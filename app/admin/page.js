"use client";

import AdminRoute from "@/components/AdminRoute";
import LogoutButton from "@/components/LogoutButton";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminHome />
    </AdminRoute>
  );
}

function AdminHome() {
  const { profile } = useAuth();

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-gray-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <h1 className="text-2xl font-semibold">Admin — {profile?.name}</h1>
        <Link
          href="/admin/seed"
          className="flex min-h-12 w-full items-center justify-center rounded-lg bg-gray-900 text-base font-medium text-white"
        >
          Seed content
        </Link>
        <LogoutButton className="w-full" />
      </div>
    </main>
  );
}
