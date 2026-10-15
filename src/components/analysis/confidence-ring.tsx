export function ConfidenceRing({
  value,
  colorVar,
  size = 52,
}: {
  value: number;
  colorVar: string;
  size?: number;
}) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0">
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--color-secondary)" strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke={`var(${colorVar})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 24 24)"
      />
      <text
        x="24"
        y="26"
        textAnchor="middle"
        className="fill-foreground"
        style={{ fontSize: "10px", fontWeight: 700 }}
      >
        {Math.round(value * 100)}%
      </text>
    </svg>
  );
}
