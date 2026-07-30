import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const createMilestoneSchema = z.object({
  params: z.object({
    projectId: objectId,
  }),
  body: z
    .object({
      name: z.string().trim().min(1).max(300),
      description: z.string().trim().max(10000).optional(),
      dueDate: z.coerce.date(),
    })
    .strict(),
});

export const updateMilestoneSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      name: z.string().trim().min(1).max(300).optional(),
      description: z.string().trim().max(10000).optional(),
      dueDate: z.coerce.date().optional(),
    })
    .strict()
    .refine(
      (body) =>
        body.name !== undefined ||
        body.description !== undefined ||
        body.dueDate !== undefined,
      { message: "At least one field is required" }
    ),
});

export const approveMilestoneSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      decision: z.enum(["approved", "rejected"]),
      rejectReason: z.string().trim().max(2000).optional(),
    })
    .strict()
    .superRefine((body, ctx) => {
      if (body.decision === "rejected" && !body.rejectReason?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Reject reason is required",
          path: ["rejectReason"],
        });
      }
    }),
});

export const submitMilestoneFeedbackSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      feedback: z.string().trim().min(1).max(2000),
    })
    .strict(),
});

export const replyMilestoneFeedbackSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      message: z.string().trim().min(1).max(2000),
    })
    .strict(),
});

export const listMilestonesParamSchema = z.object({
  params: z.object({
    projectId: objectId,
  }),
});

export const milestoneIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});
