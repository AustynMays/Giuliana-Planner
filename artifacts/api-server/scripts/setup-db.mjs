import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const replitRuntime = Boolean(
  process.env.REPLIT_ENVIRONMENT ||
    process.env.REPLIT_DEV_DOMAIN ||
    process.env.REPL_ID,
);
const connectionString =
  process.env.PLANNER_DATABASE_URL ??
  (replitRuntime ? undefined : process.env.DATABASE_URL);

if (!connectionString) {
  console.error("Set PLANNER_DATABASE_URL to an external PostgreSQL connection string.");
  process.exitCode = 1;
} else {
  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  const schemaPath = resolve(scriptDirectory, "../../../schema.sql");
  const schema = await readFile(schemaPath, "utf8");
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    await client.query(schema);
    console.log("Senior Planner database schema is ready.");
  } catch {
    console.error("Database setup failed. Check the external PostgreSQL URL and permissions.");
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}
