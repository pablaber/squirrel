import { customAlphabet } from 'nanoid';

export const generateRoomId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

export const generateMessageId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

export const niceFingerprint = (fingerprintBase64: string) => {
	return fingerprintBase64.slice(0, 10).toLowerCase();
};