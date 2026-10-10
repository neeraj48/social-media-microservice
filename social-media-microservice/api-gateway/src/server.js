import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import proxy from "express-http-proxy";
import logger from "./utils/logger.js";
import { rateLimit as createRateLimit } from "express-rate-limit";
import errorHandler from "./middleware/errorHandler.js";
import { validateToken } from "./middleware/authMiddleware.js";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

const redisClient = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
);
redisClient.on("error", (err) => {
  logger.error("Redis connection error: %o", err);
});

const rateLimitOption = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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
  store: new RedisStore({
    sendCommand: (command, ...args) => redisClient.call(command, ...args),
  }),
});

app.use(rateLimitOption);

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request for ${req.url}`);
  logger.info("Request body: %o", req.body);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error("Proxy error: %o", err);
    res.status(500).json({
      success: false,
      message: `Internal Server Error`,
      error: err.message,
    });
  },
};

//setting proxy for identity service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userReqDecorator: (proxyReq, proxyReqData, userReq, userRes) => {
      logger.info(
        `Proxying request to identity service: ${proxyReq.method} ${userReq.originalUrl}`,
      );
      return proxyReqData;
    },
  }),
);

//setting proxy for post service
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq?.user?.userId;
      return proxyReqOpts;
    },
    userReqDecorator: (proxyReq, proxyReqData, userReq, userRes) => {
      logger.info(
        `Proxying request to post service: ${proxyReq.method} ${userReq.originalUrl}`,
      );
      return proxyReqData;
    },
  }),
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(
    `Identity service running on port at ${process.env.IDENTITY_SERVICE_URL}`,
  );
  logger.info(
    `Post service running on port at ${process.env.POST_SERVICE_URL}`,
  );
  logger.info(`Redis URL: ${process.env.REDIS_URL}`);
});
