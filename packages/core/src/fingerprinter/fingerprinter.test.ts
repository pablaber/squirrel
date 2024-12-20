import { describe, it, expect } from "vitest";
import { webcrypto } from "crypto";
import { createFingerprinter } from "./fingerprinter";

const { subtle } = webcrypto;

describe("Fingerprinter", () => {
  const fingerprinter = createFingerprinter(subtle);

  it("should calculate the fingerprint of a given P-256 key", async () => {
    const key = await crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveKey"]
    );
    const fingerprint = await fingerprinter.calculatePublicKeyFingerprint(
      key.publicKey
    );
    expect(fingerprint).toBeDefined();
    expect(fingerprint).toBeTypeOf("string");
    expect(fingerprint.length).toBe(64);
  });

  it("should calculate the fingerprint of a given P-384 key", async () => {
    const key = await crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-384",
      },
      true,
      ["deriveKey"]
    );
    const fingerprint = await fingerprinter.calculatePublicKeyFingerprint(
      key.publicKey
    );
    expect(fingerprint).toBeDefined();
    expect(fingerprint).toBeTypeOf("string");
    expect(fingerprint.length).toBe(64);
  });

  it("should calculate the fingerprint of a given P-521 key", async () => {
    const key = await crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-521",
      },
      true,
      ["deriveKey"]
    );
    const fingerprint = await fingerprinter.calculatePublicKeyFingerprint(
      key.publicKey
    );
    expect(fingerprint).toBeDefined();
    expect(fingerprint).toBeTypeOf("string");
    expect(fingerprint.length).toBe(64);
  });

  it("should be idempotent", async () => {
    const key = await crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveKey"]
    );
    const fingerprint1 = await fingerprinter.calculatePublicKeyFingerprint(
      key.publicKey
    );
    const fingerprint2 = await fingerprinter.calculatePublicKeyFingerprint(
      key.publicKey
    );
    expect(fingerprint1).toBe(fingerprint2);
  });
});
