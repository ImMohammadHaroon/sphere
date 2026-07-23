import { toast } from "@/lib/toast";

function resolveMessage(value, ...args) {
  return typeof value === "function" ? value(...args) : value;
}

export function withMutationToasts(options, { success, error } = {}) {
  const { onSuccess, onError, ...rest } = options;

  return {
    ...rest,
    onSuccess: (...args) => {
      onSuccess?.(...args);
      if (success) {
        toast.success(resolveMessage(success, ...args));
      }
    },
    onError: (err, ...args) => {
      onError?.(err, ...args);
      if (error !== false) {
        const message = resolveMessage(error, err, ...args);
        toast.error(
          message ??
            (err instanceof Error ? err.message : "Something went wrong")
        );
      }
    },
  };
}
