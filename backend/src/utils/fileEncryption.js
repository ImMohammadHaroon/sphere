import crypto from "node:crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const KEY_LENGTH = 32;

function toBuffer(value) {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value == null) {
    throw new TypeError("decryptBuffer expects a Buffer ciphertext");
  }

  // Mongoose lean() may return mongodb.Binary or a serialized buffer object.
  if (typeof value === "object") {
    if (value.type === "Buffer" && Array.isArray(value.data)) {
      return Buffer.from(value.data);
    }

    if (value.buffer != null) {
      return Buffer.isBuffer(value.buffer)
        ? value.buffer
        : Buffer.from(value.buffer);
    }
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }

  throw new TypeError("decryptBuffer expects a Buffer ciphertext");
}

function getMasterKey() {
  const key = Buffer.from(env.FILE_ENCRYPTION_KEY, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `FILE_ENCRYPTION_KEY must be a base64-encoded ${KEY_LENGTH}-byte key (got ${key.length} bytes)`
    );
  }
  return key;
}

/**
 * Encrypt a buffer with AES-256-GCM.
 * @param {Buffer} buffer
 * @returns {{ ciphertext: Buffer, iv: string, authTag: string }}
 */
export function encryptBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError("encryptBuffer expects a Buffer");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

/**
 * Decrypt a buffer previously produced by encryptBuffer.
 * @param {Buffer} ciphertext
 * @param {string} iv base64-encoded IV
 * @param {string} authTag base64-encoded GCM auth tag
 * @returns {Buffer}
 */
export function decryptBuffer(ciphertext, iv, authTag) {
  const ciphertextBuffer = toBuffer(ciphertext);

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getMasterKey(),
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  return Buffer.concat([
    decipher.update(ciphertextBuffer),
    decipher.final(),
  ]);
}
