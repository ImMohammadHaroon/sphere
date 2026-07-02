import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export async function connectDB() {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  logger.info("MongoDB connected");
}

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error", err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});
