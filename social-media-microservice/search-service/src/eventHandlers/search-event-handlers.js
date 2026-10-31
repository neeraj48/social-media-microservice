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

async function handleDeletePost(event) {
  try {
    await Search.findOneAndDelete({ postId: event.postId });
    logger.info(`Search post deleted: ${event.postId}`);
  } catch (error) {
    logger.error("Error handling post deletion search post event");
  }
}

export { handlePostCreated, handleDeletePost };
