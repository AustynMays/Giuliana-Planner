import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "./lib/database";

const app: Express = express();
const PgSessionStore = connectPgSimple(session);
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set before starting the API.");
}

const allowedOrigins = process.env.CORS_ORIGIN
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production" && !allowedOrigins?.length) {
  throw new Error("Set CORS_ORIGIN to the mobile app's trusted origin in production.");
}

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: allowedOrigins?.length
      ? (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin ?? false);
            return;
          }
          callback(new Error("Origin is not allowed."));
        }
      : true,
    credentials: true,
    allowedHeaders: ["Content-Type", "X-Planner-Client"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: "planner.sid",
    store: new PgSessionStore({
      pool,
      tableName: "planner_sessions",
      createTableIfMissing: false,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 14,
    },
  }),
);
app.use((req, res, next) => {
  if (
    req.method !== "GET" &&
    req.method !== "HEAD" &&
    req.method !== "OPTIONS" &&
    req.get("x-planner-client") !== "senior-planner"
  ) {
    res.status(403).json({ message: "Request could not be verified." });
    return;
  }
  next();
});

app.use("/api", router);

export default app;
