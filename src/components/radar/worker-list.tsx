"use client";

import { useState } from "react";
import type { BadgeVariant } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import type { Worker } from "@/lib/radar-client";

function workerStatusVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (s === "active" || s === "online") return "green";
  if (s === "idle") return "muted";
  if (s === "draining") return "amber";
  if (s === "error" || s === "offline") return "red";
  return "muted";
}

function heartbeatAge(ts?: string | number): string {
  if (!ts) return "never";
  const time = typeof ts === "number" ? ts : new Date(ts).getTime();
  const ms = Date.now() - time;
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

interface WorkerListProps {
  workers: Worker[];
  onDrainToggle?: () => void;
}

export function WorkerList({ workers, onDrainToggle }: WorkerListProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleDrain(workerId: string, isDrained: boolean) {
    setLoading(workerId);
    try {
      const action = isDrained ? "undrain" : "drain";
      await fetch(`/api/defcon/admin/workers/${encodeURIComponent(workerId)}/${action}`, {
        method: "POST",
      });
      onDrainToggle?.();
    } finally {
      setLoading(null);
    }
  }

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
          workers.map((w) => {
            const isDrained =
              w.status.toLowerCase() === "draining" || w.status.toLowerCase() === "drained";
            return (
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
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end gap-0.5">
                    <Badge variant={workerStatusVariant(w.status)}>{w.status}</Badge>
                    <span style={{ color: "var(--muted-foreground)" }}>
                      {heartbeatAge(w.last_heartbeat)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={loading === w.id}
                    onClick={() => toggleDrain(w.id, isDrained)}
                    className="px-2 py-1 rounded border text-xs font-mono tracking-wider uppercase transition-colors"
                    style={{
                      borderColor: isDrained ? "rgba(0,255,136,0.3)" : "rgba(255,56,96,0.3)",
                      color: isDrained ? "var(--accent-green)" : "var(--accent-red)",
                      background: "transparent",
                      opacity: loading === w.id ? 0.5 : 1,
                      cursor: loading === w.id ? "wait" : "pointer",
                    }}
                  >
                    {isDrained ? "undrain" : "drain"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
