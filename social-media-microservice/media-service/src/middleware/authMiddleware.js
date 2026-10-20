import logger from "../utils/logger.js";

const authenticateRequest = (req, res, next) => {
  const user = req.get("x-user-id");
  if (!user) {
    logger.warn("Unauthorized access attempt: No user ID provided in headers");
    return res.status(401).json({
      success: false,
      message: "Authentication required! Please login to continue.",
    });
  }
  req.user = { userId: user };
  next();
};

export { authenticateRequest };
