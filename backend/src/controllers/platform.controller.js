import mongoose from "mongoose";
import { formatPublicUser } from "../utils/formatUser.js";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { PlatformSettings } from "../models/PlatformSettings.js";
import { sendMail } from "../services/email/transporter.js";
import { buildOrgApprovalEmail } from "../services/email/orgApprovalEmail.js";
import { buildOrgRejectionEmail } from "../services/email/orgRejectionEmail.js";
import { buildTasksByProject, totalTasksFromProjects } from "../services/taskOverviewStats.service.js";
import {
  buildMonthBuckets,
  summarizeDoneNotDone,
} from "../services/reportAggregation.service.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function notDeletedFilter() {
  return { deletedAt: null };
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
    isActive: org.isActive,
    timezone: org.settings?.timezone ?? "UTC",
    createdAt: org.createdAt,
  };
}

function approvedOrganizationFilter() {
  return {
    ...notDeletedFilter(),
    $or: [
      { verificationStatus: "approved" },
      { verificationStatus: { $exists: false } },
    ],
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
    isActive: org.isActive,
    createdAt: org.createdAt,
    userCount: org.userCount ?? 0,
  };
}

export async function getPlatformOverview(req, res, next) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthBuckets = buildMonthBuckets(6);
    const growthWindowStart = monthBuckets[0]?.start;

    const [
      orgStats,
      userStats,
      usersByRoleRows,
      projectStats,
      taskCountRows,
      recentOrganizations,
      orgsRegisteredInWindow,
      pendingOrganizationsCount,
    ] = await Promise.all([
      Organization.aggregate([
        { $match: approvedOrganizationFilter() },
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
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
            },
          },
        },
      ]),
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]),
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
          $group: {
            _id: { projectId: "$projectId", status: "$status" },
            count: { $sum: 1 },
          },
        },
      ]),
      organizationsWithUserCounts([
        { $match: approvedOrganizationFilter() },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
      ]),
      Organization.find({
        ...approvedOrganizationFilter(),
        createdAt: { $gte: growthWindowStart },
      })
        .select("createdAt")
        .lean(),
      Organization.countDocuments({
        verificationStatus: "pending",
        ...notDeletedFilter(),
      }),
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

    const userTotals = userStats[0] ?? { totalUsers: 0, activeUsers: 0 };

    const projectIds = [
      ...new Set(taskCountRows.map((row) => row._id.projectId)),
    ];
    const projects = projectIds.length
      ? await Project.find({ _id: { $in: projectIds } })
          .select("name columns")
          .lean()
      : [];

    const tasksByProject = buildTasksByProject(projects, taskCountRows);
    const totalTasks = totalTasksFromProjects(tasksByProject);
    const taskSummary = summarizeDoneNotDone(projects, taskCountRows);

    const usersByRole = {
      super_admin: 0,
      org_admin: 0,
      project_manager: 0,
      team_member: 0,
      client: 0,
    };
    for (const row of usersByRoleRows) {
      if (row._id in usersByRole) {
        usersByRole[row._id] = row.count;
      }
    }

    const organizationsRegisteredByMonth = monthBuckets.map((bucket) => {
      const count = orgsRegisteredInWindow.filter((org) => {
        const created = new Date(org.createdAt).getTime();
        return (
          created >= bucket.start.getTime() && created <= bucket.end.getTime()
        );
      }).length;

      return {
        monthStart: bucket.monthStart,
        monthLabel: bucket.monthLabel,
        count,
      };
    });

    res.json({
      totalOrganizations: orgTotals.totalOrganizations,
      activeOrganizations: orgTotals.activeOrganizations,
      totalUsers: userTotals.totalUsers,
      activeUsers: userTotals.activeUsers,
      totalProjects: projectTotals.totalProjects,
      activeProjects: projectTotals.activeProjects,
      totalTasks,
      tasksByProject,
      newOrganizationsLast30Days: orgTotals.newOrganizationsLast30Days,
      recentOrganizations: recentOrganizations.map(normalizeOverviewOrganization),
      // Extended analytics KPIs (additive — existing overview fields preserved)
      usersByRole,
      organizationsRegisteredByMonth,
      pendingOrganizations: pendingOrganizationsCount,
      taskCompletionRate: taskSummary.taskCompletionRate,
      tasksDone: taskSummary.tasksDone,
      tasksNotDone: taskSummary.tasksNotDone,
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
        .select("name email role createdAt avatar.mimeType avatar.updatedAt")
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
      members: members.map((member) => formatPublicUser(member)),
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
    ...formatPublicUser(user),
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

function formatPlatformSettings(doc) {
  return {
    id: doc._id.toString(),
    general: {
      platformName: doc.general?.platformName ?? "ProjectSphere",
      supportEmail: doc.general?.supportEmail ?? "",
    },
    registration: {
      allowSelfServeSignup: doc.registration?.allowSelfServeSignup ?? true,
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
    };

    settings.markModified("registration");
    await settings.save();

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

    res.json({ settings: formatPlatformSettings(settings) });
  } catch (err) {
    next(err);
  }
}
