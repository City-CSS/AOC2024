import { Router, Request, Response } from 'express';
import { Config } from '../types/leaderboard';
import { LeaderboardService } from '../services/leaderboardService';

export function createLeaderboardRouter(leaderboardService: LeaderboardService, config: Config): Router {
	const router = Router();

	router.get("/:id", async (req: Request, res: Response) => {
		try {
			if (!config.leaderboardIds.includes(req.params.id)) {
				res.status(404).json({ error: "Leaderboard not found" });
				return;
			}

			const data = await leaderboardService.getLeaderboardData(req.params.id);
			res.json(data);
		} catch (error: unknown) {
			res.status(503).json(
					{
						error: "Failed to fetch leaderboard data",
						message: (error as Error).message
					});
		}
	});

	router.get("/", async (_: Request, res: Response) => {
		try {
			const results = await Promise.all(
					config.leaderboardIds.map(async (leaderboardId) => {
						try {
							const data = await leaderboardService.getLeaderboardData(leaderboardId);
							return { id: leaderboardId, data, error: null };
						} catch (error: unknown) {
							return { id: leaderboardId, data: null, error: (error as Error).message };
						}
					})
			);
			res.json(results);
		} catch (error: unknown) {
			res.status(503).json(
					{
						error: "Failed to fetch leaderboards data",
						message: (error as Error).message
					});
		}
	});

	return router;
}
