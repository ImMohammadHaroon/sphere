import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import { Attachment } from "../../src/models/Attachment.js";

function oid() {
  return new mongoose.Types.ObjectId();
}

const baseFields = () => ({
  organizationId: oid(),
  taskId: oid(),
  uploaderId: oid(),
  fileName: "spec.pdf",
  mimeType: "application/pdf",
  size: 1024,
  encryptedData: Buffer.from("ciphertext-sample"),
  iv: Buffer.alloc(12).toString("base64"),
  authTag: Buffer.alloc(16).toString("base64"),
});

describe("Attachment model validation", () => {
  it("accepts valid attachment fields", () => {
    const doc = new Attachment(baseFields());
    assert.equal(doc.validateSync(), undefined);
  });

  it("requires fileName", () => {
    const fields = baseFields();
    delete fields.fileName;
    const doc = new Attachment(fields);

    const err = doc.validateSync();
    assert.ok(err);
    assert.match(String(err.message), /fileName/i);
  });

  it("requires encryptedData buffer", () => {
    const fields = baseFields();
    delete fields.encryptedData;
    const doc = new Attachment(fields);

    const err = doc.validateSync();
    assert.ok(err);
    assert.match(String(err.message), /encryptedData/i);
  });

  it("requires iv and authTag", () => {
    const withoutIv = baseFields();
    delete withoutIv.iv;
    assert.match(String(new Attachment(withoutIv).validateSync()?.message), /iv/i);

    const withoutTag = baseFields();
    delete withoutTag.authTag;
    assert.match(
      String(new Attachment(withoutTag).validateSync()?.message),
      /authTag/i
    );
  });

  it("requires a valid attachment parent", () => {
    const neither = { ...baseFields(), taskId: null, milestoneId: null };
    const neitherErr = new Attachment(neither).validateSync();
    assert.ok(neitherErr);
    assert.match(String(neitherErr.message), /task, milestone, or comment/i);

    const taskAndMilestone = { ...baseFields(), milestoneId: oid() };
    const taskAndMilestoneErr = new Attachment(taskAndMilestone).validateSync();
    assert.ok(taskAndMilestoneErr);
    assert.match(
      String(taskAndMilestoneErr.message),
      /task, milestone, or comment/i
    );
  });

  it("accepts milestone-only attachments", () => {
    const fields = baseFields();
    delete fields.taskId;
    fields.milestoneId = oid();
    const doc = new Attachment(fields);
    assert.equal(doc.validateSync(), undefined);
  });

  it("accepts comment attachments linked to a task", () => {
    const fields = {
      ...baseFields(),
      commentId: oid(),
    };
    const doc = new Attachment(fields);
    assert.equal(doc.validateSync(), undefined);
  });

  it("rejects comment attachments without a task", () => {
    const fields = {
      ...baseFields(),
      taskId: null,
      commentId: oid(),
    };
    const err = new Attachment(fields).validateSync();
    assert.ok(err);
    assert.match(String(err.message), /task, milestone, or comment/i);
  });
});
