import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import logger from "./utils/logger.js";
import cors from "cors";
import helmet from "helmet";
import errorHandler from "./middleware/errorHandler.js";
import mediaRoutes from "./routes/media-routes.js";

const app = express();
const PORT = process.env.PORT || 3003;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => logger.error("Error connecting to MongoDB:", err));

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info("Incoming request: %s %s", req.method, req.url);
  logger.info("Request headers: %o", req.headers);
  logger.info("Request body: %o", req.body);
  next();
});

// Routes
app.use("/api/media", mediaRoutes);

app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  logger.info(`Media service is running on port ${PORT}`);
});

//unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at: %o, reason: %o", promise, reason);
  // Optionally, you can exit the process or perform other actions here
});
