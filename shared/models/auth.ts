import { sql } from "drizzle-orm";
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: integer("user_id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect & { profileImageUrl?: string | null };
