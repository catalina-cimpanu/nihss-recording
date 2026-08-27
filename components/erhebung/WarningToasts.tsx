"use client";

export const WARNING_TOAST_MS = 5000;

export type WarningToast = {
  id: number;
  message: string;
};

type WarningToastsProps = {
  toasts: WarningToast[];
};

export default function WarningToasts({ toasts }: WarningToastsProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1 border-b border-tempis-orange/30 bg-surface px-2 py-1.5 md:px-3">
      <div className="mx-auto max-w-4xl space-y-1.5">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="overflow-hidden rounded-lg border border-tempis-orange/40 bg-surface"
          >
            <p className="px-3 py-2 text-sm">{toast.message}</p>
            <div
              className="h-0.5 origin-left bg-tempis-orange"
              style={{ animation: `toast-timer ${WARNING_TOAST_MS}ms linear forwards` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
