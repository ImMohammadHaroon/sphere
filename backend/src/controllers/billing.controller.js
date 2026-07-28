import {
  listPublicPlans,
  getSubscriptionDetails,
  createBillingSetupIntent,
  confirmPaymentMethodFromSetup,
  setOrganizationDefaultPaymentMethod,
  removeOrganizationPaymentMethod,
  changeOrganizationPlan,
  cancelOrganizationSubscription,
  reactivateOrganizationSubscription,
  getOrganizationInvoices,
  getOrganizationInvoice,
} from "../services/billing.service.js";

export async function getPlans(req, res, next) {
  try {
    res.json({ plans: listPublicPlans() });
  } catch (err) {
    next(err);
  }
}

export async function getSubscription(req, res, next) {
  try {
    const data = await getSubscriptionDetails(req.user.organizationId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function createSetupIntent(req, res, next) {
  try {
    const data = await createBillingSetupIntent(req.user.organizationId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function confirmPaymentMethod(req, res, next) {
  try {
    const data = await confirmPaymentMethodFromSetup({
      organizationId: req.user.organizationId,
      setupIntentId: req.body.setupIntentId,
      setAsDefault: req.body.setAsDefault,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function setDefaultPaymentMethod(req, res, next) {
  try {
    const data = await setOrganizationDefaultPaymentMethod(
      req.user.organizationId,
      req.params.paymentMethodId
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function removePaymentMethod(req, res, next) {
  try {
    const data = await removeOrganizationPaymentMethod(
      req.user.organizationId,
      req.params.paymentMethodId
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function changePlan(req, res, next) {
  try {
    const data = await changeOrganizationPlan({
      organizationId: req.user.organizationId,
      planId: req.body.plan,
      interval: req.body.interval,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function cancelSubscription(req, res, next) {
  try {
    const data = await cancelOrganizationSubscription(req.user.organizationId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function reactivateSubscription(req, res, next) {
  try {
    const data = await reactivateOrganizationSubscription(
      req.user.organizationId
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getInvoices(req, res, next) {
  try {
    const data = await getOrganizationInvoices(req.user.organizationId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getInvoice(req, res, next) {
  try {
    const data = await getOrganizationInvoice(
      req.user.organizationId,
      req.params.invoiceId
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}
