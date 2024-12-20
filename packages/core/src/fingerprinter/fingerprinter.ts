import type { webcrypto } from "node:crypto";

export function createFingerprinter(
  subtle: SubtleCrypto | webcrypto.SubtleCrypto
) {
  async function calculatePublicKeyFingerprint(publicCryptoKey: CryptoKey) {
    const exportedKey = await subtle.exportKey("spki", publicCryptoKey);
    const hashBuffer = await subtle.digest("SHA-256", exportedKey);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  }

  return {
    calculatePublicKeyFingerprint,
  };
}
