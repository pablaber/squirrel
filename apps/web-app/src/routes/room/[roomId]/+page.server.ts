import { db } from '@squirrel/db';
import { error, type Cookies } from '@sveltejs/kit';
import { cookieUtils, passwordUtils } from '$lib/server/utils';

export const load = async ({ params, ...rest }) => {
	const cookies = rest.cookies as Cookies;

	const { roomId } = params;

	const room = await db.query.rooms.findFirst({
		where: (rooms, { eq }) => eq(rooms.id, roomId),
		with: {
			messages: true
		}
	});

	if (!room) {
		throw error(404, 'Room not found');
	}

	if (!room.password) {
		return {
			room,
			passwordRequired: false
		};
	}

	const bakery = cookieUtils.init(cookies);
	const cookiePassword = bakery.getRoomIdCookie(roomId);

	if (!cookiePassword) {
		return {
			room,
			passwordRequired: true
		};
	}

	const correctPasswordHash = passwordUtils.verifyPassword(cookiePassword, room.password);

	return {
		room,
		passwordRequired: !correctPasswordHash
	};
};
