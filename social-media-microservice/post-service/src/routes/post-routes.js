import express from "express";
import { rateLimit } from "express-rate-limit";
import { authenticateRequest } from "../middleware/authMiddleware.js";
import logger from "../utils/logger.js";
import {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
} from "../contollers/post-controller.js";

const router = express.Router();

const postRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  keyGenerator: (req) => req.user.userId,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Post API rate limit exceeded for user: %s", req.user.userId);
    res.status(429).json({
      success: false,
      message: "Too many post API requests. Please try again after 15 minutes.",
    });
  },
});

router.use(authenticateRequest, postRateLimit);

router.post("/create-post", createPost);
router.get("/all-posts", getAllPosts);
router.get("/:id", getPostById);
router.delete("/:id", deletePost);

export default router;
