import pg from "pg";
import { logger } from "./logger";

const { Pool } = pg;
const isReplitRuntime = Boolean(
  process.env.REPLIT_ENVIRONMENT ||
    process.env.REPLIT_DEV_DOMAIN ||
    process.env.REPL_ID,
);
const connectionString =
  process.env.PLANNER_DATABASE_URL ??
  (isReplitRuntime ? undefined : process.env.DATABASE_URL);

if (!connectionString) {
  throw new Error("Set PLANNER_DATABASE_URL to an external PostgreSQL connection string.");
}

export const pool = new Pool({ connectionString });

pool.on("error", (error) => {
  logger.error({ err: error }, "PostgreSQL pool error");
});
