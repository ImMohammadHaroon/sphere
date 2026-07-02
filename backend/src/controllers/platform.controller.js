import mongoose from "mongoose";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";

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

function normalizeOrganization(org) {
  return {
    _id: org._id.toString(),
    name: org.name,
    plan: org.plan,
    isActive: org.isActive,
    createdAt: org.createdAt,
    userCount: org.userCount ?? 0,
  };
}

async function organizationsWithUserCounts(pipeline = []) {
  return Organization.aggregate([
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
        plan: 1,
        isActive: 1,
        createdAt: 1,
        userCount: 1,
      },
    },
  ]);
}

export async function getPlatformOverview(req, res, next) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [orgStats, userStats, projectStats, taskStats, recentOrganizations] =
      await Promise.all([
        Organization.aggregate([
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
              byStatus: [
                { $group: { _id: "$status", count: { $sum: 1 } } },
              ],
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
      recentOrganizations: recentOrganizations.map(normalizeOrganization),
    });
  } catch (err) {
    next(err);
  }
}

export async function listOrganizations(req, res, next) {
  try {
    const organizations = await organizationsWithUserCounts([
      { $sort: { createdAt: -1 } },
    ]);

    res.json({
      organizations: organizations.map(normalizeOrganization),
    });
  } catch (err) {
    next(err);
  }
}

export async function getOrganization(req, res, next) {
  try {
    const organizations = await organizationsWithUserCounts([
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
      { $limit: 1 },
    ]);

    if (!organizations.length) {
      const err = new Error("Not found");
      err.status = 404;
      throw err;
    }

    res.json({ organization: normalizeOrganization(organizations[0]) });
  } catch (err) {
    next(err);
  }
}
