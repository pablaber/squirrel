import type { Cookies } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { hoursToSeconds } from 'date-fns';
import { serverConfig } from '../server-config';

const COOKIE_PREFIX = `sq-`;

const roomCookie = (roomId: string) => `${COOKIE_PREFIX}rm-${roomId}`;
const masterPasswordCookie = () => `${COOKIE_PREFIX}mp`;

type CookieOptions = Parameters<Cookies['set']>[2];
const cookieOptions = (options: Partial<CookieOptions> = {}) => ({
	path: '/',
	httpOnly: true,
	secure: true,
	sameSite: 'strict' as const,
	maxAge: hoursToSeconds(24 * 30),
	...options
});

export function init(cookies: Cookies) {
	function setRoomIdCookie(roomId: string, password?: string) {
		cookies.set(roomCookie(roomId), password ?? '', cookieOptions());
	}

	/**
	 * Gets the room ID cookie. Will return null if there is an empty string or no cookie.
	 */
	function getRoomIdCookie(roomId: string) {
		const cookieValue = cookies.get(roomCookie(`room-${roomId}`));
		return cookieValue || null;
	}

	/**
	 * Gets the master password cookie and verifies it against the provided password.
	 * If the password is incorrect, the cookie is deleted.
	 */
	function testMasterPasswordCookie() {
		const cookieValue = cookies.get(masterPasswordCookie());
		if (cookieValue === serverConfig.hashedMasterPassword) {
			cookies.set(masterPasswordCookie(), cookieValue, cookieOptions());
			return true;
		}

		cookies.delete(masterPasswordCookie(), cookieOptions());
		return false;
	}

	function setMasterPasswordCookie(password: string) {
		const hashedPassword = createHash('sha256').update(password).digest('hex');
		cookies.set(masterPasswordCookie(), hashedPassword, cookieOptions());
	}

	return {
		setRoomIdCookie,
		getRoomIdCookie,
		testMasterPasswordCookie,
		setMasterPasswordCookie
	};
}
