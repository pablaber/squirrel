import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import type { WSContext } from "hono/ws";
import { db, schema } from "@squirrel/db";
import { WsMessage } from "@squirrel/core";
import { WebSocketService } from "./web-socket-service";
import { logger } from "./logger";

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get("/", (c) => {
  return c.text("Hello World!");
});

app.get(
  "/ws/room/:roomId",
  upgradeWebSocket((c) => {
    const { roomId } = c.req.param();
    const { fingerprint } = c.req.query();

    const createServerMessage = WsMessage.createServerMessageBuilder(roomId);
    const webSocketService = new WebSocketService(createServerMessage);
    const createErrorMessage = WsMessage.createErrorMessageBuilder(roomId);

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
        const [error, message] = WsMessage.fromWebSocketString(rawMessage);
        if (error) {
          const errorMessage = createErrorMessage(error);
          webSocketService.sendMessageToRoom(
            roomId,
            fingerprint,
            errorMessage.toWebSocketString()
          );
        } else if (message) {
          webSocketService.sendMessageToRoom(
            roomId,
            fingerprint,
            message.toWebSocketString()
          );
          db()
            .insert(schema.messages)
            .values({
              id: message.id,
              roomId: message.roomId,
              sender: message.sender,
              content: message.content,
              ts: message.ts,
            })
            .then(() => {
              logger.debug({
                message: "saved message to database",
                messageId: message.id,
              });
            })
            .catch((error: unknown) => {
              logger.error({
                message: "failed to save message to database",
                error,
              });
              // TODO: send error to client about db save
            });
        } else {
          const errorMessage = createErrorMessage();
          webSocketService.sendMessageToRoom(
            roomId,
            fingerprint,
            errorMessage.toWebSocketString()
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
