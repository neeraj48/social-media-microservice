import express from "express";
import { rateLimit } from "express-rate-limit";
import { searchPostCtrl } from "../contollers/search-controller.js";
import { authenticateRequest } from "../middleware/authMiddleware.js";
import logger from "../utils/logger.js";

const router = express.Router();

const searchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  keyGenerator: (req) => req.user.userId,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Search API rate limit exceeded for user: %s", req.user.userId);
    res.status(429).json({
      success: false,
      message: "Too many search API requests. Please try again after 15 minutes.",
    });
  },
});

router.use(authenticateRequest, searchRateLimit);

router.get("/posts", searchPostCtrl);

const searchRoutes = router;

export { searchRoutes };
