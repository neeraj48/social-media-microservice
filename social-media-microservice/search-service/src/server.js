import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";
import Redis from "ioredis";
import { searchRoutes } from "./routes/search-routes.js";
import { connectToRabbitMQ, consumeFromRabbitMQ } from "./utils/rabbitmq.js";
import {
  handlePostCreated,
  handleDeletePost,
} from "./eventHandlers/search-event-handlers.js";
import rateLimit, { rateLimit as createRateLimit } from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 3004;

// connect to mongodb
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info("connected to mongodb"))
  .catch((err) => logger.error("Error connecting to mongodb", err));

//middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info("Incoming request: %s %s", req.method, req.url);
  logger.info("Request headers: %o", req.headers);
  logger.info("Request body: %o", req.body);
  next();
});

const searchRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  keyGenerator: (req) => req.user.userId,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Media API rate limit exceeded for user: %s", req.user.userId);
    res.status(429).json({
      success: false,
      message:
        "Too many media API requests. Please try again after 15 minutes.",
    });
  },
});

const apiRateLimti = rateLimit(searchRateLimit);

app.use("/api/search", searchRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    await consumeFromRabbitMQ("post.created", handlePostCreated);
    await consumeFromRabbitMQ("post.deleted", handleDeletePost);
    app.listen(PORT, () => {
      logger.info(`Search service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(error, "failed to start search service");
    process.exit(1);
  }
}

startServer();
