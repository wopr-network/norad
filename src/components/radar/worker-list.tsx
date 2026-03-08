import type { BadgeVariant } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import type { Worker } from "@/lib/radar-client";

function workerStatusVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (s === "active" || s === "online") return "green";
  if (s === "idle") return "muted";
  if (s === "error" || s === "offline") return "red";
  return "muted";
}

function heartbeatAge(ts?: string): string {
  if (!ts) return "never";
  const ms = Date.now() - new Date(ts).getTime();
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

interface WorkerListProps {
  workers: Worker[];
}

export function WorkerList({ workers }: WorkerListProps) {
  return (
    <div>
      <h2
        className="text-xs font-bold tracking-widest uppercase mb-3"
        style={{ color: "var(--muted-foreground)" }}
      >
        Workers
      </h2>
      <div className="flex flex-col gap-2">
        {workers.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            no workers registered
          </p>
        ) : (
          workers.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between rounded border px-3 py-2 text-xs"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex flex-col gap-0.5">
                <span style={{ color: "var(--foreground)" }}>{w.name}</span>
                <span style={{ color: "var(--muted-foreground)" }}>
                  {w.type}
                  {w.discipline ? ` · ${w.discipline}` : ""}
                </span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <Badge variant={workerStatusVariant(w.status)}>{w.status}</Badge>
                <span style={{ color: "var(--muted-foreground)" }}>
                  {heartbeatAge(w.last_heartbeat)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
