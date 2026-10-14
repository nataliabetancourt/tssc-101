import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getLocationName } from "@/lib/locations";
import {
  COURSE_ID,
  countStoredLessonCompletions,
  getCourseProgressStatus,
} from "@/lib/progress";

export async function loadAdminDashboardData(courseId = COURSE_ID) {
  const [courseSnap, usersSnap, progressSnap] = await Promise.all([
    getDoc(doc(db, "courses", courseId)),
    getDocs(collection(db, "users")),
    getDocs(collectionGroup(db, "progress")),
  ]);

  const lessonCount = courseSnap.exists()
    ? (courseSnap.data().lessonCount ?? 0)
    : 0;

  const users = usersSnap.docs.map((userDoc) => ({
    uid: userDoc.id,
    ...userDoc.data(),
  }));

  const progressByUid = {};
  for (const progressDoc of progressSnap.docs) {
    const data = progressDoc.data();
    if (progressDoc.id !== courseId && data.courseId !== courseId) continue;
    const uid = progressDoc.ref.parent.parent?.id;
    if (!uid) continue;
    progressByUid[uid] = {
      ...data,
      updatedAt: progressDoc.updateTime ?? null,
    };
  }

  return { lessonCount, users, progressByUid };
}

export function buildAdminRows(users, progressByUid, lessonCount) {
  return users
    .map((user) => {
      const progress = progressByUid[user.uid] ?? null;
      return {
        uid: user.uid,
        name: user.name || user.email || "Unnamed",
        locationSlug: user.location ?? "",
        locationName: getLocationName(user.location),
        completedLessons: countStoredLessonCompletions(progress),
        lessonCount,
        status: getCourseProgressStatus(progress, lessonCount),
        lastActivity: getLastActivityAt(progress),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export function summarizeAdminRows(rows) {
  const totalUsers = rows.length;
  const completed = rows.filter((row) => row.status === "completed").length;
  const inProgress = rows.filter((row) => row.status === "in_progress").length;
  const notStarted = rows.filter((row) => row.status === "not_started").length;

  return {
    totalUsers,
    completed,
    inProgress,
    notStarted,
    completionRate: totalUsers ? Math.round((completed / totalUsers) * 100) : 0,
  };
}

function getLastActivityAt(progress) {
  if (!progress) return null;

  const candidates = [progress.updatedAt, progress.startedAt];
  for (const lesson of Object.values(progress.lessons ?? {})) {
    candidates.push(lesson?.completedAt);
  }

  const times = candidates.map(toMillis).filter(Number.isFinite);
  if (!times.length) return null;
  return new Date(Math.max(...times));
}

function toMillis(value) {
  if (!value) return NaN;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value.seconds === "number") {
    return value.seconds * 1000 + Math.floor((value.nanoseconds ?? 0) / 1e6);
  }
  return NaN;
}
