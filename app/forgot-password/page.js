"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { firebaseAuthMessage } from "@/lib/authErrors";

const fieldClass =
  "w-full min-h-12 rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-900";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/login`,
      });
      setSent(true);
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
          <h1 className="text-2xl font-semibold">Forgot password</h1>
          <p className="mt-1 text-gray-600">
            Enter your work email and we will send a reset link.
          </p>
        </div>

        {sent ? (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            If an account exists for {email}, a reset email is on the way. Check
            your inbox and spam folder.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Email
              <input
                className={fieldClass}
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-gray-900 underline">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
