"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminRoute from "@/components/AdminRoute";
import AdminShell from "@/components/admin/AdminShell";
import QuestionForm from "@/components/admin/QuestionForm";
import { loadLesson, loadQuestions } from "@/lib/course";
import { saveQuestion } from "@/lib/cms";

export default function EditQuestionPage() {
  return (
    <AdminRoute>
      <EditQuestion />
    </AdminRoute>
  );
}

function EditQuestion() {
  const { lessonId, questionId } = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadLesson(lessonId), loadQuestions(lessonId)])
      .then(([nextLesson, nextQuestions]) => {
        if (cancelled) return;
        setLesson(nextLesson);
        setQuestion(
          nextQuestions.find((item) => item.id === questionId) ?? null,
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Could not load this question.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId, questionId]);

  async function handleSubmit(values) {
    setSaving(true);
    try {
      await saveQuestion({
        lessonId,
        questionId,
        values,
        existing: question,
      });
      router.replace(`/admin/content/${lessonId}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title="Edit question"
      subtitle={lesson ? `Lesson: ${lesson.title}` : "Quiz question"}
    >
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : !question ? (
        <p className="text-gray-600">This question was not found.</p>
      ) : (
        <QuestionForm
          question={question}
          lessonId={lessonId}
          submitLabel="Save question"
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/admin/content/${lessonId}`)}
        />
      )}
    </AdminShell>
  );
}
