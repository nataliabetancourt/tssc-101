"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { authErrorKey } from "@/lib/authErrors";
import { ErrorBanner } from "@/components/LoadingScreen";
import AuthShell, {
  fieldClass,
  primaryButtonClass,
} from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth");
  const tErrors = useTranslations("Errors");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/login`,
      });
      setSent(true);
    } catch (err) {
      setError(tErrors(authErrorKey(err)));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight">
          {t("forgotTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("forgotHelp")}</p>
      </div>

      {sent ? (
        <p className="rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand">
          {t("resetSent", { email })}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("email")}
            <input
              className={fieldClass}
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <ErrorBanner>{error}</ErrorBanner>

          <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full`}>
            {submitting ? t("sending") : t("sendReset")}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link
          href="/login"
          className="inline-flex min-h-12 items-center font-semibold text-brand"
        >
          {t("backToLogin")}
        </Link>
      </p>
    </AuthShell>
  );
}
