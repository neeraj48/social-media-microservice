import cloudinary from "cloudinary";
import logger from "./logger.js";
import dotenv from "dotenv";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadMediaFile = (file) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          logger.error("Error uploading media file:", error);
          reject(error);
          return;
        }
        if (!result) {
          const resultError = new Error("Cloudinary returned no upload result");
          logger.error("Error uploading media file:", resultError);
          reject(resultError);
          return;
        }
        resolve(result);
      },
    );

    uploadStream.on("error", (error) => {
      logger.error("Error uploading media file:", error);
      reject(error);
    });
    uploadStream.end(file.buffer);
  });

export { uploadMediaFile };
