import { z } from "zod";

const planIdSchema = z.enum(["starter", "professional", "business"]);
const intervalSchema = z.enum(["month", "year"]);

export const changePlanSchema = z.object({
  body: z.object({
    plan: planIdSchema,
    interval: intervalSchema.optional(),
  }),
});

export const confirmPaymentMethodSchema = z.object({
  body: z.object({
    setupIntentId: z.string().min(1),
    setAsDefault: z.boolean().optional(),
  }),
});

export const paymentMethodIdParamSchema = z.object({
  params: z.object({
    paymentMethodId: z.string().min(1),
  }),
});

export const registerPlanFieldsSchema = z.object({
  plan: planIdSchema.optional(),
  interval: intervalSchema.optional(),
});
