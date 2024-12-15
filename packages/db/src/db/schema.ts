import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { ids } from "@squirrel/core";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ids.generate(10)),
  username: text("username").unique(),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  password: text("password"),
  ownerPublicKey: text("owner_public_key").notNull(),
  ownerFingerprint: text("owner_fingerprint").notNull(),
  guestPublicKey: text("guest_public_key"),
  guestFingerprint: text("guest_fingerprint"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const roomRelations = relations(rooms, ({ many }) => ({
  messages: many(messages),
}));

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .references(() => rooms.id)
    .notNull(),
  sender: text("sender").notNull(),
  content: text("content").notNull(),
  ts: timestamp("ts").defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  room: one(rooms, { fields: [messages.roomId], references: [rooms.id] }),
}));
