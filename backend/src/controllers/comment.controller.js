import { Comment } from "../models/Comment.js";
import { Attachment } from "../models/Attachment.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { isProjectMember } from "../utils/projectAccess.js";
import { emitToProject } from "../sockets/index.js";
import { listAttachmentsForComments } from "./commentAttachment.controller.js";
import { formatPublicUser, USER_PUBLIC_FIELDS } from "../utils/formatUser.js";

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function formatAuthor(author) {
  return formatPublicUser(author);
}

export function formatComment(comment, attachments = []) {
  const author = formatAuthor(comment.authorId);

  return {
    _id: comment._id.toString(),
    organizationId: comment.organizationId?.toString(),
    taskId: comment.taskId?.toString(),
    parentId: comment.parentId?.toString?.() ?? null,
    body: comment.body,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    authorId: author?.id ?? null,
    author,
    attachments,
  };
}

async function loadProjectWithMembers(req, projectId) {
  return req
    .scopedFindOne(Project, { _id: projectId })
    .populate("members", USER_PUBLIC_FIELDS)
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
      .populate("authorId", USER_PUBLIC_FIELDS)
      .sort({ createdAt: 1 })
      .lean();

    const attachmentMap = await listAttachmentsForComments(
      req,
      comments.map((comment) => comment._id)
    );

    res.json({
      comments: comments.map((comment) =>
        formatComment(
          comment,
          attachmentMap.get(comment._id.toString()) ?? []
        )
      ),
    });
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

    const parentId = req.body.parentId ?? null;

    if (parentId) {
      const parent = await req
        .scopedFindOne(Comment, { _id: parentId, taskId: task._id })
        .lean();

      if (!parent) {
        const err = new Error("Parent comment not found on this task");
        err.status = 400;
        throw err;
      }
    }

    const created = await Comment.create({
      organizationId: req.user.organizationId,
      taskId: task._id,
      authorId: req.user.userId,
      parentId,
      body: req.body.body,
    });

    const comment = await req
      .scopedFindOne(Comment, { _id: created._id })
      .populate("authorId", USER_PUBLIC_FIELDS)
      .lean();

    const commentPayload = formatComment(comment, []);

    emitToProject(task.projectId.toString(), "comment:new", commentPayload);

    res.status(201).json({ comment: commentPayload });
  } catch (err) {
    next(err);
  }
}

async function deleteCommentTree(req, commentId) {
  const replies = await req
    .scopedQuery(Comment, { parentId: commentId })
    .select("_id")
    .lean();

  for (const reply of replies) {
    await deleteCommentTree(req, reply._id);
  }

  await Attachment.deleteMany({ commentId });
  await req.scopedFindOneAndDelete(Comment, { _id: commentId });
}

export async function deleteComment(req, res, next) {
  try {
    const comment = await req
      .scopedFindOne(Comment, { _id: req.params.id })
      .lean();

    if (!comment) {
      throw notFound();
    }

    if (comment.taskId.toString() !== req.params.taskId) {
      throw notFound();
    }

    await deleteCommentTree(req, comment._id);

    const task = await req
      .scopedFindOne(Task, { _id: comment.taskId })
      .lean();

    if (!task) {
      throw notFound();
    }

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
