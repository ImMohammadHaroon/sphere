import { Attachment } from "../models/Attachment.js";
import { CommunityMessage } from "../models/CommunityMessage.js";
import { encryptBuffer, decryptBuffer } from "../utils/fileEncryption.js";
import { resolveAttachmentContentType } from "../utils/attachmentMime.js";
import { formatUploader } from "./attachment.controller.js";
import { USER_PUBLIC_FIELDS } from "../utils/formatUser.js";
import { emitToChatRoom, emitToOrg } from "../sockets/index.js";
import { formatChatMessage } from "./chat.controller.js";
import {
  getRoomById,
  touchRoomLastMessage,
} from "../services/chat.service.js";
import { listAttachmentsForCommunityMessages } from "./communityMessageAttachment.controller.js";

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

export function formatChatMessageAttachment(attachment) {
  const uploader = formatUploader(attachment.uploaderId);

  return {
    _id: attachment._id.toString(),
    organizationId: attachment.organizationId?.toString(),
    communityMessageId: attachment.communityMessageId?.toString(),
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    size: attachment.size,
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt,
    uploaderId: uploader?.id ?? null,
    uploader,
  };
}

async function assertRoomMessageReadable(req, roomId, messageId) {
  const room = await getRoomById(req, roomId);

  const message = await req
    .scopedFindOne(CommunityMessage, { _id: messageId, roomId: room._id })
    .populate("authorId", USER_PUBLIC_FIELDS)
    .lean();

  if (!message && room.type === "community") {
    const legacy = await req
      .scopedFindOne(CommunityMessage, { _id: messageId, roomId: null })
      .populate("authorId", USER_PUBLIC_FIELDS)
      .lean();

    if (!legacy) {
      throw notFound();
    }

    return { room, message: legacy };
  }

  if (!message) {
    throw notFound();
  }

  return { room, message };
}

export async function uploadChatMessageAttachment(req, res, next) {
  try {
    if (!req.file) {
      throw badRequest("No file uploaded");
    }

    const { room, message } = await assertRoomMessageReadable(
      req,
      req.params.roomId,
      req.params.messageId
    );

    const { ciphertext, iv, authTag } = encryptBuffer(req.file.buffer);

    const created = await Attachment.create({
      organizationId: req.user.organizationId,
      communityMessageId: message._id,
      uploaderId: req.user.userId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      encryptedData: ciphertext,
      iv,
      authTag,
    });

    await touchRoomLastMessage(room._id, message.body);

    const attachment = await req
      .scopedFindOne(Attachment, { _id: created._id })
      .select(METADATA_SELECT)
      .populate("uploaderId", USER_PUBLIC_FIELDS)
      .lean();

    const attachmentPayload = formatChatMessageAttachment(attachment);

    const existingAttachments = await listAttachmentsForCommunityMessages(req, [
      message._id,
    ]);
    const allAttachments =
      existingAttachments.get(message._id.toString()) ?? [];

    const messagePayload = formatChatMessage(message, room._id, allAttachments);

    emitToChatRoom(room._id.toString(), "chat:attachment:new", {
      roomId: room._id.toString(),
      roomType: room.type,
      messageId: message._id.toString(),
      attachment: attachmentPayload,
      message: messagePayload,
    });

    emitToOrg(req.user.organizationId, "chat:room:updated", {
      roomId: room._id.toString(),
    });

    res.status(201).json({ attachment: attachmentPayload });
  } catch (err) {
    next(err);
  }
}

export async function downloadChatMessageAttachment(req, res, next) {
  try {
    await assertRoomMessageReadable(
      req,
      req.params.roomId,
      req.params.messageId
    );

    const attachment = await req.scopedFindOne(Attachment, {
      _id: req.params.id,
      communityMessageId: req.params.messageId,
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

export async function deleteChatMessageAttachment(req, res, next) {
  try {
    const { room, message } = await assertRoomMessageReadable(
      req,
      req.params.roomId,
      req.params.messageId
    );

    const attachment = await req
      .scopedFindOne(Attachment, { _id: req.params.id })
      .lean();

    if (!attachment) {
      throw notFound();
    }

    if (attachment.communityMessageId?.toString() !== req.params.messageId) {
      throw notFound();
    }

    const isUploader = attachment.uploaderId.toString() === req.user.userId;
    const isElevated =
      req.user.role === "org_admin" || req.user.role === "project_manager";

    if (!isUploader && !isElevated) {
      const err = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    await req.scopedFindOneAndDelete(Attachment, { _id: attachment._id });

    emitToChatRoom(room._id.toString(), "chat:attachment:deleted", {
      roomId: room._id.toString(),
      messageId: message._id.toString(),
      attachmentId: attachment._id.toString(),
    });

    res.json({
      message: "Attachment deleted",
      attachmentId: attachment._id.toString(),
      messageId: message._id.toString(),
    });
  } catch (err) {
    next(err);
  }
}
