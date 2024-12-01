import axios, { AxiosError } from 'axios';
import { Config, RawLeaderboardData, FilteredLeaderboardData, LeaderboardData } from '../types/leaderboard';
import { LeaderboardCache } from './leaderboardCache';

export class LeaderboardService {
	private cache: LeaderboardCache;

	constructor(
			private config: Config,
			private cacheDuration: number
	) {
		this.cache = new LeaderboardCache();
	}

	private filterLeaderboardData(data: RawLeaderboardData): FilteredLeaderboardData {
		const members = Object.values(data.members).map(member => ({
			id: member.id,
			name: member.name,
			local_score: member.local_score,
			completion_day_level: member.completion_day_level
		}));

		return { members };
	}

	private async fetchData(leaderboardId: string): Promise<RawLeaderboardData> {
		const url = `https://adventofcode.com/${this.config.year}/leaderboard/private/view/${leaderboardId}.json`;

		const response = await axios.get<RawLeaderboardData>(url, {
			headers: {
				Cookie: `session=${this.config.sessionCookie}`
			},
		});

		if (response.data != null && response.data.toString().includes('<!DOCTYPE html>')) {
			throw new Error('REDIRECT_ERROR: Received HTML instead of JSON - likely redirected to login page');
		}

		return response.data;
	}

	private async hitEndpoint(leaderboardId: string): Promise<FilteredLeaderboardData> {
		try {
			const data = await this.fetchData(leaderboardId);
			const filteredData = this.filterLeaderboardData(data);
			this.cache.set(leaderboardId, filteredData);
			console.log(`Leaderboard ${leaderboardId} data fetched successfully at ${new Date().toISOString()}`);
			return filteredData;
		} catch (error: unknown) {
			this.handleError(error, leaderboardId);
			throw error;
		}
	}

	private handleError(error: unknown, leaderboardId: string): void {
		if (error instanceof Error && error.message?.includes('REDIRECT_ERROR')) {
			console.error('Session likely expired:', error.message);
		} else if (error instanceof AxiosError && error.response) {
			console.error("Response status:", error.response.status);
			console.error("Response headers:", error.response.headers);
		} else {
			console.error(`Error fetching leaderboard ${leaderboardId} data:`, (error as Error).message);
		}
	}

	async getLeaderboardData(leaderboardId: string): Promise<LeaderboardData> {
		const cachedEntry = this.cache.get(leaderboardId);

		if (cachedEntry && cachedEntry.isValid(this.cacheDuration)) {
			return cachedEntry.data;
		}

		return this.hitEndpoint(leaderboardId);
	}

	async initializeCache(): Promise<void> {
		for (const leaderboardId of this.config.leaderboardIds) {
			try {
				await this.hitEndpoint(leaderboardId);
			} catch {
				console.error(`Failed to fetch initial data for leaderboard ${leaderboardId}`);
			}
		}
	}
}
