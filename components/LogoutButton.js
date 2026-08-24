"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LogoutButton({ className = "" }) {
  const router = useRouter();
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
      className={`min-h-12 rounded-lg border border-gray-300 px-4 text-base font-medium text-gray-900 disabled:opacity-60 ${className}`}
    >
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
