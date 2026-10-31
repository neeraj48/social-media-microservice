import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import logger from "./utils/logger.js";
import cors from "cors";
import helmet from "helmet";
import errorHandler from "./middleware/errorHandler.js";
import mediaRoutes from "./routes/media-routes.js";
import { connectToRabbitMQ, consumeFromRabbitMQ } from "./utils/rabbitmq.js";
import handlePostDeletedEvent from "./eventHandler/media-event-handlers.js";

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
  if (req.is("multipart/form-data")) {
    logger.info("Multipart request body will be logged after parsing");
  } else {
    logger.info("Request body: %o", req.body);
  }
  next();
});

// Routes
app.use("/api/media", mediaRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    // Connect to RabbitMQ
    await connectToRabbitMQ();

    //consume messages from RabbitMQ
    await consumeFromRabbitMQ("post.deleted", handlePostDeletedEvent);

    app.listen(PORT, () => {
      logger.info(`Media service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Error starting the server: %o", error);
    process.exit(1); // Exit the process with an error code
  }
}

startServer();

// Start the server
// app.listen(PORT, () => {
//   logger.info(`Media service is running on port ${PORT}`);
// });

//unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at: %o, reason: %o", promise, reason);
  // Optionally, you can exit the process or perform other actions here
});
