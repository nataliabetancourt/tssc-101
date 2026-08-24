"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { firebaseAuthMessage } from "@/lib/authErrors";

const fieldClass =
  "w-full min-h-12 rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-900";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = useMemo(
    () => searchParams.get("oobCode") ?? "",
    [searchParams],
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!oobCode) {
      setError("This reset link is missing a code. Request a new one.");
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      router.replace("/login");
    } catch (err) {
      setError(firebaseAuthMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-gray-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Set a new password</h1>
          <p className="mt-1 text-gray-600">Choose a password of at least 6 characters.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            New password
            <input
              className={fieldClass}
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Confirm password
            <input
              className={fieldClass}
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              minLength={6}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
          </label>

          {error ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="min-h-12 w-full rounded-lg bg-gray-900 text-base font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save password"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          <Link href="/forgot-password" className="font-medium text-gray-900 underline">
            Request a new reset link
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white text-gray-600">
          Loading…
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
