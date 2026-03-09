"use client";

import { useCallback, useEffect, useState } from "react";
import type { EventLogEntry, SlotPool, Source, Watch, Worker } from "@/lib/radar-client";
import { EventLogPanel } from "./event-log";
import { SlotGrid } from "./slot-grid";
import { SourcesPanel } from "./sources-panel";
import { WorkerList } from "./worker-list";

const POLL_INTERVAL = 10_000;

export interface RadarState {
  pool: SlotPool;
  workers: Worker[];
  events: EventLogEntry[];
  sources: Source[];
  watchesBySource: Record<string, Watch[]>;
  degraded: boolean;
}

async function fetchRadarState(): Promise<RadarState> {
  const [poolRes, workersRes, eventsRes, sourcesRes] = await Promise.allSettled([
    fetch("/api/radar/pool/slots").then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<SlotPool>;
    }),
    fetch("/api/radar/workers").then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<Worker[]>;
    }),
    fetch("/api/radar/events?limit=100").then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<EventLogEntry[]>;
    }),
    fetch("/api/radar/sources").then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<Source[]>;
    }),
  ]);

  const degraded = [poolRes, workersRes, eventsRes, sourcesRes].some(
    (r) => r.status === "rejected",
  );

  const pool =
    poolRes.status === "fulfilled" ? poolRes.value : { slots: [], available: 0, capacity: 0 };
  const workers = workersRes.status === "fulfilled" ? workersRes.value : [];
  const events = eventsRes.status === "fulfilled" ? eventsRes.value : [];
  const sources = sourcesRes.status === "fulfilled" ? sourcesRes.value : [];

  const watchesBySource: Record<string, Watch[]> = {};
  if (sources.length > 0) {
    const watchResults = await Promise.allSettled(
      sources.map((s) =>
        fetch(`/api/radar/sources/${encodeURIComponent(s.id)}/watches`).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<Watch[]>;
        }),
      ),
    );
    for (let i = 0; i < sources.length; i++) {
      const result = watchResults[i];
      watchesBySource[sources[i].id] = result.status === "fulfilled" ? result.value : [];
    }
  }

  return { pool, workers, events, sources, watchesBySource, degraded };
}

interface RadarPanelProps {
  initial: RadarState;
}

export function RadarPanel({ initial }: RadarPanelProps) {
  const [state, setState] = useState<RadarState>(initial);

  const refresh = useCallback(() => {
    fetchRadarState()
      .then(setState)
      .catch(() => {
        // ignore fetch errors — degraded state handled by fetchRadarState
      });
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="flex flex-col gap-8">
      {state.degraded && (
        <span
          className="text-xs font-bold tracking-wider uppercase"
          style={{ color: "var(--accent-red)" }}
        >
          DEGRADED — some upstream data unavailable
        </span>
      )}
      <SlotGrid
        slots={state.pool.slots}
        available={state.pool.available}
        capacity={state.pool.capacity}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <EventLogPanel events={state.events} />
        <WorkerList workers={state.workers} onDrainToggle={refresh} />
      </div>
      <SourcesPanel sources={state.sources} watchesBySource={state.watchesBySource} />
    </div>
  );
}
