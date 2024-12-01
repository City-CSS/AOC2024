import dotenv from 'dotenv';
import { Config } from '../types/leaderboard';

export function loadConfig(): Config {
	const envLoadingResult = dotenv.config({ path: '../.env' });
	if (envLoadingResult.error) {
		console.error('Error loading .env file:', envLoadingResult.error);
		process.exit(1);
	}

	const sessionCookie = process.env.SESSION_COOKIE;
	if (!sessionCookie) {
		console.error('Session cookie was not provided!')
		process.exit(1);
	}

	return {
		sessionCookie: process.env.SESSION_COOKIE as string,
		leaderboardIds: [
				"4296175" // CSG
		],
		year: process.env.YEAR || '2023',
	};
}

export const CACHE_DURATION = (process.env.CACHE_DURATION as unknown as number || 15) * 60 * 1000;
export const PORT = process.env.PORT || 3000;

