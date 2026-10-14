"use client";

import { useTranslations } from "next-intl";
import { getLessonStatus } from "@/lib/progress";
import StatusChip from "@/components/StatusChip";

export default function LessonOutline({
  open,
  modules,
  orderedLessons,
  progress,
  selectedId,
  newLessons,
  onSelect,
  onClose,
  statusLabel,
}) {
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="sheet-backdrop absolute inset-0 bg-ink/30"
        aria-label={tCommon("close")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-outline-title"
        className="sheet-panel relative z-10 flex max-h-[85vh] w-full max-w-md flex-col rounded-t-[28px] bg-surface sm:rounded-[24px]"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line sm:hidden" />
        <div className="flex items-center justify-between px-5 pb-3 pt-3">
          <h2 id="lesson-outline-title" className="text-lg font-semibold tracking-tight">
            {t("lessons")}
          </h2>
          <button type="button" onClick={onClose} className="btn btn-ghost min-h-11 px-3 text-sm">
            {tCommon("close")}
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-6 pb-2">
            {modules.map((module) => (
              <div key={module.moduleId} className="flex flex-col gap-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {module.moduleTitle}
                </h3>
                {module.lessons.map((lesson) => {
                  const status = getLessonStatus(
                    lesson,
                    orderedLessons,
                    progress,
                  );
                  const selected = lesson.id === selectedId;
                  const isNew = newLessons.some((item) => item.id === lesson.id);
                  const watched =
                    progress?.lessons?.[lesson.id]?.watchedPercent ?? 0;

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      disabled={status === "locked"}
                      onClick={() => {
                        onSelect(lesson.id);
                        onClose();
                      }}
                      className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-left text-[15px] ${
                        selected
                          ? "border-brand bg-brand-soft"
                          : "border-line bg-surface"
                      } disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      <span className="min-w-0">
                        <span className="font-medium">
                          {lesson.order}. {lesson.displayTitle || lesson.title}
                        </span>
                        {isNew ? (
                          <span className="mt-0.5 block text-sm font-medium text-warning">
                            {t("newLesson")}
                          </span>
                        ) : status !== "locked" && status !== "completed" ? (
                          <span className="mt-0.5 block text-sm text-muted">
                            {status === "quiz"
                              ? t("quizReady")
                              : t("watchedPercent", {
                                  percent: Math.round(watched),
                                })}
                          </span>
                        ) : null}
                      </span>
                      <StatusChip status={status} label={statusLabel(status)} />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
