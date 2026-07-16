import mongoose from "mongoose";
import { COLLECTIONS } from "../config/collections.js";
import { enforceKanbanColumnRules } from "../services/kanbanTemplate.service.js";

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
  enforceKanbanColumnRules(this.columns);
});

export const KanbanTemplate = mongoose.model(
  "KanbanTemplate",
  kanbanTemplateSchema,
  COLLECTIONS.KANBAN_TEMPLATES
);

export { KANBAN_COLUMN_COLORS, kanbanColumnSchema };
