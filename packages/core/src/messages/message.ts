import { z } from "zod";
import type {
  ActivityMessage as ActivityMessageType,
  MessageMessage as MessageMessageType,
  MessageType,
} from "./types";

type MessageOptions = ActivityMessageType | MessageMessageType;

const messageBaseSchema = {
  roomId: z.string(),
  sender: z.string(),
  ts: z.date(),
};

const messageActivitySchema = z.object({
  type: z.literal("activity"),
  action: z.enum(["join", "leave"]),
  ...messageBaseSchema,
});

const messageMessageSchema = z.object({
  type: z.literal("message"),
  content: z.string(),
  ...messageBaseSchema,
});

const messageSchema = z.union([messageActivitySchema, messageMessageSchema]);

/**
 * A class used to parse and create string socket messages.
 */
class MessageBase {
  public type: MessageType;
  public roomId: string;
  public ts: Date;

  constructor(options: MessageOptions) {
    this.type = options.type;
    this.roomId = options.roomId;
    this.ts = options.ts;
  }

  public isMessage(): this is MessageMessage {
    return this.type === "message";
  }

  public isActivity(): this is ActivityMessage {
    return this.type === "activity";
  }

  /**
   * Parses a string message into an ActivityMessage or MessageMessage.
   * @param message - The string message to parse.
   * @param additionalOptions - Additional options to set on the message.
   * @returns An ActivityMessage or MessageMessage.
   */
  public static fromString(
    message: string,
    additionalOptions: { roomId?: string; sender?: string } = {}
  ): ActivityMessage | MessageMessage {
    let messageObject: MessageOptions;

    try {
      messageObject = JSON.parse(message);
    } catch (error) {
      throw new Error("Error parsing message as JSON");
    }

    if (additionalOptions.roomId) {
      messageObject.roomId = additionalOptions.roomId;
    }

    if (additionalOptions.sender) {
      messageObject.sender = additionalOptions.sender;
    }

    const parsedMessage = messageSchema.parse(messageObject);
    if (parsedMessage.type === "message") {
      return new MessageMessage(parsedMessage);
    }

    if (parsedMessage.type === "activity") {
      return new ActivityMessage(parsedMessage);
    }

    throw new Error("Invalid message type");
  }

  public asJsonString(): string {
    return JSON.stringify(this);
  }
}

export class MessageMessage extends MessageBase {
  public sender: string;
  public content: string;

  constructor(options: MessageMessageType) {
    super(options);
    this.sender = options.sender;
    this.content = options.content;
  }
}

export class ActivityMessage extends MessageBase {
  public action: "join" | "leave";

  constructor(options: ActivityMessageType) {
    super(options);
    this.action = options.action;
  }
}

export class MessageError extends MessageBase {}
