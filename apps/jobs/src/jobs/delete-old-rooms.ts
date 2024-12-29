import { db, schema } from "@squirrel/db";
import { lt, inArray, count } from "drizzle-orm";
import { logger } from "../utils/logger";
import type { Job } from "../types";

// Every 30 minutes
const CHRON_SCHEDULE = "*/30 * * * *";

/**
 * Deletes old rooms that have expired as well as all messages that were in
 * those rooms.
 */
async function deleteOldRoomsBase(options: { dryRun: boolean }) {
  const { dryRun } = options;

  const matchingRooms = await db()
    .select()
    .from(schema.rooms)
    .where(lt(schema.rooms.expires, new Date()));

  const matchingRoomInfo = matchingRooms.map((r) => ({
    id: r.id,
    expires: r.expires,
    createdAt: r.createdAt,
  }));
  logger.debug(
    { matchingRoomInfo },
    `Found ${matchingRooms.length} rooms to delete`
  );

  const roomIds = matchingRooms.map((r) => r.id);

  if (!dryRun) {
    const { rowCount: deletedMessageCount } = await db()
      .delete(schema.messages)
      .where(inArray(schema.messages.roomId, roomIds));

    logger.debug({ roomIds }, `Deleted ${deletedMessageCount} messages`);

    const { rowCount: deletedRoomCount } = await db()
      .delete(schema.rooms)
      .where(inArray(schema.rooms.id, roomIds));

    logger.debug({ roomIds }, `Deleted ${deletedRoomCount} rooms`);

    const stats = {
      deletedMessageCount,
      deletedRoomCount,
    };
    logger.info({ stats }, "Run stats");
  } else {
    const [{ count: deletedMessageCount }] = await db()
      .select({ count: count() })
      .from(schema.messages)
      .where(inArray(schema.messages.roomId, roomIds));
    logger.debug(
      { roomIds },
      `DRY RUN: Would have deleted ${deletedMessageCount} messages`
    );

    const [{ count: deletedRoomCount }] = await db()
      .select({ count: count() })
      .from(schema.rooms)
      .where(inArray(schema.rooms.id, roomIds));
    logger.debug(
      { roomIds },
      `DRY RUN: Would have deleted ${deletedRoomCount} rooms`
    );

    logger.info(
      { stats: { deletedMessageCount: 0, deletedRoomCount: 0 } },
      "Did not delete rooms and messages because this is a dry run"
    );
  }
}

/**
 * Deletes old rooms that have expired as well as all messages that were in
 * those rooms.
 */
async function deleteOldRooms(options: {
  dryRun: boolean;
}): Promise<{ success: boolean }> {
  try {
    await deleteOldRoomsBase(options);
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed running room deletion.");
    return { success: false };
  }
}

export const deleteOldRoomsJob: Job = {
  schedule: CHRON_SCHEDULE,
  handler: deleteOldRooms,
};