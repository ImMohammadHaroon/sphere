import mongoose from "mongoose";
import { ChatRoom } from "../models/ChatRoom.js";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { isProjectMember } from "../utils/projectAccess.js";
import { formatPublicUser, formatUserDisplayRole, USER_PUBLIC_FIELDS } from "../utils/formatUser.js";

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function forbidden(message = "Forbidden") {
  const err = new Error(message);
  err.status = 403;
  return err;
}

export function sortParticipantIds(userIdA, userIdB) {
  const a = userIdA.toString();
  const b = userIdB.toString();
  return a < b ? [a, b] : [b, a];
}

export async function ensureCommunityRoom(organizationId) {
  const orgObjectId = new mongoose.Types.ObjectId(organizationId);

  let room = await ChatRoom.findOne({
    organizationId: orgObjectId,
    type: "community",
  });

  if (!room) {
    room = await ChatRoom.create({
      organizationId: orgObjectId,
      type: "community",
    });
  }

  return room;
}

export async function ensureProjectRoom(organizationId, projectId) {
  const orgObjectId = new mongoose.Types.ObjectId(organizationId);
  const projectObjectId = new mongoose.Types.ObjectId(projectId);

  let room = await ChatRoom.findOne({
    organizationId: orgObjectId,
    type: "project",
    projectId: projectObjectId,
  });

  if (!room) {
    room = await ChatRoom.create({
      organizationId: orgObjectId,
      type: "project",
      projectId: projectObjectId,
    });
  }

  return room;
}

export async function ensureDirectRoom(organizationId, userId, otherUserId) {
  if (userId.toString() === otherUserId.toString()) {
    throw forbidden("Cannot create a chat with yourself");
  }

  const orgObjectId = new mongoose.Types.ObjectId(organizationId);
  const sortedIds = sortParticipantIds(userId, otherUserId).map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  const otherUser = await User.findOne({
    _id: new mongoose.Types.ObjectId(otherUserId),
    organizationId: orgObjectId,
    isActive: true,
  })
    .select(USER_PUBLIC_FIELDS)
    .lean();

  if (!otherUser) {
    throw notFound("User not found in your organization");
  }

  let room = await ChatRoom.findOne({
    organizationId: orgObjectId,
    type: "direct",
    participantIds: { $all: sortedIds, $size: 2 },
  });

  if (!room) {
    room = await ChatRoom.create({
      organizationId: orgObjectId,
      type: "direct",
      participantIds: sortedIds,
    });
  }

  return { room, otherUser };
}

async function loadProjectWithMembers(organizationId, projectId) {
  const project = await Project.findOne({
    _id: projectId,
    organizationId: new mongoose.Types.ObjectId(organizationId),
  })
    .populate("members", USER_PUBLIC_FIELDS)
    .lean();

  if (!project) {
    throw notFound();
  }

  return project;
}

export async function assertRoomAccess(req, room) {
  const userId = req.user.userId;
  const role = req.user.role;

  if (room.type === "community") {
    return room;
  }

  if (room.type === "project") {
    const project = await loadProjectWithMembers(
      req.user.organizationId,
      room.projectId
    );

    if (role !== "org_admin" && !isProjectMember(project, userId)) {
      throw forbidden();
    }

    return { room, project };
  }

  if (room.type === "direct") {
    const isParticipant = room.participantIds.some(
      (id) => id.toString() === userId
    );

    if (!isParticipant) {
      throw forbidden();
    }

    return room;
  }

  throw notFound();
}

export async function getRoomById(req, roomId) {
  const room = await req.scopedFindOne(ChatRoom, { _id: roomId }).lean();

  if (!room) {
    throw notFound("Chat room not found");
  }

  await assertRoomAccess(req, room);
  return room;
}

export function formatRoomSummary(room, context = {}) {
  const base = {
    _id: room._id.toString(),
    organizationId: room.organizationId?.toString(),
    type: room.type,
    projectId: room.projectId?.toString() ?? null,
    participantIds: room.participantIds?.map((id) => id.toString()) ?? [],
    lastMessageAt: room.lastMessageAt,
    lastMessagePreview: room.lastMessagePreview ?? "",
    updatedAt: room.updatedAt,
    createdAt: room.createdAt,
    name: context.name ?? "Chat",
    subtitle: context.subtitle ?? null,
    otherUser: context.otherUser ?? null,
    project: context.project ?? null,
  };

  return base;
}

export async function buildRoomSummary(req, room) {
  if (room.type === "community") {
    return formatRoomSummary(room, {
      name: "Community",
      subtitle: "Everyone in your organization",
    });
  }

  if (room.type === "project") {
    const project = await Project.findById(room.projectId)
      .select("name status")
      .lean();

    return formatRoomSummary(room, {
      name: project?.name ?? "Project team",
      subtitle: "Project team chat",
      project: project
        ? {
            id: project._id.toString(),
            name: project.name,
            status: project.status,
          }
        : null,
    });
  }

  if (room.type === "direct") {
    const otherId = room.participantIds.find(
      (id) => id.toString() !== req.user.userId
    );

    const otherUser = otherId
      ? await User.findById(otherId).select(USER_PUBLIC_FIELDS).lean()
      : null;

    const formatted = formatPublicUser(otherUser);

    return formatRoomSummary(room, {
      name: formatted?.name ?? "Direct message",
      subtitle: formatUserDisplayRole(formatted),
      otherUser: formatted,
    });
  }

  return formatRoomSummary(room);
}

export async function listAccessibleRooms(req) {
  const organizationId = new mongoose.Types.ObjectId(req.user.organizationId);
  const userId = req.user.userId;
  const role = req.user.role;

  const communityRoom = await ensureCommunityRoom(req.user.organizationId);

  const projectFilter =
    role === "org_admin"
      ? { organizationId }
      : {
          organizationId,
          $or: [
            { ownerId: new mongoose.Types.ObjectId(userId) },
            { members: new mongoose.Types.ObjectId(userId) },
          ],
        };

  const projects = await Project.find(projectFilter)
    .select("name status")
    .sort({ updatedAt: -1 })
    .lean();

  const projectRooms = await Promise.all(
    projects.map(async (project) => {
      const room = await ensureProjectRoom(
        req.user.organizationId,
        project._id
      );
      return formatRoomSummary(room, {
        name: project.name,
        subtitle: "Project team",
        project: {
          id: project._id.toString(),
          name: project.name,
          status: project.status,
        },
      });
    })
  );

  const directRooms = await ChatRoom.find({
    organizationId,
    type: "direct",
    participantIds: new mongoose.Types.ObjectId(userId),
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();

  const directSummaries = await Promise.all(
    directRooms.map((room) => buildRoomSummary(req, room))
  );

  const communitySummary = await buildRoomSummary(req, communityRoom);

  return {
    community: communitySummary,
    projects: projectRooms,
    direct: directSummaries,
  };
}

export async function searchOrgDirectory(req, query, limit = 20) {
  const organizationId = new mongoose.Types.ObjectId(req.user.organizationId);
  const trimmed = query?.trim() ?? "";

  const filter = {
    organizationId,
    isActive: true,
    _id: { $ne: new mongoose.Types.ObjectId(req.user.userId) },
  };

  if (trimmed) {
    const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const users = await User.find(filter)
    .select(USER_PUBLIC_FIELDS)
    .sort({ name: 1 })
    .limit(Math.min(limit, 50))
    .lean();

  return users.map((user) => formatPublicUser(user));
}

export async function touchRoomLastMessage(roomId, body) {
  const preview = (body ?? "").trim().slice(0, 200);

  await ChatRoom.findByIdAndUpdate(roomId, {
    lastMessageAt: new Date(),
    lastMessagePreview: preview || "📎 Attachment",
  });
}
