import "../setupEnv.js";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Organization } from "../../src/models/Organization.js";
import { User } from "../../src/models/User.js";
import { Project } from "../../src/models/Project.js";
import { Invite } from "../../src/models/Invite.js";
import { assertWithinLimit } from "../../src/services/planLimits.service.js";

describe("planLimits.service assertWithinLimit", () => {
  /** @type {MongoMemoryServer} */
  let mongod;
  let organizationId;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const org = await Organization.create({
      name: "Limit Test Org",
      slug: "limit-test-org",
      billing: {
        plan: "starter",
        interval: "month",
        status: "active",
      },
    });
    organizationId = org._id;

    await User.create({
      organizationId,
      name: "Admin",
      email: "admin@limit-test.example",
      passwordHash: "hash",
      role: "org_admin",
    });

    for (let i = 0; i < 5; i += 1) {
      await Project.create({
        organizationId,
        ownerId: new mongoose.Types.ObjectId(),
        members: [],
        name: `Project ${i + 1}`,
        columns: [],
      });
    }
  });

  after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("blocks creating projects when starter plan project limit is reached", async () => {
    await assert.rejects(
      () => assertWithinLimit(organizationId, "projects"),
      (err) => {
        assert.equal(err.status, 402);
        assert.match(err.message, /5 projects/i);
        return true;
      }
    );
  });

  it("blocks invites when starter plan user limit is reached", async () => {
    for (let i = 0; i < 4; i += 1) {
      await User.create({
        organizationId,
        name: `Member ${i}`,
        email: `member${i}@limit-test.example`,
        passwordHash: "hash",
        role: "team_member",
      });
    }

    await assert.rejects(
      () => assertWithinLimit(organizationId, "users"),
      (err) => {
        assert.equal(err.status, 402);
        assert.match(err.message, /team members/i);
        return true;
      }
    );
  });

  it("counts pending invites toward user limits", async () => {
    const otherOrg = await Organization.create({
      name: "Invite Limit Org",
      slug: "invite-limit-org",
      billing: {
        plan: "starter",
        interval: "month",
        status: "active",
      },
    });

    await User.create({
      organizationId: otherOrg._id,
      name: "Owner",
      email: "owner@invite-limit.example",
      passwordHash: "hash",
      role: "org_admin",
    });

    for (let i = 0; i < 4; i += 1) {
      await User.create({
        organizationId: otherOrg._id,
        name: `User ${i}`,
        email: `user${i}@invite-limit.example`,
        passwordHash: "hash",
        role: "team_member",
      });
    }

    await Invite.create({
      organizationId: otherOrg._id,
      email: "pending@invite-limit.example",
      role: "team_member",
      token: "token",
      invitedBy: new mongoose.Types.ObjectId(),
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await assert.rejects(
      () => assertWithinLimit(otherOrg._id, "users"),
      (err) => err.status === 402
    );
  });
});
