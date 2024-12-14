import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import { initMessageParser, messageParserErrorCodes } from "./message-parser";
import { WebSocketService } from "./web-socket-service";
import { logger } from "./logger";
import { db, schema} from '@squirrel/db';
import type { WSContext } from "hono/ws";

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
const webSocketService = new WebSocketService();

app.get("/", (c) => {
  return c.text("Hello World!");
});

app.get(
  "/ws/room/:roomId",
  upgradeWebSocket((c) => {
    const { roomId } = c.req.param();
    const { fingerprint } = c.req.query();

    const messageParser = initMessageParser(roomId, fingerprint);

    return {
      onOpen(_event, client) {
        webSocketService.addClientToRoom(
          roomId,
          fingerprint,
          client as WSContext<WebSocket>
        );
      },
      onMessage(event) {
        const rawMessage = event.data.toString();
        const [error, message] = messageParser.parseMessage(rawMessage);
        if (error) {
          logger.error(error.asLogObject());
          webSocketService.sendMessageToRoom(
            roomId,
            fingerprint,
            error.asWebSocketMessage()
          );
        } else if (message) {
          webSocketService.sendMessageToRoom(
            roomId,
            fingerprint,
            JSON.stringify({
              success: true,
              message,
            })
          );
          db.insert(schema.messages)
            .values(message)
            .then(() => {
              logger.debug({
                message: "saved message to database",
                messageId: message.id,
              });
            })
            .catch((error) => {
              logger.error({
                message: "failed to save message to database",
                error,
              });
              // TODO: send error to client about db save
            });
        } else {
          const error = messageParser.createError(
            "Message was undefined",
            messageParserErrorCodes.UNKNOWN_ERROR
          );
          webSocketService.sendMessageToRoom(
            roomId,
            fingerprint,
            error.asWebSocketMessage()
          );
        }
      },
      onClose: () => {
        webSocketService.removeClientFromRoom(roomId, fingerprint);
      },
    };
  })
);

export { app, injectWebSocket };
