import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { AuditLog } from "../../src/models/AuditLog.js";
import { Project } from "../../src/models/Project.js";
import { Task } from "../../src/models/Task.js";
import {
  getDoneColumnKey,
  getTaskCompletionEvents,
} from "../../src/services/reportAggregation.service.js";

function oid(id) {
  return id ? new mongoose.Types.ObjectId(id) : new mongoose.Types.ObjectId();
}

/** Mongoose-query lookalike: supports .select().sort().lean() chains. */
function leanQuery(result) {
  const query = {
    select() {
      return query;
    },
    sort() {
      return query;
    },
    lean() {
      return Promise.resolve(result);
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return query;
}

describe("reportAggregation.service", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("getDoneColumnKey returns the column marked isDone", () => {
    const key = getDoneColumnKey({
      columns: [
        { key: "a", isDone: false },
        { key: "b", isDone: true },
      ],
    });
    assert.equal(key, "b");
  });

  it("getTaskCompletionEvents uses earliest audit completedAt and falls back to updatedAt", async () => {
    const organizationId = oid();
    const projectId = oid();
    const taskWithAudit = oid();
    const taskFallback = oid();
    const taskNotDone = oid();
    const auditEarly = new Date("2026-01-10T12:00:00.000Z");
    const auditLate = new Date("2026-01-12T12:00:00.000Z");
    const updatedAt = new Date("2026-01-15T08:00:00.000Z");

    mock.method(Project, "findOne", () =>
      leanQuery({
        _id: projectId,
        columns: [
          { key: "todo", isDone: false },
          { key: "done", isDone: true },
        ],
      })
    );

    mock.method(Task, "find", () =>
      leanQuery([
        { _id: taskWithAudit, status: "done", updatedAt },
        { _id: taskFallback, status: "done", updatedAt },
        { _id: taskNotDone, status: "todo", updatedAt },
      ])
    );

    mock.method(AuditLog, "find", () =>
      leanQuery([
        { targetId: taskWithAudit, createdAt: auditEarly },
        { targetId: taskWithAudit, createdAt: auditLate },
      ])
    );

    const events = await getTaskCompletionEvents(projectId, organizationId);

    assert.equal(events.length, 2);

    const byTask = new Map(events.map((e) => [e.taskId, e.completedAt]));
    assert.equal(byTask.size, 2);
    assert.deepEqual(byTask.get(taskWithAudit.toString()), auditEarly);
    assert.deepEqual(byTask.get(taskFallback.toString()), updatedAt);
    assert.equal(byTask.has(taskNotDone.toString()), false);
  });

  it("getTaskCompletionEvents returns [] when the project is missing", async () => {
    mock.method(Project, "findOne", () => leanQuery(null));

    const events = await getTaskCompletionEvents(oid(), oid());
    assert.deepEqual(events, []);
  });
});
