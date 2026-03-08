import type { Slot } from "@/lib/radar-client";

const statusColors: Record<string, string> = {
  idle: "var(--muted-foreground)",
  claiming: "var(--accent-amber)",
  working: "var(--accent-green)",
};

function elapsed(since?: string): string {
  if (!since) return "";
  const ms = Date.now() - new Date(since).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h${mins % 60}m`;
}

interface SlotGridProps {
  slots: Slot[];
  available: number;
  capacity: number;
}

export function SlotGrid({ slots, available, capacity }: SlotGridProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: "var(--muted-foreground)" }}
        >
          Slot Pool
        </h2>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {available}/{capacity} available
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {slots.map((slot) => {
          const color = statusColors[slot.status] ?? "var(--muted-foreground)";
          const isWorking = slot.status === "working";
          return (
            <div
              key={slot.id}
              className="rounded border p-3 flex flex-col gap-1"
              style={{
                background: "var(--card)",
                borderColor: isWorking ? "rgba(0,255,136,0.25)" : "var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                  {slot.id}
                </span>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: color,
                    boxShadow: isWorking ? `0 0 6px ${color}` : "none",
                  }}
                />
              </div>
              <span className="text-xs font-bold tracking-wider uppercase" style={{ color }}>
                {slot.status}
              </span>
              {slot.entityId && (
                <span className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                  {slot.entityId.slice(0, 10)}…
                </span>
              )}
              {slot.claimedAt && (
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {elapsed(slot.claimedAt)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
