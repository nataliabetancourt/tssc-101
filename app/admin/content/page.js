"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminRoute from "@/components/AdminRoute";
import AdminShell, {
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/admin/AdminShell";
import { loadCourse } from "@/lib/course";
import { deleteLesson, groupLessonsByModule } from "@/lib/cms";
import { getLessonYoutubeVideos } from "@/lib/youtube";

export default function AdminContentPage() {
  return (
    <AdminRoute>
      <ContentList />
    </AdminRoute>
  );
}

function ContentList() {
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  async function refresh() {
    const { course: nextCourse, lessons: nextLessons } = await loadCourse();
    setCourse(nextCourse);
    setLessons(nextLessons);
  }

  useEffect(() => {
    let cancelled = false;
    refresh()
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Could not load lessons.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(lesson) {
    const confirmed = window.confirm(
      `Delete “${lesson.title}” and all of its quiz questions? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(lesson.id);
    setError("");
    try {
      await deleteLesson(lesson.id);
      await refresh();
    } catch (err) {
      setError(err.message ?? "Could not delete this lesson.");
    } finally {
      setDeletingId("");
    }
  }

  const modules = groupLessonsByModule(lessons);

  return (
    <AdminShell
      title="Course content"
      subtitle={`${course?.title ?? "Tire Store 101"} · ${lessons.length} lessons`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          lessonCount is {course?.lessonCount ?? 0} and updates automatically
          when lessons are added or deleted.
        </p>
        <Link href="/admin/content/new" className={primaryButtonClass}>
          Add lesson
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-muted">Loading lessons…</p>
      ) : lessons.length === 0 ? (
        <p className="card px-4 py-6 text-muted">
          No lessons yet. Add the first lesson to start the course.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {modules.map((module) => (
            <section key={module.moduleId} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">
                {module.moduleOrder}. {module.moduleTitle}
              </h2>
              <ul className="flex flex-col gap-2">
                {module.lessons.map((lesson) => {
                  const videos = getLessonYoutubeVideos(lesson);
                  return (
                    <li
                      key={lesson.id}
                      className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {lesson.order}. {lesson.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {lesson.durationSeconds || 0}s ·{" "}
                          {lesson.hasQuiz === false ? "No quiz" : "Has quiz"} · EN{" "}
                          {videos.en || "—"}
                          {videos.es ? ` · ES ${videos.es}` : " · ES pending"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/content/${lesson.id}`}
                          className={secondaryButtonClass}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(lesson)}
                          disabled={deletingId === lesson.id}
                          className={secondaryButtonClass}
                        >
                          {deletingId === lesson.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
