import mongoose from "mongoose";
import { Attachment } from "../models/Attachment.js";
import { Milestone } from "../models/Milestone.js";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { createNotification } from "../services/notification.service.js";
import { isProjectMember } from "../utils/projectAccess.js";
import { formatPublicUser, USER_PUBLIC_FIELDS } from "../utils/formatUser.js";

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function conflict(message) {
  const err = new Error(message);
  err.status = 409;
  return err;
}

function forbidden(message = "Forbidden") {
  const err = new Error(message);
  err.status = 403;
  return err;
}

export function formatFeedbackMessage(message) {
  const author = formatPublicUser(message.authorId);

  return {
    _id: message._id?.toString?.() ?? message._id,
    body: message.body,
    authorId: author?.id ?? message.authorId?.toString?.() ?? null,
    author,
    createdAt: message.createdAt,
  };
}

function buildFeedbackMessages(milestone) {
  const thread = (milestone.feedbackThread ?? []).map(formatFeedbackMessage);

  if (thread.length > 0) {
    return thread;
  }

  if (milestone.clientFeedback?.trim()) {
    return [
      {
        _id: "legacy",
        body: milestone.clientFeedback,
        authorId:
          milestone.approvedByClientId?.toString?.() ??
          milestone.approvedByClientId ??
          null,
        author: null,
        createdAt: milestone.updatedAt ?? milestone.createdAt,
      },
    ];
  }

  return [];
}

export function formatMilestone(milestone) {
  const feedbackMessages = buildFeedbackMessages(milestone);

  return {
    ...milestone,
    _id: milestone._id.toString(),
    organizationId: milestone.organizationId?.toString(),
    projectId: milestone.projectId?.toString?.() ?? milestone.projectId,
    approvedByClientId:
      milestone.approvedByClientId?.toString?.() ??
      milestone.approvedByClientId,
    createdBy: milestone.createdBy?.toString?.() ?? milestone.createdBy,
    feedbackMessages,
    clientFeedback:
      feedbackMessages.find((message) => !message.author)?.body ??
      milestone.clientFeedback ??
      "",
  };
}

async function loadProjectWithMembers(req, projectId) {
  return req
    .scopedFindOne(Project, { _id: projectId })
    .populate("members", USER_PUBLIC_FIELDS)
    .lean();
}

async function assertProjectReadable(req, projectId) {
  const project = await loadProjectWithMembers(req, projectId);

  if (!project) {
    throw notFound();
  }

  if (
    req.user.role !== "org_admin" &&
    !isProjectMember(project, req.user.userId)
  ) {
    throw notFound();
  }

  return project;
}

async function assertProjectInOrg(req, projectId) {
  const project = await req.scopedFindOne(Project, { _id: projectId }).lean();
  if (!project) {
    throw notFound();
  }
  return project;
}

function memberIds(project) {
  const ids = new Set();

  for (const member of project.members ?? []) {
    const id =
      member && typeof member === "object" && member._id != null
        ? member._id.toString()
        : member?.toString?.();
    if (id) {
      ids.add(id);
    }
  }

  const ownerId = project.ownerId?.toString?.() ?? project.ownerId;
  if (ownerId) {
    ids.add(ownerId.toString());
  }

  return [...ids];
}

export async function listMilestones(req, res, next) {
  try {
    await assertProjectReadable(req, req.params.projectId);

    const milestones = await req
      .scopedQuery(Milestone, { projectId: req.params.projectId })
      .populate("feedbackThread.authorId", USER_PUBLIC_FIELDS)
      .sort({ dueDate: 1 })
      .lean();

    res.json({ milestones: milestones.map(formatMilestone) });
  } catch (err) {
    next(err);
  }
}

export async function createMilestone(req, res, next) {
  try {
    const project = await assertProjectInOrg(req, req.params.projectId);

    const created = await Milestone.create({
      organizationId: req.user.organizationId,
      projectId: req.params.projectId,
      name: req.body.name,
      description: req.body.description ?? "",
      dueDate: req.body.dueDate,
      createdBy: req.user.userId,
    });

    const milestone = await req
      .scopedFindOne(Milestone, { _id: created._id })
      .lean();

    const projectMemberIds = memberIds(project);
    if (projectMemberIds.length > 0) {
      const clients = await User.find({
        _id: {
          $in: projectMemberIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
        organizationId: req.user.organizationId,
        role: "client",
        isActive: true,
      })
        .select("_id")
        .lean();

      for (const client of clients) {
        try {
          await createNotification({
            organizationId: created.organizationId,
            userId: client._id,
            type: "milestone_created",
            payload: {
              milestoneId: created._id.toString(),
              milestoneName: created.name,
              projectId: project._id.toString(),
              projectName: project.name,
            },
          });
        } catch (notifyErr) {
          console.error(
            "Failed to create milestone_created notification:",
            notifyErr
          );
        }
      }
    }

    res.status(201).json({ milestone: formatMilestone(milestone) });
  } catch (err) {
    next(err);
  }
}

export async function updateMilestone(req, res, next) {
  try {
    const existing = await req
      .scopedFindOne(Milestone, { _id: req.params.id })
      .lean();

    if (!existing) {
      throw notFound();
    }

    if (existing.status !== "pending") {
      throw conflict("Cannot edit an already-approved or rejected milestone");
    }

    const updates = {};
    for (const field of ["name", "description", "dueDate"]) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const milestone = await req
      .scopedFindOneAndUpdate(Milestone, { _id: req.params.id }, updates)
      .lean();

    res.json({ milestone: formatMilestone(milestone) });
  } catch (err) {
    next(err);
  }
}

export async function approveMilestone(req, res, next) {
  try {
    const existing = await req
      .scopedFindOne(Milestone, { _id: req.params.id })
      .lean();

    if (!existing) {
      throw notFound();
    }

    if (existing.status !== "pending") {
      throw conflict("Milestone has already been approved or rejected");
    }

    const project = await req
      .scopedFindOne(Project, { _id: existing.projectId })
      .lean();

    if (!project) {
      throw notFound("Project not found");
    }

    if (!isProjectMember(project, req.user.userId)) {
      throw forbidden();
    }

    const updates = {
      status: req.body.decision,
      approvedByClientId: req.user.userId,
      approvedAt: new Date(),
    };

    if (req.body.decision === "rejected") {
      updates.rejectReason = req.body.rejectReason;
    }

    const milestone = await req
      .scopedFindOneAndUpdate(Milestone, { _id: req.params.id }, updates)
      .lean();

    try {
      await createNotification({
        organizationId: existing.organizationId,
        userId: project.ownerId,
        type: "milestone_approved",
        payload: {
          milestoneId: existing._id.toString(),
          milestoneName: existing.name,
          projectId: project._id.toString(),
          projectName: project.name,
          decision: req.body.decision,
          rejectReason: req.body.rejectReason ?? "",
        },
      });
    } catch (notifyErr) {
      console.error(
        "Failed to create milestone_approved notification:",
        notifyErr
      );
    }

    res.json({ milestone: formatMilestone(milestone) });
  } catch (err) {
    next(err);
  }
}

export async function submitMilestoneFeedback(req, res, next) {
  try {
    if (req.user.role !== "client") {
      throw forbidden("Only clients can submit milestone feedback");
    }

    const existing = await req
      .scopedFindOne(Milestone, { _id: req.params.id })
      .lean();

    if (!existing) {
      throw notFound();
    }

    if (existing.status !== "pending") {
      throw conflict("Feedback can only be added while the milestone is pending");
    }

    const project = await loadProjectWithMembers(req, existing.projectId);

    if (!project) {
      throw notFound("Project not found");
    }

    if (!isProjectMember(project, req.user.userId)) {
      throw forbidden();
    }

    const message = {
      body: req.body.feedback,
      authorId: req.user.userId,
      createdAt: new Date(),
    };

    await req.scopedFindOneAndUpdate(
      Milestone,
      { _id: req.params.id },
      {
        $push: { feedbackThread: message },
        clientFeedback: req.body.feedback,
      }
    );

    const milestone = await req
      .scopedFindOne(Milestone, { _id: req.params.id })
      .populate("feedbackThread.authorId", USER_PUBLIC_FIELDS)
      .lean();

    try {
      await createNotification({
        organizationId: existing.organizationId,
        userId: project.ownerId,
        type: "milestone_feedback",
        payload: {
          milestoneId: existing._id.toString(),
          milestoneName: existing.name,
          projectId: project._id.toString(),
          projectName: project.name,
          feedback: req.body.feedback,
        },
      });
    } catch (notifyErr) {
      console.error(
        "Failed to create milestone_feedback notification:",
        notifyErr
      );
    }

    res.json({ milestone: formatMilestone(milestone) });
  } catch (err) {
    next(err);
  }
}

async function milestoneHasClientFeedback(existing) {
  if (existing.clientFeedback?.trim()) {
    return true;
  }

  if (!existing.feedbackThread?.length) {
    return false;
  }

  const authorIds = [
    ...new Set(
      existing.feedbackThread.map((message) => message.authorId.toString())
    ),
  ];

  const clientCount = await User.countDocuments({
    _id: { $in: authorIds.map((id) => new mongoose.Types.ObjectId(id)) },
    organizationId: existing.organizationId,
    role: "client",
  });

  return clientCount > 0;
}

export async function replyMilestoneFeedback(req, res, next) {
  try {
    const teamRoles = ["org_admin", "project_manager", "team_member"];
    if (!teamRoles.includes(req.user.role)) {
      throw forbidden("Only team members can reply to client feedback");
    }

    const existing = await req
      .scopedFindOne(Milestone, { _id: req.params.id })
      .lean();

    if (!existing) {
      throw notFound();
    }

    if (existing.status !== "pending") {
      throw conflict("Replies are only allowed while the milestone is pending");
    }

    const project = await loadProjectWithMembers(req, existing.projectId);

    if (!project) {
      throw notFound("Project not found");
    }

    if (
      req.user.role !== "org_admin" &&
      !isProjectMember(project, req.user.userId)
    ) {
      throw forbidden();
    }

    const hasClientFeedback = await milestoneHasClientFeedback(existing);
    if (!hasClientFeedback) {
      throw conflict("Wait for client feedback before replying");
    }

    const message = {
      body: req.body.message,
      authorId: req.user.userId,
      createdAt: new Date(),
    };

    await req.scopedFindOneAndUpdate(
      Milestone,
      { _id: req.params.id },
      { $push: { feedbackThread: message } }
    );

    const milestone = await req
      .scopedFindOne(Milestone, { _id: req.params.id })
      .populate("feedbackThread.authorId", USER_PUBLIC_FIELDS)
      .lean();

    const projectMemberIds = memberIds(project);
    if (projectMemberIds.length > 0) {
      const clients = await User.find({
        _id: {
          $in: projectMemberIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
        organizationId: existing.organizationId,
        role: "client",
        isActive: true,
      })
        .select("_id")
        .lean();

      for (const client of clients) {
        try {
          const replier = await User.findById(req.user.userId)
            .select("name")
            .lean();

          await createNotification({
            organizationId: existing.organizationId,
            userId: client._id,
            type: "milestone_feedback_reply",
            payload: {
              milestoneId: existing._id.toString(),
              milestoneName: existing.name,
              projectId: project._id.toString(),
              projectName: project.name,
              message: req.body.message,
              repliedByName: replier?.name ?? "Your team",
            },
          });
        } catch (notifyErr) {
          console.error(
            "Failed to create milestone_feedback_reply notification:",
            notifyErr
          );
        }
      }
    }

    res.json({ milestone: formatMilestone(milestone) });
  } catch (err) {
    next(err);
  }
}

export async function deleteMilestone(req, res, next) {
  try {
    const existing = await req
      .scopedFindOne(Milestone, { _id: req.params.id })
      .lean();

    if (!existing) {
      throw notFound();
    }

    if (existing.status !== "pending") {
      throw conflict("Cannot delete an already-approved or rejected milestone");
    }

    await Attachment.deleteMany({ milestoneId: existing._id });

    const milestone = await req
      .scopedFindOneAndDelete(Milestone, { _id: req.params.id })
      .lean();

    res.json({
      message: "Milestone deleted",
      milestone: formatMilestone(milestone),
    });
  } catch (err) {
    next(err);
  }
}
