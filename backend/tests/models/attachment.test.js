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
  data: Buffer.from("sample"),
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

  it("requires data buffer", () => {
    const fields = baseFields();
    delete fields.data;
    const doc = new Attachment(fields);

    const err = doc.validateSync();
    assert.ok(err);
    assert.match(String(err.message), /data/i);
  });
});
