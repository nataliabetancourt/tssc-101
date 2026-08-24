"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import LogoutButton from "@/components/LogoutButton";
import { useAuth } from "@/context/AuthContext";
import { LOCATIONS } from "@/lib/locations";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardHome />
    </ProtectedRoute>
  );
}

function DashboardHome() {
  const { profile } = useAuth();
  const locationName =
    LOCATIONS.find((store) => store.slug === profile?.location)?.name ??
    profile?.location;

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-gray-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Welcome, {profile?.name}
          </h1>
          <p className="mt-1 text-gray-600">{locationName}</p>
        </div>
        <LogoutButton className="w-full" />
      </div>
    </main>
  );
}
