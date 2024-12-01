import express, { Request, Response } from 'express';
import axios, {AxiosError, AxiosResponse} from "axios";
import dotenv from 'dotenv';
import cors, {CorsOptions} from "cors";

const envLoadingResult = dotenv.config({ path: '../.env' });
if (envLoadingResult.error) {
  console.error('Error loading .env file:', envLoadingResult.error);
  process.exit(1);
}

interface Config {
  sessionCookie: string;
  leaderboardIds: string[];
  year: string;
}

interface LeaderboardData {
  // TODO: Define
  [key: string]: any;
}

interface LeaderboardResult {
  id: string;
  data: LeaderboardData | null;
  error: string | null;
}

class LeaderboardCacheEntry {
  constructor(
      public data: LeaderboardData,
      public lastFetchTime: number = Date.now()
  ) {}

  isValid(): boolean {
    return Date.now() - this.lastFetchTime < CACHE_DURATION;
  }
}

// Configuration
const PORT = process.env.PORT || 3000;
const CACHE_DURATION = (process.env.CACHE_DURATION as unknown as number || 15) * 60 * 1000; // Convert to milliseconds

const config: Config = {
  sessionCookie: process.env.SESSION_COOKIE || '',
  leaderboardIds: [
    "4296175" // CSG
  ],
  year: process.env.YEAR || '2023',
};

// CORS Configuration
const corsOptions: CorsOptions = {
  origin: [`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

const app = express();
app.use(cors(corsOptions));

const leaderboardCache = new Map<string, LeaderboardCacheEntry>();

// Function to fetch the leaderboard
const fetchLeaderboardData = async (leaderboardId: string): Promise<LeaderboardData> => {
  const cachedEntry = leaderboardCache.get(leaderboardId);

  // Return cached data if it's still valid
  if (cachedEntry && cachedEntry.isValid()) {
    return cachedEntry.data;
  }

  return hitEndpoint(leaderboardId);
};

const hitEndpoint = async (leaderboardId: string): Promise<LeaderboardData> => {
  try {
    const response = await fetchData(leaderboardId);
    const newCacheEntry = new LeaderboardCacheEntry(response.data);
    leaderboardCache.set(leaderboardId, newCacheEntry);
    console.log(`Leaderboard ${leaderboardId} data fetched successfully at ${new Date().toISOString()}`);
    return newCacheEntry.data;
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('REDIRECT_ERROR')) {
      console.error('Session likely expired:', error.message);
    } else if (error instanceof AxiosError && error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else {
      console.error(`Error fetching leaderboard ${leaderboardId} data:`, (error as Error).message);
    }
    throw error;
  }
};

const fetchData = async (leaderboardId: string): Promise<AxiosResponse<LeaderboardData>> => {
  const url = `https://adventofcode.com/${config.year}/leaderboard/private/view/${leaderboardId}.json`;

  const response = await axios.get<LeaderboardData>(url, {
    headers: {
      Cookie: `session=${config.sessionCookie}`
    },
  });

  if (response.data != null && response.data.toString().includes('<!DOCTYPE html>')) {
    throw new Error('REDIRECT_ERROR: Received HTML instead of JSON - likely redirected to login page');
  }
  return response;
};

// Single leaderboard endpoint
app.get("/leaderboard/:id", cors(corsOptions), async (req: Request, res: Response) => {
  try {
    if (!config.leaderboardIds.includes(req.params.id)) {
      res.status(404).json({ error: "Leaderboard not found" });
      return;
    }

    const data = await fetchLeaderboardData(req.params.id);
    res.json(data);
  } catch (error: unknown) {
        res.status(503).json(
        {
          error: "Failed to fetch leaderboard data",
          message: (error as Error).message
        });
  }
});

// All leaderboards endpoint
app.get("/leaderboards", cors(corsOptions), async (_: Request, res: Response) => {
  try {
    const results: LeaderboardResult[] = await Promise.all(
        config.leaderboardIds.map(async (leaderboardId) => {
          try {
            const data = await fetchLeaderboardData(leaderboardId);
            return {
              id: leaderboardId,
              data: data,
              error: null
            };
          } catch (error: unknown) {
            return {
              id: leaderboardId,
              data: null,
              error: (error as Error).message
            };
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

// Error handling middleware
app.use((err: Error, _: Request, res: Response) => {
  console.error(err.stack);
  res.status(500).json(
      {
        error: "Internal Server Error",
        message: err.message
      });
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Initial fetch of all leaderboards
  for (const leaderboardId of config.leaderboardIds) {
    try {
      await hitEndpoint(leaderboardId);
    } catch {
      console.error(`Failed to fetch initial data for leaderboard ${leaderboardId}`);
    }
  }
});
