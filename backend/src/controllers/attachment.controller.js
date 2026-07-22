import { Attachment } from "../models/Attachment.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { isProjectMember } from "../utils/projectAccess.js";
import { encryptBuffer, decryptBuffer } from "../utils/fileEncryption.js";
import { resolveAttachmentContentType } from "../utils/attachmentMime.js";
import { emitToProject } from "../sockets/index.js";
import { USER_PUBLIC_FIELDS, formatPublicUser } from "../utils/formatUser.js";

/** Projection that strips ciphertext material from metadata responses. */
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

export function formatUploader(uploader) {
  return formatPublicUser(uploader);
}

export function formatAttachment(attachment) {
  const uploader = formatUploader(attachment.uploaderId);

  return {
    _id: attachment._id.toString(),
    organizationId: attachment.organizationId?.toString(),
    taskId: attachment.taskId?.toString(),
    milestoneId: attachment.milestoneId?.toString(),
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

export async function listAttachments(req, res, next) {
  try {
    await assertTaskReadable(req, req.params.taskId, req.params.projectId);

    const attachments = await req
      .scopedQuery(Attachment, { taskId: req.params.taskId })
      .select(METADATA_SELECT)
      .populate("uploaderId", USER_PUBLIC_FIELDS)
      .sort({ createdAt: 1 })
      .lean();

    res.json({ attachments: attachments.map(formatAttachment) });
  } catch (err) {
    next(err);
  }
}

export async function uploadAttachment(req, res, next) {
  try {
    if (!req.file) {
      throw badRequest("No file uploaded");
    }

    // 5MB cap is enforced by multer in src/config/upload.js because MongoDB's
    // 16MB document limit is the hard ceiling (metadata + encrypted buffer must fit).
    const { task } = await assertTaskReadable(
      req,
      req.params.taskId,
      req.params.projectId
    );

    const { ciphertext, iv, authTag } = encryptBuffer(req.file.buffer);

    const created = await Attachment.create({
      organizationId: req.user.organizationId,
      taskId: task._id,
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
      .populate("uploaderId", USER_PUBLIC_FIELDS)
      .lean();

    const attachmentPayload = formatAttachment(attachment);

    emitToProject(task.projectId.toString(), "attachment:new", attachmentPayload);

    res.status(201).json({ attachment: attachmentPayload });
  } catch (err) {
    next(err);
  }
}

export async function downloadAttachment(req, res, next) {
  try {
    await assertTaskReadable(req, req.params.taskId, req.params.projectId);

    const attachment = await req.scopedFindOne(Attachment, {
      _id: req.params.id,
      taskId: req.params.taskId,
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

export async function deleteAttachment(req, res, next) {
  try {
    const attachment = await req
      .scopedFindOneAndDelete(Attachment, { _id: req.params.id })
      .lean();

    if (!attachment) {
      throw notFound();
    }

    if (attachment.taskId.toString() !== req.params.taskId) {
      throw notFound();
    }

    const task = await req
      .scopedFindOne(Task, { _id: attachment.taskId })
      .lean();

    if (!task) {
      throw notFound();
    }

    emitToProject(task.projectId.toString(), "attachment:deleted", {
      attachmentId: attachment._id.toString(),
      taskId: attachment.taskId.toString(),
    });

    res.json({
      message: "Attachment deleted",
      attachmentId: attachment._id.toString(),
      taskId: attachment.taskId.toString(),
    });
  } catch (err) {
    next(err);
  }
}
