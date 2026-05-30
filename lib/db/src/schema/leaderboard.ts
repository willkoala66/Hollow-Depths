import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const leaderboardTable = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  totalFrames: integer("total_frames").notNull(),
  deaths: integer("deaths").notNull(),
  hollowFrames: integer("hollow_frames"),
  sovereignFrames: integer("sovereign_frames"),
  playerHpAtHollow: integer("player_hp_at_hollow"),
  playerHpAtSovereign: integer("player_hp_at_sovereign"),
  playerHpAtHunter: integer("player_hp_at_hunter"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LeaderboardEntry = typeof leaderboardTable.$inferSelect;
export type InsertLeaderboard = typeof leaderboardTable.$inferInsert;
