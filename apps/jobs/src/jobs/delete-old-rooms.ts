import { db, schema } from "@squirrel/db";
import { lt, inArray } from "drizzle-orm";
import { subDays } from "date-fns";
import { logger } from "../utils/logger";

export async function deleteOldRooms() {
  const deleteCutoff = subDays(new Date(), 7);
  const matchingRooms = await db()
    .select()
    .from(schema.rooms)
    .where(lt(schema.rooms.createdAt, deleteCutoff));

  const { rowCount: deletedMessages } = await db()
    .delete(schema.messages)
    .where(
      inArray(
        schema.messages.roomId,
        matchingRooms.map((r) => r.id)
      )
    );

  logger.debug(`Deleted ${deletedMessages} messages`);

  const { rowCount } = await db()
    .delete(schema.rooms)
    .where(
      inArray(
        schema.rooms.id,
        matchingRooms.map((r) => r.id)
      )
    );

  logger.debug(`Deleted ${rowCount} rooms`);
}
