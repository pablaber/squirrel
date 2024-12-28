import pino from "pino";

type LoggerOptions = {
  app: string;
  level?: pino.Level;
  includePid?: boolean;
  includeHostname?: boolean;
};

export function createLogger(options: LoggerOptions) {
  const loggerBase: pino.LoggerOptions<never, boolean>["base"] = {
    app: options.app,
  };

  if (!options.includeHostname) {
    loggerBase["hostname"] = undefined;
  }
  if (!options.includePid) {
    loggerBase["pid"] = undefined;
  }

  return pino({
    level: options.level ?? "info",
    base: loggerBase,
    formatters: {
      level: (label) => ({ level: label }),
    },
  });
}

export function normalizeLogLevel(
  level?: string,
  defaultLevel: pino.Level = "info"
): pino.Level {
  const normalizedLevel = level?.toLowerCase();
  const validLevels: pino.Level[] = [
    "fatal",
    "error",
    "warn",
    "info",
    "debug",
    "trace",
  ];

  return validLevels.includes(normalizedLevel as pino.Level)
    ? (normalizedLevel as pino.Level)
    : defaultLevel;
}
