import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import logger from "./utils/logger.js";
import helmet from "helmet";
import cors from "cors";
import RateLimit from "express-rate-limit";
import routes from "./routes/identity_service.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3001;

// connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info("Connected to MongoDB"))
  .catch((error) => logger.error("Error connecting to MongoDB: %o", error));

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request for ${req.url}`);
  logger.info("Request body: %o", req.body);
  next();
});

// basic ip rate limit for sensitive endpoints like login and register
const sensitiveRateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn("Sensitive endpoint rate limit exceeded for IP: %s", req.ip);
    res.status(429).json({
      success: false,
      message:
        "Too many requests from this IP, please try again after 15 minutes",
    });
  },
};

const sensitiveRateLimit = RateLimit(sensitiveRateLimitOptions);

//apply sensitive rate limit to routes
app.use("/api/auth/register", sensitiveRateLimit);
app.use("/api/auth/login", sensitiveRateLimit);

// routes
app.use("/api/auth", routes);

// error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Identity service running on port ${PORT}`);
});

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at: %o, reason: %o", promise, reason);
  // Application specific logging, throwing an error, or other logic here
});
