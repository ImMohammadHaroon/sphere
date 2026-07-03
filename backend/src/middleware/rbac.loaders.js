import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";

export async function loadProject(req) {
  return req.scopedFindOne(Project, { _id: req.params.id });
}

export async function loadTask(req) {
  return req.scopedFindOne(Task, { _id: req.params.id });
}
