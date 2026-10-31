import express from "express";
import Multer from "multer";
import { uploadMedia, getAllMedia } from "../contollers/media-controller.js";
import { authenticateRequest } from "../middleware/authMiddleware.js";
import logger from "../utils/logger.js";

const router = express.Router();

//configure multer for file upload
const uploadMulter = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
  },
}).single("file");

router.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    uploadMulter(req, res, function (err) {
      if (err instanceof Multer.MulterError) {
        logger.error("Multer error while uploading file:", err);
        return res.status(400).json({
          message: "Multer error while uploading file",
          error: err.message,
          stack: err.stack,
        });
      } else if (err) {
        logger.error("Unknown error while uploading file:", err);
        return res.status(500).json({
          message: "Unknown error while uploading file",
          error: err.message,
          stack: err.stack,
        });
      } else if (!req.file) {
        logger.error("No file uploaded");
        return res.status(400).json({ message: "No file uploaded" });
      }
      logger.info("Parsed multipart fields: %o", req.body);
      next();
    });
  },
  uploadMedia,
);

router.get("/getAllFiles", authenticateRequest, getAllMedia);

export default router;
