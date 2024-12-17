import { z } from "zod";
import { WsMessageError, WsMessageErrorCodes } from "./ws-message-errors";
import { generateMessageId } from "../ids/ids";

/* Types */

type WsMessageType = "client" | "server" | "error";
type WsMessageOptions = {
  id: string;
  type: WsMessageType;
  roomId: string;
  sender: string;
  ts: Date;
  content: string;
  metadata: Record<string, unknown>;
};

/**
 * A web socket message.
 */
export class WsMessage {
  public id: string;
  public type: WsMessageType;
  public roomId: string;
  public sender: string;
  public ts: Date;
  public content: string;
  public metadata: Record<string, unknown>;

  constructor(options: WsMessageOptions) {
    this.id = options.id;
    this.type = options.type;
    this.roomId = options.roomId;
    this.sender = options.sender;
    this.ts = options.ts;
    this.content = options.content;
    this.metadata = options.metadata;
  }

  /**
   * Parses a message from a web socket string. Can pass inferred server
   * variables as incoming messages from the client do not include these.
   */
  static fromWebSocketString(
    str: string,
    inferredServerVariables?: { roomId?: string; sender?: string }
  ): [null, WsMessage] | [WsMessageError, null] {
    let messageJson;
    try {
      messageJson = JSON.parse(str);
    } catch (error) {
      return [
        new WsMessageError(
          "Failed to parse message from web socket string",
          WsMessageErrorCodes.MALFORMED_MESSAGE
        ),
        null,
      ];
    }

    const { data: messageOptions, error } = z
      .object({
        id: z.string().length(10),
        type: z.enum(["client", "server"]),
        roomId: z.string().optional(),
        sender: z.string().optional(),
        ts: z.number(),
        content: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
      .safeParse(messageJson);
    if (error) {
      const { issues } = error;
      const firstIssue = issues[0];
      let errorMessage = "Unknown message schema error";
      if (firstIssue) {
        errorMessage = `Schema error for ${firstIssue.path.join(".")}: ${firstIssue.message}`;
      }
      return [
        new WsMessageError(errorMessage, WsMessageErrorCodes.MALFORMED_MESSAGE),
        null,
      ];
    }

    let { roomId, sender } = messageOptions;

    if (roomId === undefined && inferredServerVariables?.roomId) {
      roomId = inferredServerVariables.roomId;
    }
    if (roomId === undefined) {
      return [
        new WsMessageError(
          "Schema error for roomId: roomId is required or must be inferred from the server",
          WsMessageErrorCodes.INVALID_MESSAGE_SCHEMA
        ),
        null,
      ];
    }

    if (sender === undefined && inferredServerVariables?.sender) {
      sender = inferredServerVariables.sender;
    }
    if (sender === undefined) {
      return [
        new WsMessageError(
          "Schema error for sender: sender is required or must be inferred from the server",
          WsMessageErrorCodes.INVALID_MESSAGE_SCHEMA
        ),
        null,
      ];
    }

    const { id, type, ts, content, metadata } = messageOptions;
    return [
      null,
      new WsMessage({
        id,
        type,
        roomId,
        sender,
        ts: new Date(ts),
        content,
        metadata: metadata ?? {},
      }),
    ];
  }

  /**
   * Creates a function that can be used to create server messages.
   */
  static createServerMessageBuilder(roomId: string) {
    return function createServerMessage(
      content: string,
      metadata?: Record<string, unknown>
    ) {
      return new WsMessage({
        id: generateMessageId(),
        type: "server",
        roomId,
        sender: "server",
        ts: new Date(),
        content,
        metadata: metadata ?? {},
      });
    };
  }

  /**
   * Creates a function that can be used to create error messages.
   */
  static createErrorMessageBuilder(roomId: string) {
    return function createErrorMessage(
      error?: WsMessageError,
      metadata?: Record<string, unknown>
    ) {
      const errorOrDefault =
        error ??
        new WsMessageError(
          "Unknown error",
          WsMessageErrorCodes.UNKNOWN_ERROR,
          metadata
        );
      return new WsMessage({
        id: generateMessageId(),
        type: "error",
        roomId,
        sender: "server",
        ts: new Date(),
        content: errorOrDefault.message,
        metadata: {
          code: errorOrDefault.code,
          context: errorOrDefault.context,
          ...(metadata ?? {}),
        },
      });
    };
  }

  /**
   * Checks if the message is a server message.
   */
  isServerMessage() {
    return this.type === "server";
  }

  /**
   * Checks if the message is a client message.
   */
  isClientMessage() {
    return this.type === "client";
  }

  /**
   * Checks if the message is an error message.
   */
  isErrorMessage() {
    return this.type === "error";
  }

  /**
   * Converts the message to a string that can be sent over the web socket.
   */
  toWebSocketString() {
    return JSON.stringify({
      type: this.type,
      roomId: this.roomId,
      sender: this.sender,
      ts: this.ts.valueOf(),
      content: this.content,
      metadata: this.metadata,
    });
  }
}
