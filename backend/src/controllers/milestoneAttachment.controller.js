import { Attachment } from "../models/Attachment.js";
import { Milestone } from "../models/Milestone.js";
import { Project } from "../models/Project.js";
import { isProjectMember } from "../utils/projectAccess.js";
import { encryptBuffer, decryptBuffer } from "../utils/fileEncryption.js";
import { resolveAttachmentContentType } from "../utils/attachmentMime.js";
import { formatUploader } from "./attachment.controller.js";
import { USER_PUBLIC_FIELDS } from "../utils/formatUser.js";

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

function conflict(message) {
  const err = new Error(message);
  err.status = 409;
  return err;
}

export function formatMilestoneAttachment(attachment) {
  const uploader = formatUploader(attachment.uploaderId);

  return {
    _id: attachment._id.toString(),
    organizationId: attachment.organizationId?.toString(),
    milestoneId: attachment.milestoneId?.toString(),
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

async function assertMilestoneReadable(req, milestoneId, projectId = null) {
  const filter = { _id: milestoneId };
  if (projectId) {
    filter.projectId = projectId;
  }

  const milestone = await req.scopedFindOne(Milestone, filter).lean();
  if (!milestone) {
    throw notFound();
  }

  const project = await loadProjectWithMembers(req, milestone.projectId);
  if (!project) {
    throw notFound();
  }

  if (
    req.user.role !== "org_admin" &&
    !isProjectMember(project, req.user.userId)
  ) {
    throw notFound();
  }

  return { milestone, project };
}

function assertMilestoneMutable(milestone) {
  if (milestone.status !== "pending") {
    throw conflict("Cannot modify attachments on an approved or rejected milestone");
  }
}

export async function listMilestoneAttachments(req, res, next) {
  try {
    await assertMilestoneReadable(
      req,
      req.params.milestoneId,
      req.params.projectId
    );

    const attachments = await req
      .scopedQuery(Attachment, { milestoneId: req.params.milestoneId })
      .select(METADATA_SELECT)
      .populate("uploaderId", USER_PUBLIC_FIELDS)
      .sort({ createdAt: 1 })
      .lean();

    res.json({ attachments: attachments.map(formatMilestoneAttachment) });
  } catch (err) {
    next(err);
  }
}

export async function uploadMilestoneAttachment(req, res, next) {
  try {
    if (!req.file) {
      throw badRequest("No file uploaded");
    }

    const { milestone } = await assertMilestoneReadable(
      req,
      req.params.milestoneId,
      req.params.projectId
    );

    assertMilestoneMutable(milestone);

    const { ciphertext, iv, authTag } = encryptBuffer(req.file.buffer);

    const created = await Attachment.create({
      organizationId: req.user.organizationId,
      milestoneId: milestone._id,
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

    res.status(201).json({
      attachment: formatMilestoneAttachment(attachment),
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadMilestoneAttachment(req, res, next) {
  try {
    await assertMilestoneReadable(
      req,
      req.params.milestoneId,
      req.params.projectId
    );

    const attachment = await req.scopedFindOne(Attachment, {
      _id: req.params.id,
      milestoneId: req.params.milestoneId,
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

export async function deleteMilestoneAttachment(req, res, next) {
  try {
    const { milestone } = await assertMilestoneReadable(
      req,
      req.params.milestoneId,
      req.params.projectId
    );

    assertMilestoneMutable(milestone);

    const attachment = await req
      .scopedFindOneAndDelete(Attachment, { _id: req.params.id })
      .lean();

    if (!attachment) {
      throw notFound();
    }

    if (attachment.milestoneId?.toString() !== req.params.milestoneId) {
      throw notFound();
    }

    res.json({
      message: "Attachment deleted",
      attachmentId: attachment._id.toString(),
      milestoneId: attachment.milestoneId.toString(),
    });
  } catch (err) {
    next(err);
  }
}
