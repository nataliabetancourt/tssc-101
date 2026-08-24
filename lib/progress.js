export const COURSE_ID = "tire101";
export const WATCH_COMPLETE_PERCENT = 90;

export function sortLessons(lessons) {
  return [...lessons].sort((a, b) => a.order - b.order);
}

export function getLessonStatus(lesson, lessons, progress) {
  if (progress?.lessons?.[lesson.id]?.watchCompleted) {
    return "completed";
  }

  const sorted = sortLessons(lessons);
  const index = sorted.findIndex((item) => item.id === lesson.id);
  if (index <= 0) {
    return "unlocked";
  }

  const previous = sorted[index - 1];
  if (progress?.lessons?.[previous.id]?.watchCompleted) {
    return "unlocked";
  }

  return "locked";
}

export function countWatchCompleted(lessons, progress) {
  return lessons.filter((lesson) => progress?.lessons?.[lesson.id]?.watchCompleted)
    .length;
}
