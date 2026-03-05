export type ToastType = "success" | "error" | "info";

export type AppToast = {
  message: string;
  type?: ToastType;
};

const EVENT_NAME = "price-radar-toast";

export function showToast(message: string, type: ToastType = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AppToast>(EVENT_NAME, { detail: { message, type } }));
}

export function toastEventName() {
  return EVENT_NAME;
}
