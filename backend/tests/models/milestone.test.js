import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import { Milestone } from "../../src/models/Milestone.js";

function oid() {
  return new mongoose.Types.ObjectId();
}

describe("Milestone model validation", () => {
  it("requires dueDate — validateSync returns ValidationError mentioning dueDate", () => {
    const doc = new Milestone({
      projectId: oid(),
      organizationId: oid(),
      createdBy: oid(),
      name: "Test",
    });

    const err = doc.validateSync();
    assert.ok(err, "expected a ValidationError");
    assert.equal(err.name, "ValidationError");
    assert.match(String(err.message), /dueDate/i);
  });

  it("defaults status to pending when dueDate is set and status is omitted", () => {
    const doc = new Milestone({
      projectId: oid(),
      organizationId: oid(),
      createdBy: oid(),
      name: "Test",
      dueDate: new Date("2026-08-01"),
    });

    assert.equal(doc.status, "pending");
    assert.equal(doc.validateSync(), undefined);
  });

  it("rejects invalid status values", () => {
    const doc = new Milestone({
      projectId: oid(),
      organizationId: oid(),
      createdBy: oid(),
      name: "Test",
      dueDate: new Date("2026-08-01"),
      status: "invalid_value",
    });

    const err = doc.validateSync();
    assert.ok(err, "expected a ValidationError");
    assert.equal(err.name, "ValidationError");
    assert.match(String(err.message), /status/i);
  });
});
