import { db } from '@squirrel/db';
import { error, json } from '@sveltejs/kit';

/**
 * Get the room data for a given room ID.
 */
export async function GET({ params }) {
	const { roomId } = params;

	const room = await db().query.rooms.findFirst({
		where: (rooms, { eq }) => eq(rooms.id, roomId),
		with: {
			messages: true
		}
	});

	if (!room) {
		throw error(404, 'Room not found');
	}

	// TODO: password check

	return json({ room });
}
