import crypto from 'node:crypto';
import { z } from 'zod';
import { db, schema } from '@squirrel/db';
import { createCryptoUtils } from '$lib/utils';
import { eq } from 'drizzle-orm';

const { rooms } = schema;
const cryptoUtils = createCryptoUtils(crypto.webcrypto.subtle as SubtleCrypto);

export async function POST({ request, params }) {
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
	const guestFingerprint = await cryptoUtils.calculateFingerprint(guestKey);

	const existingRoom = await db().query.rooms.findFirst({
		where: (rooms, { eq }) => eq(rooms.id, roomId)
	});

	if (!existingRoom) {
		return Response.json(
			{
				error: 'Room not found'
			},
			{ status: 404 }
		);
	}

	if (existingRoom.guestPublicKey) {
		return Response.json(
			{
				error: 'Room already has a guest'
			},
			{ status: 400 }
		);
	}

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
