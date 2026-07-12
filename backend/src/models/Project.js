import mongoose from "mongoose";
import { COLLECTIONS } from "../config/collections.js";
import { kanbanColumnSchema } from "./KanbanTemplate.js";

const projectSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    kanbanTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KanbanTemplate",
      default: null,
    },
    columns: {
      type: [kanbanColumnSchema],
      default: undefined,
    },
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema, COLLECTIONS.PROJECTS);
