import { DEFCON_ADMIN_TOKEN, DEFCON_URL } from "./config";
import { logger } from "./logger";

const log = logger("defcon-client");

export interface FlowState {
  id: string;
  name: string;
  mode?: string;
  modelTier?: string;
}

export interface FlowTransition {
  from: string;
  to: string;
  on?: string;
}

export interface Flow {
  id: string;
  name: string;
  states: FlowState[];
  transitions: FlowTransition[];
}

export interface EntityRefs {
  linear?: { id: string; key: string; title: string };
  github?: { repo: string };
}

export interface EntityHistory {
  state: string;
  enteredAt: string;
  exitedAt?: string;
}

export interface Entity {
  id: string;
  flowId: string;
  state: string;
  artifacts: Record<string, unknown>;
  refs: EntityRefs;
  history: EntityHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface DefconStatus {
  flows: Record<string, Record<string, number>>;
  activeInvocations: number;
  pendingClaims: number;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (DEFCON_ADMIN_TOKEN) {
    headers.Authorization = `Bearer ${DEFCON_ADMIN_TOKEN}`;
  }
  return headers;
}

function resolveUrl(path: string): string {
  // Server-side: call DEFCON directly. Browser-side: proxy through Next.js API route.
  if (typeof window === "undefined") {
    return `${DEFCON_URL}${path}`;
  }
  // path is like /api/status or /api/entities?... — strip /api/ prefix for proxy route
  return path.replace(/^\/api\//, "/api/defcon/");
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = resolveUrl(path);
  const isServerSide = typeof window === "undefined";
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(isServerSide ? authHeaders() : {}),
      ...(init?.headers ?? {}),
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    log.error(`GET ${url} → ${res.status}`);
    throw new Error(`DEFCON ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function getDefconStatus(): Promise<DefconStatus> {
  return fetchJson<DefconStatus>("/api/status");
}

export async function getFlows(): Promise<Flow[]> {
  return fetchJson<Flow[]>("/api/flows");
}

export async function getEntitiesByState(flowName: string, state: string): Promise<Entity[]> {
  return fetchJson<Entity[]>(
    `/api/entities?flow=${encodeURIComponent(flowName)}&state=${encodeURIComponent(state)}`,
  );
}

export async function getEntity(id: string): Promise<Entity> {
  return fetchJson<Entity>(`/api/entities/${encodeURIComponent(id)}`);
}
