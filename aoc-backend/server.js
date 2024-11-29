const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const PORT = 6000;

// Configuration
const config = {
  sessionCookie: "53616c7465645f5f4e18f5cf11ef02c3ea2db55f8f655a638597dce0e8b54e980772dc17e4ba5b0b11f7471ecc52dca275a560debd3256ae6edbcf84bcf8896a",
  leaderboardId: "4296566", // Your leaderboard ID
  year: "2024",
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

  try {
    const url = `https://adventofcode.com/${config.year}/leaderboard/private/view/${config.leaderboardId}.json`;

    const response = await axios.get(url, {
      headers: {
        Cookie: `session=${config.sessionCookie}`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    cachedLeaderboard = response.data;
    lastFetchTime = now;

    console.log(
      `Leaderboard data fetched successfully at ${new Date().toISOString()}`,
    );
    return cachedLeaderboard;
  } catch (error) {
    console.error("Error fetching leaderboard data:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
    throw error;
  }
};

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `Fetching leaderboard ID: ${config.leaderboardId} for year ${config.year}`,
  );
});
