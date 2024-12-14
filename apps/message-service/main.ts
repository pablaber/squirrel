import "dotenv/config";
import { serve } from "@hono/node-server";
import { logger } from "./src/logger";
import { app, injectWebSocket } from "./src/server";

const port = parseInt(process.env.PORT || "3000");
if (isNaN(port)) {
  throw new Error("PORT is not a number");
}

const server = serve({
  fetch: app.fetch,
  port,
}, () => {
  logger.info(`Server is running on port ${port}`);
});
injectWebSocket(server);
