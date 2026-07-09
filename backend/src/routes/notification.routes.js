import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from "../validators/notification.validator.js";

const router = Router();

router.get(
  "/",
  validate(listNotificationsQuerySchema),
  notificationController.listNotifications
);

router.patch("/read-all", notificationController.markAllAsRead);

router.patch(
  "/:id/read",
  validate(notificationIdParamSchema),
  notificationController.markAsRead
);

export default router;
