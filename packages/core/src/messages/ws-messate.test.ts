import { beforeEach, describe, expect, test } from "vitest";
import { WsMessage, type WsMessageOptions } from "./ws-message";
import { generateMessageId, generateRoomId } from "../ids/ids";
import { WsMessageError, WsMessageErrorCodes } from "./ws-message-errors";

describe("WsMessage", () => {
  let baseMessageOptions: WsMessageOptions;

  beforeEach(() => {
    baseMessageOptions = {
      id: generateMessageId(),
      type: "server",
      roomId: generateRoomId(),
      sender: "sender",
      ts: new Date(),
      content: "Hello, world!",
      metadata: {},
    };
  });

  test("should be able to generate a message with the proper fields", () => {
    const message = new WsMessage(baseMessageOptions);
    expect(message.id).toBe(baseMessageOptions.id);
    expect(message.type).toBe(baseMessageOptions.type);
    expect(message.roomId).toBe(baseMessageOptions.roomId);
    expect(message.sender).toBe(baseMessageOptions.sender);
    expect(message.ts).toBe(baseMessageOptions.ts);
    expect(message.content).toBe(baseMessageOptions.content);
    expect(message.metadata).toEqual(baseMessageOptions.metadata);
  });

  test("should be able to indicate the type of message", () => {
    const serverMessage = new WsMessage(baseMessageOptions);
    expect(serverMessage.isServerMessage()).toBe(true);
    expect(serverMessage.isClientMessage()).toBe(false);
    expect(serverMessage.isErrorMessage()).toBe(false);

    const clientMessage = new WsMessage({
      ...baseMessageOptions,
      type: "client",
    });
    expect(clientMessage.isServerMessage()).toBe(false);
    expect(clientMessage.isClientMessage()).toBe(true);
    expect(clientMessage.isErrorMessage()).toBe(false);

    const errorMessage = new WsMessage({
      ...baseMessageOptions,
      type: "error",
    });
    expect(errorMessage.isServerMessage()).toBe(false);
    expect(errorMessage.isClientMessage()).toBe(false);
    expect(errorMessage.isErrorMessage()).toBe(true);
  });

  test("should be able to convert the message to a web socket string", () => {
    const message = new WsMessage(baseMessageOptions);
    const webSocketString = message.toWebSocketString();
    expect(webSocketString).toBeDefined();

    const expectedString = JSON.stringify({
      id: baseMessageOptions.id,
      type: baseMessageOptions.type,
      roomId: baseMessageOptions.roomId,
      sender: baseMessageOptions.sender,
      ts: baseMessageOptions.ts.valueOf(),
      content: baseMessageOptions.content,
      metadata: baseMessageOptions.metadata,
    });
    expect(webSocketString).toBe(expectedString);
  });

  test("serverMessageBuilder should be able to create a server message", () => {
    const roomId = generateRoomId();
    const serverMessageBuilder = WsMessage.createServerMessageBuilder(roomId);
    const message = serverMessageBuilder("Hello, world!");
    expect(message.id).toBeDefined();
    expect(message.type).toBe("server");
    expect(message.roomId).toBe(roomId);
    expect(message.sender).toBe("server");
    expect(message.ts).toBeInstanceOf(Date);
    expect(message.content).toBe("Hello, world!");
    expect(message.metadata).toEqual({});
  });

  test("serverMessageBuilder should be able to create a server message with metadata", () => {
    const roomId = generateRoomId();
    const serverMessageBuilder = WsMessage.createServerMessageBuilder(roomId);
    const message = serverMessageBuilder("Hello, world!", { foo: "bar" });
    expect(message.id).toBeDefined();
    expect(message.type).toBe("server");
    expect(message.roomId).toBe(roomId);
    expect(message.sender).toBe("server");
    expect(message.ts).toBeInstanceOf(Date);
    expect(message.content).toBe("Hello, world!");
    expect(message.metadata).toEqual({ foo: "bar" });
  });

  test("errorMessageBuilder should be able to create an error message", () => {
    const roomId = generateRoomId();
    const errorMessageBuilder = WsMessage.createErrorMessageBuilder(roomId);
    const message = errorMessageBuilder(
      new WsMessageError(
        "Hello, world error message!",
        WsMessageErrorCodes.UNKNOWN_ERROR
      )
    );
    expect(message.id).toBeDefined();
    expect(message.type).toBe("error");
    expect(message.roomId).toBe(roomId);
    expect(message.sender).toBe("server");
    expect(message.ts).toBeInstanceOf(Date);
    expect(message.content).toBe("Hello, world error message!");
    expect(message.metadata).toEqual({
      code: WsMessageErrorCodes.UNKNOWN_ERROR,
    });
  });

  test("errorMessageBuilder should be able to create an error message with metadata", () => {
    const roomId = generateRoomId();
    const errorMessageBuilder = WsMessage.createErrorMessageBuilder(roomId);
    const message = errorMessageBuilder(
      new WsMessageError("Hello, world!", WsMessageErrorCodes.UNKNOWN_ERROR, {
        some: "context",
      }),
      { foo: "bar" }
    );
    expect(message.metadata).toEqual({
      code: WsMessageErrorCodes.UNKNOWN_ERROR,
      foo: "bar",
      context: {
        some: "context",
      },
    });
  });

  describe("WsMessage.fromWebSocketString", () => {
    test("should be able to parse a message from a web socket string generated by toWebSocketString", () => {
      const originalMessage = new WsMessage(baseMessageOptions);
      const webSocketString = originalMessage.toWebSocketString();
      let [error, parsedMessage] =
        WsMessage.fromWebSocketString(webSocketString);
      expect(error).toBeNull();

      parsedMessage = parsedMessage as WsMessage;
      expect(parsedMessage).toBeDefined();
      expect(parsedMessage.id).toBe(originalMessage.id);
      expect(parsedMessage.type).toBe(originalMessage.type);
      expect(parsedMessage.roomId).toBe(originalMessage.roomId);
      expect(parsedMessage.sender).toBe(originalMessage.sender);
      expect(parsedMessage.ts).toEqual(originalMessage.ts);
      expect(parsedMessage.content).toBe(originalMessage.content);
      expect(parsedMessage.metadata).toEqual(originalMessage.metadata);
    });

    test("should return a WsMessageError if the message is not JSON", () => {
      const message = "not a JSON string";
      let [error, parsedMessage] = WsMessage.fromWebSocketString(message);
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(WsMessageError);
      error = error as WsMessageError;
      expect(error.code).toBe(WsMessageErrorCodes.MALFORMED_MESSAGE);
      expect(error.message).toBe(
        "Failed to parse message from web socket string"
      );
      expect(parsedMessage).toBeNull();
    });

    test("should return a WsMessageError if the message is JSON but an invalid schema", () => {
      const message = JSON.stringify({
        id: generateMessageId(),
        not: "a",
        valid: "schema",
      });
      let [error, parsedMessage] = WsMessage.fromWebSocketString(message);
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(WsMessageError);
      error = error as WsMessageError;
      expect(error.code).toBe(WsMessageErrorCodes.INVALID_MESSAGE_SCHEMA);
      expect(error.message).toBe('Schema error for "ts": Required');
      expect(parsedMessage).toBeNull();
    });

    test("should return a WsMessageError if the roomId is undefined and not inferred", () => {
      const message = JSON.stringify({
        ...baseMessageOptions,
        ts: new Date().valueOf(),
        roomId: undefined,
      });
      let [error, parsedMessage] = WsMessage.fromWebSocketString(message);
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(WsMessageError);
      error = error as WsMessageError;
      expect(error.code).toBe(WsMessageErrorCodes.INVALID_MESSAGE_SCHEMA);
      expect(error.message).toBe(
        'Schema error for "roomId": roomId is required or must be inferred from the server'
      );
      expect(parsedMessage).toBeNull();
    });

    test("should return a WsMessageError if the sender is undefined and not inferred", () => {
      const message = JSON.stringify({
        ...baseMessageOptions,
        ts: new Date().valueOf(),
        sender: undefined,
      });
      let [error, parsedMessage] = WsMessage.fromWebSocketString(message);
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(WsMessageError);
      error = error as WsMessageError;
      expect(error.code).toBe(WsMessageErrorCodes.INVALID_MESSAGE_SCHEMA);
      expect(error.message).toBe(
        'Schema error for "sender": sender is required or must be inferred from the server'
      );
      expect(parsedMessage).toBeNull();
    });

    test("should be able to infer the roomId from the server", () => {
      const message = JSON.stringify({
        ...baseMessageOptions,
        ts: new Date().valueOf(),
        roomId: undefined,
      });
      const ROOM_ID = generateRoomId();
      let [error, parsedMessage] = WsMessage.fromWebSocketString(message, {
        roomId: ROOM_ID,
      });
      expect(error).toBeNull();
      expect(parsedMessage).toBeDefined();

      parsedMessage = parsedMessage as WsMessage;
      expect(parsedMessage.roomId).toBe(ROOM_ID);
    });

    test("should be able to infer the sender from the server", () => {
      const message = JSON.stringify({
        ...baseMessageOptions,
        ts: new Date().valueOf(),
        sender: undefined,
      });
      const SENDER = "sender";
      let [error, parsedMessage] = WsMessage.fromWebSocketString(message, {
        sender: SENDER,
      });
      expect(error).toBeNull();
      expect(parsedMessage).toBeDefined();

      parsedMessage = parsedMessage as WsMessage;
      expect(parsedMessage.sender).toBe(SENDER);
    });
  });
});
