import logger from "../utils/logger.js";
import Search from "../models/Search.js";

const searchPostCtrl = async (req, res, next) => {
  logger.info("search endpoint hiting...");
  try {
    const { query } = req.query;
    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "A search query is required",
      });
    }

    const result = await Search.find(
      { $text: { $search: query.trim() } },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    res.status(200).json({
      success: true,
      message: "found post successfully",
      result,
    });
  } catch (error) {
    logger.error("Error while searching post:", error);
    res.status(500).json({
      success: false,
      message: "Error while searching post",
    });
  }
};

export { searchPostCtrl };
