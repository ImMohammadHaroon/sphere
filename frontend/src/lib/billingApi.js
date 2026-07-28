import { apiClient } from "./apiClient";

export function getPlans() {
  return apiClient("/billing/plans", { skipAuth: true });
}

export function getSubscription() {
  return apiClient("/billing/subscription");
}

export function createSetupIntent() {
  return apiClient("/billing/setup-intent", { method: "POST" });
}

export function confirmPaymentMethod(data) {
  return apiClient("/billing/confirm-payment-method", {
    method: "POST",
    body: data,
  });
}

export function setDefaultPaymentMethod(paymentMethodId) {
  return apiClient(`/billing/payment-methods/${paymentMethodId}/default`, {
    method: "POST",
  });
}

export function removePaymentMethod(paymentMethodId) {
  return apiClient(`/billing/payment-methods/${paymentMethodId}`, {
    method: "DELETE",
  });
}

export function changePlan(data) {
  return apiClient("/billing/change-plan", {
    method: "POST",
    body: data,
  });
}

export function cancelSubscription() {
  return apiClient("/billing/cancel", { method: "POST" });
}

export function reactivateSubscription() {
  return apiClient("/billing/reactivate", { method: "POST" });
}

export function getInvoices() {
  return apiClient("/billing/invoices");
}

export function getInvoice(invoiceId) {
  return apiClient(`/billing/invoices/${invoiceId}`);
}
