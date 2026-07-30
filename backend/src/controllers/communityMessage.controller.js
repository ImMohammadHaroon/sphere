import { CommunityMessage } from "../models/CommunityMessage.js";
import { Attachment } from "../models/Attachment.js";
import { emitToOrg } from "../sockets/index.js";
import { listAttachmentsForCommunityMessages } from "./communityMessageAttachment.controller.js";
import { formatPublicUser, USER_PUBLIC_FIELDS } from "../utils/formatUser.js";

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function formatAuthor(author) {
  return formatPublicUser(author);
}

export function formatCommunityMessage(message, attachments = []) {
  const author = formatAuthor(message.authorId);

  return {
    _id: message._id.toString(),
    organizationId: message.organizationId?.toString(),
    body: message.body,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    authorId: author?.id ?? null,
    author,
    attachments,
  };
}

export async function listCommunityMessages(req, res, next) {
  try {
    const query = req.validatedQuery ?? req.query ?? {};
    const limit = Math.min(Number(query.limit) || 50, 100);
    const before = query.before;

    const filter = {};
    if (before) {
      const beforeMessage = await req
        .scopedFindOne(CommunityMessage, { _id: before })
        .select("createdAt")
        .lean();

      if (beforeMessage) {
        filter.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    const messages = await req
      .scopedQuery(CommunityMessage, filter)
      .populate("authorId", USER_PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const chronological = [...messages].reverse();

    const attachmentMap = await listAttachmentsForCommunityMessages(
      req,
      chronological.map((message) => message._id)
    );

    res.json({
      messages: chronological.map((message) =>
        formatCommunityMessage(
          message,
          attachmentMap.get(message._id.toString()) ?? []
        )
      ),
      hasMore: messages.length === limit,
    });
  } catch (err) {
    next(err);
  }
}

export async function createCommunityMessage(req, res, next) {
  try {
    const created = await CommunityMessage.create({
      organizationId: req.user.organizationId,
      authorId: req.user.userId,
      body: req.body.body,
    });

    const message = await req
      .scopedFindOne(CommunityMessage, { _id: created._id })
      .populate("authorId", USER_PUBLIC_FIELDS)
      .lean();

    const messagePayload = formatCommunityMessage(message, []);

    emitToOrg(
      req.user.organizationId,
      "community:message:new",
      messagePayload
    );

    res.status(201).json({ message: messagePayload });
  } catch (err) {
    next(err);
  }
}

export async function deleteCommunityMessage(req, res, next) {
  try {
    const message = await req
      .scopedFindOne(CommunityMessage, { _id: req.params.id })
      .lean();

    if (!message) {
      throw notFound();
    }

    const isAuthor = message.authorId.toString() === req.user.userId;
    const isElevated =
      req.user.role === "org_admin" || req.user.role === "project_manager";

    if (!isAuthor && !isElevated) {
      const err = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    await Attachment.deleteMany({ communityMessageId: message._id });
    await req.scopedFindOneAndDelete(CommunityMessage, { _id: message._id });

    emitToOrg(req.user.organizationId, "community:message:deleted", {
      messageId: message._id.toString(),
    });

    res.json({
      message: "Message deleted",
      messageId: message._id.toString(),
    });
  } catch (err) {
    next(err);
  }
}
