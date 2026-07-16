import "../setupEnv.js";
import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { Notification } from "../../src/models/Notification.js";
import { createNotification } from "../../src/services/notification.service.js";
import { emitters } from "../../src/sockets/index.js";

function oid() {
  return new mongoose.Types.ObjectId();
}

function fakeNotification(overrides = {}) {
  const userId = overrides.userId ?? oid();
  return {
    _id: oid(),
    organizationId: overrides.organizationId ?? null,
    userId,
    type: overrides.type ?? "task_assigned",
    payload: overrides.payload ?? { title: "Hello" },
    read: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("notification.service createNotification", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("persists via Notification.create and returns the created document", async () => {
    const created = fakeNotification();
    const createMock = mock.method(Notification, "create", async () => created);
    mock.method(emitters, "emitToUser", () => {});

    const result = await createNotification({
      organizationId: null,
      userId: created.userId,
      type: "task_assigned",
      payload: { title: "Hello" },
    });

    assert.equal(result, created);
    assert.equal(createMock.mock.callCount(), 1);
  });

  it("still resolves when emitToUser throws (socket errors are isolated)", async () => {
    const original = console.error;
    console.error = () => {};

    try {
      const created = fakeNotification();
      mock.method(Notification, "create", async () => created);
      mock.method(emitters, "emitToUser", () => {
        throw new Error("socket unavailable");
      });

      const result = await createNotification({
        userId: created.userId,
        type: "milestone_created",
        payload: { milestoneId: "m1" },
      });

      assert.equal(result, created);
    } finally {
      console.error = original;
    }
  });

  it("rejects when userId is missing before attempting to persist", async () => {
    const createMock = mock.method(Notification, "create", async () => {
      throw new Error("should not persist");
    });

    await assert.rejects(
      () =>
        createNotification({
          type: "task_assigned",
          payload: {},
        }),
      (err) => {
        assert.match(err.message, /userId and type are required/);
        assert.equal(err.status, 400);
        return true;
      }
    );
    assert.equal(createMock.mock.callCount(), 0);
  });

  it("rejects when type is missing before attempting to persist", async () => {
    const createMock = mock.method(Notification, "create", async () => {
      throw new Error("should not persist");
    });

    await assert.rejects(
      () =>
        createNotification({
          userId: oid(),
          payload: {},
        }),
      (err) => {
        assert.match(err.message, /userId and type are required/);
        assert.equal(err.status, 400);
        return true;
      }
    );
    assert.equal(createMock.mock.callCount(), 0);
  });
});
