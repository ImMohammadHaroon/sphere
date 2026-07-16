import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import { Notification } from "../../src/models/Notification.js";

function oid() {
  return new mongoose.Types.ObjectId();
}

describe("Notification model validation", () => {
  it("allows organizationId: null (super_admin case)", () => {
    const doc = new Notification({
      organizationId: null,
      userId: oid(),
      type: "org_registered",
      payload: { orgName: "Acme" },
    });

    assert.equal(doc.validateSync(), undefined);
    assert.equal(doc.organizationId, null);
  });

  it("requires userId", () => {
    const doc = new Notification({
      organizationId: null,
      type: "task_assigned",
      payload: {},
    });

    const err = doc.validateSync();
    assert.ok(err, "expected a ValidationError");
    assert.equal(err.name, "ValidationError");
    assert.match(String(err.message), /userId/i);
  });

  it("requires type", () => {
    const doc = new Notification({
      organizationId: null,
      userId: oid(),
      payload: {},
    });

    const err = doc.validateSync();
    assert.ok(err, "expected a ValidationError");
    assert.equal(err.name, "ValidationError");
    assert.match(String(err.message), /type/i);
  });
});
