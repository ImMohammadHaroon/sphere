import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import crypto from "node:crypto";

/**
 * Provide required env before importing modules that load config/env.js.
 */
process.env.MONGO_URI ??= "mongodb://127.0.0.1:27017/projectsphere-test-unused";
process.env.JWT_SECRET ??= "test-jwt-secret";
process.env.JWT_REFRESH_SECRET ??= "test-jwt-refresh-secret";
process.env.ENCRYPTION_KEY ??= "0123456789abcdef0123456789abcdef";
process.env.FILE_ENCRYPTION_KEY ??= crypto.randomBytes(32).toString("base64");
process.env.NODE_ENV ??= "test";

describe("fileEncryption", () => {
  let encryptBuffer;
  let decryptBuffer;

  before(async () => {
    ({ encryptBuffer, decryptBuffer } = await import(
      "../../src/utils/fileEncryption.js"
    ));
  });

  it("round-trips a buffer through AES-256-GCM", () => {
    const original = Buffer.from("hello attachment encryption");
    const { ciphertext, iv, authTag } = encryptBuffer(original);

    assert.ok(Buffer.isBuffer(ciphertext));
    assert.equal(ciphertext.equals(original), false);
    assert.equal(typeof iv, "string");
    assert.equal(typeof authTag, "string");

    const decrypted = decryptBuffer(ciphertext, iv, authTag);
    assert.equal(decrypted.equals(original), true);
  });

  it("rejects tampered ciphertext", () => {
    const original = Buffer.from("integrity check");
    const { ciphertext, iv, authTag } = encryptBuffer(original);
    const tampered = Buffer.from(ciphertext);
    tampered[0] ^= 0xff;

    assert.throws(() => decryptBuffer(tampered, iv, authTag));
  });

  it("decrypts BSON-like binary objects from lean queries", () => {
    const original = Buffer.from("lean binary payload");
    const { ciphertext, iv, authTag } = encryptBuffer(original);

    const leanBinary = {
      type: "Buffer",
      data: [...ciphertext],
    };

    const decrypted = decryptBuffer(leanBinary, iv, authTag);
    assert.equal(decrypted.equals(original), true);
  });
});

describe("formatAttachment metadata sanitization", () => {
  let formatAttachment;

  before(async () => {
    ({ formatAttachment } = await import(
      "../../src/controllers/attachment.controller.js"
    ));
  });

  it("never includes encryptedData, iv, or authTag in formatted output", () => {
    const fakeId = {
      toString() {
        return "507f1f77bcf86cd799439011";
      },
    };

    const formatted = formatAttachment({
      _id: fakeId,
      organizationId: fakeId,
      taskId: fakeId,
      fileName: "secret.pdf",
      mimeType: "application/pdf",
      size: 42,
      encryptedData: Buffer.from("should-not-leak"),
      iv: "iv-should-not-leak",
      authTag: "tag-should-not-leak",
      uploaderId: fakeId,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    assert.equal("encryptedData" in formatted, false);
    assert.equal("iv" in formatted, false);
    assert.equal("authTag" in formatted, false);
    assert.equal("data" in formatted, false);
    assert.equal(formatted.fileName, "secret.pdf");
    assert.equal(formatted.size, 42);
  });
});
