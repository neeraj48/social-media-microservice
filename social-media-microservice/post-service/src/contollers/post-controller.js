import logger from "../utils/logger.js";
import Post from "../models/Post.js";
import { validateCreatePost } from "../utils/validation.js";

async function invalidPostCache(req, input) {
  const cacheKey = `post_${input}`;
  await req.redisClient.get(cacheKey);
  
  const key = await req.redisClient.keys("posts:*");
  if (key) {
    await req.redisClient.del(key);
    logger.info("Invalidated post cache due to %s", input);
  }
}

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
    await invalidPostCache(req, newlyCreatedPost._id.toString());
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
  logger.info("Get all posts request received for user: %s", req.user.userId);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts_page_${page}_limit_${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);
    if (cachedPosts) {
      logger.info(
        "Retrieved posts from cache, count: %d",
        JSON.parse(cachedPosts).length,
      );
      return res
        .status(200)
        .json({ success: true, data: JSON.parse(cachedPosts) });
    }
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    const totalPosts = await Post.countDocuments();
    //save the retrieved posts in Redis cache for future requests
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(posts));
    logger.info("Retrieved all posts, count: %d", posts.length);
    res.status(200).json({ success: true, data: posts, total: totalPosts });
  } catch (error) {
    logger.error("Error retrieving posts: %o", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getPostById = async (req, res) => {
  logger.info("Retrieving post by ID: %s", req.params.id);
  try {
    const { id } = req.params;
    const cacheKey = `post_${id}`;
    const cachePost = await req.redisClient.get(cacheKey);
    if (cachePost) {
      logger.info("Retrieved post from cache for ID: %s", id);
      return res
        .status(200)
        .json({ success: true, data: JSON.parse(cachePost) });
    }
    const post = await Post.findById(id);
    if (!post) {
      logger.warn("Post not found for ID: %s", id);
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    logger.info("Retrieved post by ID: %s", id);
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    logger.error("Error retrieving post by ID: %o", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deletePost = async (req, res) => {
  logger.info("Deleting post by ID: %s", req.params.id);
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndDelete(id);
    if (!post) {
      logger.warn("Post not found for ID: %s", id);
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    logger.info("Post deleted by ID: %s", id);
    await invalidPostCache(req, id);
    res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    logger.error("Error deleting post: %o", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export { createPost, getAllPosts, getPostById, deletePost };
