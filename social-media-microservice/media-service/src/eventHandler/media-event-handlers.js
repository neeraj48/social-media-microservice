import Media from "../models/Media.js";
import { deleteMediaFile } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

const handlePostDeletedEvent = async (eventData) => {
  try {
    const { postId, userId, mediaIds } = eventData;
    if (!userId || !Array.isArray(mediaIds)) {
      logger.error("Invalid post.deleted event; refusing media deletion: %o", {
        postId,
      });
      return;
    }
    const legacyObjectIds = mediaIds.filter(
      (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id),
    );
    const mediaToDelete = await Media.find({
      userId,
      $or: [
        { mediaId: { $in: mediaIds } },
        { _id: { $in: legacyObjectIds } },
      ],
    });
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
