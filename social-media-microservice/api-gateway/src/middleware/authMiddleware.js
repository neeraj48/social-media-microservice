import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";

const validateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    logger.warn("Authorization header missing");
    return res
      .status(401)
      .json({ success: false, message: "Authorization header missing" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.error("Invalid token");
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    if (
      typeof user !== "object" ||
      user === null ||
      typeof user.userId !== "string" ||
      !user.userId
    ) {
      logger.warn("Invalid token: user ID missing");
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

export { validateToken };
