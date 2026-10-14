"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import LogoutButton from "@/components/LogoutButton";
import BrandLogo from "@/components/BrandLogo";
import { IconGrid, IconPlay, IconUsers } from "@/components/icons";
import {
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";

export { fieldClass, primaryButtonClass, secondaryButtonClass };

export default function AdminShell({ title, subtitle, children }) {
  const tCommon = useTranslations("Common");
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard", label: tCommon("training"), icon: IconPlay },
    { href: "/admin", label: tCommon("team"), icon: IconUsers, match: (path) => path === "/admin" },
    { href: "/admin/content", label: tCommon("content"), icon: IconGrid, match: (path) => path.startsWith("/admin/content") },
  ];

  return (
    <main className="min-h-screen bg-canvas pb-[calc(5.25rem+env(safe-area-inset-bottom))] text-ink lg:pb-8">
      <header className="sticky top-0 z-30 border-b border-line bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandLogo className="h-7 w-auto max-w-[160px]" />
            <p className="truncate text-[15px] font-semibold tracking-tight">
              {tCommon("admin")}
            </p>
          </div>
          <LogoutButton />
        </div>
        <nav className="mx-auto hidden w-full max-w-6xl gap-1 px-4 pb-3 lg:flex">
          {tabs.map((tab) => {
            const active = tab.match
              ? tab.match(pathname)
              : pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold ${
                  active ? "bg-brand-soft text-brand" : "text-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6">
        <div>
            <h1 className="display text-[28px]">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {tabs.map((tab) => {
            const active = tab.match
              ? tab.match(pathname)
              : pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
