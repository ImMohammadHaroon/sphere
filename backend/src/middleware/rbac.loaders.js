import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { Comment } from "../models/Comment.js";
import { Attachment } from "../models/Attachment.js";

export async function loadProject(req) {
  return req.scopedFindOne(Project, { _id: req.params.id });
}

export async function loadTask(req) {
  return req.scopedFindOne(Task, { _id: req.params.id });
}

export async function loadComment(req) {
  const filter = { _id: req.params.id };
  if (req.params.taskId) {
    filter.taskId = req.params.taskId;
  }
  return req.scopedFindOne(Comment, filter);
}

export async function loadAttachment(req) {
  const filter = { _id: req.params.id };
  if (req.params.taskId) {
    filter.taskId = req.params.taskId;
  }
  return req.scopedFindOne(Attachment, filter);
}
