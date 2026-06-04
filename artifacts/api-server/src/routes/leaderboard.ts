import { Router, type IRouter } from "express";
import { db, leaderboardTable } from "@workspace/db";
import { asc, desc, lt, count } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const insertSchema = z.object({
  name: z.string().min(1).max(32).trim(),
  totalFrames: z.number().int().positive(),
  deaths: z.number().int().min(0),
  hollowFrames: z.number().int().positive().nullable().optional(),
  sovereignFrames: z.number().int().positive().nullable().optional(),
  playerHpAtHollow: z.number().int().min(0).nullable().optional(),
  playerHpAtSovereign: z.number().int().min(0).nullable().optional(),
  playerHpAtHunter: z.number().int().min(0).nullable().optional(),
});

router.get("/leaderboard", async (req, res) => {
  try {
    const entries = await db
      .select()
      .from(leaderboardTable)
      .orderBy(
        asc(leaderboardTable.totalFrames),
        asc(leaderboardTable.deaths),
        desc(leaderboardTable.playerHpAtHunter),
        desc(leaderboardTable.playerHpAtSovereign),
        desc(leaderboardTable.playerHpAtHollow),
        asc(leaderboardTable.hollowFrames),
        asc(leaderboardTable.sovereignFrames),
        asc(leaderboardTable.createdAt),
      )
      .limit(10);
    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch leaderboard");
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

router.post("/leaderboard", async (req, res) => {
  const result = insertSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid data", issues: result.error.issues });
    return;
  }
  try {
    const [entry] = await db
      .insert(leaderboardTable)
      .values(result.data)
      .returning();
    const [{ rankAbove }] = await db
      .select({ rankAbove: count() })
      .from(leaderboardTable)
      .where(lt(leaderboardTable.totalFrames, entry.totalFrames));
    const [{ total }] = await db
      .select({ total: count() })
      .from(leaderboardTable);
    res.status(201).json({ ...entry, rank: Number(rankAbove) + 1, total: Number(total) });
  } catch (err) {
    req.log.error({ err }, "Failed to insert leaderboard entry");
    res.status(500).json({ error: "Failed to save entry" });
  }
});

export default router;
