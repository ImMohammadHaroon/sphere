import { Server } from "socket.io";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { verifyAccessToken } from "../services/token.service.js";
import { isProjectMember } from "../utils/projectAccess.js";

let io = null;

async function assertProjectAccess(user, projectId) {
  const project = await Project.findOne({
    _id: projectId,
    organizationId: new mongoose.Types.ObjectId(user.organizationId),
  }).lean();

  if (!project) {
    return null;
  }

  if (user.role !== "org_admin" && !isProjectMember(project, user.userId)) {
    return null;
  }

  return project;
}

export function emitToProject(projectId, event, payload) {
  if (!io) {
    return;
  }
  io.to(`project:${projectId}`).emit(event, payload);
}

export function emitToUser(userId, event, payload) {
  if (!io) {
    return;
  }
  io.to(`user:${userId}`).emit(event, payload);
}

// TODO: emitToProject(projectId, "comment:new", payload) when Comment model exists

export function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || env.CLIENT_URLS.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId);

      if (!user || !user.isActive) {
        return next(new Error("Invalid token"));
      }

      socket.data.user = {
        id: user._id.toString(),
        userId: user._id.toString(),
        organizationId: user.organizationId?.toString() ?? null,
        role: user.role,
        email: user.email,
      };
      socket.data.joinedProjects = new Set();

      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    // super_admin sockets have no organizationId and must NOT be disconnected or
    // excluded here  they still need their personal user:{id} room for
    // platform-level notifications.
    socket.join(`user:${user.userId}`);

    if (!user.organizationId) {
      return;
    }

    socket.on("project:join", async ({ projectId }) => {
      if (!projectId) {
        socket.emit("error", { message: "projectId is required" });
        return;
      }

      const project = await assertProjectAccess(user, projectId);
      if (!project) {
        socket.emit("error", { message: "Project not found or access denied" });
        return;
      }

      socket.join(`org:${user.organizationId}`);
      socket.join(`project:${projectId}`);
      socket.data.joinedProjects.add(projectId);

      socket
        .to(`project:${projectId}`)
        .emit("presence:join", { userId: user.userId, projectId });
    });

    socket.on("project:leave", ({ projectId }) => {
      if (!projectId) {
        return;
      }

      socket.leave(`project:${projectId}`);
      socket.data.joinedProjects.delete(projectId);

      socket
        .to(`project:${projectId}`)
        .emit("presence:leave", { userId: user.userId, projectId });
    });

    socket.on("disconnect", () => {
      for (const projectId of socket.data.joinedProjects) {
        socket
          .to(`project:${projectId}`)
          .emit("presence:leave", { userId: user.userId, projectId });
      }
      socket.data.joinedProjects.clear();
    });
  });

  return io;
}
