import { describe, expect, test } from "vitest";
import * as ids from "./ids";

describe("generate", () => {
  test("should return a string with proper length and characters", () => {
    const id = ids.generate();
    expect(id).toBeDefined();
    expect(id.length).toBe(10);
    expect(id).toMatch(/^[a-z0-9]+$/);
  });

  test("should allow passing a custom length", () => {
    const id = ids.generate(15);
    expect(id).toBeDefined();
    expect(id.length).toBe(15);
    expect(id).toMatch(/^[a-z0-9]+$/);
  });

  test("should allow passing a custom alphabet", () => {
    const id = ids.generate(10, "0123456789");
    expect(id).toBeDefined();
    expect(id.length).toBe(10);
    expect(id).toMatch(/^[0-9]+$/);
  });
});

describe("generateUserId", () => {
  test("should return a string with proper length and characters", () => {
    const id = ids.generateUserId();
    expect(id).toBeDefined();
    expect(id.length).toBe(10);
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});

describe("generateMessageId", () => {
  test("should return a string with proper length and characters", () => {
    const id = ids.generateMessageId();
    expect(id).toBeDefined();
    expect(id.length).toBe(10);
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});

describe("generateRoomId", () => {
  test("should return a string with proper length and characters", () => {
    const id = ids.generateRoomId();
    expect(id).toBeDefined();
    expect(id.length).toBe(10);
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});
