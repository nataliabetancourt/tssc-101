"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { authErrorKey } from "@/lib/authErrors";
import LoadingScreen, { ErrorBanner } from "@/components/LoadingScreen";
import AuthShell, {
  fieldClass,
  primaryButtonClass,
} from "@/components/AuthShell";

function ResetPasswordForm() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const tErrors = useTranslations("Errors");
  const tCommon = useTranslations("Common");
  const searchParams = useSearchParams();
  const oobCode = useMemo(
    () => searchParams.get("oobCode") ?? "",
    [searchParams],
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(t("passwordsMismatch"));
      return;
    }

    if (!oobCode) {
      setError(t("missingResetCode"));
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      router.replace("/login");
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
          {t("resetTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("resetHelp")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("newPassword")}
          <input
            className={fieldClass}
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("confirmPassword")}
          <input
            className={fieldClass}
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            minLength={6}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
          />
        </label>

        <ErrorBanner>{error}</ErrorBanner>

        <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full`}>
          {submitting ? tCommon("saving") : t("savePassword")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link
          href="/forgot-password"
          className="inline-flex min-h-12 items-center font-semibold text-brand"
        >
          {t("requestNewLink")}
        </Link>
      </p>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
