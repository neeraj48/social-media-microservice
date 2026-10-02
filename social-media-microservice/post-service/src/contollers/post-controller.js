import logger from "../utils/logger.js";
import Post from "../models/Post.js";
import { validateCreatePost } from "../utils/validation.js";

const createPost = async (req, res) => {
  logger.info("Creating post for user: %s", req.user.userId);
  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn(
        "Validation error during post creation: %o",
        error.details[0].message,
      );
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const { content, mediaIds } = req.body;
    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });
    await newlyCreatedPost.save();
    logger.info("Post created for user: %s", req.user.userId);
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: newlyCreatedPost,
    });
  } catch (error) {
    logger.error("Error creating post: %o", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    logger.info("Retrieved all posts, count: %d", posts.length);
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    logger.error("Error retrieving posts: %o", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
  } catch (error) {
    logger.error("Error retrieving post by ID: %o", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
  } catch (error) {
    logger.error("Error deleting post: %o", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export { createPost };
