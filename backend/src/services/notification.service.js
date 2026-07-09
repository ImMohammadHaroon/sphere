import { Notification } from "../models/Notification.js";
import { emitToUser } from "../sockets/index.js";

function formatNotification(notification) {
  return {
    id: notification._id.toString(),
    organizationId: notification.organizationId?.toString() ?? null,
    userId: notification.userId.toString(),
    type: notification.type,
    payload: notification.payload,
    read: notification.read,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}

export async function createNotification({
  organizationId = null,
  userId,
  type,
  payload,
}) {
  if (!userId || !type) {
    const err = new Error("userId and type are required");
    err.status = 400;
    throw err;
  }

  const notification = await Notification.create({
    organizationId,
    userId,
    type,
    payload,
  });

  try {
    emitToUser(
      userId.toString(),
      "notification:new",
      formatNotification(notification)
    );
  } catch (socketErr) {
    console.error("Failed to emit notification:new:", socketErr);
  }

  return notification;
}
