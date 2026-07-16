import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateColumnKeys,
  normalizeColumns,
  copyColumns,
} from "../../src/services/kanbanTemplate.service.js";

describe("kanbanTemplate.service pure helpers", () => {
  it("generateColumnKeys returns unique slug keys for duplicate names", () => {
    const keys = generateColumnKeys(["Review", "Review", "In Progress"]);

    assert.deepEqual(keys, ["review", "review-2", "in-progress"]);
    assert.equal(new Set(keys).size, 3);
  });

  it("normalizeColumns maps names to keys, orders, and defaults last isDone", () => {
    const columns = normalizeColumns([
      { name: " Backlog ", color: "gray" },
      { name: "Doing", color: "amber", isDone: false },
      { name: "Ship", color: "green" },
    ]);

    assert.deepEqual(columns, [
      {
        key: "backlog",
        name: "Backlog",
        color: "gray",
        order: 0,
        isDone: false,
      },
      {
        key: "doing",
        name: "Doing",
        color: "amber",
        order: 1,
        isDone: false,
      },
      {
        key: "ship",
        name: "Ship",
        color: "green",
        order: 2,
        isDone: true,
      },
    ]);
  });

  it("normalizeColumns preserves an explicit isDone without forcing the last column", () => {
    const columns = normalizeColumns([
      { name: "Todo", color: "gray" },
      { name: "Done", color: "green", isDone: true },
      { name: "Archive", color: "purple" },
    ]);

    assert.equal(columns[0].isDone, false);
    assert.equal(columns[1].isDone, true);
    assert.equal(columns[2].isDone, false);
  });

  it("copyColumns returns a plain shallow copy with isDone defaulted to false", () => {
    const input = [
      { key: "a", name: "A", color: "gray", order: 0 },
      { key: "b", name: "B", color: "green", order: 1, isDone: true },
    ];

    const copied = copyColumns(input);

    assert.deepEqual(copied, [
      { key: "a", name: "A", color: "gray", order: 0, isDone: false },
      { key: "b", name: "B", color: "green", order: 1, isDone: true },
    ]);
    assert.notEqual(copied, input);
    assert.notEqual(copied[0], input[0]);
  });
});
