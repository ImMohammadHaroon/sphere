import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { enforceKanbanColumnRules } from "../../src/services/kanbanTemplate.service.js";

/**
 * KanbanTemplate uses pre("save"), not pre("validate"), so validateSync() does
 * not run the hook. The hook body was extracted to enforceKanbanColumnRules()
 * in kanbanTemplate.service.js and is unit-tested here as a pure function.
 */
describe("KanbanTemplate column rules (enforceKanbanColumnRules)", () => {
  it("throws when column keys are not unique", () => {
    assert.throws(
      () =>
        enforceKanbanColumnRules([
          { key: "todo", name: "To Do", color: "gray", order: 0, isDone: false },
          { key: "todo", name: "Dup", color: "amber", order: 1, isDone: true },
        ]),
      /Column keys must be unique/
    );
  });

  it("throws when more than one column is marked isDone", () => {
    assert.throws(
      () =>
        enforceKanbanColumnRules([
          { key: "a", name: "A", color: "gray", order: 0, isDone: true },
          { key: "b", name: "B", color: "green", order: 1, isDone: true },
        ]),
      /Exactly one column must be marked as done/
    );
  });

  it("defaults the last column (by order) to isDone when none is set", () => {
    const columns = [
      { key: "todo", name: "To Do", color: "gray", order: 0, isDone: false },
      { key: "done", name: "Done", color: "green", order: 2, isDone: false },
      {
        key: "progress",
        name: "In Progress",
        color: "amber",
        order: 1,
        isDone: false,
      },
    ];

    enforceKanbanColumnRules(columns);

    assert.equal(columns.find((c) => c.key === "done").isDone, true);
    assert.equal(columns.find((c) => c.key === "todo").isDone, false);
    assert.equal(columns.find((c) => c.key === "progress").isDone, false);
  });

  it("leaves a single existing isDone column unchanged", () => {
    const columns = [
      { key: "todo", name: "To Do", color: "gray", order: 0, isDone: false },
      { key: "done", name: "Done", color: "green", order: 1, isDone: true },
    ];

    enforceKanbanColumnRules(columns);

    assert.equal(columns[0].isDone, false);
    assert.equal(columns[1].isDone, true);
  });
});
