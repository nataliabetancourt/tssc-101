"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminRoute from "@/components/AdminRoute";
import AdminShell from "@/components/admin/AdminShell";
import QuestionForm from "@/components/admin/QuestionForm";
import { loadLesson, loadQuestions } from "@/lib/course";
import { generateQuestionId, saveQuestion } from "@/lib/cms";

export default function NewQuestionPage() {
  return (
    <AdminRoute>
      <NewQuestion />
    </AdminRoute>
  );
}

function NewQuestion() {
  const { lessonId } = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadLesson(lessonId), loadQuestions(lessonId)])
      .then(([nextLesson, nextQuestions]) => {
        if (cancelled) return;
        setLesson(nextLesson);
        setQuestions(nextQuestions);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Could not load this lesson.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  async function handleSubmit(values) {
    setSaving(true);
    try {
      const questionId = generateQuestionId(questions.map((item) => item.id));
      await saveQuestion({
        lessonId,
        questionId,
        values,
      });
      router.replace(`/admin/content/${lessonId}`);
    } finally {
      setSaving(false);
    }
  }

  const nextOrder =
    questions.length === 0
      ? 1
      : Math.max(...questions.map((item) => Number(item.order) || 0)) + 1;

  return (
    <AdminShell
      title="Add question"
      subtitle={lesson ? `Lesson: ${lesson.title}` : "New quiz question"}
    >
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : (
        <QuestionForm
          lessonId={lessonId}
          defaultOrder={nextOrder}
          submitLabel="Create question"
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/admin/content/${lessonId}`)}
        />
      )}
    </AdminShell>
  );
}
