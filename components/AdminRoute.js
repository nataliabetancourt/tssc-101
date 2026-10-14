"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (profile?.isAdmin !== true) {
      router.replace("/dashboard");
    }
  }, [loading, user, profile, router]);

  if (loading || !user || profile?.isAdmin !== true) {
    return <LoadingScreen />;
  }

  return children;
}
