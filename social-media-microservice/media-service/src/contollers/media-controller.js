import logger from "../utils/logger.js";
import Media from "../models/Media.js";
import { uploadMediaFile } from "../utils/cloudinary.js";

const uploadMedia = async (req, res) => {
  try {
    const file = req?.file;
    if (!file) {
      logger.error("No file uploaded");
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    const { originalname, mimetype } = file;
    const userId = req.user.userId;
    logger.info(`File detail: ${originalname}: ${mimetype}`);
    logger.info("Uploading to cloudinary starting...");
    const uploadResult = await uploadMediaFile(file);
    logger.info(
      `Cloudinary uploaded successfully: pulbicId - ${uploadResult.public_id}`,
    );
    const newMedia = new Media({
      publicId: uploadResult.public_id,
      originalName: originalname,
      minetype: mimetype,
      url: uploadResult.secure_url,
      userId: userId,
    });
    await newMedia.save();
    logger.info("Media saved to database successfully");
    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: uploadResult,
    });
  } catch (error) {
    logger.error("Error uploading media:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading media",
    });
  }
};

export { uploadMedia };
