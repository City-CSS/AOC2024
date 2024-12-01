import { AxiosResponse } from 'axios';

export interface Config {
	sessionCookie: string;
	leaderboardIds: string[];
	year: string;
}

export interface Star {
	star_index: number;
	get_star_ts: number;
}

export interface DayCompletion {
	"1": Star;
	"2": Star;
}

export interface CompletionDayLevel {
	[day: string]: DayCompletion;
}

export type RawMember = Member
export interface Member {
	id: string;
	name: string;
	local_score: number;
	completion_day_level: CompletionDayLevel;
}

export interface RawLeaderboardData {
	members: { [key: string]: RawMember };
	// OTHER FIELDS IGNORED
}

export type LeaderboardData = FilteredLeaderboardData;
export interface FilteredLeaderboardData {
	members: Member[];
}

export interface LeaderboardResult {
	id: string;
	data: FilteredLeaderboardData | null;
	error: string | null;
}

export type LeaderboardResponse = AxiosResponse<RawLeaderboardData>;
