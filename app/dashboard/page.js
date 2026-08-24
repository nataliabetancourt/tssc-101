"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import LogoutButton from "@/components/LogoutButton";
import YouTubePlayer from "@/components/YouTubePlayer";
import { useAuth } from "@/context/AuthContext";
import { loadCourse, loadProgress, saveLessonProgress } from "@/lib/course";
import {
  COURSE_ID,
  countWatchCompleted,
  getLessonStatus,
} from "@/lib/progress";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <CourseHome />
    </ProtectedRoute>
  );
}

function CourseHome() {
  const { user, profile } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const lastSaveRef = useRef(0);
  const progressRef = useRef(progress);
  const latestUpdateRef = useRef(null);
  progressRef.current = progress;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { course: nextCourse, lessons: nextLessons } =
          await loadCourse(COURSE_ID);
        if (cancelled) return;
        setCourse(nextCourse);
        setLessons(nextLessons);

        try {
          const nextProgress = await loadProgress(user.uid, COURSE_ID);
          if (cancelled) return;
          setProgress(nextProgress);
          setSelectedId(pickDefaultLesson(nextLessons, nextProgress));
        } catch (progressErr) {
          if (cancelled) return;
          setSelectedId(pickDefaultLesson(nextLessons, null));
          setError(
            progressErr.code === "permission-denied" ||
              /insufficient permissions/i.test(progressErr.message ?? "")
              ? "Watch progress is blocked by Firestore rules. Publish the latest firestore.rules (they must allow users/{userId}/progress/{courseId}), then refresh."
              : progressErr.message ?? "Could not load watch progress.",
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? "Could not load the course.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      const pending = latestUpdateRef.current;
      if (pending) {
        const previous = progressRef.current?.lessons?.[pending.lessonId];
        saveLessonProgress(user.uid, pending.lessonId, {
          watchedPercent: Math.max(
            previous?.watchedPercent ?? 0,
            pending.update.watchedPercent,
          ),
          watchCompleted: Boolean(
            previous?.watchCompleted || pending.update.watchCompleted,
          ),
          lastPositionSeconds: pending.update.lastPositionSeconds,
        }).catch(() => {});
      }
    };
  }, [user.uid]);

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedId) ?? null,
    [lessons, selectedId],
  );

  const selectedStatus = selectedLesson
    ? getLessonStatus(selectedLesson, lessons, progress)
    : "locked";
  const selectedProgress = progress?.lessons?.[selectedId] ?? {
    watchedPercent: 0,
    watchCompleted: false,
    lastPositionSeconds: 0,
  };
  const completedCount = countWatchCompleted(lessons, progress);
  const coursePercent = lessons.length
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;

  const persistProgress = useCallback(
    async (lessonId, nextLessonProgress) => {
      const previous = progressRef.current?.lessons?.[lessonId];
      const merged = {
        watchedPercent: Math.max(
          previous?.watchedPercent ?? 0,
          nextLessonProgress.watchedPercent,
        ),
        watchCompleted: Boolean(
          previous?.watchCompleted || nextLessonProgress.watchCompleted,
        ),
        lastPositionSeconds: nextLessonProgress.lastPositionSeconds,
      };

      setProgress((current) => ({
        courseId: COURSE_ID,
        status: "in_progress",
        startedAt: current?.startedAt,
        lessons: {
          ...(current?.lessons ?? {}),
          [lessonId]: merged,
        },
      }));

      await saveLessonProgress(user.uid, lessonId, merged, COURSE_ID);
    },
    [user.uid],
  );

  const handleProgress = useCallback(
    (update) => {
      if (!selectedId) return;
      const now = Date.now();
      const previous = progressRef.current?.lessons?.[selectedId];
      const completedNow =
        update.watchCompleted && !previous?.watchCompleted;
      const due = now - lastSaveRef.current > 3000;
      latestUpdateRef.current = { lessonId: selectedId, update };

      if (!completedNow && !due) {
        setProgress((current) => ({
          courseId: COURSE_ID,
          status: "in_progress",
          startedAt: current?.startedAt,
          lessons: {
            ...(current?.lessons ?? {}),
            [selectedId]: {
              watchedPercent: Math.max(
                previous?.watchedPercent ?? 0,
                update.watchedPercent,
              ),
              watchCompleted: Boolean(
                previous?.watchCompleted || update.watchCompleted,
              ),
              lastPositionSeconds: update.lastPositionSeconds,
            },
          },
        }));
        return;
      }

      lastSaveRef.current = now;
      persistProgress(selectedId, update).catch((err) => {
        setError(err.message ?? "Could not save progress.");
      });
    },
    [persistProgress, selectedId],
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-gray-600">
        Loading course…
      </main>
    );
  }

  if (error && !course) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-gray-900">
        <p className="mx-auto max-w-md rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-gray-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-600">Hi, {profile?.name}</p>
            <h1 className="text-2xl font-semibold">
              {course?.title ?? "Tire Store 101"}
            </h1>
          </div>
          <LogoutButton className="min-h-10 shrink-0 px-3 text-sm" />
        </header>

        <section>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Course progress</span>
            <span className="text-gray-600">
              {completedCount} of {lessons.length} watched
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gray-900"
              style={{ width: `${coursePercent}%` }}
            />
          </div>
        </section>

        {selectedLesson && selectedStatus !== "locked" ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{selectedLesson.title}</h2>
            <YouTubePlayer
              key={selectedLesson.id}
              videoId={selectedLesson.youtubeId}
              durationSeconds={selectedLesson.durationSeconds || 1}
              completed={Boolean(selectedProgress.watchCompleted)}
              startSeconds={selectedProgress.lastPositionSeconds ?? 0}
              initialMaxSeconds={
                ((selectedProgress.watchedPercent ?? 0) / 100) *
                (selectedLesson.durationSeconds || 1)
              }
              onProgress={handleProgress}
            />
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>Video</span>
                <span className="text-gray-600">
                  {Math.round(selectedProgress.watchedPercent ?? 0)}% watched
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gray-900"
                  style={{
                    width: `${Math.min(100, selectedProgress.watchedPercent ?? 0)}%`,
                  }}
                />
              </div>
              {!selectedProgress.watchCompleted ? (
                <p className="mt-2 text-sm text-gray-600">
                  Watch about 90% to unlock the next lesson.
                </p>
              ) : (
                <p className="mt-2 text-sm text-green-700">
                  Watch complete. You can replay this lesson anytime.
                </p>
              )}
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Lessons</h2>
          {lessons.map((lesson) => {
            const status = getLessonStatus(lesson, lessons, progress);
            const watched = progress?.lessons?.[lesson.id]?.watchedPercent ?? 0;
            const selected = lesson.id === selectedId;

            return (
              <button
                key={lesson.id}
                type="button"
                disabled={status === "locked"}
                onClick={() => setSelectedId(lesson.id)}
                className={`flex min-h-14 w-full items-center justify-between rounded-lg border px-4 text-left text-base ${
                  selected
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-300 bg-white"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <span>
                  <span className="font-medium">
                    {lesson.order}. {lesson.title}
                  </span>
                  {status !== "locked" ? (
                    <span className="mt-0.5 block text-sm text-gray-600">
                      {Math.round(watched)}% watched
                    </span>
                  ) : null}
                </span>
                <span className="text-sm text-gray-600">
                  {status === "completed"
                    ? "Done"
                    : status === "locked"
                      ? "Locked"
                      : "Watch"}
                </span>
              </button>
            );
          })}
        </section>

        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {profile?.isAdmin ? (
          <Link
            href="/admin"
            className="flex min-h-12 w-full items-center justify-center rounded-lg border border-gray-300 text-base font-medium"
          >
            Admin
          </Link>
        ) : null}
      </div>
    </main>
  );
}

function pickDefaultLesson(lessons, progress) {
  const firstIncomplete = lessons.find(
    (lesson) =>
      getLessonStatus(lesson, lessons, progress) === "unlocked" &&
      !progress?.lessons?.[lesson.id]?.watchCompleted,
  );
  if (firstIncomplete) return firstIncomplete.id;

  const firstUnlocked = lessons.find(
    (lesson) => getLessonStatus(lesson, lessons, progress) !== "locked",
  );
  return firstUnlocked?.id ?? lessons[0]?.id ?? null;
}
