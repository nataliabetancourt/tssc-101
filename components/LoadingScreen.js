"use client";

import { useTranslations } from "next-intl";

export function Spinner({ className = "h-7 w-7" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-brand-soft border-t-brand ${className}`}
      aria-hidden
    />
  );
}

export default function LoadingScreen({ label }) {
  const t = useTranslations("Common");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas px-6 text-muted">
      <Spinner />
      <p className="text-sm">{label ?? t("loading")}</p>
    </main>
  );
}

export function InlineLoader({ label }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <Spinner className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBanner({ children }) {
  if (!children) return null;
  return (
    <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
      {children}
    </p>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="py-6">
      <p className="font-semibold text-ink">{title}</p>
      {body ? <p className="mt-1 text-sm text-muted">{body}</p> : null}
    </div>
  );
}

export function Skeleton({ className = "h-4" }) {
  return <div className={`animate-pulse rounded-lg bg-line ${className}`} />;
}
