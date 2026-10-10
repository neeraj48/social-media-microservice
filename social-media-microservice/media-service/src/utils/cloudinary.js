import cloudinary from "cloudinary";
import logger from "./logger.js";
import dotenv from "dotenv";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadMediaFile = async (file) => {
  try {
    const uploadRes = await cloudinary.v2.uploader.upload_stream(file, {
      resource_type: "auto",
    });
    return uploadRes;
  } catch (error) {
    logger.error("Error uploading media file:", error);
    throw error;
  }
};

module.exports = {
  uploadMediaFile,
};
