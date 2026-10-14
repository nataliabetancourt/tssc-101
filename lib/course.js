import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COURSE_ID, mergeLessonProgress } from "@/lib/progress";

export async function loadCourse(courseId = COURSE_ID) {
  const courseSnap = await getDoc(doc(db, "courses", courseId));
  const lessonsSnap = await getDocs(
    collection(db, "courses", courseId, "lessons"),
  );

  return {
    course: courseSnap.exists()
      ? { id: courseSnap.id, ...courseSnap.data() }
      : null,
    lessons: lessonsSnap.docs
      .map((lessonDoc) => ({ id: lessonDoc.id, ...lessonDoc.data() }))
      .sort((a, b) => a.order - b.order),
  };
}

export async function loadLesson(lessonId, courseId = COURSE_ID) {
  const snap = await getDoc(doc(db, "courses", courseId, "lessons", lessonId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function loadQuestions(lessonId, courseId = COURSE_ID) {
  const snap = await getDocs(
    collection(db, "courses", courseId, "lessons", lessonId, "questions"),
  );

  return snap.docs
    .map((questionDoc) => ({ id: questionDoc.id, ...questionDoc.data() }))
    .sort((a, b) => a.order - b.order);
}

export async function loadProgress(uid, courseId = COURSE_ID) {
  const snap = await getDoc(doc(db, "users", uid, "progress", courseId));
  return snap.exists() ? snap.data() : null;
}

export async function saveLessonProgress(
  uid,
  lessonId,
  lessonProgress,
  courseId = COURSE_ID,
) {
  const ref = doc(db, "users", uid, "progress", courseId);
  const snap = await getDoc(ref);
  const payload = { ...lessonProgress };
  const justCompleted =
    lessonProgress.lessonCompleted && !snap.data()?.lessons?.[lessonId]?.lessonCompleted;

  if (justCompleted) {
    payload.completedAt = serverTimestamp();
  } else if (!payload.completedAt) {
    delete payload.completedAt;
  }

  if (!snap.exists()) {
    await setDoc(ref, {
      courseId,
      status: "in_progress",
      startedAt: serverTimestamp(),
      lessons: {
        [lessonId]: payload,
      },
    });
    return;
  }

  await updateDoc(ref, {
    courseId,
    status: "in_progress",
    [`lessons.${lessonId}`]: payload,
  });
}

export async function saveSeenLessonCount(
  uid,
  seenLessonCount,
  courseId = COURSE_ID,
) {
  const ref = doc(db, "users", uid, "progress", courseId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        courseId,
        status: "in_progress",
        startedAt: serverTimestamp(),
        seenLessonCount,
        lessons: {},
      },
      { merge: true },
    );
    return;
  }

  await updateDoc(ref, { seenLessonCount });
}

export { mergeLessonProgress };
