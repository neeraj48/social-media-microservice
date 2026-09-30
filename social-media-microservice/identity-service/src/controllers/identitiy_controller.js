import logger from "../utils/logger.js";
import { validateRegistration, validationLogin } from "../utils/validation.js";
import User from "../models/user.js";
import generateToken from "../utils/generateToken.js";
import RefreshToken from "../models/RefreshToken.js";

//register controller
const registerUser = async (req, res) => {
  const { username, email } = req.body;
  logger.info("Registering user with username and email: %o", {
    username,
    email,
  });
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn(
        "Validation error during registration: %o",
        error.details[0].message,
      );
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const { password } = req.body;
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      logger.warn("User with username or email already exists: %o", {
        username,
        email,
      });
      return res
        .status(400)
        .json({ success: false, message: "Username or email already exists" });
    }
    user = new User({ username, email, password });
    await user.save();
    logger.info("User registered successfully: %o", user._id);
    const { accessToken, refreshToken } = await generateToken(user);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Error registering user: %o", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//login controller
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  logger.info("Logging in user with email: %s", email);
  try {
    const { error } = validationLogin(req.body);
    if (error) {
      logger.warn(
        "Validation error during login: %o",
        error.details[0].message,
      );
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("User with email not found: %s", email);
      return res.status(400).json({ success: false, message: "Invalid email" });
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("Invalid password for user: %s", email);
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }
    const { accessToken, refreshToken } = await generateToken(user);
    logger.info("User logged in successfully: %s", email);
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      accessToken,
      refreshToken,
      userId: user,
    });
  } catch (error) {
    logger.error("Error logging in user: %o", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// refresh token controller
const refreshTokenUser = async (req, res) => {
  logger.info("Refreshing token end hit..", refreshToken);
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res
        .status(400)
        .json({ success: false, message: "Refresh token missing" });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token: %s", refreshToken);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(storedToken.userId);
    if (!user) {
      logger.warn("User not found", refreshToken);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateToken(user);

    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info("Old refresh token deleted: %s", refreshToken);

    logger.info("Token refreshed successfully for user: %s", user._id);
    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Error refreshing token: %o", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//logout user controller
const logoutUser = async (req, res) => {
  logger.info("Logging out endpoint hit...", req.body.refreshToken);
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing during logout");
      return res
        .status(400)
        .json({ success: false, message: "Refresh token missing" });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      logger.warn("Refresh token not found during logout");
      return res.status(404).json({
        success: false,
        message: "Refresh token not found",
      });
    }

    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info(
      "User logged out successfully with refresh token: %s",
      refreshToken,
    );
    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    logger.error("Error logging out user: %o", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export { registerUser, loginUser, refreshTokenUser, logoutUser };
