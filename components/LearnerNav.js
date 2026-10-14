"use client";

import { useTranslations } from "next-intl";
import { IconHome, IconPlay } from "@/components/icons";

export default function LearnerNav({ view, onHome, onLesson, disabledLesson }) {
  const t = useTranslations("Common");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-lg grid-cols-2">
        <button
          type="button"
          onClick={onHome}
          className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            view === "home" ? "text-brand" : "text-muted"
          }`}
        >
          <IconHome className="h-[18px] w-[18px]" />
          {t("home")}
        </button>
        <button
          type="button"
          onClick={onLesson}
          disabled={disabledLesson}
          className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-medium disabled:opacity-35 ${
            view === "lesson" ? "text-brand" : "text-muted"
          }`}
        >
          <IconPlay className="h-[18px] w-[18px]" />
          {t("training")}
        </button>
      </div>
    </nav>
  );
}
