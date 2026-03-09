import type { Slot } from "@/lib/radar-client";

const DEAD_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

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

function isDead(slot: Slot): boolean {
  if (slot.status !== "working" || !slot.claimedAt) return false;
  return Date.now() - new Date(slot.claimedAt).getTime() > DEAD_THRESHOLD_MS;
}

interface SlotGridProps {
  slots: Slot[];
  available: number;
  capacity: number;
}

export function SlotGrid({ slots, available, capacity }: SlotGridProps) {
  const inUse = capacity - available;
  const deadCount = slots.filter(isDead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: "var(--muted-foreground)" }}
        >
          Slot Pool
        </h2>
        <div className="flex items-center gap-3">
          {deadCount > 0 && (
            <span className="text-xs font-bold" style={{ color: "var(--accent-red)" }}>
              {deadCount} DEAD
            </span>
          )}
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {inUse}/{capacity} in use
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {slots.map((slot) => {
          const dead = isDead(slot);
          const color = dead
            ? "var(--accent-red)"
            : (statusColors[slot.status] ?? "var(--muted-foreground)");
          const isWorking = slot.status === "working";
          return (
            <div
              key={slot.id}
              className="rounded border p-3 flex flex-col gap-1"
              style={{
                background: "var(--card)",
                borderColor: dead
                  ? "rgba(255,56,96,0.5)"
                  : isWorking
                    ? "rgba(0,255,136,0.25)"
                    : "var(--border)",
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
                    boxShadow: dead
                      ? "0 0 8px var(--accent-red)"
                      : isWorking
                        ? `0 0 6px ${color}`
                        : "none",
                  }}
                />
              </div>
              <span className="text-xs font-bold tracking-wider uppercase" style={{ color }}>
                {dead ? "DEAD" : slot.status}
              </span>
              {slot.workerId && (
                <span className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                  {slot.workerId}
                </span>
              )}
              {slot.entityId && (
                <span className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                  {slot.entityId.slice(0, 10)}…
                </span>
              )}
              {slot.claimedAt && (
                <span
                  className="text-xs"
                  style={{ color: dead ? "var(--accent-red)" : "var(--muted-foreground)" }}
                >
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
