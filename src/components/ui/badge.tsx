import type { CSSProperties } from "react";

export type BadgeVariant = "green" | "amber" | "red" | "blue" | "muted";

const variantStyles: Record<BadgeVariant, CSSProperties> = {
  green: {
    color: "var(--accent-green)",
    borderColor: "rgba(0,255,136,0.2)",
    background: "rgba(0,255,136,0.06)",
  },
  amber: {
    color: "var(--accent-amber)",
    borderColor: "rgba(255,179,0,0.2)",
    background: "rgba(255,179,0,0.06)",
  },
  red: {
    color: "var(--accent-red)",
    borderColor: "rgba(255,56,96,0.2)",
    background: "rgba(255,56,96,0.06)",
  },
  blue: {
    color: "var(--accent-blue)",
    borderColor: "rgba(0,184,255,0.2)",
    background: "rgba(0,184,255,0.06)",
  },
  muted: {
    color: "var(--muted-foreground)",
    borderColor: "var(--border)",
    background: "var(--muted)",
  },
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
}

export function Badge({ variant = "muted", children, dot = false }: BadgeProps) {
  const style = variantStyles[variant];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs border rounded font-mono tracking-wide"
      style={style}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse-dot flex-shrink-0"
          style={{ background: style.color as string }}
        />
      )}
      {children}
    </span>
  );
}

export function modelTierVariant(tier?: string): BadgeVariant {
  if (!tier) return "muted";
  const t = tier.toLowerCase();
  if (t.includes("opus")) return "amber";
  if (t.includes("sonnet")) return "blue";
  if (t.includes("haiku")) return "green";
  return "muted";
}

export function stateVariant(state: string): BadgeVariant {
  const s = state.toLowerCase();
  if (s.includes("done") || s.includes("complete") || s.includes("merged")) return "green";
  if (s.includes("fail") || s.includes("error") || s.includes("cancel")) return "red";
  if (s.includes("review") || s.includes("pending") || s.includes("wait")) return "amber";
  if (s.includes("work") || s.includes("active") || s.includes("claim")) return "blue";
  return "muted";
}
