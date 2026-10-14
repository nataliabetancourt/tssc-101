"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ProtectedRoute from "@/components/ProtectedRoute";
import YouTubePlayer from "@/components/YouTubePlayer";
import LessonQuiz from "@/components/LessonQuiz";
import LoadingScreen, {
  EmptyState,
  ErrorBanner,
  InlineLoader,
} from "@/components/LoadingScreen";
import StatusChip from "@/components/StatusChip";
import LessonOutline from "@/components/LessonOutline";
import ModuleList from "@/components/ModuleList";
import AppHeader from "@/components/AppHeader";
import FeaturedLesson from "@/components/FeaturedLesson";
import LearnerNav from "@/components/LearnerNav";
import FadeIn from "@/components/FadeIn";
import { ProgressBar, ProgressRing } from "@/components/ui";
import { IconCheck, IconChevronLeft } from "@/components/icons";
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
  sortLessons,
} from "@/lib/progress";
import { resolveLessonVideoId } from "@/lib/youtube";
import { groupLessonsByModule } from "@/lib/cms";
import { localizeLesson, localizeQuestion } from "@/lib/localize";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <CourseHome />
    </ProtectedRoute>
  );
}

function CourseHome() {
  const { user, profile } = useAuth();
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  const tStatus = useTranslations("Status");
  const tErrors = useTranslations("Errors");
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [questionState, setQuestionState] = useState({
    lessonId: null,
    items: [],
  });
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [stage, setStage] = useState("video");
  const [view, setView] = useState("home");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const lastSaveRef = useRef(0);
  const progressRef = useRef(progress);
  const lessonsRef = useRef(lessons);
  const latestUpdateRef = useRef(null);
  // Mirror latest progress for the player tick handler without rerendering it.
  progressRef.current = progress; // eslint-disable-line react-hooks/refs
  lessonsRef.current = lessons; // eslint-disable-line react-hooks/refs

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
              ? "progressPermission"
              : "loadProgress",
          );
        }
      } catch {
        if (!cancelled) setError("loadCourse");
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

  const orderedLessons = useMemo(
    () =>
      sortLessons(lessons).map((lesson) =>
        localizeLesson(lesson, profile?.language),
      ),
    [lessons, profile?.language],
  );
  const lessonModules = useMemo(
    () => groupLessonsByModule(orderedLessons),
    [orderedLessons],
  );
  const selectedLesson = useMemo(
    () => orderedLessons.find((lesson) => lesson.id === selectedId) ?? null,
    [orderedLessons, selectedId],
  );
  const selectedIndex = orderedLessons.findIndex(
    (lesson) => lesson.id === selectedId,
  );
  const previousLesson =
    selectedIndex > 0 ? orderedLessons[selectedIndex - 1] : null;
  const nextLesson =
    selectedIndex >= 0 && selectedIndex < orderedLessons.length - 1
      ? orderedLessons[selectedIndex + 1]
      : null;
  const nextLocked =
    !nextLesson ||
    getLessonStatus(nextLesson, orderedLessons, progress) === "locked";

  const selectedStatus = selectedLesson
    ? getLessonStatus(selectedLesson, orderedLessons, progress)
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
  const questions =
    questionState.lessonId === selectedId ? questionState.items : [];
  const videoId = resolveLessonVideoId(selectedLesson, profile?.language);

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
      return;
    }

    let cancelled = false;
    setQuestionsLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    loadQuestions(selectedId)
      .then((nextQuestions) => {
        if (!cancelled) {
          setQuestionState({ lessonId: selectedId, items: nextQuestions });
        }
      })
      .catch(() => {
        if (!cancelled) setError("loadQuiz");
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
      persistProgress(selectedId, update).catch(() => {
        setError("saveProgress");
      });
    },
    [persistProgress, selectedId],
  );

  async function handleQuizPass() {
    if (!selectedId) return;
    const next = orderedLessons[selectedIndex + 1];
    const persist = persistProgress(selectedId, {
      quizPassed: true,
      watchCompleted: true,
      watchedPercent: selectedProgress.watchedPercent ?? 100,
      lastPositionSeconds: selectedProgress.lastPositionSeconds ?? 0,
    });
    if (next) {
      setSelectedId(next.id);
      setStage("video");
      setView("lesson");
    } else {
      setView("home");
    }
    await persist;
  }

  function openLesson(lessonId) {
    setSelectedId(lessonId);
    setView("lesson");
  }

  function statusLabel(status) {
    if (status === "completed") return tStatus("done");
    if (status === "locked") return tStatus("locked");
    if (status === "quiz") return tStatus("quiz");
    return tStatus("watch");
  }

  if (loading) {
    return <LoadingScreen label={t("loadingCourse")} />;
  }

  if (error && !course) {
    return (
      <main className="min-h-screen bg-canvas px-6 py-10">
        <ErrorBanner>{tErrors(error)}</ErrorBanner>
      </main>
    );
  }

  const showingLesson =
    view === "lesson" && selectedLesson && selectedStatus !== "locked";
  const selectedModuleTitle =
    selectedLesson?.displayModuleTitle || selectedLesson?.moduleTitle;
  const watchPercent = Math.round(selectedProgress.watchedPercent ?? 0);
  const remaining = Math.max(0, requiredCount - completedCount);
  const remainingSeconds = orderedLessons
    .filter((lesson) => getLessonStatus(lesson, orderedLessons, progress) !== "completed")
    .reduce((sum, lesson) => sum + (Number(lesson.durationSeconds) || 0), 0);
  const remainingMinutes = remainingSeconds
    ? Math.max(1, Math.round(remainingSeconds / 60))
    : 0;
  const resumeId = pickDefaultLesson(orderedLessons, progress);
  const resumeLesson =
    orderedLessons.find((lesson) => lesson.id === resumeId) ?? selectedLesson;
  const resumeStatus = resumeLesson
    ? getLessonStatus(resumeLesson, orderedLessons, progress)
    : "locked";
  const resumeWatched = Math.round(
    progress?.lessons?.[resumeLesson?.id]?.watchedPercent ?? 0,
  );
  const resumeMinutes = resumeLesson?.durationSeconds
    ? Math.max(1, Math.round(Number(resumeLesson.durationSeconds) / 60))
    : remainingMinutes;
  const primaryActionLabel = courseComplete
    ? t("reviewCourse")
    : completedCount === 0
      ? t("startCourse")
      : resumeStatus === "quiz"
        ? t("continueQuiz")
        : t("continueLesson");

  return (
    <main className="min-h-screen bg-canvas pb-[calc(4.25rem+env(safe-area-inset-bottom))] text-ink">
      <AppHeader
        title={
          showingLesson
            ? selectedLesson?.displayTitle || selectedLesson?.title || tCommon("appName")
            : tCommon("appName")
        }
        back={
          showingLesson ? (
            <button
              type="button"
              onClick={() => setView("home")}
              className="flex h-10 w-10 items-center justify-center text-ink"
              aria-label={t("backToHome")}
            >
              <IconChevronLeft className="h-5 w-5" />
            </button>
          ) : null
        }
      />

      <div className="mx-auto flex w-full max-w-lg flex-col">
        {!showingLesson ? (
          <div className="flex flex-col gap-8 px-5 py-6">
            <FadeIn className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[13px] text-muted">
                  {greeting(t, profile?.name || "")}
                </p>
                <h1 className="display mt-1">{course?.title ?? tCommon("appName")}</h1>
                <p className="stat mt-3 text-[13px] text-muted">
                  <span className="text-ink">{completedCount}</span>
                  /{requiredCount}
                  {remaining > 0 && remainingMinutes
                    ? ` · ${t("minutes", { count: remainingMinutes })}`
                    : ""}
                </p>
              </div>
              <div className="relative shrink-0">
                <ProgressRing value={coursePercent} label={t("courseProgress")} />
                <span className="stat absolute inset-0 flex items-center justify-center text-[11px] font-medium">
                  {coursePercent}%
                </span>
              </div>
            </FadeIn>

            {showCourseNewBadge ? (
              <p className="text-sm font-medium text-warning">{t("newLesson")}</p>
            ) : null}

            {courseComplete ? (
              <FadeIn delay={0.04} className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft text-success">
                  <IconCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[15px] font-semibold tracking-[-0.02em]">
                    {t("courseComplete")}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {t("courseCompleteBody")}
                  </p>
                </div>
              </FadeIn>
            ) : null}

            {resumeLesson ? (
              <FadeIn delay={0.06}>
                <FeaturedLesson
                  lesson={resumeLesson}
                  language={profile?.language}
                  actionLabel={primaryActionLabel}
                  remainingMinutes={resumeMinutes}
                  watchedPercent={resumeWatched}
                  complete={courseComplete}
                  onContinue={() => openLesson(resumeLesson.id)}
                />
              </FadeIn>
            ) : null}

            {orderedLessons.length === 0 ? (
              <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />
            ) : (
              <FadeIn delay={0.1}>
                <p className="kicker mb-1">{t("modules")}</p>
                <ModuleList
                  modules={lessonModules}
                  orderedLessons={orderedLessons}
                  progress={progress}
                  selectedId={resumeLesson?.id ?? selectedId}
                  newLessons={newLessons}
                  onSelect={openLesson}
                />
              </FadeIn>
            )}

            <ErrorBanner>{error ? tErrors(error) : null}</ErrorBanner>
          </div>
        ) : null}

        {showingLesson ? (
          <section className="flex flex-col">
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                {selectedModuleTitle ? (
                  <p className="kicker">{selectedModuleTitle}</p>
                ) : null}
                <p className="stat mt-1 text-[12px] text-muted">
                  {selectedIndex + 1}/{orderedLessons.length}
                </p>
              </div>
              <StatusChip
                status={selectedStatus}
                label={statusLabel(selectedStatus)}
              />
            </div>
            <div className="px-5">
              <ProgressBar
                value={watchPercent}
                label={t("watchedPercent", { percent: watchPercent })}
              />
            </div>

            {!showingQuiz ? (
              <div className="mt-4">
                <YouTubePlayer
                  key={`${selectedLesson.id}-${videoId}`}
                  videoId={videoId}
                  durationSeconds={selectedLesson.durationSeconds || 1}
                  completed={Boolean(selectedProgress.watchCompleted)}
                  startSeconds={
                    selectedProgress.watchCompleted
                      ? 0
                      : (selectedProgress.lastPositionSeconds ?? 0)
                  }
                  initialMaxSeconds={
                    selectedProgress.watchCompleted
                      ? selectedLesson.durationSeconds || 0
                      : (selectedProgress.lastPositionSeconds ?? 0)
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
                <div className="px-5 py-4">
                  <p className="text-sm leading-relaxed text-muted">
                    {!selectedProgress.watchCompleted
                      ? t("watchThenQuiz")
                      : selectedProgress.lessonCompleted
                        ? t("lessonCompleteReplay")
                        : t("watchCompleteContinue")}
                  </p>
                  {showQuiz ? (
                    <button
                      type="button"
                      onClick={() => setStage("quiz")}
                      className="btn btn-primary mt-4 w-full"
                    >
                      {t("continueQuiz")}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {showingQuiz ? (
              <div className="px-5 py-4">
                {questionsLoading && questions.length === 0 ? (
                  <InlineLoader label={t("loadingQuiz")} />
                ) : null}
                {questions.length > 0 ? (
                  <LessonQuiz
                    key={`${selectedLesson.id}-${profile?.language ?? "en"}`}
                    questions={questions.map((question) =>
                      localizeQuestion(
                        question,
                        profile?.language,
                        selectedLesson.id,
                      ),
                    )}
                    onPass={handleQuizPass}
                    onBackToVideo={() => setStage("video")}
                  />
                ) : null}
                {!questionsLoading && questions.length === 0 ? (
                  <p className="text-sm text-muted">{t("noQuestions")}</p>
                ) : null}
              </div>
            ) : null}

            {!showingQuiz ? (
              <div className="flex items-center justify-between gap-3 px-5 pb-6">
                <button
                  type="button"
                  disabled={!previousLesson}
                  onClick={() =>
                    previousLesson && setSelectedId(previousLesson.id)
                  }
                  className="btn btn-text px-0"
                >
                  {tCommon("previous")}
                </button>
                <button
                  type="button"
                  onClick={() => setOutlineOpen(true)}
                  className="btn btn-text px-0"
                >
                  {t("viewAllLessons")}
                </button>
                <button
                  type="button"
                  disabled={nextLocked}
                  onClick={() => nextLesson && setSelectedId(nextLesson.id)}
                  className="btn btn-text px-0"
                >
                  {tCommon("next")}
                </button>
              </div>
            ) : null}
            <div className="px-5">
              <ErrorBanner>{error ? tErrors(error) : null}</ErrorBanner>
            </div>
          </section>
        ) : null}
      </div>

      <LearnerNav
        view={showingLesson ? "lesson" : "home"}
        onHome={() => setView("home")}
        onLesson={() => resumeLesson && openLesson(resumeLesson.id)}
        disabledLesson={!resumeLesson}
      />

      <LessonOutline
        open={outlineOpen}
        modules={lessonModules}
        orderedLessons={orderedLessons}
        progress={progress}
        selectedId={selectedId}
        newLessons={newLessons}
        onSelect={openLesson}
        onClose={() => setOutlineOpen(false)}
        statusLabel={statusLabel}
      />
    </main>
  );
}

function greeting(t, name) {
  const hour = new Date().getHours();
  if (hour < 12) return t("goodMorning", { name });
  if (hour < 18) return t("goodAfternoon", { name });
  return t("goodEvening", { name });
}

function pickDefaultLesson(lessons, progress) {
  const quizReady = lessons.find(
    (lesson) => getLessonStatus(lesson, lessons, progress) === "quiz",
  );
  if (quizReady) return quizReady.id;

  const firstIncomplete = lessons.find((lesson) => {
    const status = getLessonStatus(lesson, lessons, progress);
    return status === "unlocked" || status === "quiz";
  });
  if (firstIncomplete) return firstIncomplete.id;

  return lessons[0]?.id ?? null;
}
