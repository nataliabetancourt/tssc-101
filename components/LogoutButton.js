"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LogoutButton({ className = "" }) {
  const router = useRouter();
  const t = useTranslations("Common");
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await signOut(auth);
      router.replace("/login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={busy}
      className={`btn btn-text shrink-0 ${className}`}
    >
      {busy ? t("loggingOut") : t("logOut")}
    </button>
  );
}
