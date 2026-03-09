import { createEntity } from "@/lib/defcon-client";
import { logger } from "@/lib/logger";
import { loadSourcesConfig } from "./config";
import { isValidCron, lastCronFireTime, nextCronFireTime } from "./cron-parser";
import type { SourcesConfig } from "./types";

const log = logger("cron-scheduler");
const TICK_INTERVAL_MS = 15_000;

export interface SourceState {
  sourceName: string;
  type: "cron";
  lastFiredAt: number | null;
  nextFireAt: number;
  schedule?: string;
  interval_ms?: number;
}

export class CronScheduler {
  private states: Map<string, SourceState> = new Map();
  private watches: SourcesConfig["watches"] = {};
  private timer: ReturnType<typeof setInterval> | null = null;

  start(): void {
    const config = loadSourcesConfig();
    if (!config) return;

    this.watches = config.watches;
    const now = Date.now();

    for (const [name, source] of Object.entries(config.sources)) {
      if (source.type !== "cron") {
        log.warn(`Skipping non-cron source: ${name}`);
        continue;
      }

      const { schedule, interval_ms } = source.config;

      if (schedule && interval_ms) {
        log.error(`Source "${name}" has both schedule and interval_ms — skipping`);
        continue;
      }
      if (!schedule && !interval_ms) {
        log.error(`Source "${name}" has neither schedule nor interval_ms — skipping`);
        continue;
      }

      if (schedule) {
        if (!isValidCron(schedule)) {
          log.error(`Source "${name}" has invalid cron expression: ${schedule} — skipping`);
          continue;
        }
        // Check for missed fire: fire immediately if the last scheduled fire
        // is recent (within 2 tick intervals). This catches up if the process
        // was briefly down but avoids replaying old fires after long outages.
        const lastFire = lastCronFireTime(schedule, now);
        const missedFire = lastFire !== null && now - lastFire <= 2 * TICK_INTERVAL_MS;
        let nextFire: number;
        if (missedFire) {
          nextFire = now;
        } else {
          try {
            nextFire = nextCronFireTime(schedule, now);
          } catch (err) {
            log.error(
              `Source "${name}" has unreachable cron schedule: ${schedule} — skipping`,
              err,
            );
            continue;
          }
        }
        this.states.set(name, {
          sourceName: name,
          type: "cron",
          lastFiredAt: null,
          nextFireAt: nextFire,
          schedule,
        });
      } else if (interval_ms) {
        this.states.set(name, {
          sourceName: name,
          type: "cron",
          lastFiredAt: null,
          nextFireAt: now + interval_ms,
          interval_ms,
        });
      }

      log.info(`Registered cron source: ${name}`);
    }

    if (this.states.size === 0) {
      log.warn("No valid cron sources found");
      return;
    }

    this.timer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
    this.timer.unref();
    log.info(
      `Cron scheduler started with ${this.states.size} source(s), tick every ${TICK_INTERVAL_MS}ms`,
    );
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.states.clear();
    log.info("Cron scheduler stopped");
  }

  getSourceStates(): SourceState[] {
    return Array.from(this.states.values());
  }

  private tick(): void {
    const now = Date.now();

    for (const [name, state] of this.states) {
      if (now >= state.nextFireAt) {
        this.fire(name, state, now);
      }
    }
  }

  private fire(name: string, state: SourceState, now: number): void {
    log.info(`Firing cron source: ${name}`);

    state.lastFiredAt = now;
    if (state.schedule) {
      try {
        state.nextFireAt = nextCronFireTime(state.schedule, now);
      } catch (err) {
        log.error(`Failed to compute next fire time for "${name}", stopping source`, err);
        this.states.delete(name);
        return;
      }
    } else if (state.interval_ms) {
      state.nextFireAt = now + state.interval_ms;
    }

    for (const [watchName, watch] of Object.entries(this.watches)) {
      if (watch.source !== name) continue;
      if (watch.action !== "create_entity") continue;

      const { flow, refs, artifacts } = watch.action_config;
      log.info(`Watch "${watchName}" creating entity for flow "${flow}"`);

      createEntity({ flow, refs, artifacts }).catch((err) => {
        log.error(`Failed to create entity for watch "${watchName}"`, err);
      });
    }
  }
}

let _instance: CronScheduler | null = null;

export function getScheduler(): CronScheduler {
  if (!_instance) {
    _instance = new CronScheduler();
  }
  return _instance;
}
