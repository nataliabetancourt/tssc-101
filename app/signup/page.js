"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { firebaseAuthMessage } from "@/lib/authErrors";
import { LOCATIONS } from "@/lib/locations";

const fieldClass =
  "w-full min-h-12 rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-900";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        location,
        language,
        isAdmin: false,
        createdAt: serverTimestamp(),
      });
      router.replace("/dashboard");
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
          <h1 className="text-2xl font-semibold">Create an account</h1>
          <p className="mt-1 text-gray-600">Tire Store 101 training</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Name
            <input
              className={fieldClass}
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

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

          <label className="flex flex-col gap-1 text-sm font-medium">
            Password
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
            Location
            <select
              className={fieldClass}
              name="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              required
            >
              <option value="">Select a store</option>
              {LOCATIONS.map((store) => (
                <option key={store.slug} value={store.slug}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Language
            <select
              className={fieldClass}
              name="language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              required
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
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
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-gray-900 underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
