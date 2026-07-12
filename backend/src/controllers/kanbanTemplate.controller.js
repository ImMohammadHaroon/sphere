import { KanbanTemplate } from "../models/KanbanTemplate.js";
import { Project } from "../models/Project.js";
import {
  createKanbanTemplate,
  normalizeColumns,
} from "../services/kanbanTemplate.service.js";

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function formatTemplate(template) {
  return {
    ...template,
    _id: template._id.toString(),
    organizationId: template.organizationId?.toString(),
    createdBy: template.createdBy?.toString?.() ?? template.createdBy,
  };
}

export async function listTemplates(req, res, next) {
  try {
    const templates = await req
      .scopedQuery(KanbanTemplate)
      .sort({ name: 1 })
      .lean();

    res.json({ templates: templates.map(formatTemplate) });
  } catch (err) {
    next(err);
  }
}

export async function getTemplate(req, res, next) {
  try {
    const template = await req
      .scopedFindOne(KanbanTemplate, { _id: req.params.id })
      .lean();

    if (!template) {
      throw notFound();
    }

    res.json({ template: formatTemplate(template) });
  } catch (err) {
    next(err);
  }
}

export async function createTemplate(req, res, next) {
  try {
    const template = await createKanbanTemplate({
      organizationId: req.user.organizationId,
      createdBy: req.user.userId,
      name: req.body.name,
      columns: req.body.columns,
    });

    res.status(201).json({ template: formatTemplate(template.toObject()) });
  } catch (err) {
    next(err);
  }
}

export async function updateTemplate(req, res, next) {
  try {
    const template = await req.scopedFindOne(KanbanTemplate, {
      _id: req.params.id,
    });

    if (!template) {
      throw notFound();
    }

    // Editing a template does NOT retroactively change any project's columns snapshot.
    const normalized = normalizeColumns(req.body.columns);
    template.name = req.body.name.trim();
    template.columns = normalized;
    await template.save();

    res.json({ template: formatTemplate(template.toObject()) });
  } catch (err) {
    next(err);
  }
}

export async function deleteTemplate(req, res, next) {
  try {
    const template = await req.scopedFindOne(KanbanTemplate, {
      _id: req.params.id,
    });

    if (!template) {
      throw notFound();
    }

    const projectCount = await req
      .scopedQuery(Project, { kanbanTemplateId: template._id })
      .countDocuments();

    if (projectCount > 0) {
      const err = new Error(
        `This template is used by ${projectCount} project(s) and cannot be deleted`
      );
      err.status = 409;
      throw err;
    }

    await req.scopedFindOneAndDelete(KanbanTemplate, { _id: req.params.id });

    res.json({ message: "Template deleted" });
  } catch (err) {
    next(err);
  }
}
