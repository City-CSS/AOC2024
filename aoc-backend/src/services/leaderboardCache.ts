import { LeaderboardData } from '../types/leaderboard';

export class LeaderboardCacheEntry {
	constructor(
			public data: LeaderboardData,
			public lastFetchTime: number = Date.now()
	) {}

	isValid(cacheDuration: number): boolean {
		return Date.now() - this.lastFetchTime < cacheDuration;
	}
}

export class LeaderboardCache {
	private cache = new Map<string, LeaderboardCacheEntry>();

	get(leaderboardId: string): LeaderboardCacheEntry | undefined {
		return this.cache.get(leaderboardId);
	}

	set(leaderboardId: string, data: LeaderboardData): void {
		this.cache.set(leaderboardId, new LeaderboardCacheEntry(data));
	}
}
