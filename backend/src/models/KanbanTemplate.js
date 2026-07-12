import mongoose from "mongoose";
import { COLLECTIONS } from "../config/collections.js";

const KANBAN_COLUMN_COLORS = [
  "gray",
  "amber",
  "orange",
  "green",
  "blue",
  "purple",
  "red",
];

const kanbanColumnSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    color: {
      type: String,
      required: true,
      enum: KANBAN_COLUMN_COLORS,
    },
    order: { type: Number, required: true },
    isDone: { type: Boolean, default: false },
  },
  { _id: false }
);

const kanbanTemplateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    columns: {
      type: [kanbanColumnSchema],
      required: true,
      validate: {
        validator(columns) {
          return Array.isArray(columns) && columns.length > 0;
        },
        message: "At least one column is required",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

kanbanTemplateSchema.index({ organizationId: 1, name: 1 }, { unique: true });

kanbanTemplateSchema.pre("save", function () {
  const keys = this.columns.map((c) => c.key);
  if (new Set(keys).size !== keys.length) {
    throw new Error("Column keys must be unique within a template");
  }

  const doneColumns = this.columns.filter((c) => c.isDone);
  if (doneColumns.length > 1) {
    throw new Error("Exactly one column must be marked as done");
  }

  if (doneColumns.length === 0) {
    const sorted = [...this.columns].sort((a, b) => a.order - b.order);
    const last = sorted[sorted.length - 1];
    const lastInDoc = this.columns.find((c) => c.key === last.key);
    if (lastInDoc) {
      lastInDoc.isDone = true;
    }
  }
});

export const KanbanTemplate = mongoose.model(
  "KanbanTemplate",
  kanbanTemplateSchema,
  COLLECTIONS.KANBAN_TEMPLATES
);

export { KANBAN_COLUMN_COLORS, kanbanColumnSchema };
