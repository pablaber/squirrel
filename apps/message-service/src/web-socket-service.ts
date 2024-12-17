import type { WSContext } from "hono/ws";
import { logger } from "./logger";
import { WsMessage } from "@squirrel/core";

type Fingerprint = string;
type RoomClients = Map<Fingerprint, WSContext<WebSocket>>;

export class WebSocketService {
  private clients: Map<string, RoomClients>;

  constructor() {
    this.clients = new Map<string, RoomClients>();
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

    const createServerMessage = WsMessage.createServerMessageBuilder(roomId);
    const serverMessage = createServerMessage(
      `Client ${fingerprint} connected`
    );
    this.sendMessageToRoom(
      roomId,
      "server",
      serverMessage.toWebSocketString(),
      fingerprint
    );
    logger.info(
      `Client connected to room ${roomId} with fingerprint ${fingerprint}. ${roomClients.size} clients in room`
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
      const createServerMessage = WsMessage.createServerMessageBuilder(roomId);
      const serverMessage = createServerMessage(
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
    message: string,
    excludeFingerprint: Fingerprint | null = null
  ) {
    const roomClientsToSend = new Map(this.getRoomClients(roomId));
    console.log("roomClients", Array.from(roomClientsToSend.keys()));

    if (excludeFingerprint) {
      roomClientsToSend.delete(excludeFingerprint);
    }

    console.log("roomClients", Array.from(roomClientsToSend.keys()));

    roomClientsToSend.forEach((client) => client.send(message));
    logger.debug(
      `Message sent to ${roomClientsToSend.size} clients in room ${roomId} from ${senderFingerprint}: ${message}`
    );
  }
}
