/**
 * One-off script: drop the legacy `invitetokens` MongoDB collection.
 *
 * Run manually when ready:
 *   node src/scripts/dropInviteTokenCollection.js
 *
 * Does not run automatically on server start.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

dotenv.config();

const COLLECTION_NAME = "invitetokens";

async function dropInviteTokenCollection() {
  await connectDB();

  const collections = await mongoose.connection.db
    .listCollections({ name: COLLECTION_NAME })
    .toArray();

  if (collections.length === 0) {
    console.log(`[dropInviteToken] Collection "${COLLECTION_NAME}" does not exist — nothing to drop.`);
    await mongoose.connection.close();
    process.exit(0);
  }

  await mongoose.connection.db.dropCollection(COLLECTION_NAME);
  console.log(`[dropInviteToken] Dropped collection "${COLLECTION_NAME}".`);

  await mongoose.connection.close();
  process.exit(0);
}

dropInviteTokenCollection().catch(async (err) => {
  console.error("[dropInviteToken] Failed:", err);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore close errors on failure path
  }
  process.exit(1);
});
