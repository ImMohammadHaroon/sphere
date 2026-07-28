import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { Invite } from "../models/Invite.js";
import { Project } from "../models/Project.js";
import {
  getPlan,
  normalizePlanId,
  normalizeBillingInterval,
} from "../config/plans.js";
import {
  assertBillingAllowsActions,
  getOrgBillingState,
} from "../utils/billingState.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export async function getOrgUsage(organizationId) {
  const [userCount, pendingInviteCount, projectCount] = await Promise.all([
    User.countDocuments({ organizationId, isActive: true }),
    Invite.countDocuments({
      organizationId,
      status: "pending",
      expiresAt: { $gt: new Date() },
    }),
    Project.countDocuments({ organizationId }),
  ]);

  return {
    users: userCount + pendingInviteCount,
    activeUsers: userCount,
    pendingInvites: pendingInviteCount,
    projects: projectCount,
  };
}

export async function assertWithinLimit(organizationId, resource) {
  const org = await Organization.findById(organizationId).select("billing");
  if (!org) {
    throw httpError("Organization not found", 404);
  }

  await assertBillingAllowsActions(org);

  const plan = getPlan(normalizePlanId(org.billing?.plan));
  const usage = await getOrgUsage(organizationId);

  if (resource === "users") {
    if (usage.users >= plan.maxUsers) {
      throw httpError(
        `${plan.name} plan allows up to ${plan.maxUsers} team members. Upgrade in Billing settings.`,
        402
      );
    }
    return;
  }

  if (resource === "projects") {
    if (usage.projects >= plan.maxProjects) {
      throw httpError(
        `${plan.name} plan allows up to ${plan.maxProjects} projects. Upgrade in Billing settings.`,
        402
      );
    }
  }
}

export async function getOrgLimitsSummary(organizationId) {
  const org = await Organization.findById(organizationId).select("billing");
  if (!org) {
    throw httpError("Organization not found", 404);
  }

  const plan = getPlan(normalizePlanId(org.billing?.plan));
  const usage = await getOrgUsage(organizationId);
  const billing = getOrgBillingState(org);

  return {
    plan: {
      id: plan.id,
      name: plan.name,
      maxUsers: plan.maxUsers,
      maxProjects: plan.maxProjects,
    },
    usage,
    billing,
  };
}

export function getPlanFromOrg(org) {
  return getPlan(normalizePlanId(org?.billing?.plan));
}

export function getIntervalFromOrg(org) {
  return normalizeBillingInterval(org?.billing?.interval);
}
