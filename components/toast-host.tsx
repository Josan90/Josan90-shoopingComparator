"use client";

import { useEffect, useMemo, useState } from "react";
import { AppToast, toastEventName } from "@/lib/toast";

type ToastItem = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const eventName = useMemo(() => toastEventName(), []);

  useEffect(() => {
    let seq = 1;

    const onToast = (event: Event) => {
      const custom = event as CustomEvent<AppToast>;
      const detail = custom.detail;
      if (!detail?.message) return;

      const id = seq++;
      const type = detail.type || "info";

      setItems((prev) => [...prev, { id, message: detail.message, type }]);

      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, 2800);
    };

    window.addEventListener(eventName, onToast);
    return () => {
      window.removeEventListener(eventName, onToast);
    };
  }, [eventName]);

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {items.map((item) => (
        <div className={`toast ${item.type}`} key={item.id} role="status">
          {item.message}
        </div>
      ))}
    </div>
  );
}
