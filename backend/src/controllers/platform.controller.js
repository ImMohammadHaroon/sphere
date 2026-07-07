import mongoose from "mongoose";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { AuditLog } from "../models/AuditLog.js";
import { PlatformSettings } from "../models/PlatformSettings.js";
import { getClientIp, logAction } from "../services/auditLog.service.js";
import { sendMail } from "../services/email/transporter.js";
import { buildOrgApprovalEmail } from "../services/email/orgApprovalEmail.js";
import { buildOrgRejectionEmail } from "../services/email/orgRejectionEmail.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function notDeletedFilter() {
  return { deletedAt: null };
}

function emptyTasksByStatus() {
  return {
    todo: 0,
    "in-progress": 0,
    review: 0,
    done: 0,
  };
}

function mapTasksByStatus(groups) {
  const result = emptyTasksByStatus();
  for (const row of groups) {
    if (row._id && result[row._id] !== undefined) {
      result[row._id] = row.count;
    }
  }
  return result;
}

function parsePagination(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildListMatch(query = {}) {
  const match = {
    ...notDeletedFilter(),
    $or: [
      { verificationStatus: "approved" },
      { verificationStatus: { $exists: false } },
    ],
  };

  if (query.search) {
    match.name = { $regex: query.search, $options: "i" };
  }

  if (query.plan) {
    match.plan = query.plan;
  }

  if (query.isActive === "true") {
    match.isActive = true;
  } else if (query.isActive === "false") {
    match.isActive = false;
  }

  return match;
}

function mapListOrganization(org) {
  return {
    id: org._id.toString(),
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    isActive: org.isActive,
    userCount: org.userCount ?? 0,
    projectCount: org.projectCount ?? 0,
    createdAt: org.createdAt,
  };
}

function mapOrganizationDetail(org) {
  return {
    id: org._id.toString(),
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    isActive: org.isActive,
    timezone: org.settings?.timezone ?? "UTC",
    createdAt: org.createdAt,
  };
}

async function findActiveOrganizationById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return Organization.findOne({
    _id: id,
    ...notDeletedFilter(),
  });
}

async function organizationsWithUserCounts(pipeline = []) {
  return Organization.aggregate([
    { $match: notDeletedFilter() },
    ...pipeline,
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "organizationId",
        as: "users",
      },
    },
    {
      $addFields: {
        userCount: { $size: "$users" },
      },
    },
    {
      $project: {
        name: 1,
        slug: 1,
        plan: 1,
        isActive: 1,
        createdAt: 1,
        userCount: 1,
      },
    },
  ]);
}

function normalizeOverviewOrganization(org) {
  return {
    _id: org._id.toString(),
    name: org.name,
    plan: org.plan,
    isActive: org.isActive,
    createdAt: org.createdAt,
    userCount: org.userCount ?? 0,
  };
}

export async function getPlatformOverview(req, res, next) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [orgStats, userStats, projectStats, taskStats, recentOrganizations] =
      await Promise.all([
        Organization.aggregate([
          { $match: notDeletedFilter() },
          {
            $facet: {
              totals: [
                {
                  $group: {
                    _id: null,
                    totalOrganizations: { $sum: 1 },
                    activeOrganizations: {
                      $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
                    },
                    newOrganizationsLast30Days: {
                      $sum: {
                        $cond: [{ $gte: ["$createdAt", thirtyDaysAgo] }, 1, 0],
                      },
                    },
                  },
                },
              ],
            },
          },
        ]),
        User.aggregate([{ $count: "totalUsers" }]),
        Project.aggregate([
          {
            $facet: {
              totals: [
                {
                  $group: {
                    _id: null,
                    totalProjects: { $sum: 1 },
                    activeProjects: {
                      $sum: {
                        $cond: [{ $eq: ["$status", "active"] }, 1, 0],
                      },
                    },
                  },
                },
              ],
            },
          },
        ]),
        Task.aggregate([
          {
            $facet: {
              total: [{ $count: "totalTasks" }],
              byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            },
          },
        ]),
        organizationsWithUserCounts([
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
        ]),
      ]);

    const orgTotals = orgStats[0]?.totals[0] ?? {
      totalOrganizations: 0,
      activeOrganizations: 0,
      newOrganizationsLast30Days: 0,
    };

    const projectTotals = projectStats[0]?.totals[0] ?? {
      totalProjects: 0,
      activeProjects: 0,
    };

    const taskFacet = taskStats[0] ?? { total: [], byStatus: [] };
    const totalTasks = taskFacet.total[0]?.totalTasks ?? 0;
    const tasksByStatus = mapTasksByStatus(taskFacet.byStatus);

    res.json({
      totalOrganizations: orgTotals.totalOrganizations,
      activeOrganizations: orgTotals.activeOrganizations,
      totalUsers: userStats[0]?.totalUsers ?? 0,
      totalProjects: projectTotals.totalProjects,
      activeProjects: projectTotals.activeProjects,
      totalTasks,
      tasksByStatus,
      newOrganizationsLast30Days: orgTotals.newOrganizationsLast30Days,
      recentOrganizations: recentOrganizations.map(normalizeOverviewOrganization),
    });
  } catch (err) {
    next(err);
  }
}

export async function listOrganizations(req, res, next) {
  try {
    const query = req.validatedQuery ?? req.query;
    const match = buildListMatch(query);
    const { page, limit, skip } = parsePagination(query);

    const [result] = await Organization.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "organizationId",
                as: "users",
              },
            },
            {
              $lookup: {
                from: "projects",
                localField: "_id",
                foreignField: "organizationId",
                as: "projects",
              },
            },
            {
              $addFields: {
                userCount: { $size: "$users" },
                projectCount: { $size: "$projects" },
              },
            },
            {
              $project: {
                name: 1,
                slug: 1,
                plan: 1,
                isActive: 1,
                createdAt: 1,
                userCount: 1,
                projectCount: 1,
              },
            },
          ],
        },
      },
    ]);

    const total = result.metadata[0]?.total ?? 0;

    res.json({
      organizations: result.data.map(mapListOrganization),
      total,
      page,
      totalPages: total > 0 ? Math.ceil(total / limit) : 1,
    });
  } catch (err) {
    next(err);
  }
}

function mapPendingOrganization(org) {
  const admin = org.adminUsers?.[0] ?? null;

  return {
    id: org._id.toString(),
    name: org.name,
    plan: org.plan,
    createdAt: org.createdAt,
    admin: admin
      ? { name: admin.name, email: admin.email }
      : { name: null, email: null },
  };
}

async function findPendingOrganizationById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return Organization.findOne({
    _id: id,
    verificationStatus: "pending",
    ...notDeletedFilter(),
  });
}

async function findOrgAdminUser(organizationId) {
  return User.findOne({ organizationId, role: "org_admin" })
    .select("name email")
    .lean();
}

export async function listPendingOrganizations(req, res, next) {
  try {
    const query = req.validatedQuery ?? req.query;
    const { page, limit, skip } = parsePagination(query);

    const [result] = await Organization.aggregate([
      { $match: { verificationStatus: "pending", ...notDeletedFilter() } },
      { $sort: { createdAt: 1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                let: { orgId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$organizationId", "$$orgId"] },
                          { $eq: ["$role", "org_admin"] },
                        ],
                      },
                    },
                  },
                  { $project: { name: 1, email: 1 } },
                  { $limit: 1 },
                ],
                as: "adminUsers",
              },
            },
            {
              $project: {
                name: 1,
                plan: 1,
                createdAt: 1,
                adminUsers: 1,
              },
            },
          ],
        },
      },
    ]);

    const total = result.metadata[0]?.total ?? 0;

    res.json({
      organizations: result.data.map(mapPendingOrganization),
      total,
      page,
      totalPages: total > 0 ? Math.ceil(total / limit) : 1,
    });
  } catch (err) {
    next(err);
  }
}

export async function approveOrganization(req, res, next) {
  try {
    const org = await findActiveOrganizationById(req.params.id);

    if (!org) {
      throw httpError("Not found", 404);
    }

    if (org.verificationStatus === "approved") {
      return res.json({
        message: "Organization is already approved",
        organization: mapOrganizationDetail(org),
      });
    }

    if (org.verificationStatus !== "pending") {
      throw httpError("Organization is not pending approval", 400);
    }

    org.verificationStatus = "approved";
    org.verificationReviewedAt = new Date();
    org.verificationReviewedBy = req.user.userId;
    org.verificationRejectionReason = null;
    await org.save();

    const admin = await findOrgAdminUser(org._id);
    if (admin) {
      const { subject, html, text } = buildOrgApprovalEmail({
        name: admin.name,
        orgName: org.name,
      });
      await sendMail({ to: admin.email, subject, html, text });
    }

    await logAction({
      organizationId: org._id,
      actorId: req.user.userId,
      action: "organization.approved",
      targetType: "Organization",
      targetId: org._id,
      metadata: { slug: org.slug, name: org.name },
      ip: getClientIp(req),
    });

    res.json({
      message: "Organization approved",
      organization: mapOrganizationDetail(org),
    });
  } catch (err) {
    next(err);
  }
}

export async function rejectOrganization(req, res, next) {
  try {
    const org = await findPendingOrganizationById(req.params.id);

    if (!org) {
      const existing = await findActiveOrganizationById(req.params.id);
      if (existing?.verificationStatus === "rejected") {
        return res.json({
          message: "Organization is already rejected",
          organization: mapOrganizationDetail(existing),
        });
      }
      throw httpError("Not found", 404);
    }

    const reason = req.body?.reason?.trim() || null;

    org.verificationStatus = "rejected";
    org.verificationReviewedAt = new Date();
    org.verificationReviewedBy = req.user.userId;
    org.verificationRejectionReason = reason;
    await org.save();

    const admin = await findOrgAdminUser(org._id);
    if (admin) {
      const { subject, html, text } = buildOrgRejectionEmail({
        name: admin.name,
        orgName: org.name,
        reason,
      });
      await sendMail({ to: admin.email, subject, html, text });
    }

    await logAction({
      organizationId: org._id,
      actorId: req.user.userId,
      action: "organization.rejected",
      targetType: "Organization",
      targetId: org._id,
      metadata: { slug: org.slug, name: org.name, reason },
      ip: getClientIp(req),
    });

    res.json({
      message: "Organization rejected",
      organization: mapOrganizationDetail(org),
    });
  } catch (err) {
    next(err);
  }
}

export async function getOrganizationDetail(req, res, next) {
  try {
    const org = await findActiveOrganizationById(req.params.id);

    if (!org) {
      throw httpError("Not found", 404);
    }

    const orgId = org._id;

    const [members, projects, taskCount] = await Promise.all([
      User.find({ organizationId: orgId })
        .select("name email role createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Project.aggregate([
        { $match: { organizationId: orgId } },
        {
          $lookup: {
            from: "tasks",
            localField: "_id",
            foreignField: "projectId",
            as: "tasks",
          },
        },
        {
          $addFields: {
            taskCount: { $size: "$tasks" },
          },
        },
        {
          $project: {
            name: 1,
            status: 1,
            taskCount: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ]),
      Task.countDocuments({ organizationId: orgId }),
    ]);

    res.json({
      organization: mapOrganizationDetail(org),
      members: members.map((member) => ({
        id: member._id.toString(),
        name: member.name,
        email: member.email,
        role: member.role,
        createdAt: member.createdAt,
      })),
      projects: projects.map((project) => ({
        id: project._id.toString(),
        name: project.name,
        status: project.status,
        taskCount: project.taskCount ?? 0,
        createdAt: project.createdAt,
      })),
      stats: {
        userCount: members.length,
        projectCount: projects.length,
        taskCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function suspendOrganization(req, res, next) {
  try {
    const org = await findActiveOrganizationById(req.params.id);

    if (!org) {
      throw httpError("Not found", 404);
    }

    if (!org.isActive) {
      return res.json({
        message: "Organization is already suspended",
        organization: mapOrganizationDetail(org),
      });
    }

    org.isActive = false;
    await org.save();

    await logAction({
      organizationId: org._id,
      actorId: req.user.userId,
      action: "organization.suspended",
      targetType: "Organization",
      targetId: org._id,
      metadata: { slug: org.slug, name: org.name },
      ip: getClientIp(req),
    });

    res.json({
      message: "Organization suspended",
      organization: mapOrganizationDetail(org),
    });
  } catch (err) {
    next(err);
  }
}

export async function activateOrganization(req, res, next) {
  try {
    const org = await findActiveOrganizationById(req.params.id);

    if (!org) {
      throw httpError("Not found", 404);
    }

    if (org.isActive) {
      return res.json({
        message: "Organization is already active",
        organization: mapOrganizationDetail(org),
      });
    }

    org.isActive = true;
    await org.save();

    await logAction({
      organizationId: org._id,
      actorId: req.user.userId,
      action: "organization.activated",
      targetType: "Organization",
      targetId: org._id,
      metadata: { slug: org.slug, name: org.name },
      ip: getClientIp(req),
    });

    res.json({
      message: "Organization activated",
      organization: mapOrganizationDetail(org),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteOrganization(req, res, next) {
  try {
    const org = await findActiveOrganizationById(req.params.id);

    if (!org) {
      throw httpError("Not found", 404);
    }

    if (req.body.confirmSlug !== org.slug) {
      throw httpError("Confirmation slug does not match", 400);
    }

    org.isActive = false;
    org.deletedAt = new Date();
    await org.save();

    await logAction({
      organizationId: org._id,
      actorId: req.user.userId,
      action: "organization.deleted",
      targetType: "Organization",
      targetId: org._id,
      metadata: { slug: org.slug, name: org.name },
      ip: getClientIp(req),
    });

    res.json({
      message: "Organization deleted",
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        deletedAt: org.deletedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

function mapListedUser(user) {
  const org = user.organizationId;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    organization:
      org && org._id
        ? {
            id: org._id.toString(),
            name: org.name,
            slug: org.slug,
          }
        : null,
    createdAt: user.createdAt,
  };
}

async function buildUserListFilter(query = {}) {
  const conditions = [];

  if (query.search) {
    conditions.push({
      $or: [
        { name: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
      ],
    });
  }

  if (query.role) {
    conditions.push({ role: query.role });
  }

  if (query.organizationId) {
    const org = await findActiveOrganizationById(query.organizationId);
    if (!org) {
      return null;
    }
    conditions.push({ organizationId: org._id });
  } else {
    const activeOrgIds = await Organization.find(notDeletedFilter()).distinct("_id");
    conditions.push({
      $or: [{ organizationId: null }, { organizationId: { $in: activeOrgIds } }],
    });
  }

  if (conditions.length === 0) {
    return {};
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { $and: conditions };
}

export async function listAllUsers(req, res, next) {
  try {
    const query = req.validatedQuery ?? req.query;
    const { page, limit, skip } = parsePagination(query);
    const filter = await buildUserListFilter(query);

    if (filter === null) {
      return res.json({
        users: [],
        total: 0,
        page,
        totalPages: 1,
      });
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate({ path: "organizationId", select: "name slug" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      users: users.map(mapListedUser),
      total,
      page,
      totalPages: total > 0 ? Math.ceil(total / limit) : 1,
    });
  } catch (err) {
    next(err);
  }
}

function formatPlatformAuditLog(log) {
  const actor = log.actorId;
  const org = log.organizationId;

  return {
    id: log._id.toString(),
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId?.toString() ?? null,
    metadata: log.metadata ?? {},
    ip: log.ip,
    createdAt: log.createdAt,
    actor: actor
      ? {
          name: actor.name,
          email: actor.email,
        }
      : null,
    organization:
      org && org._id
        ? {
            id: org._id.toString(),
            name: org.name,
            slug: org.slug,
          }
        : null,
  };
}

function formatPlatformSettings(doc) {
  return {
    id: doc._id.toString(),
    general: {
      platformName: doc.general?.platformName ?? "ProjectSphere",
      supportEmail: doc.general?.supportEmail ?? "",
    },
    registration: {
      allowSelfServeSignup: doc.registration?.allowSelfServeSignup ?? true,
      defaultPlan: doc.registration?.defaultPlan ?? "free",
    },
    security: {
      globalPasswordMinLength: doc.security?.globalPasswordMinLength ?? 8,
      enforceGlobal2FA: doc.security?.enforceGlobal2FA ?? false,
    },
    maintenance: {
      enabled: doc.maintenance?.enabled ?? false,
      message: doc.maintenance?.message ?? "",
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function logPlatformSettingsUpdate(req, settings, section) {
  await logAction({
    organizationId: null,
    actorId: req.user.userId,
    action: "platform_settings.updated",
    targetType: "PlatformSettings",
    targetId: settings._id,
    metadata: { section },
    ip: getClientIp(req),
  });
}

export async function getPlatformSettings(req, res, next) {
  try {
    const settings = await PlatformSettings.getOrCreate();
    res.json({ settings: formatPlatformSettings(settings) });
  } catch (err) {
    next(err);
  }
}

export async function updateGeneralSettings(req, res, next) {
  try {
    const settings = await PlatformSettings.getOrCreate();
    const { general } = req.body;

    settings.general = {
      platformName: general.platformName,
      supportEmail: general.supportEmail,
    };

    settings.markModified("general");
    await settings.save();
    await logPlatformSettingsUpdate(req, settings, "general");

    res.json({ settings: formatPlatformSettings(settings) });
  } catch (err) {
    next(err);
  }
}

export async function updateRegistrationSettings(req, res, next) {
  try {
    const settings = await PlatformSettings.getOrCreate();
    const { registration } = req.body;

    settings.registration = {
      allowSelfServeSignup: registration.allowSelfServeSignup,
      defaultPlan: registration.defaultPlan,
    };

    settings.markModified("registration");
    await settings.save();
    await logPlatformSettingsUpdate(req, settings, "registration");

    res.json({ settings: formatPlatformSettings(settings) });
  } catch (err) {
    next(err);
  }
}

export async function updateSecuritySettings(req, res, next) {
  try {
    const settings = await PlatformSettings.getOrCreate();
    const { security } = req.body;

    settings.security = {
      globalPasswordMinLength: security.globalPasswordMinLength,
      enforceGlobal2FA: security.enforceGlobal2FA,
    };

    settings.markModified("security");
    await settings.save();
    await logPlatformSettingsUpdate(req, settings, "security");

    res.json({ settings: formatPlatformSettings(settings) });
  } catch (err) {
    next(err);
  }
}

export async function updateMaintenanceSettings(req, res, next) {
  try {
    const settings = await PlatformSettings.getOrCreate();
    const { maintenance } = req.body;

    settings.maintenance = {
      enabled: maintenance.enabled,
      message: maintenance.message,
    };

    settings.markModified("maintenance");
    await settings.save();
    await logPlatformSettingsUpdate(req, settings, "maintenance");

    res.json({ settings: formatPlatformSettings(settings) });
  } catch (err) {
    next(err);
  }
}

export async function listPlatformAuditLogs(req, res, next) {
  try {
    const query = req.validatedQuery ?? req.query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter = {};

    if (query.action) {
      filter.action = query.action;
    }

    if (query.organizationId) {
      filter.organizationId = new mongoose.Types.ObjectId(query.organizationId);
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = query.startDate;
      }
      if (query.endDate) {
        filter.createdAt.$lte = query.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("actorId", "name email")
        .populate("organizationId", "name slug")
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs: logs.map(formatPlatformAuditLog),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
}
