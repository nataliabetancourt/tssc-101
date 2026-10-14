"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import AdminRoute from "@/components/AdminRoute";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, ErrorBanner } from "@/components/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import {
  buildAdminRows,
  loadAdminDashboardData,
  summarizeAdminRows,
} from "@/lib/admin";
import { LOCATIONS } from "@/lib/locations";

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}

function AdminDashboard() {
  const { profile } = useAuth();
  const locale = useLocale();
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const tErrors = useTranslations("Errors");
  const tStatus = useTranslations("Status");
  const [rows, setRows] = useState([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    loadAdminDashboardData()
      .then(({ lessonCount, users, progressByUid }) => {
        if (cancelled) return;
        setRows(buildAdminRows(users, progressByUid, lessonCount));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.code === "permission-denied" ||
            /insufficient permissions/i.test(err.message ?? "")
            ? "adminPermission"
            : "loadAdmin",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleRows = useMemo(
    () =>
      locationFilter
        ? rows.filter((row) => row.locationSlug === locationFilter)
        : rows,
    [locationFilter, rows],
  );
  const stats = useMemo(() => summarizeAdminRows(visibleRows), [visibleRows]);

  function statusLabel(status) {
    if (status === "completed") return tStatus("completed");
    if (status === "in_progress") return tStatus("inProgress");
    return tStatus("notStarted");
  }

  return (
    <AdminShell
      title={t("title")}
      subtitle={profile?.name ? `${tCommon("admin")} · ${profile.name}` : null}
    >
        <label className="flex max-w-sm flex-col gap-1.5 text-sm font-medium">
          {t("location")}
          <select
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            className="field"
          >
            <option value="">{t("allLocations")}</option>
            {LOCATIONS.map((location) => (
              <option key={location.slug} value={location.slug}>
                {location.name}
              </option>
            ))}
          </select>
        </label>

        <ErrorBanner>{error ? tErrors(error) : null}</ErrorBanner>

        {loading ? (
          <div className="flex items-center gap-3 py-10 text-muted">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand-soft border-t-brand" />
            {t("loading")}
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-5">
              <StatCard label={t("totalUsers")} value={stats.totalUsers} />
              <StatCard label={t("completed")} value={stats.completed} />
              <StatCard
                label={t("completionRate")}
                value={`${stats.completionRate}%`}
              />
              <StatCard label={t("inProgress")} value={stats.inProgress} />
              <StatCard label={t("notStarted")} value={stats.notStarted} />
            </section>

            {error ? null : rows.length === 0 ? (
              <EmptyState title={t("emptyUsers")} />
            ) : (
              <>
              <section className="flex flex-col gap-2 md:hidden">
                {visibleRows.length === 0 ? (
                  <p className="card px-4 py-6 text-center text-sm text-muted">
                    {t("emptyFilter")}
                  </p>
                ) : (
                  visibleRows.map((row) => (
                    <article key={row.uid} className="card px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{row.name}</p>
                          <p className="mt-0.5 text-sm text-muted">
                            {row.locationName}
                          </p>
                        </div>
                        <StatusBadge
                          status={row.status}
                          label={statusLabel(row.status)}
                        />
                      </div>
                      <p className="mt-3 text-sm text-muted">
                        {t("lessonsCount", {
                          completed: row.completedLessons,
                          total: row.lessonCount,
                        })}
                        {" · "}
                        {formatLastActivity(row.lastActivity, locale)}
                      </p>
                    </article>
                  ))
                )}
              </section>
              <section className="card hidden overflow-hidden md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-canvas text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">{t("name")}</th>
                      <th className="px-4 py-3 font-medium">{t("location")}</th>
                      <th className="px-4 py-3 font-medium">{t("lessons")}</th>
                      <th className="px-4 py-3 font-medium">{t("status")}</th>
                      <th className="px-4 py-3 font-medium">
                        {t("lastActivity")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-6 text-center text-muted"
                        >
                          {t("emptyFilter")}
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row) => (
                        <tr key={row.uid} className="border-t border-line">
                          <td className="px-4 py-3 font-medium">{row.name}</td>
                          <td className="px-4 py-3">{row.locationName}</td>
                          <td className="px-4 py-3">
                            {t("lessonsCount", {
                              completed: row.completedLessons,
                              total: row.lessonCount,
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge
                              status={row.status}
                              label={statusLabel(row.status)}
                            />
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {formatLastActivity(row.lastActivity, locale)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </section>
              </>
            )}
          </>
        )}
    </AdminShell>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="py-1">
      <p className="text-[12px] text-muted">{label}</p>
      <p className="stat mt-1 text-[22px] font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function StatusBadge({ status, label }) {
  const className =
    status === "completed"
      ? "bg-success-soft text-success"
      : status === "in_progress"
        ? "bg-warning-soft text-warning"
        : "bg-[#f3f4f6] text-muted";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function formatLastActivity(date, locale) {
  if (!date) return "—";
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
