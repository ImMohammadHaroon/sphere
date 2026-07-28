import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as billingApi from "@/lib/billingApi";
import { toast } from "@/lib/toast";

export function useBillingPlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: async () => {
      const data = await billingApi.getPlans();
      return data.plans ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: () => billingApi.getSubscription(),
  });
}

export function useCreateSetupIntent() {
  return useMutation({
    mutationFn: () => billingApi.createSetupIntent(),
  });
}

export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId) =>
      billingApi.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
      toast.success("Primary card updated");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update default card"
      );
    },
  });
}

export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId) =>
      billingApi.removePaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
      toast.success("Card removed");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove card"
      );
    },
  });
}

export function useChangePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => billingApi.changePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
      toast.success("Plan updated successfully");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update plan");
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => billingApi.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
      toast.success("Subscription will cancel at period end");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to cancel subscription");
    },
  });
}

export function useReactivateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => billingApi.reactivateSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
      toast.success("Subscription reactivated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to reactivate subscription");
    },
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: () => billingApi.getInvoices(),
  });
}
