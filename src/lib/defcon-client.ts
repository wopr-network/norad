import { SILO_ADMIN_TOKEN, SILO_URL, WOPR_TENANT_ID } from "./config";
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
  id: string;
  entityId: string;
  fromState: string;
  toState: string;
  trigger: string;
  invocationId?: string;
  timestamp: string;
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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": WOPR_TENANT_ID,
  };
  if (SILO_ADMIN_TOKEN) {
    headers.Authorization = `Bearer ${SILO_ADMIN_TOKEN}`;
  }
  return headers;
}

function resolveUrl(path: string): string {
  // Server-side: call silo directly. Browser-side: proxy through Next.js API route.
  if (typeof window === "undefined") {
    return `${SILO_URL}${path}`;
  }
  // path is like /api/status or /api/entities?... — strip /api/ prefix for proxy route
  return path.replace(/^\/api\//, "/api/defcon/");
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = resolveUrl(path);
  const isServerSide = typeof window === "undefined";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      ...init,
      signal: init?.signal ?? controller.signal,
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
  } catch (error) {
    log.error(`GET ${url} failed`, error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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

// ─── Integrations ───────────────────────────────────────────────────────────

export type IntegrationCategory = "issue_tracker" | "vcs";
export type IntegrationProvider = "linear" | "jira" | "github_issues" | "github" | "gitlab";

export interface IntegrationCredentials {
  provider: IntegrationProvider;
  accessToken: string;
  installationId?: number;
  workspaceId?: string;
  cloudId?: string;
  baseUrl?: string;
}

export interface Integration {
  id: string;
  tenantId: string;
  name: string;
  category: IntegrationCategory;
  provider: IntegrationProvider;
  createdAt: string;
  updatedAt: string;
}

export async function listIntegrations(category?: IntegrationCategory): Promise<Integration[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  const data = await fetchJson<{ integrations: Integration[] }>(`/api/admin/integrations${qs}`);
  return data.integrations;
}

export async function createIntegration(payload: {
  name: string;
  category: IntegrationCategory;
  provider: IntegrationProvider;
  credentials: IntegrationCredentials;
}): Promise<Integration> {
  const data = await fetchJson<{ integration: Integration }>("/api/admin/integrations", {
    method: "POST",
    body: JSON.stringify({ ...payload, tenant_id: WOPR_TENANT_ID }),
  });
  return data.integration;
}

export async function updateIntegrationCredentials(
  id: string,
  credentials: IntegrationCredentials,
): Promise<Integration> {
  const data = await fetchJson<{ integration: Integration }>(
    `/api/admin/integrations/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ credentials }),
    },
  );
  return data.integration;
}

export async function deleteIntegration(id: string): Promise<void> {
  await fetchJson<unknown>(`/api/admin/integrations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
