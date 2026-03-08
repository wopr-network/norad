"use client";

import { useEffect, useRef, useState } from "react";
import type { ActivityItem } from "@/lib/radar-client";
import { getEntityActivity } from "@/lib/radar-client";

const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATES = new Set(["done", "failed", "cancelled"]);

function rowLabel(type: ActivityItem["type"]): string {
  switch (type) {
    case "start":
      return "▶ start";
    case "tool_use":
      return "⚙ tool";
    case "text":
      return "✎ text";
    case "result":
      return "✓ result";
  }
}

function rowColor(type: ActivityItem["type"]): string {
  switch (type) {
    case "start":
      return "var(--accent-blue)";
    case "tool_use":
      return "var(--accent-orange, var(--muted-foreground))";
    case "text":
      return "var(--foreground)";
    case "result":
      return "var(--accent-green)";
  }
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const [expanded, setExpanded] = useState(item.type === "tool_use");

  let summary: string;
  let detail: string | null = null;

  if (item.type === "tool_use") {
    const name = item.data.name as string | undefined;
    const input = item.data.input as Record<string, unknown> | undefined;
    summary = name ?? "unknown";
    if (input && Object.keys(input).length > 0) {
      detail = JSON.stringify(input, null, 2);
    }
  } else if (item.type === "text") {
    const text = (item.data.text as string | undefined) ?? "";
    summary = text.slice(0, 120) + (text.length > 120 ? "…" : "");
    if (text.length > 120) detail = text;
  } else if (item.type === "result") {
    const subtype = item.data.subtype as string | undefined;
    const cost = item.data.cost_usd as number | undefined;
    summary = [subtype, cost != null ? `$${cost.toFixed(4)}` : null].filter(Boolean).join(" · ");
  } else {
    summary = `slot ${item.slotId}`;
  }

  const hasDetail = detail !== null;

  return (
    <div
      className="flex flex-col gap-0.5 py-1.5 border-b last:border-b-0"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex gap-3 text-xs">
        <span className="w-14 flex-shrink-0 font-mono" style={{ color: rowColor(item.type) }}>
          {rowLabel(item.type)}
        </span>
        <button
          type="button"
          className={`flex-1 font-mono text-left bg-transparent border-0 p-0 ${hasDetail ? "cursor-pointer hover:opacity-80" : ""}`}
          style={{ color: "var(--muted-foreground)", wordBreak: "break-word" }}
          onClick={hasDetail ? () => setExpanded((e) => !e) : undefined}
          disabled={!hasDetail}
        >
          {summary}
          {hasDetail && (
            <span className="ml-1.5 text-xs" style={{ color: "var(--accent-blue)" }}>
              {expanded ? "▲" : "▼"}
            </span>
          )}
        </button>
      </div>
      {expanded && detail && (
        <pre
          className="text-xs ml-[4.25rem] p-2 rounded overflow-x-auto"
          style={{
            color: "var(--foreground)",
            background: "var(--muted, rgba(255,255,255,0.05))",
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
  const nextSeqRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
            if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
  }, [entityId, entityState, autoScroll]);

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
        {items.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
