import { cookieUtils } from '$lib/server/utils/index.js';
import { z } from 'zod';
import { db, schema } from '@squirrel/db';
import { eq } from 'drizzle-orm';
import { passwordUtils } from '$lib/server/utils';

const bodySchema = z.object({
	password: z.string()
});

export async function POST({ request, params, cookies }) {
	const { roomId } = params;

	// Extract the password from the request body
	const { data, error } = bodySchema.safeParse(await request.json());
	if (!data || error) {
		return Response.json({ error: 'Invalid request body' }, { status: 400 });
	}
	const { password } = data;

	const room = await db().query.rooms.findFirst({
		where: eq(schema.rooms.id, roomId)
	});
	if (!room) {
		return Response.json({ error: 'Room not found' }, { status: 404 });
	}

	const roomPassword = room.password;
	if (!roomPassword) {
		return Response.json({ error: 'Room password not set' }, { status: 400 });
	}

	const isPasswordCorrect = passwordUtils.verifyPassword(
		password,
		roomPassword
	);
	if (!isPasswordCorrect) {
		return Response.json({ error: 'Invalid password' }, { status: 401 });
	}

	const cookieMonster = cookieUtils.init(cookies);
	cookieMonster.setRoomIdCookie(roomId, password);

	return new Response(null, { status: 204 });
}
