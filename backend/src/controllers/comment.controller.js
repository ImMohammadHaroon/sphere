import { Comment } from "../models/Comment.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { logAction, getClientIp } from "../services/auditLog.service.js";
import { isProjectMember } from "../utils/projectAccess.js";
import { emitToProject } from "../sockets/index.js";

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function formatAuthor(author) {
  if (!author) {
    return null;
  }

  if (typeof author === "object" && author.name !== undefined) {
    return {
      id: author._id.toString(),
      name: author.name,
      email: author.email,
      role: author.role,
    };
  }

  return {
    id: author.toString(),
  };
}

export function formatComment(comment) {
  const author = formatAuthor(comment.authorId);

  return {
    _id: comment._id.toString(),
    organizationId: comment.organizationId?.toString(),
    taskId: comment.taskId?.toString(),
    body: comment.body,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    authorId: author?.id ?? null,
    author,
  };
}

async function loadProjectWithMembers(req, projectId) {
  return req
    .scopedFindOne(Project, { _id: projectId })
    .populate("members", "name email role")
    .lean();
}

async function assertTaskReadable(req, taskId, projectId = null) {
  const filter = { _id: taskId };
  if (projectId) {
    filter.projectId = projectId;
  }

  const task = await req.scopedFindOne(Task, filter).lean();
  if (!task) {
    throw notFound();
  }

  const project = await loadProjectWithMembers(req, task.projectId);
  if (!project) {
    throw notFound();
  }

  if (
    req.user.role !== "org_admin" &&
    !isProjectMember(project, req.user.userId)
  ) {
    throw notFound();
  }

  return { task, project };
}

export async function listComments(req, res, next) {
  try {
    await assertTaskReadable(req, req.params.taskId, req.params.projectId);

    const comments = await req
      .scopedQuery(Comment, { taskId: req.params.taskId })
      .populate("authorId", "name email role")
      .sort({ createdAt: 1 })
      .lean();

    res.json({ comments: comments.map(formatComment) });
  } catch (err) {
    next(err);
  }
}

export async function createComment(req, res, next) {
  try {
    const { task } = await assertTaskReadable(
      req,
      req.params.taskId,
      req.params.projectId
    );

    const created = await Comment.create({
      organizationId: req.user.organizationId,
      taskId: task._id,
      authorId: req.user.userId,
      body: req.body.body,
    });

    const comment = await req
      .scopedFindOne(Comment, { _id: created._id })
      .populate("authorId", "name email role")
      .lean();

    const commentPayload = formatComment(comment);

    await logAction({
      organizationId: req.user.organizationId,
      actorId: req.user.userId,
      action: "comment.created",
      targetType: "Comment",
      targetId: created._id,
      metadata: {
        taskId: task._id.toString(),
        projectId: task.projectId.toString(),
      },
      ip: getClientIp(req),
    });

    emitToProject(task.projectId.toString(), "comment:new", commentPayload);

    res.status(201).json({ comment: commentPayload });
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const comment = await req
      .scopedFindOneAndDelete(Comment, { _id: req.params.id })
      .lean();

    if (!comment) {
      throw notFound();
    }

    if (comment.taskId.toString() !== req.params.taskId) {
      throw notFound();
    }

    const task = await req
      .scopedFindOne(Task, { _id: comment.taskId })
      .lean();

    if (!task) {
      throw notFound();
    }

    await logAction({
      organizationId: req.user.organizationId,
      actorId: req.user.userId,
      action: "comment.deleted",
      targetType: "Comment",
      targetId: comment._id,
      metadata: {
        taskId: comment.taskId.toString(),
        projectId: task.projectId.toString(),
      },
      ip: getClientIp(req),
    });

    emitToProject(task.projectId.toString(), "comment:deleted", {
      commentId: comment._id.toString(),
      taskId: comment.taskId.toString(),
    });

    res.json({
      message: "Comment deleted",
      commentId: comment._id.toString(),
      taskId: comment.taskId.toString(),
    });
  } catch (err) {
    next(err);
  }
}
