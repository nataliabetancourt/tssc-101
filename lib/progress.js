export const COURSE_ID = "tire101";
export const WATCH_COMPLETE_PERCENT = 90;

export function sortLessons(lessons) {
  return [...lessons].sort((a, b) => a.order - b.order);
}

export function lessonHasQuiz(lesson) {
  return lesson?.hasQuiz !== false;
}

export function isLessonComplete(lesson, progress) {
  const data = progress?.lessons?.[lesson.id];
  if (!data?.watchCompleted) return false;
  if (!lessonHasQuiz(lesson)) return true;
  return data.quizPassed === true;
}

export function getLessonStatus(lesson, lessons, progress) {
  if (isLessonComplete(lesson, progress)) {
    return "completed";
  }

  const sorted = sortLessons(lessons);
  const index = sorted.findIndex((item) => item.id === lesson.id);
  const previousComplete =
    index <= 0 || isLessonComplete(sorted[index - 1], progress);

  if (!previousComplete) {
    return "locked";
  }

  if (progress?.lessons?.[lesson.id]?.watchCompleted && lessonHasQuiz(lesson)) {
    return "quiz";
  }

  return "unlocked";
}

export function countLessonsCompleted(lessons, progress) {
  return lessons.filter((lesson) => isLessonComplete(lesson, progress)).length;
}

export function isCourseComplete(course, lessons, progress) {
  const required = course?.lessonCount ?? lessons.length;
  if (!required) return false;
  return countLessonsCompleted(lessons, progress) === required;
}

export function getNewLessons(lessons, progress) {
  const seen = progress?.seenLessonCount;
  if (!seen || lessons.length <= seen) return [];
  return sortLessons(lessons).slice(seen);
}

export function mergeLessonProgress(previous, patch, lesson) {
  const watchedPercent = Math.max(
    previous?.watchedPercent ?? 0,
    patch.watchedPercent ?? 0,
  );
  const watchCompleted = Boolean(
    previous?.watchCompleted || patch.watchCompleted,
  );
  const quizPassed = Boolean(previous?.quizPassed || patch.quizPassed);
  const lessonCompleted =
    watchCompleted && (quizPassed || !lessonHasQuiz(lesson));
  const justCompleted = lessonCompleted && !previous?.lessonCompleted;

  return {
    watchedPercent,
    watchCompleted,
    lastPositionSeconds:
      patch.lastPositionSeconds ?? previous?.lastPositionSeconds ?? 0,
    quizPassed,
    lessonCompleted,
    completedAt: justCompleted
      ? new Date()
      : (previous?.completedAt ?? null),
  };
}
