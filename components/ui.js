export const fieldClass = "field";
export const primaryButtonClass = "btn btn-primary";
export const secondaryButtonClass = "btn btn-secondary";
export const ghostButtonClass = "btn btn-ghost";
export const softButtonClass = "btn btn-soft";

export function ProgressBar({ value = 0, label }) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
      aria-label={label}
    >
      <div className="progress-fill" style={{ width: `${width}%` }} />
    </div>
  );
}

export function ProgressRing({ value = 0, size = 64, stroke = 5, label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      role="img"
      aria-label={label}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(92, 38, 142, 0.12)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: "stroke-dashoffset 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </svg>
  );
}
