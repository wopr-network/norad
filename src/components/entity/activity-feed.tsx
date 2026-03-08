"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const toolName = item.type === "tool_use" ? (item.data.name as string | undefined) : undefined;
  const text = item.type === "text" ? (item.data.text as string | undefined) : undefined;
  const signal = item.type === "result" ? (item.data.signal as string | undefined) : undefined;

  return (
    <div
      className="flex gap-3 text-xs py-1 border-b last:border-b-0"
      style={{ borderColor: "var(--border)" }}
    >
      <span className="w-14 flex-shrink-0 font-mono" style={{ color: rowColor(item.type) }}>
        {rowLabel(item.type)}
      </span>
      <span className="flex-1 truncate" style={{ color: "var(--muted-foreground)" }}>
        {toolName ?? signal ?? (text ? text.slice(0, 120) : `slot ${item.slotId}`)}
      </span>
    </div>
  );
}

interface ActivityFeedProps {
  entityId: string;
  entityState: string;
}

export function ActivityFeed({ entityId, entityState }: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const nextSeqRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const page = await getEntityActivity(entityId, nextSeqRef.current);
      if (page.items.length > 0) {
        setItems((prev) => [...prev, ...page.items]);
        nextSeqRef.current = page.nextSeq;
      }
    } catch {
      // ignore transient errors — keep polling
    }
  }, [entityId]);

  useEffect(() => {
    poll();

    if (TERMINAL_STATES.has(entityState)) return;

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [poll, entityState]);

  if (items.length === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        No activity yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {items.map((item) => (
        <ActivityRow key={item.id} item={item} />
      ))}
    </div>
  );
}
