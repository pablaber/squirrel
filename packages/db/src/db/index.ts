import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function db() {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  dbInstance = drizzle({
    client: new pg.Pool({ connectionString }),
    schema: { ...schema },
  });

  return dbInstance;
}
