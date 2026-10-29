import express from "express";
import { searchPostCtrl } from "../contollers/search-controller.js";
import { authenticateRequest } from "../../../media-service/src/middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateRequest);

router.get("/posts", searchPostCtrl);

const searchRoutes = router;

export { searchRoutes };
