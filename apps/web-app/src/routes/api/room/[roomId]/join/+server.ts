import crypto from 'node:crypto';
import { z } from 'zod';
import { db, schema } from '@squirrel/db';
import { createCryptoUtils } from '$lib/utils';
import { eq } from 'drizzle-orm';
import { cookieUtils } from '$lib/server/utils/index.js';

const { rooms } = schema;
const cryptoUtils = createCryptoUtils(crypto.webcrypto.subtle as SubtleCrypto);

export async function POST({ request, params, cookies }) {
	const { roomId } = params;

	const bodySchema = z.object({
		publicKey: z.string()
	});

	const { publicKey: guestPublicKey } = bodySchema.parse(await request.json());

	if (!roomId || !guestPublicKey) {
		return Response.json(
			{
				error: 'Room ID and public key are required'
			},
			{ status: 400 }
		);
	}

	let guestKey: CryptoKey;
	try {
		guestKey = await cryptoUtils.importKey(guestPublicKey);
	} catch (e) {
		console.error(e);
		return Response.json(
			{
				error: 'Invalid public key'
			},
			{ status: 400 }
		);
	}
	const guestFingerprint =
		await cryptoUtils.calculatePublicKeyFingerprint(guestKey);

	const existingRoom = await db().query.rooms.findFirst({
		where: (rooms, { eq }) => eq(rooms.id, roomId)
	});

	// Verify the room exists
	if (!existingRoom) {
		return Response.json(
			{
				error: 'Room not found'
			},
			{ status: 404 }
		);
	}

	// If the room has a password, verify the password set in a cookie matches
	if (existingRoom.password) {
		const cookieMonster = cookieUtils.init(cookies);
		const passwordValid = cookieMonster.testMasterPasswordCookie();
		if (!passwordValid) {
			return Response.json(
				{
					error: 'Invalid password'
				},
				{ status: 401 }
			);
		}
	}

	// If the room already has a guest, return an error
	if (existingRoom.guestPublicKey) {
		return Response.json(
			{
				error: 'Room already has a guest'
			},
			{ status: 400 }
		);
	}

	// Update the room with the new guest and return the room
	const [updatedRoom] = await db()
		.update(rooms)
		.set({
			guestPublicKey,
			guestFingerprint
		})
		.where(eq(rooms.id, roomId))
		.returning();

	return Response.json({
		room: updatedRoom
	});
}
