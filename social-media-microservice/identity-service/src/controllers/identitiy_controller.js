import logger from "../utils/logger.js";
import { validateRegistration, validationLogin } from "../utils/validation.js";
import User from "../models/user.js";
import generateToken from "../utils/generateToken.js";

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

export { registerUser, loginUser };
