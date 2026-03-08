import type { EventLog } from "@/lib/radar-client";

const typeColors: Record<string, string> = {
  "entity.created": "var(--accent-green)",
  "entity.transitioned": "var(--accent-blue)",
  "entity.claimed": "var(--accent-amber)",
  "entity.updated": "var(--muted-foreground)",
};

interface EventLogPanelProps {
  events: EventLog[];
}

export function EventLogPanel({ events }: EventLogPanelProps) {
  return (
    <div>
      <h2
        className="text-xs font-bold tracking-widest uppercase mb-3"
        style={{ color: "var(--muted-foreground)" }}
      >
        Event Log
      </h2>
      <div className="rounded border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="overflow-y-auto max-h-64">
          {events.length === 0 ? (
            <div className="text-xs text-center py-6" style={{ color: "var(--muted-foreground)" }}>
              no events
            </div>
          ) : (
            events.map((ev) => {
              const color = typeColors[ev.type] ?? "var(--muted-foreground)";
              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 px-3 py-2 border-b text-xs"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <span className="flex-1 truncate font-mono" style={{ color }}>
                    {ev.type}
                  </span>
                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {new Date(ev.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
