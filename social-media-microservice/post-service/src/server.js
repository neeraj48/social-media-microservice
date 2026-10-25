import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import Redis from "ioredis";
import cors from "cors";
import helmet from "helmet";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";
import postRoutes from "./routes/post-routes.js";
import { connectToRabbitMQ } from "./utils/rabbitmq.js";

const app = express();
const PORT = process.env.PORT || 3002;

//connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((err) => {
    logger.error("Error connecting to MongoDB: %o", err);
  });

// Connect to Redis
const redisClient = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
);
redisClient.on("error", (err) => {
  logger.error("Redis connection error: %o", err);
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info("Incoming request: %s %s", req.method, req.url);
  logger.info("Request headers: %o", req.headers);
  logger.info("Request body: %o", req.body);
  next();
});

// Routes
app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes,
);

// Error handling middleware
app.use(errorHandler);

async function startServer() {
  try {
    // Connect to RabbitMQ
    await connectToRabbitMQ();
    app.listen(PORT, () => {
      logger.info(`Post service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Error starting the server: %o", error);
    process.exit(1); // Exit the process with an error code
  }
}

startServer();

// Start the server
// app.listen(PORT, () => {
//   logger.info(`Post service is running on port ${PORT}`);
// });

//unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at: %o, reason: %o", promise, reason);
  // Optionally, you can exit the process or perform other actions here
});
