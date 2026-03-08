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

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${RADAR_URL}${path}`;
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
