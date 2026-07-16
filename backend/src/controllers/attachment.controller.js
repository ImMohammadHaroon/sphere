import { Attachment } from "../models/Attachment.js";
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

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function formatUploader(uploader) {
  if (!uploader) {
    return null;
  }

  if (typeof uploader === "object" && uploader.name !== undefined) {
    return {
      id: uploader._id.toString(),
      name: uploader.name,
      email: uploader.email,
    };
  }

  return {
    id: uploader.toString(),
  };
}

export function formatAttachment(attachment) {
  const uploader = formatUploader(attachment.uploaderId);

  return {
    _id: attachment._id.toString(),
    organizationId: attachment.organizationId?.toString(),
    taskId: attachment.taskId?.toString(),
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
      .select("-data")
      .populate("uploaderId", "name email")
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

    const { task } = await assertTaskReadable(
      req,
      req.params.taskId,
      req.params.projectId
    );

    const created = await Attachment.create({
      organizationId: req.user.organizationId,
      taskId: task._id,
      uploaderId: req.user.userId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer,
    });

    const attachment = await req
      .scopedFindOne(Attachment, { _id: created._id })
      .select("-data")
      .populate("uploaderId", "name email")
      .lean();

    const attachmentPayload = formatAttachment(attachment);

    await logAction({
      organizationId: req.user.organizationId,
      actorId: req.user.userId,
      action: "attachment.uploaded",
      targetType: "Attachment",
      targetId: created._id,
      metadata: {
        taskId: task._id.toString(),
        projectId: task.projectId.toString(),
        fileName: created.fileName,
        size: created.size,
      },
      ip: getClientIp(req),
    });

    emitToProject(task.projectId.toString(), "attachment:new", attachmentPayload);

    res.status(201).json({ attachment: attachmentPayload });
  } catch (err) {
    next(err);
  }
}

export async function downloadAttachment(req, res, next) {
  try {
    await assertTaskReadable(req, req.params.taskId, req.params.projectId);

    const attachment = await req
      .scopedFindOne(Attachment, {
        _id: req.params.id,
        taskId: req.params.taskId,
      })
      .lean();

    if (!attachment) {
      throw notFound();
    }

    res.set("Content-Type", attachment.mimeType);
    res.set(
      "Content-Disposition",
      `inline; filename="${attachment.fileName}"`
    );
    res.send(attachment.data);
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

    await logAction({
      organizationId: req.user.organizationId,
      actorId: req.user.userId,
      action: "attachment.deleted",
      targetType: "Attachment",
      targetId: attachment._id,
      metadata: {
        taskId: attachment.taskId.toString(),
        projectId: task.projectId.toString(),
        fileName: attachment.fileName,
      },
      ip: getClientIp(req),
    });

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
