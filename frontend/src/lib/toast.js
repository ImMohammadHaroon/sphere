let toastHandler = null;

export function registerToastHandler(handler) {
  toastHandler = handler;
}

export function toast(message, variant = "success") {
  toastHandler?.(message, variant);
}

toast.success = (message) => toast(message, "success");
toast.error = (message) => toast(message, "error");
