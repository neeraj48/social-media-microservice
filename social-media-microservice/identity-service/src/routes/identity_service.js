import express from "express";
import { registerUser, loginUser, refreshTokenUser } from "../controllers/identitiy_controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshTokenUser);

export default router;
