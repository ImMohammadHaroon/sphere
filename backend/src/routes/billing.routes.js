import { Router } from "express";
import * as billingController from "../controllers/billing.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { tenantScope } from "../middleware/tenantScope.js";
import { validate } from "../middleware/validate.middleware.js";
import { changePlanSchema, confirmPaymentMethodSchema, paymentMethodIdParamSchema } from "../validators/billing.validator.js";

const router = Router();

router.get("/plans", billingController.getPlans);

router.get(
  "/subscription",
  authenticate,
  tenantScope,
  requireRole(["org_admin"]),
  billingController.getSubscription
);

router.post(
  "/setup-intent",
  authenticate,
  tenantScope,
  requireRole(["org_admin"]),
  billingController.createSetupIntent
);

router.post(
  "/confirm-payment-method",
  authenticate,
  tenantScope,
  requireRole(["org_admin"]),
  validate(confirmPaymentMethodSchema),
  billingController.confirmPaymentMethod
);

router.post(
  "/payment-methods/:paymentMethodId/default",
  authenticate,
  tenantScope,
  requireRole(["org_admin"]),
  validate(paymentMethodIdParamSchema),
  billingController.setDefaultPaymentMethod
);

router.delete(
  "/payment-methods/:paymentMethodId",
  authenticate,
  tenantScope,
  requireRole(["org_admin"]),
  validate(paymentMethodIdParamSchema),
  billingController.removePaymentMethod
);

router.post(
  "/change-plan",
  authenticate,
  tenantScope,
  requireRole(["org_admin"]),
  validate(changePlanSchema),
  billingController.changePlan
);

router.post(
  "/cancel",
  authenticate,
  tenantScope,
  requireRole(["org_admin"]),
  billingController.cancelSubscription
);

router.post(
  "/reactivate",
  authenticate,
  tenantScope,
  requireRole(["org_admin"]),
  billingController.reactivateSubscription
);

router.get(
  "/invoices",
  authenticate,
  tenantScope,
  requireRole(["org_admin"]),
  billingController.getInvoices
);

router.get(
  "/invoices/:invoiceId",
  authenticate,
  tenantScope,
  requireRole(["org_admin"]),
  billingController.getInvoice
);

export default router;
