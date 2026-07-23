import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { registerToastHandler } from "@/lib/toast";

const ToastContext = createContext(null);

export function ToastProvider({ children, durationMs = 3000 }) {
  const [toast, setToast] = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const showToast = useCallback((message, variant = "success") => {
    setToast({ message, variant });
  }, []);

  useEffect(() => {
    registerToastHandler(showToast);
    return () => registerToastHandler(null);
  }, [showToast]);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(() => setToast(null), durationMs);
    return () => clearTimeout(timer);
  }, [toast, durationMs]);

  return (
    <ToastContext.Provider value={{ toast, showToast, dismissToast }}>
      {children}
      <Toast toast={toast} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  return useContext(ToastContext);
}
