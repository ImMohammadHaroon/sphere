import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import inviteRoutes from "./routes/invite.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes, { projectTaskRouter } from "./routes/task.routes.js";
import {
  projectTaskCommentRouter,
  taskCommentRouter,
} from "./routes/comment.routes.js";
import {
  projectTaskCommentAttachmentRouter,
  taskCommentAttachmentRouter,
} from "./routes/commentAttachment.routes.js";
import {
  projectTaskAttachmentRouter,
  taskAttachmentRouter,
} from "./routes/attachment.routes.js";
import milestoneRoutes, {
  projectMilestoneRouter,
} from "./routes/milestone.routes.js";
import {
  projectMilestoneAttachmentRouter,
  milestoneAttachmentRouter,
} from "./routes/milestoneAttachment.routes.js";
import communityMessageRoutes from "./routes/communityMessage.routes.js";
import communityMessageAttachmentRoutes from "./routes/communityMessageAttachment.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import platformRoutes from "./routes/platform.routes.js";
import orgRoutes from "./routes/org.routes.js";
import orgSettingsRoutes from "./routes/orgSettings.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import kanbanTemplateRoutes from "./routes/kanbanTemplate.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import { handleStripeWebhook } from "./controllers/stripeWebhook.controller.js";
import { authenticate, requireRole } from "./middleware/auth.middleware.js";
import { tenantScope } from "./middleware/tenantScope.js";
import { globalRateLimiter } from "./middleware/rateLimit.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { swaggerServe, swaggerSetup } from "./config/swagger.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: env.isProduction,
    hsts: env.isProduction,
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CLIENT_URLS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);

app.use(globalRateLimiter);
app.use(morgan(env.isProduction ? "combined" : "dev"));

app.post(
  "/api/v1/billing/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "projectsphere-api" });
});

let dbReady = false;
app.use(async (req, res, next) => {
  if (dbReady || req.path === "/health") {
    next();
    return;
  }
  try {
    await connectDB();
    dbReady = true;
    next();
  } catch (err) {
    next(err);
  }
});

app.use("/api-docs", swaggerServe, swaggerSetup);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/invites", inviteRoutes);
app.use("/api/v1/notifications", authenticate, notificationRoutes);

app.use(
  "/api/v1/chat",
  authenticate,
  tenantScope,
  chatRoutes
);

app.use(
  "/api/v1/community/messages",
  authenticate,
  tenantScope,
  communityMessageRoutes
);
app.use(
  "/api/v1/community/messages/:messageId/attachments",
  authenticate,
  tenantScope,
  communityMessageAttachmentRoutes
);

app.use("/api/v1/projects", authenticate, tenantScope, projectRoutes);
app.use(
  "/api/v1/projects/:projectId/tasks",
  authenticate,
  tenantScope,
  projectTaskRouter
);
app.use(
  "/api/v1/projects/:projectId/tasks/:taskId/comments",
  authenticate,
  tenantScope,
  projectTaskCommentRouter
);
app.use(
  "/api/v1/projects/:projectId/tasks/:taskId/comments/:commentId/attachments",
  authenticate,
  tenantScope,
  projectTaskCommentAttachmentRouter
);
app.use(
  "/api/v1/projects/:projectId/tasks/:taskId/attachments",
  authenticate,
  tenantScope,
  projectTaskAttachmentRouter
);
app.use(
  "/api/v1/tasks/:taskId/comments",
  authenticate,
  tenantScope,
  taskCommentRouter
);
app.use(
  "/api/v1/tasks/:taskId/comments/:commentId/attachments",
  authenticate,
  tenantScope,
  taskCommentAttachmentRouter
);
app.use(
  "/api/v1/tasks/:taskId/attachments",
  authenticate,
  tenantScope,
  taskAttachmentRouter
);
app.use("/api/v1/tasks", authenticate, tenantScope, taskRoutes);
app.use(
  "/api/v1/projects/:projectId/milestones",
  authenticate,
  tenantScope,
  projectMilestoneRouter
);
app.use(
  "/api/v1/projects/:projectId/milestones/:milestoneId/attachments",
  authenticate,
  tenantScope,
  projectMilestoneAttachmentRouter
);
app.use(
  "/api/v1/milestones/:milestoneId/attachments",
  authenticate,
  tenantScope,
  milestoneAttachmentRouter
);
app.use("/api/v1/milestones", authenticate, tenantScope, milestoneRoutes);

app.use(
  "/api/v1/kanban-templates",
  authenticate,
  tenantScope,
  kanbanTemplateRoutes
);

app.use(
  "/api/v1/platform",
  authenticate,
  requireRole(["super_admin"]),
  platformRoutes
);

app.use(
  "/api/v1/org",
  authenticate,
  tenantScope,
  orgRoutes
);

app.use(
  "/api/v1/org/settings",
  authenticate,
  tenantScope,
  requireRole(["org_admin"]),
  orgSettingsRoutes
);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use(errorHandler);

export default app;
