import {
  createCampusWorld,
  isCampus,
  compileWorldInformation,
} from "@campuswahala/game-engine";
import "reflect-metadata";
import {
  ArgumentsHost,
  Catch,
  Controller,
  Delete,
  ExceptionFilter,
  Get,
  Headers,
  Param,
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
import { factFeedbackSchema } from "@campuswahala/domain";
import { AccountService } from "./accounts";
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

// Compile geometry once at boot; publication projection stays live and private-safe.
const compiledWorlds = {
  futa: createCampusWorld("futa"),
  oau: createCampusWorld("oau"),
  unilag: createCampusWorld("unilag"),
};
@Controller()
class ApiController {
  constructor(
    @Inject(PlayerService) private readonly players: PlayerService,
    @Inject(REPOSITORY) private readonly repository: PlayerRepository,
    @Inject(AccountService) private readonly accounts: AccountService,
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
  @Get("v1/catalogue/published") published() {
    return this.accounts.publishedCatalogue();
  }
  @Get("v1/worlds/:campus/versions/:version") world(
    @Param("campus") campus: string,
    @Param("version") version: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!isCampus(campus) || version !== "1")
      throw new HttpException("WORLD_NOT_FOUND", 404);
    const world = compiledWorlds[campus];
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    response.setHeader(
      "ETag",
      `"${campus}-${world.sourceRevision}-${world.version}"`,
    );
    return world;
  }
  @Get("v1/worlds/:campus/latest") latestWorld(
    @Param("campus") campus: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!isCampus(campus)) throw new HttpException("WORLD_NOT_FOUND", 404);
    response.setHeader("Cache-Control", "public, max-age=60");
    return {
      campusId: campus,
      version: 1,
      path: `/v1/worlds/${campus}/versions/1`,
    };
  }
  @Get("v1/worlds/:campus/information") async worldInformation(
    @Param("campus") campus: string,
  ) {
    if (!isCampus(campus)) throw new HttpException("WORLD_NOT_FOUND", 404);
    const published = await this.accounts.publishedCatalogue();
    return {
      venues: compileWorldInformation(compiledWorlds[campus], published.facts),
    };
  }
  @Get("v1/account/world") getWorldState(
    @Headers("x-account-token") token: unknown,
  ) {
    return this.accounts.worldState(token);
  }
  @Post("v1/account/world") putWorldState(
    @Headers("x-account-token") token: unknown,
    @Body() body: unknown,
  ) {
    return this.accounts.saveWorldState(token, body);
  }
  @Post("v1/account/begin") begin(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.accounts.begin(body, response.locals.client);
  }
  @Post("v1/account/callback") callback(
    @Body() body: unknown,
    @Headers("x-account-token") session: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.accounts.callback(body, response.locals.client, session);
  }
  @Get("v1/account/me") account(@Headers("x-account-token") token: unknown) {
    return this.accounts.self(token);
  }
  @Post("v1/account/convert") convert(
    @Body() body: unknown,
    @Headers("x-account-token") token: unknown,
    @Headers("x-guest-token") guest: unknown,
  ) {
    if (!body || typeof body !== "object" || Object.keys(body).length)
      throw new HttpException("INVALID_CONVERSION_INPUT", 400);
    return this.accounts.convert(token, guest);
  }
  @Post("v1/account/privacy") privacy(
    @Body() body: unknown,
    @Headers("x-account-token") token: unknown,
  ) {
    return this.accounts.privacy(token, body);
  }
  @Delete("v1/account/session") logout(
    @Headers("x-account-token") token: unknown,
  ) {
    return this.accounts.logout(token);
  }
  @Delete("v1/account/me") deletion(
    @Headers("x-account-token") token: unknown,
  ) {
    return this.accounts.requestDeletion(token);
  }
  @Post("v1/feedback") async feedback(
    @Body() input: unknown,
    @Headers("x-account-token") token: unknown,
    @Headers("x-guest-token") guest: unknown,
  ) {
    const parsed = factFeedbackSchema.safeParse(input);
    if (!parsed.success) throw new HttpException("INVALID_FEEDBACK", 400);
    const db = this.accounts.db;
    if (!db) throw new HttpException("CATALOGUE_UNAVAILABLE", 503);
    const fact = await db.campusFact.findFirst({
      where: {
        id: parsed.data.factId,
        status: "published",
        staleAt: { gt: new Date() },
      },
    });
    if (!fact) throw new HttpException("FACT_UNAVAILABLE", 404);
    let userId: string | undefined;
    let actorHash: string;
    let weight = 0.1;
    if (token) {
      const user = await this.accounts.principal(token);
      userId = user.id;
      actorHash = this.accounts.hash(`feedback:${user.id}`);
      const character = await db.playerCharacter.findUnique({
        where: { userId },
      });
      const previous = await db.factFeedback.count({ where: { userId } });
      weight =
        Date.now() - user.createdAt.getTime() >= 7 * 86400000 &&
        character?.campusId === fact.campusId
          ? Math.min(0.8, 0.5 + previous * 0.01)
          : 0.2;
    } else {
      await this.players.self(guest);
      actorHash = this.accounts.hash(`feedback:${String(guest)}`);
    }
    await db.factFeedback.upsert({
      where: { factId_actorHash: { factId: fact.id, actorHash } },
      create: { ...parsed.data, userId, actorHash, weight },
      update: {
        kind: parsed.data.kind,
        correction: parsed.data.correction,
        weight,
      },
    });
    log({ service: "api", event: "fact_feedback_received", count: 1 });
    const evidence = await db.evidence.findMany({
      where: { versions: { some: { version: { factId: fact.id } } } },
      take: 100,
      select: { observation: { select: { sourceId: true } } },
    });
    const recheckAt = new Date(Date.now() + 60000);
    await db.contentSource.updateMany({
      where: {
        id: { in: [...new Set(evidence.map((e) => e.observation.sourceId))] },
        nextFetchAt: { gt: recheckAt },
      },
      data: { nextFetchAt: recheckAt },
    });
    return { received: true };
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
  const sessionKey = config.SESSION_SECRET ?? randomBytes(32).toString("hex");
  const accounts = new AccountService(config, sessionKey);
  @Module({
    controllers: [ApiController],
    providers: [
      PlayerService,
      { provide: AccountService, useValue: accounts },
      { provide: REPOSITORY, useValue: repository },
      {
        provide: HASH_KEY,
        useValue: sessionKey,
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
      `${res.locals.rawBody ?? ""}\n${req.headers["x-guest-token"] ?? ""}${req.path.startsWith("/v1/account/") || req.path === "/v1/feedback" ? `\n${req.headers["x-account-token"] ?? ""}` : ""}`,
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
  app.use("/v1/worlds", limiter(120, "client"));
  app.use("/v1/campuses", limiter(120, "client"));
  app.use("/v1/catalogue", limiter(120, "client"));
  app.use("/v1/account", limiter(60, "client"));
  app.use("/v1/account", limiter(100, "network"));
  app.use("/v1/feedback", limiter(20, "client"));
  app.use("/v1/feedback", limiter(80, "network"));
  const accountLimiter = rateLimit({
    windowMs: 60000,
    limit: 60,
    keyGenerator: (_req, res) => String(res.locals.account),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json(apiError("RATE_LIMITED", res.locals.requestId)),
  });
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (
      ["/v1/account/begin", "/v1/account/callback"].includes(req.path) ||
      (!req.path.startsWith("/v1/account/") && req.path !== "/v1/feedback") ||
      !req.headers["x-account-token"]
    )
      return next();
    try {
      const user = await accounts.principal(req.headers["x-account-token"]);
      res.locals.account = accounts.hash(`account-rate:${user.id}`);
      return accountLimiter(req, res, next);
    } catch {
      return res
        .status(401)
        .json(apiError("ACCOUNT_SESSION_EXPIRED", res.locals.requestId));
    }
  });
  app.useGlobalFilters(new SafeExceptionFilter());
  await app.init();
  return { app, repository, accounts };
}
