import { Attachment } from "../models/Attachment.js";
import { Comment } from "../models/Comment.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { isProjectMember } from "../utils/projectAccess.js";
import { encryptBuffer, decryptBuffer } from "../utils/fileEncryption.js";
import { resolveAttachmentContentType } from "../utils/attachmentMime.js";
import { formatUploader } from "./attachment.controller.js";

const METADATA_SELECT = "-encryptedData -iv -authTag";

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

export function formatCommentAttachment(attachment) {
  const uploader = formatUploader(attachment.uploaderId);

  return {
    _id: attachment._id.toString(),
    organizationId: attachment.organizationId?.toString(),
    taskId: attachment.taskId?.toString(),
    commentId: attachment.commentId?.toString(),
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    size: attachment.size,
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt,
    uploaderId: uploader?.id ?? null,
    uploader,
  };
}

async function loadProjectWithMembers(req, projectId) {
  return req
    .scopedFindOne(Project, { _id: projectId })
    .populate("members", "name email role")
    .lean();
}

async function assertCommentReadable(req, taskId, commentId, projectId = null) {
  const taskFilter = { _id: taskId };
  if (projectId) {
    taskFilter.projectId = projectId;
  }

  const task = await req.scopedFindOne(Task, taskFilter).lean();
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

  const comment = await req
    .scopedFindOne(Comment, { _id: commentId, taskId })
    .lean();

  if (!comment) {
    throw notFound();
  }

  return { task, project, comment };
}

export async function uploadCommentAttachment(req, res, next) {
  try {
    if (!req.file) {
      throw badRequest("No file uploaded");
    }

    const { task } = await assertCommentReadable(
      req,
      req.params.taskId,
      req.params.commentId,
      req.params.projectId
    );

    const { ciphertext, iv, authTag } = encryptBuffer(req.file.buffer);

    const created = await Attachment.create({
      organizationId: req.user.organizationId,
      taskId: task._id,
      commentId: req.params.commentId,
      uploaderId: req.user.userId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      encryptedData: ciphertext,
      iv,
      authTag,
    });

    const attachment = await req
      .scopedFindOne(Attachment, { _id: created._id })
      .select(METADATA_SELECT)
      .populate("uploaderId", "name email")
      .lean();

    res.status(201).json({
      attachment: formatCommentAttachment(attachment),
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadCommentAttachment(req, res, next) {
  try {
    await assertCommentReadable(
      req,
      req.params.taskId,
      req.params.commentId,
      req.params.projectId
    );

    const attachment = await req.scopedFindOne(Attachment, {
      _id: req.params.id,
      taskId: req.params.taskId,
      commentId: req.params.commentId,
    });

    if (!attachment) {
      throw notFound();
    }

    if (!attachment.encryptedData) {
      throw notFound("Attachment file data not found");
    }

    const plaintext = decryptBuffer(
      attachment.encryptedData,
      attachment.iv,
      attachment.authTag
    );

    res.set(
      "Content-Type",
      resolveAttachmentContentType(attachment.fileName, attachment.mimeType)
    );
    res.set("Cache-Control", "private, no-store");
    res.set(
      "Content-Disposition",
      `inline; filename="${attachment.fileName}"`
    );
    res.send(plaintext);
  } catch (err) {
    next(err);
  }
}

export async function deleteCommentAttachment(req, res, next) {
  try {
    await assertCommentReadable(
      req,
      req.params.taskId,
      req.params.commentId,
      req.params.projectId
    );

    const attachment = await req
      .scopedFindOneAndDelete(Attachment, { _id: req.params.id })
      .lean();

    if (!attachment) {
      throw notFound();
    }

    if (
      attachment.commentId?.toString() !== req.params.commentId ||
      attachment.taskId?.toString() !== req.params.taskId
    ) {
      throw notFound();
    }

    res.json({
      message: "Attachment deleted",
      attachmentId: attachment._id.toString(),
      commentId: attachment.commentId.toString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function listAttachmentsForComments(req, commentIds) {
  if (!commentIds.length) {
    return new Map();
  }

  const attachments = await req
    .scopedQuery(Attachment, { commentId: { $in: commentIds } })
    .select(METADATA_SELECT)
    .populate("uploaderId", "name email")
    .sort({ createdAt: 1 })
    .lean();

  const grouped = new Map();
  for (const attachment of attachments) {
    const key = attachment.commentId.toString();
    const list = grouped.get(key) ?? [];
    list.push(formatCommentAttachment(attachment));
    grouped.set(key, list);
  }

  return grouped;
}
