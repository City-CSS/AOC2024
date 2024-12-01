import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import { loadConfig, CACHE_DURATION, PORT } from './config/config';
import { LeaderboardService } from './services/leaderboardService';
import { createLeaderboardRouter } from './routes/leaderboardRoutes';

const config = loadConfig();

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

const leaderboardService = new LeaderboardService(config, CACHE_DURATION);

app.use('/leaderboard', createLeaderboardRouter(leaderboardService, config));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _: NextFunction): void => {
  console.error('Error caught in middleware:', err);
  res.status(500).json(
      {
        error: "Internal Server Error",
        message: err.message
      });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await leaderboardService.initializeCache();
});
