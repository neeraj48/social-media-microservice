import logger from "../utils/logger.js";
import Search from "../models/Search.js";

const searchPostCtrl = async (req, res, next) => {
  logger.info("search endpoint hiting...");
  try {
    const { query } = req.query;
    const result = await Search.find(
      { $text: { $query: query } },
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
