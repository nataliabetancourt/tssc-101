"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import BrandLogo from "@/components/BrandLogo";
import LogoutButton from "@/components/LogoutButton";
import { useAuth } from "@/context/AuthContext";

export default function AppHeader({ title, action, back }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-12 w-full max-w-xl items-center justify-between gap-3 px-5">
        <div className="flex min-w-0 items-center gap-1">
          {back}
          {back ? (
            <p className="truncate text-[14px] font-medium tracking-[-0.02em] text-ink">
              {title}
            </p>
          ) : (
            <BrandLogo className="h-7 w-auto max-w-[168px]" />
          )}
        </div>
        {action ?? <HeaderActions />}
      </div>
    </header>
  );
}

function HeaderActions() {
  const { profile } = useAuth();
  const t = useTranslations("Common");

  return (
    <div className="flex shrink-0 items-center gap-3">
      {profile?.isAdmin === true ? (
        <Link href="/admin" className="btn btn-text">
          {t("admin")}
        </Link>
      ) : null}
      <LogoutButton />
    </div>
  );
}
