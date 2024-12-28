import { createLogger, normalizeLogLevel } from "@squirrel/core/logger";

export const logger = createLogger({
  app: "jobs",
  level: normalizeLogLevel(process.env.LOG_LEVEL),
});
