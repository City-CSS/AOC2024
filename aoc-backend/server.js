const express = require("express");
const axios = require("axios");
require('dotenv').config();
const cors = require("cors");
const app = express();

// Configuration
const PORT = process.env.PORT;
const CACHE_DURATION = process.env.CACHE_DURATION * 60 * 1000; // Convert to milliseconds

const config = {
  sessionCookie: process.env.SESSION_COOKIE,
  leaderboardIds: [
    "4296175" // CSG
  ],
  year: process.env.YEAR,
};

// CORS Configuration
const corsOptions = {
  origin: [`http://localhost:${PORT}`, "http://127.0.0.1:${PORT}"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

const leaderboardCache = new Map();

class LeaderboardCacheEntry {
  constructor(data) {
    this.data = data;
    this.lastFetchTime = Date.now();
  }

  isValid() {
    return Date.now() - this.lastFetchTime < CACHE_DURATION;
  }
}

// Function to fetch the leaderboard
const fetchLeaderboardData = async (leaderboardId) => {
  const cachedEntry = leaderboardCache.get(leaderboardId);

  // Return cached data if it's still valid
  if (cachedEntry && cachedEntry.isValid()) {
    return cachedEntry.data;
  }

  return hitEndpoint(leaderboardId);
};

const hitEndpoint = async (leaderboardId) => {
  try {
    let response = await fetchData(leaderboardId);
    const newCacheEntry = new LeaderboardCacheEntry(response.data);
    leaderboardCache.set(leaderboardId, newCacheEntry);
    console.log(`Leaderboard ${leaderboardId} data fetched successfully at ${new Date().toISOString()}`);
    return newCacheEntry.data;
  } catch (error) {
    if (error.message.includes('REDIRECT_ERROR')) {
      console.error('Session likely expired:', error.message);
    } else if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else {
      console.error(`Error fetching leaderboard ${leaderboardId} data:`, error.message);
    }
    throw error;
  }
}

const fetchData = async (leaderboardId) => {
  const url = `https://adventofcode.com/${config.year}/leaderboard/private/view/${leaderboardId}.json`;

  const response = await axios.get(url, {
    headers: {
      Cookie: `session=${config.sessionCookie}`
    },
  });

  if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>'))
    throw new Error('REDIRECT_ERROR: Received HTML instead of JSON - likely redirected to login page');

  return response;
}

// Single leaderboard endpoint
app.get("/leaderboard/:id", cors(corsOptions), async (req, res) => {
  try {
    if (!config.leaderboardIds.includes(req.params.id)) {
      return res.status(404).json({ error: "Leaderboard not found" });
    }
    const data = await fetchLeaderboardData(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(503).json({
      error: "Failed to fetch leaderboard data",
      message: error.message,
    });
  }
});

// All leaderboards endpoint
app.get("/leaderboards", cors(corsOptions), async (req, res) => {
  try {
    const results = await Promise.all(
      config.leaderboardIds.map(async (leaderboardId) => {
        try {
          const data = await fetchLeaderboardData(leaderboardId);
          return {
            id: leaderboardId,
            data: data,
            error: null
          };
        } catch (error) {
          return {
            id: leaderboardId,
            data: null,
            error: error.message
          };
        }
      })
    );
    res.json(results);
  } catch (error) {
    res.status(503).json({
      error: "Failed to fetch leaderboards data",
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Initial fetch of all leaderboards
  for (const leaderboardId of config.leaderboardIds) {
    try {
      await hitEndpoint(leaderboardId);
    } catch (error) {
      console.error(`Failed to fetch initial data for leaderboard ${leaderboardId}`);
    }
  }
});
