import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import { DEFAULT_BOARD_COLUMNS } from "../../services/kanbanTemplate.service.js";

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function api(baseUrl, path, { method = "GET", token } = {}) {
  const headers = {};
  if (token) {
    Object.assign(headers, authHeader(token));
  }

  const response = await fetch(`${baseUrl}${path}`, { method, headers });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

describe("platformReport.controller", () => {
  /** @type {MongoMemoryServer} */
  let mongod;
  /** @type {import("http").Server} */
  let server;
  let baseUrl;
  let superAdminToken;
  let orgAdminToken;
  let orgAId;
  let orgBId;
  let projectAId;
  let projectBId;
  let assigneeId;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();
    process.env.JWT_SECRET ??= "test-jwt-secret";
    process.env.JWT_REFRESH_SECRET ??= "test-jwt-refresh-secret";
    process.env.ENCRYPTION_KEY ??= "0123456789abcdef0123456789abcdef";
    process.env.FILE_ENCRYPTION_KEY ??= Buffer.alloc(32).toString("base64");
    process.env.NODE_ENV ??= "test";

    const mongoose = (await import("mongoose")).default;
    await mongoose.connect(process.env.MONGO_URI);

    const { Organization } = await import("../../models/Organization.js");
    const { User } = await import("../../models/User.js");
    const { Project } = await import("../../models/Project.js");
    const { Task } = await import("../../models/Task.js");
    const { hashPassword } = await import("../../services/password.service.js");
    const { signAccessToken } = await import("../../services/token.service.js");
    const { default: app } = await import("../../app.js");

    const passwordHash = await hashPassword("password123");

    const superAdmin = await User.create({
      name: "Platform Super Admin",
      email: "super@test.com",
      passwordHash,
      role: "super_admin",
    });

    const orgA = await Organization.create({
      name: "Acme Corp",
      slug: "acme-corp",
    });
    const orgB = await Organization.create({
      name: "Beta LLC",
      slug: "beta-llc",
    });
    orgAId = orgA._id.toString();
    orgBId = orgB._id.toString();

    const orgAdmin = await User.create({
      organizationId: orgA._id,
      name: "Org Admin",
      email: "admin@acme.com",
      passwordHash,
      role: "org_admin",
    });

    assigneeId = (
      await User.create({
        organizationId: orgB._id,
        name: "Beta Assignee",
        email: "assignee@beta.com",
        passwordHash,
        role: "team_member",
      })
    )._id;

    const projectA = await Project.create({
      organizationId: orgA._id,
      name: "Alpha Launch",
      ownerId: orgAdmin._id,
      members: [orgAdmin._id],
      columns: DEFAULT_BOARD_COLUMNS,
    });
    const projectB = await Project.create({
      organizationId: orgB._id,
      name: "Beta Rollout",
      ownerId: assigneeId,
      members: [assigneeId],
      columns: DEFAULT_BOARD_COLUMNS,
    });
    projectAId = projectA._id.toString();
    projectBId = projectB._id.toString();

    await Task.create([
      {
        organizationId: orgA._id,
        projectId: projectA._id,
        title: "Alpha task 1",
        status: "todo",
      },
      {
        organizationId: orgA._id,
        projectId: projectA._id,
        title: "Alpha task 2",
        status: "done",
      },
      {
        organizationId: orgB._id,
        projectId: projectB._id,
        title: "Beta task 1",
        status: "done",
        assigneeId,
      },
      {
        organizationId: orgB._id,
        projectId: projectB._id,
        title: "Beta task 2",
        status: "in-progress",
        assigneeId,
      },
    ]);

    superAdminToken = signAccessToken({
      userId: superAdmin._id.toString(),
      role: "super_admin",
    });
    orgAdminToken = signAccessToken({
      userId: orgAdmin._id.toString(),
      role: "org_admin",
      organizationId: orgAId,
    });

    server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });

    const mongoose = (await import("mongoose")).default;
    await mongoose.disconnect();
    await mongod.stop();
    globalThis.__mongoose = { conn: null, promise: null };
  });

  it("returns 403 for non-super-admin on platform project routes", async () => {
    const list = await api(baseUrl, "/platform/projects", {
      token: orgAdminToken,
    });
    assert.equal(list.status, 403);

    const burndown = await api(
      baseUrl,
      `/platform/projects/${projectBId}/reports/burndown`,
      { token: orgAdminToken }
    );
    assert.equal(burndown.status, 403);
  });

  it("returns burndown, velocity, and workload for a project in any organization", async () => {
    const burndown = await api(
      baseUrl,
      `/platform/projects/${projectBId}/reports/burndown`,
      { token: superAdminToken }
    );
    assert.equal(burndown.status, 200);
    assert.ok(Array.isArray(burndown.body.series));
    assert.equal(burndown.body.totalScope, 2);

    const velocity = await api(
      baseUrl,
      `/platform/projects/${projectBId}/reports/velocity`,
      { token: superAdminToken }
    );
    assert.equal(velocity.status, 200);
    assert.equal(velocity.body.series.length, 8);
    assert.ok(
      velocity.body.series.some((week) => (week.tasksCompleted ?? 0) > 0)
    );

    const workload = await api(
      baseUrl,
      `/platform/projects/${projectBId}/reports/workload`,
      { token: superAdminToken }
    );
    assert.equal(workload.status, 200);
    assert.ok(Array.isArray(workload.body.workload));
    assert.equal(workload.body.workload.length, 1);
    assert.equal(workload.body.workload[0].assigneeName, "Beta Assignee");
    assert.equal(workload.body.workload[0].totalAssigned, 2);
  });

  it("lists platform projects with organizationName via lookup", async () => {
    const response = await api(baseUrl, "/platform/projects", {
      token: superAdminToken,
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.total, 2);

    const betaProject = response.body.projects.find(
      (project) => project._id === projectBId
    );
    assert.ok(betaProject);
    assert.equal(betaProject.name, "Beta Rollout");
    assert.equal(betaProject.organizationId, orgBId);
    assert.equal(betaProject.organizationName, "Beta LLC");
    assert.equal(betaProject.taskCount, 2);
  });

  it("supports search and pagination on /platform/projects", async () => {
    const search = await api(baseUrl, "/platform/projects?search=alpha", {
      token: superAdminToken,
    });
    assert.equal(search.status, 200);
    assert.equal(search.body.total, 1);
    assert.equal(search.body.projects[0].name, "Alpha Launch");
    assert.equal(search.body.projects[0].organizationName, "Acme Corp");

    const orgFilter = await api(
      baseUrl,
      `/platform/projects?organizationId=${orgBId}`,
      { token: superAdminToken }
    );
    assert.equal(orgFilter.status, 200);
    assert.equal(orgFilter.body.total, 1);
    assert.equal(orgFilter.body.projects[0]._id, projectBId);

    const pageOne = await api(baseUrl, "/platform/projects?limit=1&page=1", {
      token: superAdminToken,
    });
    assert.equal(pageOne.status, 200);
    assert.equal(pageOne.body.projects.length, 1);
    assert.equal(pageOne.body.total, 2);
    assert.equal(pageOne.body.totalPages, 2);

    const pageTwo = await api(baseUrl, "/platform/projects?limit=1&page=2", {
      token: superAdminToken,
    });
    assert.equal(pageTwo.status, 200);
    assert.equal(pageTwo.body.projects.length, 1);
    assert.notEqual(
      pageOne.body.projects[0]._id,
      pageTwo.body.projects[0]._id
    );
  });
});
