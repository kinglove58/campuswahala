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
import { campuses } from "@campuswahala/campus-content";
import { PostgresPlayerRepository } from "@campuswahala/database";
import type { PlayerRepository } from "@campuswahala/domain";
import type { AppConfig } from "@campuswahala/config";
import { log } from "@campuswahala/observability";
import { apiError, originAllowed, requestId } from "@campuswahala/security";
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
  const limiter = (limit: number) =>
    rateLimit({
      windowMs: 60000,
      limit,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: (_req, res) =>
        res.status(429).json(apiError("RATE_LIMITED", res.locals.requestId)),
    });
  app.use("/v1/guests", limiter(60));
  app.use((req: Request, res: Response, next: NextFunction) =>
    req.method === "POST" && req.path === "/v1/guests"
      ? createLimiter(req, res, next)
      : next(),
  );
  const createLimiter = limiter(10);
  app.use("/v1/campuses", limiter(120));
  app.use(express.json({ limit: "8kb", strict: true }));
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
  app.useGlobalFilters(new SafeExceptionFilter());
  await app.init();
  return { app, repository };
}
