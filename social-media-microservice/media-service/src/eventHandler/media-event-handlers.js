import Media from "../models/Media.js";
import { deleteMediaFile } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

const handlePostDeletedEvent = async (eventData) => {
  try {
    const { postId, mediaIds } = eventData;
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });
    for (const media of mediaToDelete) {
      await deleteMediaFile(media.publicId);
      await Media.findByIdAndDelete(media._id);
      logger.info(
        `Deleted media with ID: ${media._id} and publicId: ${media.publicId}`,
      );
    }
    logger.info(
      `Successfully handled post.deleted event for postId: ${postId}`,
    );
  } catch (error) {
    logger.error(`Error handling post.deleted event: ${error.message}`, error);
  }
};

export default handlePostDeletedEvent;
