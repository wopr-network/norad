"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ActivityItem } from "@/lib/radar-client";
import { getEntityActivity } from "@/lib/radar-client";

const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATES = new Set(["done", "failed", "cancelled"]);

function ActivityRow({ item, attemptNumber }: { item: ActivityItem; attemptNumber: number }) {
  const [expanded, setExpanded] = useState(false);

  let label: string;
  let labelColor: string;
  let summary: string;
  let detail: string | null = null;

  if (item.type === "start") {
    label = "▶";
    labelColor = "var(--accent-blue)";
    summary = `began attempt ${attemptNumber}`;
  } else if (item.type === "tool_use") {
    label = "⚙";
    labelColor = "var(--accent-orange, var(--muted-foreground))";
    const name = (item.data.name as string | undefined) ?? "unknown";
    const input = item.data.input as Record<string, unknown> | undefined;
    const compact = input ? JSON.stringify(input) : "";
    const truncated = compact.slice(0, 120);
    summary = truncated ? `${name} — ${truncated}${compact.length > 120 ? "…" : ""}` : name;
    if (input && compact.length > 120) {
      detail = JSON.stringify(input, null, 2);
    }
  } else if (item.type === "text") {
    label = "✎";
    labelColor = "var(--foreground)";
    const text = (item.data.text as string | undefined) ?? "";
    const lines = text.split("\n");
    if (lines.length > 3 || text.length > 500) {
      summary = `${lines.slice(0, 3).join(" ").slice(0, 120)}…`;
      detail = text;
    } else {
      summary = text;
    }
  } else {
    // result
    const signal = item.data.signal as string | undefined;
    const error = item.data.error as string | undefined;
    if (error) {
      label = "✗";
      labelColor = "var(--accent-red, #ef4444)";
      summary = error;
    } else {
      label = "✓";
      labelColor = "var(--accent-green)";
      summary = signal ? `signal: ${signal}` : "completed";
    }
  }

  const hasDetail = detail !== null;

  return (
    <div
      className="flex flex-col gap-0.5 py-1.5 border-b last:border-b-0"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex gap-3 text-xs">
        <span className="w-6 flex-shrink-0 font-mono" style={{ color: labelColor }}>
          {label}
        </span>
        <button
          type="button"
          className={`flex-1 font-mono text-left bg-transparent border-0 p-0 ${hasDetail ? "cursor-pointer hover:opacity-80" : ""}`}
          style={{ color: "var(--muted-foreground)", wordBreak: "break-word" }}
          onClick={hasDetail ? () => setExpanded((e) => !e) : undefined}
          disabled={!hasDetail}
          aria-disabled={!hasDetail}
          aria-expanded={hasDetail ? expanded : undefined}
        >
          {summary}
          {hasDetail && (
            <span
              className="ml-1.5 text-xs"
              style={{ color: "var(--accent-blue)" }}
              aria-hidden="true"
            >
              {expanded ? "▲" : "▼"}
            </span>
          )}
        </button>
      </div>
      {expanded && detail && (
        <pre
          className="text-xs ml-9 p-2 rounded overflow-x-auto"
          style={{
            color: "var(--foreground)",
            background: "var(--muted)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {detail}
        </pre>
      )}
    </div>
  );
}

interface ActivityFeedProps {
  entityId: string;
  entityState: string;
}

export function ActivityFeed({ entityId, entityState }: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const autoScrollRef = useRef(true);
  const nextSeqRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync so polling closure always sees latest value without being a dep
  autoScrollRef.current = autoScroll;

  // Scroll to bottom after React commits new items
  useEffect(() => {
    if (autoScrollRef.current && items.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    nextSeqRef.current = 0;
    setItems([]);

    const run = async () => {
      if (cancelled) return;
      try {
        const page = await getEntityActivity(entityId, nextSeqRef.current);
        if (!cancelled) {
          nextSeqRef.current = page.nextSeq;
          if (page.items.length > 0) {
            setItems((prev) => [...prev, ...page.items]);
          }
          if (!TERMINAL_STATES.has(entityState)) {
            timerRef.current = setTimeout(run, POLL_INTERVAL_MS);
          }
        }
      } catch {
        if (!cancelled && !TERMINAL_STATES.has(entityState)) {
          timerRef.current = setTimeout(run, POLL_INTERVAL_MS);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [entityId, entityState]);

  // Group items by slotId, preserving insertion order
  const groups = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    for (const item of items) {
      const key = item.slotId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  if (items.length === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        No activity yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          auto-scroll
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={autoScroll}
          aria-label="Auto-scroll"
          onClick={() => setAutoScroll((v) => !v)}
          className="relative inline-flex h-4 w-7 items-center rounded-full transition-colors"
          style={{ background: autoScroll ? "var(--accent-green)" : "var(--border)" }}
        >
          <span
            className="inline-block h-3 w-3 rounded-full transition-transform"
            style={{
              background: "var(--foreground)",
              transform: autoScroll ? "translateX(14px)" : "translateX(2px)",
            }}
          />
        </button>
      </div>
      <div className="flex flex-col">
        {groups.map(([slotId, slotItems], groupIdx) => (
          <div key={slotId} className="flex flex-col">
            {/* Attempt divider */}
            <div
              className="flex items-center gap-2 py-2"
              style={{ borderTop: groupIdx > 0 ? "1px solid var(--border)" : undefined }}
            >
              <span
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: "var(--muted-foreground)" }}
              >
                Attempt {groupIdx + 1}
              </span>
              <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                {slotId}
              </span>
            </div>
            {slotItems.map((item) => (
              <ActivityRow key={item.id} item={item} attemptNumber={groupIdx + 1} />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
