"use client";

import { useEffect, useState } from "react";
import type { EventLogEntry } from "@/lib/radar-client";

const PAGE_SIZE = 20;

const typeColors: Record<string, string> = {
  "entity.created": "var(--accent-green)",
  "entity.transitioned": "var(--accent-blue)",
  "entity.claimed": "var(--accent-amber)",
  "entity.updated": "var(--muted-foreground)",
};

const SIGNAL_TYPES = [
  "spec_ready",
  "pr_created",
  "clean",
  "issues",
  "fixes_pushed",
  "merged",
  "crash",
] as const;

function signalColor(signal: string): string {
  const map: Record<string, string> = {
    spec_ready: "var(--accent-blue)",
    pr_created: "var(--accent-green)",
    clean: "var(--accent-green)",
    issues: "var(--accent-amber)",
    fixes_pushed: "var(--accent-amber)",
    merged: "var(--accent-green)",
    crash: "var(--accent-red)",
  };
  return map[signal] ?? "var(--muted-foreground)";
}

function extractSignal(event: EventLogEntry): string | null {
  const action = event.action_taken;
  if (!action) return null;
  for (const s of SIGNAL_TYPES) {
    if (action.includes(s)) return s;
  }
  return null;
}

interface EventLogPanelProps {
  events: EventLogEntry[];
}

export function EventLogPanel({ events }: EventLogPanelProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const signalCounts: Record<string, number> = {};
  for (const ev of events) {
    const sig = extractSignal(ev);
    if (sig) signalCounts[sig] = (signalCounts[sig] ?? 0) + 1;
  }
  const maxSignalCount = Math.max(1, ...Object.values(signalCounts));

  const filtered = search
    ? events.filter((ev) => {
        const term = search.toLowerCase();
        return (
          (ev.action_taken ?? "").toLowerCase().includes(term) ||
          ev.source_id.toLowerCase().includes(term) ||
          ev.id.toLowerCase().includes(term)
        );
      })
    : events;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => (p >= totalPages ? 0 : p));
  }, [totalPages]);
  const pageEvents = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <h2
        className="text-xs font-bold tracking-widest uppercase mb-3"
        style={{ color: "var(--muted-foreground)" }}
      >
        Event Log
      </h2>

      {Object.keys(signalCounts).length > 0 && (
        <div className="mb-3 flex flex-col gap-1">
          {SIGNAL_TYPES.filter((s) => signalCounts[s]).map((sig) => (
            <div key={sig} className="flex items-center gap-2 text-xs">
              <span
                className="w-16 text-right font-mono truncate"
                style={{ color: signalColor(sig) }}
              >
                {sig}
              </span>
              <div
                className="flex-1 h-2 rounded overflow-hidden"
                style={{ background: "var(--muted)" }}
              >
                <div
                  className="h-full rounded"
                  style={{
                    width: `${(signalCounts[sig] / maxSignalCount) * 100}%`,
                    background: signalColor(sig),
                    opacity: 0.7,
                  }}
                />
              </div>
              <span
                className="w-6 text-right font-mono"
                style={{ color: "var(--muted-foreground)" }}
              >
                {signalCounts[sig]}
              </span>
            </div>
          ))}
        </div>
      )}

      <input
        type="text"
        placeholder="Search events..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        className="w-full px-3 py-1.5 mb-2 rounded border text-xs font-mono"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
      />

      <div className="rounded border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="overflow-y-auto max-h-64">
          {pageEvents.length === 0 ? (
            <div className="text-xs text-center py-6" style={{ color: "var(--muted-foreground)" }}>
              {search ? "no matching events" : "no events"}
            </div>
          ) : (
            pageEvents.map((ev) => {
              const action = ev.action_taken ?? "—";
              const color = typeColors[action] ?? "var(--muted-foreground)";
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
                  <span
                    className="flex-1 truncate font-mono"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {ev.source_id.slice(0, 8)}
                  </span>
                  <span className="flex-1 truncate font-mono" style={{ color }}>
                    {action}
                  </span>
                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="text-xs font-mono px-2 py-1 rounded border"
            style={{
              borderColor: "var(--border)",
              color: page === 0 ? "var(--muted-foreground)" : "var(--foreground)",
              opacity: page === 0 ? 0.4 : 1,
              cursor: page === 0 ? "default" : "pointer",
              background: "transparent",
            }}
          >
            prev
          </button>
          <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
            {page + 1}/{totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="text-xs font-mono px-2 py-1 rounded border"
            style={{
              borderColor: "var(--border)",
              color: page >= totalPages - 1 ? "var(--muted-foreground)" : "var(--foreground)",
              opacity: page >= totalPages - 1 ? 0.4 : 1,
              cursor: page >= totalPages - 1 ? "default" : "pointer",
              background: "transparent",
            }}
          >
            next
          </button>
        </div>
      )}
    </div>
  );
}
