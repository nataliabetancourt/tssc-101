"use client";

import AdminRoute from "@/components/AdminRoute";
import LogoutButton from "@/components/LogoutButton";
import { useAuth } from "@/context/AuthContext";

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
        <LogoutButton className="w-full" />
      </div>
    </main>
  );
}
