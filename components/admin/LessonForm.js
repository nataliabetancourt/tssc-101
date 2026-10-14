"use client";

import { useMemo, useState } from "react";
import {
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/admin/AdminShell";
import { getLessonYoutubeVideos } from "@/lib/youtube";
import { uniqueModules } from "@/lib/cms";
import {
  fallbackLessonTitleEs,
  fallbackModuleTitleEs,
} from "@/lib/localize";

export default function LessonForm({
  lesson,
  lessons = [],
  defaultOrder = 1,
  submitLabel,
  onSubmit,
  onCancel,
  saving,
}) {
  const modules = useMemo(() => uniqueModules(lessons), [lessons]);
  const videos = getLessonYoutubeVideos(lesson);
  const [values, setValues] = useState({
    title: lesson?.title ?? "",
    titleEs: lesson?.titleEs || fallbackLessonTitleEs(lesson?.id) || "",
    order: lesson?.order ?? defaultOrder,
    moduleId: lesson?.moduleId ?? "",
    moduleTitle: lesson?.moduleTitle ?? "",
    moduleTitleEs:
      lesson?.moduleTitleEs || fallbackModuleTitleEs(lesson?.moduleId) || "",
    moduleOrder: lesson?.moduleOrder ?? 1,
    youtubeEn: videos.en,
    youtubeEs: videos.es,
    durationSeconds: lesson?.durationSeconds ?? 60,
    hasQuiz: lesson?.hasQuiz !== false,
  });
  const [error, setError] = useState("");

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function applyModule(moduleId) {
    const selected = modules.find((item) => item.moduleId === moduleId);
    if (!selected) return;
    const sample = lessons.find((item) => item.moduleId === moduleId);
    setValues((current) => ({
      ...current,
      moduleId: selected.moduleId,
      moduleTitle: selected.moduleTitle,
      moduleTitleEs:
        sample?.moduleTitleEs ||
        fallbackModuleTitleEs(selected.moduleId) ||
        "",
      moduleOrder: selected.moduleOrder,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message ?? "Could not save this lesson.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      {lesson?.id ? (
        <p className="rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">
          Lesson ID <span className="font-medium text-ink">{lesson.id}</span>{" "}
          is fixed because learner progress is keyed to it.
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Title (English)
        <input
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          className={fieldClass}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Title (Spanish)
        <input
          value={values.titleEs}
          onChange={(event) => update("titleEs", event.target.value)}
          className={fieldClass}
          placeholder="Shown to learners whose language is Español"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Lesson order
        <input
          type="number"
          min="1"
          value={values.order}
          onChange={(event) => update("order", event.target.value)}
          className={fieldClass}
          required
        />
      </label>

      {modules.length > 0 ? (
        <label className="flex flex-col gap-1 text-sm font-medium">
          Fill module from existing
          <select
            defaultValue=""
            onChange={(event) => applyModule(event.target.value)}
            className={fieldClass}
          >
            <option value="">Select a module…</option>
            {modules.map((item) => (
              <option key={item.moduleId} value={item.moduleId}>
                {item.moduleOrder}. {item.moduleTitle}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Module title (English)
        <input
          value={values.moduleTitle}
          onChange={(event) => update("moduleTitle", event.target.value)}
          className={fieldClass}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Module title (Spanish)
        <input
          value={values.moduleTitleEs}
          onChange={(event) => update("moduleTitleEs", event.target.value)}
          className={fieldClass}
          placeholder="Optional"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Module ID
        <input
          value={values.moduleId}
          onChange={(event) => update("moduleId", event.target.value)}
          className={fieldClass}
          placeholder="Auto from title if left blank"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Module order
        <input
          type="number"
          min="1"
          value={values.moduleOrder}
          onChange={(event) => update("moduleOrder", event.target.value)}
          className={fieldClass}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        English YouTube ID or URL
        <input
          value={values.youtubeEn}
          onChange={(event) => update("youtubeEn", event.target.value)}
          className={fieldClass}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Spanish YouTube ID or URL
        <input
          value={values.youtubeEs}
          onChange={(event) => update("youtubeEs", event.target.value)}
          className={fieldClass}
          placeholder="Optional — leave blank until the Spanish video is ready"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Duration (seconds)
        <input
          type="number"
          min="1"
          value={values.durationSeconds}
          onChange={(event) => update("durationSeconds", event.target.value)}
          className={fieldClass}
          required
        />
        <span className="font-normal text-gray-600">
          Approximate length is fine. Watch progress uses the real YouTube
          duration.
        </span>
      </label>

      <label className="flex min-h-12 items-center gap-3 text-base font-medium">
        <input
          type="checkbox"
          checked={values.hasQuiz}
          onChange={(event) => update("hasQuiz", event.target.checked)}
          className="h-4 w-4"
        />
        This lesson has a quiz
      </label>

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className={secondaryButtonClass}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
