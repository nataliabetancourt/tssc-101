"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { authErrorKey } from "@/lib/authErrors";
import { ErrorBanner } from "@/components/LoadingScreen";
import AuthShell, {
  fieldClass,
  primaryButtonClass,
} from "@/components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const tErrors = useTranslations("Errors");
  const tCommon = useTranslations("Common");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(tErrors(authErrorKey(err)));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-6">
        <h1 className="display">{t("logInTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{tCommon("tagline")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
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

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("password")}
          <input
            className={fieldClass}
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <Link
          href="/forgot-password"
          className="inline-flex min-h-8 items-center text-sm font-medium text-brand"
        >
          {t("forgotPassword")}
        </Link>

        <ErrorBanner>{error}</ErrorBanner>

        <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full`}>
          {submitting ? t("loggingIn") : t("logInAction")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t("needAccount")}{" "}
        <Link href="/signup" className="font-semibold text-brand">
          {t("signUpAction")}
        </Link>
      </p>
    </AuthShell>
  );
}
