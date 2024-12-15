import { createHash, randomBytes } from 'node:crypto';

export function hashPassword(password: string) {
	const salt = randomBytes(16).toString('hex');
	const saltedPassword = `${salt}:${password}`;
	const hashedPassword = createHash('sha256').update(saltedPassword).digest('hex');
	return `${salt}:${hashedPassword}`;
}

export function verifyPassword(password: string, hashedPassword: string) {
	const [salt, storedHash] = hashedPassword.split(':');
	const saltedPassword = `${salt}:${password}`;
	const calculatedHash = createHash('sha256').update(saltedPassword).digest('hex');
	return storedHash === calculatedHash;
}
