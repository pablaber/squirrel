import type { WSContext } from "hono/ws";
import { logger } from "./logger";
import { WsMessage } from "@squirrel/core";

type Fingerprint = string;
type RoomClients = Map<Fingerprint, WSContext<WebSocket>>;
type ServerMessageBuilder = ReturnType<
  typeof WsMessage.createServerMessageBuilder
>;

export class WebSocketService {
  private clients: Map<string, RoomClients>;
  private createServerMessage: ServerMessageBuilder;

  constructor(createServerMessage: ServerMessageBuilder) {
    this.clients = new Map<string, RoomClients>();
    this.createServerMessage = createServerMessage;
  }

  public getRoomClients(roomId: string): RoomClients {
    let roomClients = this.clients.get(roomId);
    if (!roomClients) {
      roomClients = new Map<Fingerprint, WSContext<WebSocket>>();
      this.clients.set(roomId, roomClients);
    }
    return roomClients;
  }

  public addClientToRoom(
    roomId: string,
    fingerprint: Fingerprint,
    client: WSContext<WebSocket>
  ) {
    const roomClients = this.getRoomClients(roomId);
    roomClients.set(fingerprint, client);
    const serverMessage = this.createServerMessage(
      `Client ${fingerprint} connected`
    );
    this.sendMessageToRoom(roomId, "server", serverMessage.toWebSocketString());
    logger.info(
      `Client connected to room ${roomId} with fingerprint ${fingerprint}`
    );
  }
  public removeClientFromRoom(roomId: string, fingerprint: Fingerprint) {
    const roomClients = this.getRoomClients(roomId);
    roomClients.delete(fingerprint);
    logger.info(
      `Client disconnected from room ${roomId} with fingerprint ${fingerprint}`
    );
    if (roomClients.size === 0) {
      this.clients.delete(roomId);
      logger.info(`Room ${roomId} is empty, deleting`);
    } else {
      const serverMessage = this.createServerMessage(
        `Client ${fingerprint} disconnected`
      );
      this.sendMessageToRoom(
        roomId,
        "server",
        serverMessage.toWebSocketString()
      );
    }
  }

  public sendMessageToRoom(
    roomId: string,
    senderFingerprint: Fingerprint,
    message: string
  ) {
    const roomClients = this.getRoomClients(roomId);
    roomClients.forEach((client) => client.send(message));
    logger.info(
      `Message sent to room ${roomId} from ${senderFingerprint}: ${message}`
    );
  }
}
