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
import { COURSE_ID } from "@/lib/progress";

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

  if (!snap.exists()) {
    await setDoc(ref, {
      courseId,
      status: "in_progress",
      startedAt: serverTimestamp(),
      lessons: {
        [lessonId]: lessonProgress,
      },
    });
    return;
  }

  await updateDoc(ref, {
    courseId,
    status: "in_progress",
    [`lessons.${lessonId}`]: lessonProgress,
  });
}
