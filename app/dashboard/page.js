"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import LogoutButton from "@/components/LogoutButton";
import YouTubePlayer from "@/components/YouTubePlayer";
import LessonQuiz from "@/components/LessonQuiz";
import { useAuth } from "@/context/AuthContext";
import {
  loadCourse,
  loadProgress,
  loadQuestions,
  saveLessonProgress,
  saveSeenLessonCount,
} from "@/lib/course";
import {
  COURSE_ID,
  countLessonsCompleted,
  getLessonStatus,
  getNewLessons,
  isCourseComplete,
  lessonHasQuiz,
  mergeLessonProgress,
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
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [stage, setStage] = useState("video");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const lastSaveRef = useRef(0);
  const progressRef = useRef(progress);
  const lessonsRef = useRef(lessons);
  const latestUpdateRef = useRef(null);
  progressRef.current = progress;
  lessonsRef.current = lessons;

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
        const lesson = lessonsRef.current.find((item) => item.id === pending.lessonId);
        const previous = progressRef.current?.lessons?.[pending.lessonId];
        saveLessonProgress(
          user.uid,
          pending.lessonId,
          mergeLessonProgress(previous, pending.update, lesson),
        ).catch(() => {});
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
    quizPassed: false,
    lessonCompleted: false,
  };
  const completedCount = countLessonsCompleted(lessons, progress);
  const requiredCount = course?.lessonCount ?? lessons.length;
  const coursePercent = requiredCount
    ? Math.round((completedCount / requiredCount) * 100)
    : 0;
  const courseComplete = isCourseComplete(course, lessons, progress);
  const newLessons = getNewLessons(lessons, progress);
  const showCourseNewBadge = newLessons.length > 0 && !courseComplete;
  const showQuiz =
    selectedLesson &&
    selectedProgress.watchCompleted &&
    lessonHasQuiz(selectedLesson) &&
    selectedProgress.quizPassed !== true;
  const showingQuiz = showQuiz && stage === "quiz";

  useEffect(() => {
    const lesson = lessonsRef.current.find((item) => item.id === selectedId);
    const data = progressRef.current?.lessons?.[selectedId];
    if (
      data?.watchCompleted &&
      lessonHasQuiz(lesson) &&
      data.quizPassed !== true
    ) {
      setStage("quiz");
    } else {
      setStage("video");
    }
  }, [selectedId]);

  useEffect(() => {
    if (!showQuiz || !selectedId) {
      setQuestions([]);
      return;
    }

    let cancelled = false;
    setQuestionsLoading(true);
    loadQuestions(selectedId)
      .then((nextQuestions) => {
        if (!cancelled) setQuestions(nextQuestions);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? "Could not load the quiz.");
        }
      })
      .finally(() => {
        if (!cancelled) setQuestionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, showQuiz]);

  useEffect(() => {
    if (!courseComplete) return;
    if ((progress?.seenLessonCount ?? 0) >= lessons.length) return;

    saveSeenLessonCount(user.uid, lessons.length)
      .then(() => {
        setProgress((current) =>
          current
            ? { ...current, seenLessonCount: lessons.length }
            : current,
        );
      })
      .catch(() => {});
  }, [courseComplete, lessons.length, progress?.seenLessonCount, user.uid]);

  const persistProgress = useCallback(
    async (lessonId, patch) => {
      const lesson = lessonsRef.current.find((item) => item.id === lessonId);
      const previous = progressRef.current?.lessons?.[lessonId];
      const merged = mergeLessonProgress(previous, patch, lesson);

      setProgress((current) => ({
        courseId: COURSE_ID,
        status: "in_progress",
        startedAt: current?.startedAt,
        seenLessonCount: current?.seenLessonCount,
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
      const lesson = lessonsRef.current.find((item) => item.id === selectedId);
      const merged = mergeLessonProgress(previous, update, lesson);
      const completedNow = merged.watchCompleted && !previous?.watchCompleted;
      const due = now - lastSaveRef.current > 3000;
      latestUpdateRef.current = { lessonId: selectedId, update };

      if (!completedNow && !due) {
        setProgress((current) => ({
          courseId: COURSE_ID,
          status: "in_progress",
          startedAt: current?.startedAt,
          seenLessonCount: current?.seenLessonCount,
          lessons: {
            ...(current?.lessons ?? {}),
            [selectedId]: merged,
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

  async function handleQuizPass() {
    if (!selectedId) return;
    await persistProgress(selectedId, {
      quizPassed: true,
      watchCompleted: true,
      watchedPercent: selectedProgress.watchedPercent ?? 100,
      lastPositionSeconds: selectedProgress.lastPositionSeconds ?? 0,
    });
  }

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

        {showCourseNewBadge ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            New lesson added
          </p>
        ) : null}

        {courseComplete ? (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            ✓ Course complete
          </p>
        ) : null}

        <section>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Course progress</span>
            <span className="text-gray-600">
              {completedCount} of {requiredCount} complete
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gray-900"
              style={{ width: `${Math.min(100, coursePercent)}%` }}
            />
          </div>
        </section>

        {selectedLesson && selectedStatus !== "locked" ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{selectedLesson.title}</h2>
            {!showingQuiz ? (
              <>
                <YouTubePlayer
                  key={selectedLesson.id}
                  videoId={selectedLesson.youtubeId}
                  durationSeconds={selectedLesson.durationSeconds || 1}
                  completed={Boolean(selectedProgress.watchCompleted)}
                  startSeconds={
                    selectedProgress.watchCompleted
                      ? 0
                      : (selectedProgress.lastPositionSeconds ?? 0)
                  }
                  initialMaxSeconds={
                    ((selectedProgress.watchedPercent ?? 0) / 100) *
                    (selectedLesson.durationSeconds || 1)
                  }
                  onProgress={handleProgress}
                  onEnded={() => {
                    if (
                      lessonHasQuiz(selectedLesson) &&
                      selectedProgress.quizPassed !== true
                    ) {
                      setStage("quiz");
                    }
                  }}
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
                      Watch the video. The quiz starts when it ends.
                    </p>
                  ) : selectedProgress.lessonCompleted ? (
                    <p className="mt-2 text-sm text-green-700">
                      Lesson complete. You can replay this video anytime.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-600">
                      Watch complete. Continue to the quiz when you are ready.
                    </p>
                  )}
                </div>
                {showQuiz ? (
                  <button
                    type="button"
                    onClick={() => setStage("quiz")}
                    className="min-h-12 w-full rounded-lg bg-gray-900 text-base font-medium text-white"
                  >
                    Continue to quiz
                  </button>
                ) : null}
              </>
            ) : null}

            {showingQuiz && questionsLoading && questions.length === 0 ? (
              <p className="text-sm text-gray-600">Loading quiz…</p>
            ) : null}
            {showQuiz && questions.length > 0 ? (
              <div className={showingQuiz ? "" : "hidden"}>
                <LessonQuiz
                  key={selectedLesson.id}
                  questions={questions}
                  onPass={handleQuizPass}
                  onBackToVideo={() => setStage("video")}
                />
              </div>
            ) : null}
            {showingQuiz && !questionsLoading && questions.length === 0 ? (
              <p className="text-sm text-gray-600">
                No quiz questions found for this lesson.
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Lessons</h2>
          {lessons.map((lesson) => {
            const status = getLessonStatus(lesson, lessons, progress);
            const watched = progress?.lessons?.[lesson.id]?.watchedPercent ?? 0;
            const selected = lesson.id === selectedId;
            const isNew = newLessons.some((item) => item.id === lesson.id);

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
                  {isNew ? (
                    <span className="mt-0.5 block text-sm font-medium text-amber-800">
                      New lesson added
                    </span>
                  ) : status !== "locked" ? (
                    <span className="mt-0.5 block text-sm text-gray-600">
                      {status === "quiz"
                        ? "Quiz ready"
                        : `${Math.round(watched)}% watched`}
                    </span>
                  ) : null}
                </span>
                <span className="text-sm text-gray-600">
                  {status === "completed"
                    ? "Done"
                    : status === "locked"
                      ? "Locked"
                      : status === "quiz"
                        ? "Quiz"
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
  const quizReady = lessons.find(
    (lesson) => getLessonStatus(lesson, lessons, progress) === "quiz",
  );
  if (quizReady) return quizReady.id;

  const firstIncomplete = lessons.find(
    (lesson) => getLessonStatus(lesson, lessons, progress) === "unlocked",
  );
  if (firstIncomplete) return firstIncomplete.id;

  const firstUnlocked = lessons.find(
    (lesson) => getLessonStatus(lesson, lessons, progress) !== "locked",
  );
  return firstUnlocked?.id ?? lessons[0]?.id ?? null;
}
