import { error, redirect } from '@sveltejs/kit';
import { db, schema } from '@squirrel/db';
import { createCryptoUtils } from '$lib/utils';
import { passwordUtils, cookieUtils } from '$lib/server/utils';
import crypto from 'node:crypto';
import '@fontsource/pacifico';

const cryptoUtils = createCryptoUtils(crypto.webcrypto.subtle as SubtleCrypto);

export const actions = {
	create: async ({ request, cookies }) => {
		const formData = await request.formData();
		const password = formData.get('password')?.toString();

		const ownerPublicKey = formData.get('publicKey')?.toString();
		const hashedPassword = password
			? passwordUtils.hashPassword(password)
			: null;
		const newRoomId = formData.get('newRoomId')?.toString();

		if (!newRoomId) {
			throw error(400, {
				message: 'Room ID is required'
			});
		}

		if (!ownerPublicKey) {
			throw error(400, {
				message: 'Public key is required'
			});
		}

		const ownerCryptoKey = await cryptoUtils.importKey(ownerPublicKey);
		const ownerFingerprint =
			await cryptoUtils.calculateFingerprint(ownerCryptoKey);

		const [{ roomId }] = await db()
			.insert(schema.rooms)
			.values({
				id: newRoomId,
				ownerPublicKey,
				ownerFingerprint,
				password: hashedPassword
			})
			.returning({ roomId: schema.rooms.id });

		const bakery = cookieUtils.init(cookies);
		bakery.setRoomIdCookie(roomId, password);

		return redirect(302, `/room/${roomId}`);
	}
};
