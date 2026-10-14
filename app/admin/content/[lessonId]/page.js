"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminRoute from "@/components/AdminRoute";
import AdminShell, {
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/admin/AdminShell";
import LessonForm from "@/components/admin/LessonForm";
import { loadCourse, loadLesson, loadQuestions } from "@/lib/course";
import { deleteQuestion, saveLesson } from "@/lib/cms";

export default function EditLessonPage() {
  return (
    <AdminRoute>
      <EditLesson />
    </AdminRoute>
  );
}

function EditLesson() {
  const { lessonId } = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  async function refresh() {
    const [{ lessons: nextLessons }, nextLesson, nextQuestions] = await Promise.all([
      loadCourse(),
      loadLesson(lessonId),
      loadQuestions(lessonId),
    ]);
    setLessons(nextLessons);
    setLesson(nextLesson);
    setQuestions(nextQuestions);
  }

  useEffect(() => {
    let cancelled = false;
    refresh()
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Could not load this lesson.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  async function handleSubmit(values) {
    setSaving(true);
    try {
      await saveLesson({ id: lessonId, isNew: false, values });
      await refresh();
      router.push("/admin/content");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteQuestion(question) {
    const confirmed = window.confirm("Delete this question?");
    if (!confirmed) return;
    setDeletingId(question.id);
    setError("");
    try {
      await deleteQuestion(lessonId, question.id);
      await refresh();
    } catch (err) {
      setError(err.message ?? "Could not delete this question.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <AdminShell title={lesson?.title ?? "Edit lesson"} subtitle="Edit lesson details and quiz questions.">
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-gray-600">Loading lesson…</p>
      ) : !lesson ? (
        <p className="text-gray-600">This lesson was not found.</p>
      ) : (
        <>
          <LessonForm
            lesson={lesson}
            lessons={lessons}
            submitLabel="Save lesson"
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/admin/content")}
          />

          <section className="flex max-w-2xl flex-col gap-3 border-t border-line pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Questions</h2>
              <Link
                href={`/admin/content/${lessonId}/questions/new`}
                className={primaryButtonClass}
              >
                Add question
              </Link>
            </div>
            {questions.length === 0 ? (
              <p className="text-sm text-gray-600">No questions yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {questions.map((question) => (
                  <li
                    key={question.id}
                    className="card flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {question.order}. {question.prompt}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {question.type === "true_false"
                          ? "True / False"
                          : "Multiple choice"}{" "}
                        · {question.options?.length ?? 0} options
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/content/${lessonId}/questions/${question.id}`}
                        className={secondaryButtonClass}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(question)}
                        disabled={deletingId === question.id}
                        className={secondaryButtonClass}
                      >
                        {deletingId === question.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}
