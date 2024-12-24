import type { Cookies } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { hoursToSeconds } from 'date-fns';
import { dev } from '$app/environment';
import { getServerConfig } from '../server-config';

const COOKIE_PREFIX = `sq-`;

type RoomCookie = {
	password?: string;
};

const roomCookie = (roomId: string) => `${COOKIE_PREFIX}rm-${roomId}`;
const masterPasswordCookie = () => `${COOKIE_PREFIX}mp`;

type CookieOptions = Parameters<Cookies['set']>[2];
const cookieOptions = (options: Partial<CookieOptions> = {}) => ({
	path: '/',
	httpOnly: true,
	secure: !dev,
	sameSite: 'lax' as const,
	maxAge: hoursToSeconds(24 * 30),
	...options
});

/**
 * Initializes the cookie utils.
 */
export function init(cookies: Cookies) {
	const serverConfig = getServerConfig();

	/**
	 * Sets the room ID cookie.
	 */
	function setRoomIdCookie(roomId: string, password?: string) {
		const cookieValue: RoomCookie = {};
		if (password) {
			cookieValue.password = password;
		}

		const cookieString = Buffer.from(JSON.stringify(cookieValue)).toString(
			'base64url'
		);

		cookies.set(roomCookie(roomId), cookieString, cookieOptions());
	}

	/**
	 * Gets the room ID cookie. Will return null if there is an empty string or no cookie.
	 */
	function getRoomIdCookie(roomId: string): RoomCookie | null {
		const cookieValueRaw = cookies.get(roomCookie(roomId));
		if (!cookieValueRaw) {
			return null;
		}

		try {
			const cookieValue = JSON.parse(
				Buffer.from(cookieValueRaw, 'base64url').toString()
			);
			return cookieValue || null;
		} catch {
			return null;
		}
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

	/**
	 * Sets the master password cookie.
	 */
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
