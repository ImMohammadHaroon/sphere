import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import { Task } from "../../src/models/Task.js";

function oid() {
  return new mongoose.Types.ObjectId();
}

const baseFields = () => ({
  organizationId: oid(),
  projectId: oid(),
  title: "Sample task",
});

describe("Task model validation", () => {
  it("accepts any non-empty custom status string (no enum restriction)", () => {
    const doc = new Task({
      ...baseFields(),
      status: "some-custom-key",
    });

    assert.equal(doc.validateSync(), undefined);
    assert.equal(doc.status, "some-custom-key");
  });

  it("requires status — omitting it yields a ValidationError after clearing the schema default", () => {
    // status has default: "todo", so construction alone would pass validateSync.
    // Omit from the constructor payload, then clear the applied default to
    // exercise the required validator without a DB write.
    const doc = new Task({
      ...baseFields(),
    });
    assert.equal(doc.status, "todo");
    doc.status = undefined;

    const err = doc.validateSync();
    assert.ok(err, "expected a ValidationError");
    assert.equal(err.name, "ValidationError");
    assert.match(String(err.message), /status/i);
  });
});
