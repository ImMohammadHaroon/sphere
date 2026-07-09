import { Notification } from "../models/Notification.js";

const PAGE_SIZE = 30;

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

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

export async function listNotifications(req, res, next) {
  try {
    const query = req.validatedQuery ?? req.query;
    const page = query.page ?? 1;
    const limit = PAGE_SIZE;
    const skip = (page - 1) * limit;
    const userId = req.user.userId;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, read: false }),
    ]);

    res.json({
      notifications: notifications.map(formatNotification),
      unreadCount,
      page,
      hasMore: skip + notifications.length < total,
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!notification) {
      throw notFound();
    }

    if (!notification.read) {
      notification.read = true;
      await notification.save();
    }

    res.json({ notification: formatNotification(notification) });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.userId, read: false },
      { read: true }
    );

    res.json({ updated: result.modifiedCount });
  } catch (err) {
    next(err);
  }
}
