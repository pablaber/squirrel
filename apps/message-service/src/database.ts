import { db, schema, type types } from "@squirrel/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export async function addMessageToDatabase(message: types.Message) {
  try {
    await db().insert(schema.messages).values(message);
  } catch (error) {
    logger.error({
      message: "failed to save message to database",
      error,
    });
  }

  logger.debug({
    message: "saved message to database",
    messageId: message.id,
  });

  try {
    await db()
      .update(schema.rooms)
      .set({ updatedAt: new Date() })
      .where(eq(schema.rooms.id, message.roomId));
  } catch (error) {
    logger.error({
      message: "failed to update room updatedAt",
      error,
    });
  }

  logger.debug({
    message: "updated room updatedAt",
    roomId: message.roomId,
  });
}
