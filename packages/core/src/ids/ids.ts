import { customAlphabet } from "nanoid";

const DEFAULT_ALPHABET = "1234567890abcdefghijklmnopqrstuvwxyz";

export const generate = (
  length: number = 10,
  alphabet: string = DEFAULT_ALPHABET
) => customAlphabet(alphabet, length)();

export const generateUserId = () => generate(10);
export const generateMessageId = () => generate(10);
export const generateRoomId = () => generate(10);
