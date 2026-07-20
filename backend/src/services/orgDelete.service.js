import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { Invite } from "../models/Invite.js";
import { InviteToken } from "../models/InviteToken.js";
import { RefreshToken } from "../models/RefreshToken.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export async function deleteOrganizationById(organizationId) {
  const org = await Organization.findById(organizationId);

  if (!org) {
    throw httpError("Organization not found", 404);
  }

  const users = await User.find({ organizationId }).select("_id");
  const userIds = users.map((user) => user._id);

  await Promise.all([
    Task.deleteMany({ organizationId }),
    Project.deleteMany({ organizationId }),
    Invite.deleteMany({ organizationId }),
    InviteToken.deleteMany({ organizationId }),
    userIds.length > 0
      ? RefreshToken.deleteMany({ userId: { $in: userIds } })
      : Promise.resolve(),
    userIds.length > 0
      ? User.deleteMany({ organizationId })
      : Promise.resolve(),
  ]);

  await org.deleteOne();

  return {
    id: organizationId.toString(),
    name: org.name,
    slug: org.slug,
  };
}
