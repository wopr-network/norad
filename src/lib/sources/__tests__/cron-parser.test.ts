import { describe, expect, it } from "vitest";
import { isValidCron, nextCronFireTime } from "../cron-parser";

describe("isValidCron", () => {
  it("accepts standard 5-field cron", () => {
    expect(isValidCron("0 0 * * *")).toBe(true);
    expect(isValidCron("*/15 * * * *")).toBe(true);
    expect(isValidCron("0 9 * * 1-5")).toBe(true);
  });

  it("rejects invalid cron", () => {
    expect(isValidCron("")).toBe(false);
    expect(isValidCron("0 0 * *")).toBe(false); // 4 fields
    expect(isValidCron("60 0 * * *")).toBe(false); // minute > 59
    expect(isValidCron("0 25 * * *")).toBe(false); // hour > 23
    expect(isValidCron("0 0 32 * *")).toBe(false); // day > 31
    expect(isValidCron("0 0 * 13 *")).toBe(false); // month > 12
    expect(isValidCron("0 0 * * 8")).toBe(false); // dow > 7
  });
});

describe("nextCronFireTime", () => {
  it("returns next midnight for '0 0 * * *' from 2026-01-15 10:00 UTC", () => {
    const from = new Date("2026-01-15T10:00:00Z").getTime();
    const next = nextCronFireTime("0 0 * * *", from);
    expect(next).toBe(new Date("2026-01-16T00:00:00Z").getTime());
  });

  it("returns next 15-min mark for '*/15 * * * *'", () => {
    const from = new Date("2026-01-15T10:07:00Z").getTime();
    const next = nextCronFireTime("*/15 * * * *", from);
    expect(next).toBe(new Date("2026-01-15T10:15:00Z").getTime());
  });

  it("skips weekends for '0 9 * * 1-5' (Mon-Fri 9am)", () => {
    // 2026-01-17 is a Saturday
    const from = new Date("2026-01-17T10:00:00Z").getTime();
    const next = nextCronFireTime("0 9 * * 1-5", from);
    // Next Monday is Jan 19
    expect(next).toBe(new Date("2026-01-19T09:00:00Z").getTime());
  });

  it("handles exact match — returns next occurrence, not current", () => {
    const from = new Date("2026-01-15T00:00:00Z").getTime();
    const next = nextCronFireTime("0 0 * * *", from);
    expect(next).toBe(new Date("2026-01-16T00:00:00Z").getTime());
  });
});
