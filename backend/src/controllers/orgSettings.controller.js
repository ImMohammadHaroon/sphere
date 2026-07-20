import { Organization } from "../models/Organization.js";
import { deleteOrganizationById } from "../services/orgDelete.service.js";
import { slugify } from "../utils/slug.js";

const DEFAULT_PRIMARY_COLOR = "160 56% 28%";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function normalizeSettings(org) {
  const settings = org.settings ?? {};

  return {
    branding: {
      logoUrl: settings.branding?.logoUrl ?? null,
      primaryColor: settings.branding?.primaryColor ?? DEFAULT_PRIMARY_COLOR,
    },
    timezone: settings.timezone ?? "UTC",
    security: {
      passwordMinLength: settings.security?.passwordMinLength ?? 8,
      require2FA: settings.security?.require2FA ?? false,
    },
    invitePolicy: {
      defaultRole: settings.invitePolicy?.defaultRole ?? "team_member",
      inviteExpiryDays: settings.invitePolicy?.inviteExpiryDays ?? 7,
    },
  };
}

function formatOrganization(org) {
  return {
    id: org._id.toString(),
    name: org.name,
    slug: org.slug,
    isActive: org.isActive,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
    ...normalizeSettings(org),
  };
}

async function getOrgForUser(organizationId) {
  const org = await Organization.findById(organizationId);

  if (!org) {
    throw httpError("Organization not found", 404);
  }

  if (!org.settings) {
    org.settings = {};
  }

  return org;
}

async function assertSlugAvailable(slug, excludeOrgId) {
  const taken = await Organization.exists({
    slug,
    _id: { $ne: excludeOrgId },
  });

  if (taken) {
    throw httpError("This slug is already in use", 409);
  }
}

export async function getSettings(req, res, next) {
  try {
    const org = await getOrgForUser(req.user.organizationId);
    res.json({ organization: formatOrganization(org) });
  } catch (err) {
    next(err);
  }
}

export async function updateGeneralSettings(req, res, next) {
  try {
    const org = await getOrgForUser(req.user.organizationId);
    const { name, slug, branding, timezone } = req.body;
    const normalizedSlug = slugify(slug);

    if (!normalizedSlug) {
      throw httpError("Invalid slug", 400);
    }

    if (normalizedSlug !== org.slug) {
      await assertSlugAvailable(normalizedSlug, org._id);
      org.slug = normalizedSlug;
    }

    org.name = name;
    org.settings.timezone = timezone;
    org.settings.branding = {
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor,
    };

    org.markModified("settings");
    await org.save();

    res.json({ organization: formatOrganization(org) });
  } catch (err) {
    next(err);
  }
}

export async function updateSecuritySettings(req, res, next) {
  try {
    const org = await getOrgForUser(req.user.organizationId);
    const { security } = req.body;

    org.settings.security = {
      passwordMinLength: security.passwordMinLength,
      require2FA: security.require2FA,
    };

    org.markModified("settings");
    await org.save();

    res.json({ organization: formatOrganization(org) });
  } catch (err) {
    next(err);
  }
}

export async function updateInvitePolicy(req, res, next) {
  try {
    const org = await getOrgForUser(req.user.organizationId);
    const { invitePolicy } = req.body;

    org.settings.invitePolicy = {
      defaultRole: invitePolicy.defaultRole,
      inviteExpiryDays: invitePolicy.inviteExpiryDays,
    };

    org.markModified("settings");
    await org.save();

    res.json({ organization: formatOrganization(org) });
  } catch (err) {
    next(err);
  }
}

export async function deactivateOrg(req, res, next) {
  try {
    const org = await getOrgForUser(req.user.organizationId);

    if (req.body.confirmSlug !== org.slug) {
      throw httpError("Confirmation slug does not match", 400);
    }

    if (!org.isActive) {
      return res.json({
        message: "Organization is already deactivated",
        organization: formatOrganization(org),
      });
    }

    org.isActive = false;
    await org.save();

    res.json({
      message: "Organization deactivated",
      organization: formatOrganization(org),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteOrg(req, res, next) {
  try {
    const org = await getOrgForUser(req.user.organizationId);

    if (req.body.confirmSlug !== org.slug) {
      throw httpError("Confirmation slug does not match", 400);
    }

    const orgId = org._id;
    const orgSnapshot = {
      name: org.name,
      slug: org.slug,
    };

    await deleteOrganizationById(orgId);

    res.json({
      message: "Organization deleted",
      organization: {
        id: orgId.toString(),
        ...orgSnapshot,
      },
    });
  } catch (err) {
    next(err);
  }
}
