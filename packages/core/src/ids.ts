import { customAlphabet } from "nanoid";

const ALPHABET = "1234567890abcdefghijklmnopqrstuvwxyz";

export const generate = (length: number = 10) =>
  customAlphabet(ALPHABET, length)();

export const generateUserId = () => generate(10);
export const generateMessageId = () => generate(10);
export const generateRoomId = () => generate(10);
