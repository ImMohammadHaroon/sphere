import { CommunityMessage } from "../models/CommunityMessage.js";
import { Attachment } from "../models/Attachment.js";
import { emitToChatRoom, emitToOrg, emitToUser } from "../sockets/index.js";
import { listAttachmentsForCommunityMessages } from "./communityMessageAttachment.controller.js";
import { formatPublicUser, USER_PUBLIC_FIELDS } from "../utils/formatUser.js";
import {
  assertRoomAccess,
  buildRoomSummary,
  ensureCommunityRoom,
  ensureDirectRoom,
  ensureProjectRoom,
  getRoomById,
  listAccessibleRooms,
  searchOrgDirectory,
  touchRoomLastMessage,
} from "../services/chat.service.js";

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function formatAuthor(author) {
  return formatPublicUser(author);
}

export function formatChatMessage(message, roomId, attachments = []) {
  const author = formatAuthor(message.authorId);

  return {
    _id: message._id.toString(),
    roomId: roomId?.toString() ?? message.roomId?.toString() ?? null,
    organizationId: message.organizationId?.toString(),
    body: message.body,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    authorId: author?.id ?? null,
    author,
    attachments,
  };
}

function buildMessageFilter(req, room) {
  const filter = { organizationId: req.user.organizationId };

  if (room.type === "community") {
    filter.$or = [
      { roomId: room._id },
      { roomId: null },
    ];
  } else {
    filter.roomId = room._id;
  }

  return filter;
}

export async function listChatRooms(req, res, next) {
  try {
    const rooms = await listAccessibleRooms(req);
    res.json({ rooms });
  } catch (err) {
    next(err);
  }
}

export async function searchChatDirectory(req, res, next) {
  try {
    const query = req.validatedQuery?.q ?? req.query?.q ?? "";
    const limit = req.validatedQuery?.limit ?? 20;
    const users = await searchOrgDirectory(req, query, limit);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function createDirectRoom(req, res, next) {
  try {
    const { room, otherUser } = await ensureDirectRoom(
      req.user.organizationId,
      req.user.userId,
      req.body.userId
    );

    const summary = await buildRoomSummary(req, room);
    res.status(201).json({ room: summary, otherUser: formatPublicUser(otherUser) });
  } catch (err) {
    next(err);
  }
}

export async function getChatRoom(req, res, next) {
  try {
    const room = await getRoomById(req, req.params.roomId);
    const summary = await buildRoomSummary(req, room);
    res.json({ room: summary });
  } catch (err) {
    next(err);
  }
}

export async function listRoomMessages(req, res, next) {
  try {
    const room = await getRoomById(req, req.params.roomId);
    const query = req.validatedQuery ?? req.query ?? {};
    const limit = Math.min(Number(query.limit) || 50, 100);
    const before = query.before;

    const filter = buildMessageFilter(req, room);

    if (before) {
      const beforeMessage = await req
        .scopedFindOne(CommunityMessage, { _id: before, ...filter })
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
      roomId: room._id.toString(),
      messages: chronological.map((message) =>
        formatChatMessage(
          message,
          room._id,
          attachmentMap.get(message._id.toString()) ?? []
        )
      ),
      hasMore: messages.length === limit,
    });
  } catch (err) {
    next(err);
  }
}

export async function createRoomMessage(req, res, next) {
  try {
    const room = await getRoomById(req, req.params.roomId);

    const created = await CommunityMessage.create({
      organizationId: req.user.organizationId,
      roomId: room._id,
      authorId: req.user.userId,
      body: req.body.body ?? "",
    });

    await touchRoomLastMessage(room._id, req.body.body);

    const message = await req
      .scopedFindOne(CommunityMessage, { _id: created._id })
      .populate("authorId", USER_PUBLIC_FIELDS)
      .lean();

    const messagePayload = formatChatMessage(message, room._id, []);

    emitToChatRoom(room._id.toString(), "chat:message:new", {
      roomId: room._id.toString(),
      roomType: room.type,
      message: messagePayload,
    });

    emitToOrg(req.user.organizationId, "chat:room:updated", {
      roomId: room._id.toString(),
    });

    if (room.type === "direct") {
      for (const participantId of room.participantIds ?? []) {
        const participant = participantId.toString();
        if (participant !== req.user.userId) {
          emitToUser(participant, "chat:message:new", {
            roomId: room._id.toString(),
            roomType: room.type,
            message: messagePayload,
          });
          emitToUser(participant, "chat:room:updated", {
            roomId: room._id.toString(),
          });
        }
      }
    }

    res.status(201).json({ message: messagePayload });
  } catch (err) {
    next(err);
  }
}

export async function deleteRoomMessage(req, res, next) {
  try {
    const room = await getRoomById(req, req.params.roomId);

    const message = await req
      .scopedFindOne(CommunityMessage, {
        _id: req.params.id,
        roomId: room._id,
      })
      .lean();

    if (!message && room.type === "community") {
      const legacy = await req
        .scopedFindOne(CommunityMessage, {
          _id: req.params.id,
          roomId: null,
        })
        .lean();

      if (!legacy) {
        throw notFound();
      }

      const isAuthor = legacy.authorId.toString() === req.user.userId;
      const isElevated =
        req.user.role === "org_admin" || req.user.role === "project_manager";

      if (!isAuthor && !isElevated) {
        const err = new Error("Forbidden");
        err.status = 403;
        throw err;
      }

      await Attachment.deleteMany({ communityMessageId: legacy._id });
      await req.scopedFindOneAndDelete(CommunityMessage, { _id: legacy._id });

      emitToChatRoom(room._id.toString(), "chat:message:deleted", {
        roomId: room._id.toString(),
        messageId: legacy._id.toString(),
      });

      return res.json({
        message: "Message deleted",
        messageId: legacy._id.toString(),
      });
    }

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

    emitToChatRoom(room._id.toString(), "chat:message:deleted", {
      roomId: room._id.toString(),
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

export async function getCommunityRoomId(req, res, next) {
  try {
    const room = await ensureCommunityRoom(req.user.organizationId);
    const summary = await buildRoomSummary(req, room);
    res.json({ room: summary });
  } catch (err) {
    next(err);
  }
}

export async function getProjectRoomId(req, res, next) {
  try {
    const room = await ensureProjectRoom(
      req.user.organizationId,
      req.params.projectId
    );
    await assertRoomAccess(req, room);
    const summary = await buildRoomSummary(req, room);
    res.json({ room: summary });
  } catch (err) {
    next(err);
  }
}
