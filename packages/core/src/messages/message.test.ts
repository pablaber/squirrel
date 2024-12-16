import { describe, expect, test } from "vitest";
import { MessageMessage, ActivityMessage } from "./message";

describe("MessageMessage", () => {
  const message = new MessageMessage({
    type: "message",
    roomId: "123",
    ts: new Date(0),
    sender: "sender-id",
    content: "test content",
  });

  test("properties should be set correctly", () => {
    expect(message.type).toBe("message");
    expect(message.roomId).toBe("123");
    expect(message.ts).toBeInstanceOf(Date);
    expect(message.sender).toBe("sender-id");
    expect(message.content).toBe("test content");
  });

  test("isMessage and isActivity should return proper values", () => {
    expect(message.isMessage()).toBe(true);
    expect(message.isActivity()).toBe(false);
  });

  test("asJsonString should return a valid JSON string", () => {
    expect(message.asJsonString()).toBe(
      JSON.stringify({
        type: "message",
        roomId: "123",
        ts: new Date(0).toISOString(),
        sender: "sender-id",
        content: "test content",
      })
    );
  });

  test("fromString should return a MessageMessage", () => {
    const parsedMessage = MessageMessage.fromString(message.asJsonString());
    expect(parsedMessage).toBeInstanceOf(MessageMessage);
    expect(parsedMessage.isMessage()).toBe(true);
    expect(parsedMessage).toEqual(message);
  });
});

describe("ActivityMessage", () => {
  const activity = new ActivityMessage({
    type: "activity",
    roomId: "123",
    ts: new Date(0),
    sender: "sender-id",
    action: "join",
  });

  test("properties should be set correctly", () => {
    expect(activity.type).toBe("activity");
    expect(activity.roomId).toBe("123");
    expect(activity.ts).toBeInstanceOf(Date);
    expect(activity.sender).toBe("sender-id");
    expect(activity.action).toBe("join");
  });

  test("isMessage and isActivity should return proper values", () => {
    expect(activity.isMessage()).toBe(false);
    expect(activity.isActivity()).toBe(true);
  });

  test("asJsonString should return a valid JSON string", () => {
    expect(activity.asJsonString()).toBe(
      JSON.stringify({
        type: "activity",
        roomId: "123",
        ts: new Date(0).toISOString(),
        sender: "sender-id",
        action: "join",
      })
    );
  });

  test("fromString should return a ActivityMessage", () => {
    const parsedActivity = ActivityMessage.fromString(activity.asJsonString());
    expect(parsedActivity).toBeInstanceOf(ActivityMessage);
    expect(parsedActivity.isActivity()).toBe(true);
    expect(parsedActivity).toEqual(activity);
  });
});
