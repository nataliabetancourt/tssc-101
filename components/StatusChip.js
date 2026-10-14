import { IconCheck, IconLock } from "@/components/icons";

export default function StatusChip({ status, label }) {
  const className =
    status === "completed"
      ? "text-success"
      : status === "quiz"
        ? "text-warning"
        : status === "locked"
          ? "text-muted"
          : "text-brand";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-medium ${className}`}
    >
      {status === "completed" ? <IconCheck className="h-3 w-3" /> : null}
      {status === "locked" ? <IconLock className="h-3 w-3" /> : null}
      {label}
    </span>
  );
}
