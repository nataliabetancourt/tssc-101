import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COURSE_ID } from "@/lib/progress";
import { hashAnswer } from "@/lib/quiz";
import { isPlaceholderYoutubeId, normalizeYoutubeId } from "@/lib/youtube";

const OPTION_IDS = ["a", "b", "c", "d"];

export function generateLessonId(existingIds = []) {
  return uniqueId("lesson-", existingIds);
}

export function generateQuestionId(existingIds = []) {
  return uniqueId("q-", existingIds);
}

export function slugifyModuleId(title) {
  const slug = String(title ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "module";
}

export function groupLessonsByModule(lessons) {
  const groups = new Map();
  for (const lesson of [...lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
    const moduleId = lesson.moduleId || "ungrouped";
    if (!groups.has(moduleId)) {
      groups.set(moduleId, {
        moduleId,
        moduleTitle:
          lesson.displayModuleTitle || lesson.moduleTitle || "Ungrouped",
        moduleOrder: lesson.moduleOrder ?? 99,
        lessons: [],
      });
    }
    groups.get(moduleId).lessons.push(lesson);
  }
  return [...groups.values()].sort(
    (a, b) => (a.moduleOrder ?? 0) - (b.moduleOrder ?? 0),
  );
}

export function uniqueModules(lessons) {
  const byId = new Map();
  for (const lesson of lessons) {
    if (!lesson.moduleId) continue;
    if (!byId.has(lesson.moduleId)) {
      byId.set(lesson.moduleId, {
        moduleId: lesson.moduleId,
        moduleTitle: lesson.moduleTitle || lesson.moduleId,
        moduleOrder: lesson.moduleOrder ?? 1,
      });
    }
  }
  return [...byId.values()].sort(
    (a, b) => (a.moduleOrder ?? 0) - (b.moduleOrder ?? 0),
  );
}

export function nextLessonOrder(lessons) {
  if (!lessons.length) return 1;
  return Math.max(...lessons.map((lesson) => Number(lesson.order) || 0)) + 1;
}

export async function syncLessonCount(courseId = COURSE_ID) {
  const snap = await getDocs(collection(db, "courses", courseId, "lessons"));
  await setDoc(
    doc(db, "courses", courseId),
    { lessonCount: snap.size },
    { merge: true },
  );
  return snap.size;
}

export async function saveLesson(
  { id, isNew, values },
  courseId = COURSE_ID,
) {
  const payload = buildLessonPayload(values);
  const ref = doc(db, "courses", courseId, "lessons", id);

  if (isNew) {
    await setDoc(ref, payload);
    await syncLessonCount(courseId);
    return;
  }

  await setDoc(
    ref,
    {
      ...payload,
      youtubeId: deleteField(),
      captions: deleteField(),
    },
    { merge: true },
  );
}

export async function deleteLesson(lessonId, courseId = COURSE_ID) {
  const questionsSnap = await getDocs(
    collection(db, "courses", courseId, "lessons", lessonId, "questions"),
  );
  const batch = writeBatch(db);
  for (const questionDoc of questionsSnap.docs) {
    batch.delete(questionDoc.ref);
  }
  batch.delete(doc(db, "courses", courseId, "lessons", lessonId));
  await batch.commit();
  await syncLessonCount(courseId);
}

export async function saveQuestion(
  { lessonId, questionId, values, existing },
  courseId = COURSE_ID,
) {
  const payload = buildQuestionPayload(values, existing);
  await setDoc(
    doc(db, "courses", courseId, "lessons", lessonId, "questions", questionId),
    payload,
  );
}

export async function deleteQuestion(
  lessonId,
  questionId,
  courseId = COURSE_ID,
) {
  await deleteDoc(
    doc(db, "courses", courseId, "lessons", lessonId, "questions", questionId),
  );
}

export function buildLessonPayload(values) {
  const title = String(values.title ?? "").trim();
  const moduleTitle = String(values.moduleTitle ?? "").trim();
  const moduleId =
    String(values.moduleId ?? "").trim() || slugifyModuleId(moduleTitle);
  const youtubeEn = normalizeYoutubeId(values.youtubeEn);
  const youtubeEs = normalizeYoutubeId(values.youtubeEs);
  const order = Number(values.order);
  const moduleOrder = Number(values.moduleOrder);
  const durationSeconds = Number(values.durationSeconds);

  if (!title) throw new Error("Title is required.");
  if (!moduleTitle) throw new Error("Module title is required.");
  if (!Number.isFinite(order) || order < 1) {
    throw new Error("Lesson order must be 1 or higher.");
  }
  if (!Number.isFinite(moduleOrder) || moduleOrder < 1) {
    throw new Error("Module order must be 1 or higher.");
  }
  if (isPlaceholderYoutubeId(youtubeEn)) {
    throw new Error("A valid English YouTube ID or URL is required.");
  }
  if (youtubeEs && isPlaceholderYoutubeId(youtubeEs)) {
    throw new Error("Spanish YouTube ID must be a valid ID or URL, or left blank.");
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds < 1) {
    throw new Error("Duration must be at least 1 second.");
  }

  return {
    title,
    titleEs: String(values.titleEs ?? "").trim(),
    order,
    moduleId,
    moduleTitle,
    moduleTitleEs: String(values.moduleTitleEs ?? "").trim(),
    moduleOrder,
    youtubeVideos: {
      en: youtubeEn,
      es: youtubeEs || "",
    },
    durationSeconds,
    hasQuiz: Boolean(values.hasQuiz),
  };
}

export function buildQuestionPayload(values, existing) {
  const type =
    values.type === "true_false" ? "true_false" : "multiple_choice";
  const prompt = String(values.prompt ?? "").trim();
  const order = Number(values.order);
  const options = sanitizeOptions(type, values.options);

  if (!prompt) throw new Error("Question prompt is required.");
  if (!Number.isFinite(order) || order < 1) {
    throw new Error("Question order must be 1 or higher.");
  }
  if (options.length < 2) {
    throw new Error("Add at least two options.");
  }

  const correctOptionId = String(values.correctOptionId ?? "").trim();
  const payload = {
    order,
    type,
    prompt,
    promptEs: String(values.promptEs ?? "").trim(),
    options,
  };

  if (correctOptionId) {
    if (!options.some((option) => option.id === correctOptionId)) {
      throw new Error("Pick a correct option that exists in this question.");
    }
    const salt = crypto.randomUUID();
    payload.salt = salt;
    payload.answerHash = hashAnswer(salt, correctOptionId);
    return payload;
  }

  if (existing?.salt && existing?.answerHash) {
    if (existing.type && existing.type !== type) {
      throw new Error("Pick the correct answer after changing the question type.");
    }
    payload.salt = existing.salt;
    payload.answerHash = existing.answerHash;
    return payload;
  }

  throw new Error("Pick the correct answer.");
}

function sanitizeOptions(type, options) {
  if (type === "true_false") {
    return [
      { id: "true", text: "True", textEs: "Verdadero" },
      { id: "false", text: "False", textEs: "Falso" },
    ];
  }

  return (options ?? [])
    .map((option, index) => ({
      id: String(option?.id || OPTION_IDS[index] || `opt-${index + 1}`).trim(),
      text: String(option?.text ?? "").trim(),
      textEs: String(option?.textEs ?? "").trim(),
    }))
    .filter((option) => option.id && option.text)
    .slice(0, 4);
}

function uniqueId(prefix, existingIds) {
  const ids = new Set(existingIds);
  let id = `${prefix}${shortToken()}`;
  while (ids.has(id)) {
    id = `${prefix}${shortToken()}`;
  }
  return id;
}

function shortToken() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}
