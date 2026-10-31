import express from "express";
import Multer from "multer";
import { rateLimit } from "express-rate-limit";
import {
  uploadMedia,
  getAllMedia,
  validateMediaOwnership,
} from "../contollers/media-controller.js";
import { authenticateRequest } from "../middleware/authMiddleware.js";
import logger from "../utils/logger.js";

const router = express.Router();

const mediaRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  keyGenerator: (req) => req.user.userId,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Media API rate limit exceeded for user: %s", req.user.userId);
    res.status(429).json({
      success: false,
      message: "Too many media API requests. Please try again after 15 minutes.",
    });
  },
});

router.use(authenticateRequest, mediaRateLimit);

//configure multer for file upload
const uploadMulter = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
  },
}).single("file");

router.post(
  "/upload",
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

router.get("/getAllFiles", getAllMedia);
router.post("/validate-ownership", validateMediaOwnership);

export default router;
