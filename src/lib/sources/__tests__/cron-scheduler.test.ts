import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CronSourceConfig } from "../types";

// Mock defcon-client before importing scheduler
vi.mock("@/lib/defcon-client", () => ({
  createEntity: vi.fn().mockResolvedValue({ id: "ent-1" }),
}));

// Mock config loader
vi.mock("../config", () => ({
  loadSourcesConfig: vi.fn(),
}));

import { createEntity } from "@/lib/defcon-client";
import { loadSourcesConfig } from "../config";
import { CronScheduler } from "../cron-scheduler";

const mockCreateEntity = vi.mocked(createEntity);
const mockLoadConfig = vi.mocked(loadSourcesConfig);

describe("CronScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00Z"));
    mockCreateEntity.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires a cron source when next fire time passes", async () => {
    mockLoadConfig.mockReturnValue({
      sources: {
        "every-minute": { type: "cron", config: { schedule: "* * * * *" } },
      },
      watches: {
        "do-thing": {
          source: "every-minute",
          filter: {},
          action: "create_entity",
          action_config: { flow: "test-flow" },
        },
      },
    });

    const scheduler = new CronScheduler();
    scheduler.start();

    // Advance 61 seconds (past the first fire + tick interval)
    await vi.advanceTimersByTimeAsync(61_000);

    expect(mockCreateEntity).toHaveBeenCalledWith({
      flow: "test-flow",
      refs: undefined,
      artifacts: undefined,
    });

    scheduler.stop();
  });

  it("uses interval_ms when schedule is not set", async () => {
    mockLoadConfig.mockReturnValue({
      sources: {
        "every-5s": { type: "cron", config: { interval_ms: 5000 } },
      },
      watches: {
        "do-thing": {
          source: "every-5s",
          filter: {},
          action: "create_entity",
          action_config: { flow: "interval-flow" },
        },
      },
    });

    const scheduler = new CronScheduler();
    scheduler.start();

    await vi.advanceTimersByTimeAsync(16_000); // tick at 15s

    expect(mockCreateEntity).toHaveBeenCalledWith({
      flow: "interval-flow",
      refs: undefined,
      artifacts: undefined,
    });

    scheduler.stop();
  });

  it("fires once on restart for missed cron (not N times)", async () => {
    mockLoadConfig.mockReturnValue({
      sources: {
        "every-minute": { type: "cron", config: { schedule: "* * * * *" } },
      },
      watches: {
        w: {
          source: "every-minute",
          filter: {},
          action: "create_entity",
          action_config: { flow: "catch-up" },
        },
      },
    });

    // Simulate: scheduler starts 5 minutes after last expected fire
    vi.setSystemTime(new Date("2026-01-15T00:05:30Z"));

    const scheduler = new CronScheduler();
    scheduler.start();

    // First tick fires the catch-up
    await vi.advanceTimersByTimeAsync(15_000);

    // Should fire exactly once (catch-up), not 5 times
    expect(mockCreateEntity).toHaveBeenCalledTimes(1);

    scheduler.stop();
  });

  it("does nothing when config file is missing", () => {
    mockLoadConfig.mockReturnValue(null);

    const scheduler = new CronScheduler();
    scheduler.start();
    scheduler.stop();

    expect(mockCreateEntity).not.toHaveBeenCalled();
  });

  it("skips sources with invalid cron and neither schedule nor interval_ms", async () => {
    mockLoadConfig.mockReturnValue({
      sources: {
        "bad-source": { type: "cron", config: {} as CronSourceConfig },
      },
      watches: {
        w: {
          source: "bad-source",
          filter: {},
          action: "create_entity",
          action_config: { flow: "never" },
        },
      },
    });

    const scheduler = new CronScheduler();
    scheduler.start();

    await vi.advanceTimersByTimeAsync(60_000);

    expect(mockCreateEntity).not.toHaveBeenCalled();

    scheduler.stop();
  });

  it("getSourceStates returns current state for GET /api/sources", () => {
    mockLoadConfig.mockReturnValue({
      sources: {
        nightly: { type: "cron", config: { schedule: "0 0 * * *" } },
      },
      watches: {},
    });

    const scheduler = new CronScheduler();
    scheduler.start();

    const states = scheduler.getSourceStates();
    expect(states).toHaveLength(1);
    expect(states[0].sourceName).toBe("nightly");
    expect(states[0].nextFireAt).toBeGreaterThan(0);
    expect(states[0].lastFiredAt).toBeNull();

    scheduler.stop();
  });
});
