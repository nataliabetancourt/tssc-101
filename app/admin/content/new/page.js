"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminRoute from "@/components/AdminRoute";
import AdminShell from "@/components/admin/AdminShell";
import LessonForm from "@/components/admin/LessonForm";
import { loadCourse } from "@/lib/course";
import { generateLessonId, nextLessonOrder, saveLesson } from "@/lib/cms";

export default function NewLessonPage() {
  return (
    <AdminRoute>
      <NewLesson />
    </AdminRoute>
  );
}

function NewLesson() {
  const router = useRouter();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadCourse()
      .then(({ lessons: nextLessons }) => {
        if (!cancelled) setLessons(nextLessons);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Could not load lessons.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(values) {
    setSaving(true);
    try {
      const id = generateLessonId(lessons.map((lesson) => lesson.id));
      await saveLesson({ id, isNew: true, values });
      router.replace(`/admin/content/${id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title="Add lesson"
      subtitle="A stable lesson ID is generated automatically and cannot be changed later."
    >
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : (
        <LessonForm
          lessons={lessons}
          defaultOrder={nextLessonOrder(lessons)}
          submitLabel="Create lesson"
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/admin/content")}
        />
      )}
    </AdminShell>
  );
}
