import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { Organization } from "../models/Organization.js";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { KanbanTemplate } from "../models/KanbanTemplate.js";
import {
  createKanbanTemplate,
  DEFAULT_BOARD_COLUMNS,
  copyColumns,
} from "../services/kanbanTemplate.service.js";

dotenv.config();

const DEFAULT_TEMPLATE_NAME = "Default Board";

async function findCreatedByForOrg(organizationId) {
  const orgAdmin = await User.findOne({
    organizationId,
    role: "org_admin",
    isActive: true,
  })
    .sort({ createdAt: 1 })
    .select("_id")
    .lean();

  if (orgAdmin) {
    return orgAdmin._id;
  }

  const anyUser = await User.findOne({
    organizationId,
    isActive: true,
  })
    .sort({ createdAt: 1 })
    .select("_id")
    .lean();

  return anyUser?._id ?? null;
}

async function migrateDefaultKanbanTemplates() {
  await connectDB();

  const organizations = await Organization.find({}).select("_id name").lean();

  let templatesCreated = 0;
  let projectsUpdated = 0;
  let orgsSkipped = 0;

  for (const org of organizations) {
    let template = await KanbanTemplate.findOne({
      organizationId: org._id,
      name: DEFAULT_TEMPLATE_NAME,
    });

    if (!template) {
      const createdBy = await findCreatedByForOrg(org._id);

      if (!createdBy) {
        console.warn(
          `[migrate] Skipping org "${org.name}" (${org._id}): no users found`
        );
        orgsSkipped += 1;
        continue;
      }

      template = await createKanbanTemplate({
        organizationId: org._id,
        createdBy,
        name: DEFAULT_TEMPLATE_NAME,
        columns: DEFAULT_BOARD_COLUMNS.map(({ name, color, isDone }) => ({
          name,
          color,
          isDone,
        })),
      });

      templatesCreated += 1;
      console.log(
        `[migrate] Created "${DEFAULT_TEMPLATE_NAME}" for org "${org.name}"`
      );
    }

    const projectsWithoutColumns = await Project.find({
      organizationId: org._id,
      $or: [{ columns: { $exists: false } }, { columns: { $size: 0 } }],
    }).select("_id name");

    for (const project of projectsWithoutColumns) {
      project.kanbanTemplateId = template._id;
      project.columns = copyColumns(template.columns);
      await project.save();
      projectsUpdated += 1;
    }
  }

  console.log("\n[migrate] Summary:");
  console.log(`  Organizations processed: ${organizations.length}`);
  console.log(`  Organizations skipped (no users): ${orgsSkipped}`);
  console.log(`  Default templates created: ${templatesCreated}`);
  console.log(`  Projects updated with columns: ${projectsUpdated}`);

  await Organization.db.close();
  process.exit(0);
}

migrateDefaultKanbanTemplates().catch((err) => {
  console.error("[migrate] Failed:", err.message);
  process.exit(1);
});
