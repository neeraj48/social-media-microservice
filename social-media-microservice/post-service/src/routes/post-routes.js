import express from "express";
import { authenticateRequest } from "../middleware/authMiddleware.js";
import {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
} from "../contollers/post-controller.js";

const router = express.Router();

router.use(authenticateRequest);

router.post("/create-post", createPost);
router.get("/all-posts", getAllPosts);
router.get("/:id", getPostById);
router.delete("/:id", deletePost);

export default router;
