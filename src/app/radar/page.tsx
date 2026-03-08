import { EventLogPanel } from "@/components/radar/event-log";
import { SlotGrid } from "@/components/radar/slot-grid";
import { WorkerList } from "@/components/radar/worker-list";
import { logger } from "@/lib/logger";
import { getEvents, getSlotPool, getWorkers } from "@/lib/radar-client";

const log = logger("radar-page");

export const dynamic = "force-dynamic";

export default async function RadarPage() {
  const [poolResult, workersResult, eventsResult] = await Promise.allSettled([
    getSlotPool(),
    getWorkers(),
    getEvents(50),
  ]);

  const degraded = [poolResult, workersResult, eventsResult].some((r) => r.status === "rejected");
  if (degraded) {
    for (const result of [poolResult, workersResult, eventsResult]) {
      if (result.status === "rejected") {
        log.error("radar upstream failure", result.reason);
      }
    }
  }

  const pool =
    poolResult.status === "fulfilled" ? poolResult.value : { slots: [], available: 0, capacity: 0 };
  const workers = workersResult.status === "fulfilled" ? workersResult.value : [];
  const events = eventsResult.status === "fulfilled" ? eventsResult.value : [];

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
          / worker pool
        </span>
        {degraded && (
          <span
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: "var(--accent-red)" }}
          >
            DEGRADED
          </span>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <SlotGrid slots={pool.slots} available={pool.available} capacity={pool.capacity} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <EventLogPanel events={events} />
          <WorkerList workers={workers} />
        </div>
      </div>
    </div>
  );
}
