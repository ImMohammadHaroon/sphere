import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const globalCache = globalThis;

if (!globalCache.__mongoose) {
  globalCache.__mongoose = { conn: null, promise: null };
}

const cached = globalCache.__mongoose;

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  mongoose.set("strictQuery", true);

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((mongooseInstance) => {
        logger.info(`MongoDB connected (${mongooseInstance.connection.name})`);
        return mongooseInstance;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error", err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});
