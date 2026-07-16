import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import { Comment } from "../../src/models/Comment.js";

function oid() {
  return new mongoose.Types.ObjectId();
}

const baseFields = () => ({
  organizationId: oid(),
  taskId: oid(),
  authorId: oid(),
  body: "Looks good to me.",
});

describe("Comment model validation", () => {
  it("accepts valid comment fields", () => {
    const doc = new Comment(baseFields());
    assert.equal(doc.validateSync(), undefined);
  });

  it("requires body", () => {
    const doc = new Comment({
      organizationId: oid(),
      taskId: oid(),
      authorId: oid(),
    });

    const err = doc.validateSync();
    assert.ok(err);
    assert.equal(err.name, "ValidationError");
    assert.match(String(err.message), /body/i);
  });

  it("rejects body longer than 5000 characters", () => {
    const doc = new Comment({
      ...baseFields(),
      body: "x".repeat(5001),
    });

    const err = doc.validateSync();
    assert.ok(err);
    assert.match(String(err.message), /body/i);
  });
});
