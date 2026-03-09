interface CronFields {
  minutes: Set<number>;
  hours: Set<number>;
  daysOfMonth: Set<number>;
  months: Set<number>;
  daysOfWeek: Set<number>;
  domWild: boolean;
  dowWild: boolean;
}

function parseField(field: string, min: number, max: number): Set<number> | null {
  const values = new Set<number>();
  for (const part of field.split(",")) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    let range: string;
    let step = 1;
    if (stepMatch) {
      range = stepMatch[1];
      step = Number.parseInt(stepMatch[2], 10);
      if (Number.isNaN(step) || step <= 0) return null; // step of 0 or NaN is invalid (infinite loop)
    } else {
      range = part;
    }

    if (range === "*") {
      for (let i = min; i <= max; i += step) values.add(i);
    } else if (range.includes("-")) {
      const [startStr, endStr] = range.split("-");
      const start = Number.parseInt(startStr, 10);
      const end = Number.parseInt(endStr, 10);
      if (Number.isNaN(start) || Number.isNaN(end) || start < min || end > max || start > end) {
        return null;
      }
      for (let i = start; i <= end; i += step) values.add(i);
    } else {
      const val = Number.parseInt(range, 10);
      if (Number.isNaN(val) || val < min || val > max) return null;
      if (step > 1) {
        // scalar/step means "starting at val, every step up to max"
        for (let i = val; i <= max; i += step) values.add(i);
      } else {
        values.add(val);
      }
    }
  }
  return values.size > 0 ? values : null;
}

function parseCron(expression: string): CronFields | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const minutes = parseField(parts[0], 0, 59);
  const hours = parseField(parts[1], 0, 23);
  const daysOfMonth = parseField(parts[2], 1, 31);
  const months = parseField(parts[3], 1, 12);
  const daysOfWeek = parseField(parts[4], 0, 7);

  if (!minutes || !hours || !daysOfMonth || !months || !daysOfWeek) return null;

  // Normalize: treat 7 as 0 (both mean Sunday)
  if (daysOfWeek.has(7)) {
    daysOfWeek.add(0);
    daysOfWeek.delete(7);
  }

  // Track whether dom/dow were wildcards (affects OR vs AND matching)
  const domWild = parts[2] === "*";
  const dowWild = parts[4] === "*";

  return { minutes, hours, daysOfMonth, months, daysOfWeek, domWild, dowWild };
}

function matchesDayFields(fields: CronFields, d: Date): boolean {
  const domMatch = fields.daysOfMonth.has(d.getUTCDate());
  const dowMatch = fields.daysOfWeek.has(d.getUTCDay());
  // Standard cron: if both dom and dow are restricted (non-wildcard), match if either matches (OR)
  // If only one is restricted, require that one to match
  if (!fields.domWild && !fields.dowWild) return domMatch || dowMatch;
  if (fields.domWild) return dowMatch;
  return domMatch;
}

export function isValidCron(expression: string): boolean {
  return parseCron(expression) !== null;
}

/**
 * Returns the most recent fire time at or before `nowMs`, or null if none in last year.
 * Used to detect missed fires on restart.
 */
export function lastCronFireTime(expression: string, nowMs: number): number | null {
  const fields = parseCron(expression);
  if (!fields) throw new Error(`Invalid cron expression: ${expression}`);

  // Start from the current minute (truncated to minute boundary)
  const d = new Date(nowMs);
  d.setUTCSeconds(0, 0);

  // Check if current minute matches
  if (
    fields.months.has(d.getUTCMonth() + 1) &&
    matchesDayFields(fields, d) &&
    fields.hours.has(d.getUTCHours()) &&
    fields.minutes.has(d.getUTCMinutes())
  ) {
    return d.getTime();
  }

  // Scan backward minute by minute, up to ~1 year (safety limit)
  const limit = nowMs - 365 * 24 * 60 * 60 * 1000;
  d.setUTCMinutes(d.getUTCMinutes() - 1);
  while (d.getTime() >= limit) {
    if (
      fields.months.has(d.getUTCMonth() + 1) &&
      matchesDayFields(fields, d) &&
      fields.hours.has(d.getUTCHours()) &&
      fields.minutes.has(d.getUTCMinutes())
    ) {
      return d.getTime();
    }
    d.setUTCMinutes(d.getUTCMinutes() - 1);
  }

  return null;
}

export function nextCronFireTime(expression: string, fromMs: number): number {
  const fields = parseCron(expression);
  if (!fields) throw new Error(`Invalid cron expression: ${expression}`);

  // Start from the next minute after `from`
  const d = new Date(fromMs);
  d.setUTCSeconds(0, 0);
  d.setUTCMinutes(d.getUTCMinutes() + 1);

  // Scan forward minute by minute, up to ~2 years (safety limit)
  const limit = fromMs + 2 * 365 * 24 * 60 * 60 * 1000;
  while (d.getTime() <= limit) {
    if (
      fields.months.has(d.getUTCMonth() + 1) &&
      matchesDayFields(fields, d) &&
      fields.hours.has(d.getUTCHours()) &&
      fields.minutes.has(d.getUTCMinutes())
    ) {
      return d.getTime();
    }
    d.setUTCMinutes(d.getUTCMinutes() + 1);
  }

  throw new Error(`No matching time found within 2 years for: ${expression}`);
}
