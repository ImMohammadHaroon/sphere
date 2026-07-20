/**
 * One-off script: drop the legacy `auditlogs` MongoDB collection.
 *
 * Run manually when ready:
 *   node src/scripts/dropAuditLogCollection.js
 *
 * Does not run automatically on server start.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

dotenv.config();

const COLLECTION_NAME = "auditlogs";

async function dropAuditLogCollection() {
  await connectDB();

  const collections = await mongoose.connection.db
    .listCollections({ name: COLLECTION_NAME })
    .toArray();

  if (collections.length === 0) {
    console.log(`[dropAuditLog] Collection "${COLLECTION_NAME}" does not exist — nothing to drop.`);
    await mongoose.connection.close();
    process.exit(0);
  }

  await mongoose.connection.db.dropCollection(COLLECTION_NAME);
  console.log(`[dropAuditLog] Dropped collection "${COLLECTION_NAME}".`);

  await mongoose.connection.close();
  process.exit(0);
}

dropAuditLogCollection().catch(async (err) => {
  console.error("[dropAuditLog] Failed:", err);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore close errors on failure path
  }
  process.exit(1);
});
