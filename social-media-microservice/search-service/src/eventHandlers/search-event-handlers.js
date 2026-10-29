import logger from "../utils/logger.js";
import Search from "../models/Search.js";

async function handlePostCreated(event) {
  try {
    const newSearchPost = new Search({
      PostId: event.postId,
      UserId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });

    await newSearchPost.save();

    logger.info(
      `Search post created: ${event.postId}, ${newSearchPost._id.toString()}`,
    );
  } catch (error) {
    logger.error(error, "Error while post creation event in Search Document");
  }
}

export { handlePostCreated };
