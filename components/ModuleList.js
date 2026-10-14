"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getLessonStatus, isLessonComplete } from "@/lib/progress";
import { IconCheck, IconChevronDown, IconLock } from "@/components/icons";

export default function ModuleList({
  modules,
  orderedLessons,
  progress,
  selectedId,
  newLessons,
  onSelect,
}) {
  const t = useTranslations("Dashboard");
  const firstOpen = modules.find((module) =>
    module.lessons.some(
      (lesson) => getLessonStatus(lesson, orderedLessons, progress) !== "completed",
    ),
  )?.moduleId;
  const [openId, setOpenId] = useState(firstOpen ?? modules[0]?.moduleId ?? "");

  return (
    <div className="flex flex-col">
      {modules.map((module, moduleIndex) => {
        const done = module.lessons.filter((lesson) =>
          isLessonComplete(lesson, progress),
        ).length;
        const open = openId === module.moduleId;

        return (
          <section key={module.moduleId}>
            {moduleIndex > 0 ? <div className="hairline" /> : null}
            <button
              type="button"
              onClick={() => setOpenId(open ? "" : module.moduleId)}
              className="flex min-h-12 w-full items-center justify-between gap-3 py-3 text-left"
              aria-expanded={open}
            >
              <span>
                <span className="block text-[15px] font-semibold tracking-[-0.02em]">
                  {module.moduleTitle}
                </span>
                <span className="stat mt-0.5 block text-[12px] text-muted">
                  {done}/{module.lessons.length}
                </span>
              </span>
              <IconChevronDown
                className={`h-4 w-4 text-muted transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
            {open ? (
              <ul className="mb-3 flex flex-col">
                {module.lessons.map((lesson) => {
                  const status = getLessonStatus(
                    lesson,
                    orderedLessons,
                    progress,
                  );
                  const selected = lesson.id === selectedId;
                  const isNew = newLessons.some((item) => item.id === lesson.id);

                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        disabled={status === "locked"}
                        onClick={() => onSelect(lesson.id)}
                        className={`flex min-h-11 w-full items-center gap-3 py-2 text-left text-[14px] disabled:cursor-not-allowed ${
                          selected ? "text-brand" : "text-ink"
                        } ${status === "locked" ? "text-muted" : ""}`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            status === "completed"
                              ? "bg-success-soft text-success"
                              : status === "locked"
                                ? "bg-transparent text-muted"
                                : selected
                                  ? "bg-brand text-white"
                                  : "bg-brand-soft text-brand"
                          }`}
                        >
                          {status === "completed" ? (
                            <IconCheck className="h-3 w-3" />
                          ) : status === "locked" ? (
                            <IconLock className="h-3 w-3" />
                          ) : (
                            <span className="stat text-[10px]">{lesson.order}</span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium tracking-[-0.01em]">
                            {lesson.displayTitle || lesson.title}
                          </span>
                          {isNew ? (
                            <span className="text-[12px] font-medium text-warning">
                              {t("newLesson")}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
