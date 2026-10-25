const handlePostDeletedEvent = async (eventData) => {
  //   try {
  //     const { postId } = eventData;
  //     logger.info(`Handling post.deleted event for postId: ${postId}`);
  //     // Delete associated media files from Cloudinary
  //     for (const mediaId of eventData.mediaIds) {
  //       const media = await Media.findById(mediaId);
  //       if (media) {
  //         await deleteMediaFile(media.publicId);
  //         await media.remove();
  //         logger.info(
  //           `Deleted media with ID: ${mediaId} and publicId: ${media.publicId}`,
  //         );
  //       } else {
  //         logger.warn(`Media with ID: ${mediaId} not found`);
  //       }
  //     }
  //     logger.info(
  //       `Successfully handled post.deleted event for postId: ${postId}`,
  //     );
  //   } catch (error) {
  //     logger.error(`Error handling post.deleted event: ${error.message}`, error);
  //   }

  console.log("Handling post.deleted event for postId:", eventData);
};

export default handlePostDeletedEvent;
