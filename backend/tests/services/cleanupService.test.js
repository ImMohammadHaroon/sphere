import "../setupEnv.js";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { RefreshToken } from "../../src/models/RefreshToken.js";
import { cleanupExpiredRefreshTokens } from "../../src/services/cleanup.service.js";

describe("cleanup.service cleanupExpiredRefreshTokens", () => {
  /** @type {MongoMemoryServer} */
  let mongod;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("deletes expired tokens and old revoked tokens, keeps valid ones", async () => {
    await RefreshToken.deleteMany({});

    const now = Date.now();
    const userId = new mongoose.Types.ObjectId();
    const dayMs = 24 * 60 * 60 * 1000;

    const expired = await RefreshToken.create({
      userId,
      tokenHash: "hash-expired",
      deviceId: "device-expired",
      expiresAt: new Date(now - dayMs),
      revoked: false,
      revokedAt: null,
    });

    const revokedOld = await RefreshToken.create({
      userId,
      tokenHash: "hash-revoked-old",
      deviceId: "device-revoked-old",
      expiresAt: new Date(now + 7 * dayMs),
      revoked: true,
      revokedAt: new Date(now - 31 * dayMs),
    });

    const revokedRecent = await RefreshToken.create({
      userId,
      tokenHash: "hash-revoked-recent",
      deviceId: "device-revoked-recent",
      expiresAt: new Date(now + 7 * dayMs),
      revoked: true,
      revokedAt: new Date(now - 5 * dayMs),
    });

    const valid = await RefreshToken.create({
      userId,
      tokenHash: "hash-valid",
      deviceId: "device-valid",
      expiresAt: new Date(now + 7 * dayMs),
      revoked: false,
      revokedAt: null,
    });

    const deletedCount = await cleanupExpiredRefreshTokens();
    assert.equal(deletedCount, 2);

    const remaining = await RefreshToken.find({}).lean();
    const remainingIds = new Set(remaining.map((doc) => doc._id.toString()));

    assert.equal(remainingIds.has(expired._id.toString()), false);
    assert.equal(remainingIds.has(revokedOld._id.toString()), false);
    assert.equal(remainingIds.has(revokedRecent._id.toString()), true);
    assert.equal(remainingIds.has(valid._id.toString()), true);
    assert.equal(remaining.length, 2);
  });
});
