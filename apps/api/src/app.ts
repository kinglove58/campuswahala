import "reflect-metadata";
import {
  ArgumentsHost,
  Catch,
  Controller,
  Delete,
  ExceptionFilter,
  Get,
  Headers,
  HttpException,
  Inject,
  Module,
  Post,
  Body,
  Res,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { randomBytes } from "node:crypto";
import { hashGuestToken, validGuestToken } from "@campuswahala/auth";
import { campuses } from "@campuswahala/campus-content";
import { PostgresPlayerRepository } from "@campuswahala/database";
import type { PlayerRepository } from "@campuswahala/domain";
import type { AppConfig } from "@campuswahala/config";
import { log } from "@campuswahala/observability";
import {
  apiError,
  originAllowed,
  requestId,
  localTrustKey,
  pseudonym,
  verifyContext,
  ReplayGuard,
} from "@campuswahala/security";
import {
  HASH_KEY,
  MemoryPlayerRepository,
  PlayerService,
  REPOSITORY,
} from "./players";

@Controller()
class ApiController {
  constructor(
    @Inject(PlayerService) private readonly players: PlayerService,
    @Inject(REPOSITORY) private readonly repository: PlayerRepository,
  ) {}
  @Get("health/live") live() {
    return { status: "ok", service: "campuswahala-api" };
  }
  @Get("health/ready") async ready(@Res() response: Response) {
    const ready = await this.repository.ready();
    return response
      .status(ready ? 200 : 503)
      .json({ status: ready ? "ready" : "unavailable" });
  }
  @Get("v1/campuses") catalogue() {
    return { campuses };
  }
  @Post("v1/guests") create(@Body() body: unknown) {
    return this.players.create(body);
  }
  @Get("v1/guests/me") self(@Headers("x-guest-token") token: unknown) {
    return this.players.self(token);
  }
  @Delete("v1/guests/me") revoke(@Headers("x-guest-token") token: unknown) {
    return this.players.revoke(token);
  }
}

@Catch()
class SafeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const code =
      exception instanceof HttpException
        ? typeof exception.getResponse() === "object"
          ? exception.message
          : String(exception.getResponse())
        : "INTERNAL_ERROR";
    response
      .status(status)
      .json(apiError(code, String(request.res?.locals.requestId ?? "unknown")));
  }
}

export async function createApi(
  config: AppConfig,
  repositoryOverride?: PlayerRepository,
) {
  const repository =
    repositoryOverride ??
    (config.PLAYER_STORE === "postgres"
      ? new PostgresPlayerRepository(config.DATABASE_URL!)
      : new MemoryPlayerRepository());
  @Module({
    controllers: [ApiController],
    providers: [
      PlayerService,
      { provide: REPOSITORY, useValue: repository },
      {
        provide: HASH_KEY,
        useValue: config.SESSION_SECRET ?? randomBytes(32).toString("hex"),
      },
    ],
  })
  class AppModule {}
  const app = await NestFactory.create(AppModule, {
    logger: false,
    bodyParser: false,
  });
  app.use(helmet());
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.requestId = requestId();
    res.setHeader("X-Request-ID", res.locals.requestId);
    res.setHeader("Cache-Control", "no-store");
    const start = Date.now();
    res.on("finish", () =>
      log({
        service: "api",
        requestId: res.locals.requestId,
        method: req.method,
        endpoint: req.path.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/gi, ":id"),
        status: res.statusCode,
        latencyMs: Date.now() - start,
      }),
    );
    next();
  });
  if (config.APP_ENV === "local")
    app.enableCors({
      origin: config.GAME_ORIGIN,
      methods: ["GET", "POST", "DELETE"],
      allowedHeaders: ["Content-Type", "X-Guest-Token"],
    });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      ["POST", "DELETE"].includes(req.method) &&
      !originAllowed(req.headers.origin, config.GAME_ORIGIN)
    )
      return res
        .status(403)
        .json(apiError("ORIGIN_REJECTED", res.locals.requestId));
    if (req.method === "POST" && !req.is("application/json"))
      return res
        .status(415)
        .json(apiError("JSON_REQUIRED", res.locals.requestId));
    next();
  });
  app.use(
    express.json({
      limit: "8kb",
      strict: true,
      verify: (_req, res, buffer) => {
        (res as Response).locals.rawBody = buffer.toString("utf8");
      },
    }),
  );
  app.use(
    (
      err: { type?: string },
      _req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      if (err)
        return res
          .status(err.type === "entity.too.large" ? 413 : 400)
          .json(
            apiError(
              err.type === "entity.too.large"
                ? "BODY_TOO_LARGE"
                : "INVALID_JSON",
              res.locals.requestId,
            ),
          );
      next();
    },
  );
  const replay = new ReplayGuard();
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.method === "GET" &&
      ["/health/live", "/health/ready"].includes(req.path)
    )
      return next();
    const header = req.headers["x-cw-context"];
    const signed = verifyContext(
      header,
      req.method,
      req.path,
      `${res.locals.rawBody ?? ""}\n${req.headers["x-guest-token"] ?? ""}`,
      config.BFF_SERVICE_SECRET ?? localTrustKey,
    );
    if (header || config.APP_ENV !== "local") {
      if (
        !signed ||
        !/^[0-9a-f]{64}$/.test(signed.network) ||
        !replay.accept(signed.nonce)
      )
        return res
          .status(401)
          .json(apiError("SERVICE_TRUST_REJECTED", res.locals.requestId));
      res.locals.client = signed.client;
      res.locals.network = signed.network;
    } else {
      // Direct loopback API testing only. Forwarded headers are never used.
      res.locals.network = pseudonym(
        req.socket.remoteAddress ?? "local",
        config.NETWORK_HMAC_SECRET ?? localTrustKey,
      );
      res.locals.client = res.locals.network;
    }
    next();
  });
  const limiter = (
    limit: number,
    dimension: "client" | "network" | "session",
  ) =>
    rateLimit({
      windowMs: 60000,
      limit,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      keyGenerator: (_req, res) => String(res.locals[dimension]),
      handler: (_req, res) =>
        res.status(429).json(apiError("RATE_LIMITED", res.locals.requestId)),
    });
  app.use("/v1/guests", limiter(60, "client"));
  const sessionLimiter = limiter(60, "session");
  app.use((req: Request, res: Response, next: NextFunction) => {
    const token = req.headers["x-guest-token"];
    if (
      req.path.toLowerCase().replace(/\/+$/, "") === "/v1/guests/me" &&
      validGuestToken(token)
    ) {
      res.locals.session = hashGuestToken(
        token,
        config.SESSION_SECRET ?? localTrustKey,
      );
      return sessionLimiter(req, res, next);
    }
    next();
  });
  const createClientLimiter = limiter(10, "client");
  const createNetworkLimiter = limiter(100, "network");
  app.use((req: Request, res: Response, next: NextFunction) =>
    req.method === "POST" &&
    req.path.toLowerCase().replace(/\/+$/, "") === "/v1/guests"
      ? createNetworkLimiter(req, res, () =>
          createClientLimiter(req, res, next),
        )
      : next(),
  );
  app.use("/v1/campuses", limiter(120, "client"));
  app.useGlobalFilters(new SafeExceptionFilter());
  await app.init();
  return { app, repository };
}
