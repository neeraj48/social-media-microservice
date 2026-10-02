import express from "express";
import { authenticateRequest } from "../middleware/authMiddleware.js";
import { createPost } from "../contollers/post-controller.js";

const router = express.Router();

router.use(authenticateRequest);

router.post("/create-post", createPost);

export default router;
