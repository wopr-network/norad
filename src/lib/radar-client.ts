import { RADAR_URL } from "./config";
import { logger } from "./logger";

const log = logger("radar-client");

export type SlotStatus = "idle" | "claiming" | "working";

export interface Slot {
  id: string;
  status: SlotStatus;
  workerId?: string;
  entityId?: string;
  claimedAt?: string;
}

export interface Worker {
  id: string;
  name: string;
  type: string;
  discipline?: string;
  status: string;
  last_heartbeat?: string;
}

export interface EventLog {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface SlotPool {
  slots: Slot[];
  available: number;
  capacity: number;
}

function resolveUrl(path: string): string {
  if (typeof window === "undefined") {
    return `${RADAR_URL}${path}`;
  }
  // Browser: proxy through Next.js API route to avoid cross-origin issues
  return path.replace(/^\/api\//, "/api/radar/");
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = resolveUrl(path);
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    log.error(`GET ${url} → ${res.status}`);
    throw new Error(`RADAR ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function getSlotPool(): Promise<SlotPool> {
  return fetchJson<SlotPool>("/api/pool/slots");
}

export async function getWorkers(): Promise<Worker[]> {
  return fetchJson<Worker[]>("/api/workers");
}

export async function getEvents(limit = 50, offset = 0): Promise<EventLog[]> {
  return fetchJson<EventLog[]>(`/api/events?limit=${limit}&offset=${offset}`);
}

export interface ActivityItem {
  id: string;
  entityId: string;
  slotId: string;
  seq: number;
  type: "start" | "tool_use" | "text" | "result";
  data: Record<string, unknown>;
  createdAt: number;
}

export interface ActivityPage {
  items: ActivityItem[];
  nextSeq: number;
}

export async function getEntityActivity(entityId: string, since = 0): Promise<ActivityPage> {
  return fetchJson<ActivityPage>(`/api/entities/${entityId}/activity?since=${since}`);
}

export interface Source {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  enabled: boolean;
  created_at: number;
  updated_at: number;
}

export interface Watch {
  id: string;
  source_id: string;
  name: string;
  filter: Record<string, unknown>;
  action: string;
  action_config: Record<string, unknown>;
  enabled: boolean;
  created_at: number;
  updated_at: number;
}

export interface EventLogEntry {
  id: string;
  source_id: string;
  watch_id: string | null;
  raw_event: unknown;
  action_taken: string | null;
  defcon_response: unknown;
  created_at: number;
}

export async function getSources(): Promise<Source[]> {
  return fetchJson<Source[]>("/api/sources");
}

export async function getSourceWatches(sourceId: string): Promise<Watch[]> {
  return fetchJson<Watch[]>(`/api/sources/${encodeURIComponent(sourceId)}/watches`);
}

export async function getEventLog(limit = 50, offset = 0): Promise<EventLogEntry[]> {
  return fetchJson<EventLogEntry[]>(`/api/events?limit=${limit}&offset=${offset}`);
}
