const express = require("express");
const axios = require("axios");
require('dotenv').config();
const cors = require("cors");
const app = express();
const PORT = 6000;

// Configuration
const config = {
  sessionCookie: process.env.SESSION_COOKIE,
  leaderboardId: "48462", // Your leaderboard ID
  year: "2023",
};

// Cache configuration
let cachedLeaderboard = null;
let lastFetchTime = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// CORS Configuration
const corsOptions = {
  origin: ["http://localhost:6000", "http://127.0.0.1:6000"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};



app.use(cors(corsOptions));

// Function to fetch the leaderboard
const fetchLeaderboardData = async () => {
  const now = Date.now();

  // Return cached data if it's still valid
  if (
    cachedLeaderboard &&
    lastFetchTime &&
    now - lastFetchTime < CACHE_DURATION
  ) {
    return cachedLeaderboard;
  }

  return hitEndpoint(now);
};

const hitEndpoint = async (now) => {
  try {
    let response = await fetchData();
    cachedLeaderboard = response.data;
    lastFetchTime = now;
    console.log(`Leaderboard data fetched successfully at ${new Date().toISOString()}`);
    return cachedLeaderboard;
  } catch (error) {
    if (error.message.includes('REDIRECT_ERROR')) {
      console.error('Session likely expired:', error.message);
    } else if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else {
      console.error("Error fetching leaderboard data:", error.message);
    }
  }
}

const fetchData = async () => {
  const url = `https://adventofcode.com/${config.year}/leaderboard/private/view/${config.leaderboardId}.json`;

  const response = await axios.get(url, {
    headers: {
      Cookie: `session=${config.sessionCookie}`
    },
  });

  if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>'))
    throw new Error('REDIRECT_ERROR: Received HTML instead of JSON - likely redirected to login page');

  return response;
}

// Leaderboard endpoint
app.get("/leaderboard", cors(corsOptions), async (req, res) => {
  try {
    const data = await fetchLeaderboardData();
    res.json(data);
  } catch (error) {
    res.status(503).json({
      error: "Failed to fetch leaderboard data",
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
  console.log(`Fetching leaderboard ID: ${config.leaderboardId} for year ${config.year}`,);
  await hitEndpoint();
});
