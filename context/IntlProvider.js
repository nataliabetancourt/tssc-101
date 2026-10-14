"use client";

import { useEffect } from "react";
import { NextIntlClientProvider } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

const MESSAGES = { en, es };

export default function AppIntlProvider({ children }) {
  const { profile } = useAuth();
  const locale = profile?.language === "es" ? "es" : "en";

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone="America/Chicago"
    >
      {children}
    </NextIntlClientProvider>
  );
}
