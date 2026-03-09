import type { RadarState } from "@/components/radar/radar-panel";
import { RadarPanel } from "@/components/radar/radar-panel";
import { logger } from "@/lib/logger";
import type { EventLogEntry, Source, Watch } from "@/lib/radar-client";
import {
  getEventLog,
  getSlotPool,
  getSources,
  getSourceWatches,
  getWorkers,
} from "@/lib/radar-client";

const log = logger("radar-page");

export const dynamic = "force-dynamic";

export default async function RadarPage() {
  const [poolResult, workersResult, eventsResult, sourcesResult] = await Promise.allSettled([
    getSlotPool(),
    getWorkers(),
    getEventLog(100),
    getSources(),
  ]);

  for (const result of [poolResult, workersResult, eventsResult, sourcesResult]) {
    if (result.status === "rejected") {
      log.error("radar upstream failure", result.reason);
    }
  }

  const degraded = [poolResult, workersResult, eventsResult, sourcesResult].some(
    (r) => r.status === "rejected",
  );
  const pool =
    poolResult.status === "fulfilled" ? poolResult.value : { slots: [], available: 0, capacity: 0 };
  const workers = workersResult.status === "fulfilled" ? workersResult.value : [];
  const events: EventLogEntry[] = eventsResult.status === "fulfilled" ? eventsResult.value : [];
  const sources: Source[] = sourcesResult.status === "fulfilled" ? sourcesResult.value : [];

  const watchesBySource: Record<string, Watch[]> = {};
  if (sources.length > 0) {
    const watchResults = await Promise.allSettled(sources.map((s) => getSourceWatches(s.id)));
    for (let i = 0; i < sources.length; i++) {
      const result = watchResults[i];
      watchesBySource[sources[i].id] = result.status === "fulfilled" ? result.value : [];
    }
  }

  const initial: RadarState = {
    pool,
    workers,
    events,
    sources,
    watchesBySource,
    degraded,
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <h1
          className="text-sm font-bold tracking-[0.3em] uppercase"
          style={{ color: "var(--foreground)" }}
        >
          Radar
        </h1>
        <span className="text-xs tracking-wider" style={{ color: "var(--muted-foreground)" }}>
          / detection &amp; dispatch
        </span>
      </div>
      <RadarPanel initial={initial} />
    </div>
  );
}
