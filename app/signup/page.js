"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { authErrorKey } from "@/lib/authErrors";
import { LOCATIONS } from "@/lib/locations";
import { ErrorBanner } from "@/components/LoadingScreen";
import AuthShell, {
  fieldClass,
  primaryButtonClass,
} from "@/components/AuthShell";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

const MESSAGES = { en, es };

export default function SignupPage() {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <NextIntlClientProvider
      locale={language}
      messages={MESSAGES[language]}
      timeZone="America/Chicago"
    >
      <SignupForm language={language} onLanguageChange={setLanguage} />
    </NextIntlClientProvider>
  );
}

function SignupForm({ language, onLanguageChange }) {
  const router = useRouter();
  const t = useTranslations("Auth");
  const tErrors = useTranslations("Errors");
  const tCommon = useTranslations("Common");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        location,
        language,
        isAdmin: false,
        createdAt: serverTimestamp(),
      });
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
        <h1 className="display">{t("signUpTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{tCommon("tagline")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("name")}
            <input
              className={fieldClass}
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

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

          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("password")}
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
            {t("location")}
            <select
              className={fieldClass}
              name="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              required
            >
              <option value="">{t("selectStore")}</option>
              {LOCATIONS.map((store) => (
                <option key={store.slug} value={store.slug}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("language")}
            <select
              className={fieldClass}
              name="language"
              value={language}
              onChange={(event) => onLanguageChange(event.target.value)}
              required
            >
              <option value="en">{t("english")}</option>
              <option value="es">{t("spanish")}</option>
            </select>
          </label>

          <ErrorBanner>{error}</ErrorBanner>

          <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full`}>
            {submitting ? t("creatingAccount") : t("signUpAction")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-brand">
            {t("logInAction")}
          </Link>
        </p>
    </AuthShell>
  );
}
