const DEFCON_URL = process.env.DEFCON_URL ?? "http://localhost:3001";
const DEFCON_ADMIN_TOKEN = process.env.DEFCON_ADMIN_TOKEN ?? "";

export interface CreatedEntity {
  id: string;
  flowId: string;
  state: string;
}

export async function createEntity(flowName: string): Promise<CreatedEntity> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (DEFCON_ADMIN_TOKEN) {
    headers.Authorization = `Bearer ${DEFCON_ADMIN_TOKEN}`;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  const res = await fetch(`${DEFCON_URL}/api/entities`, {
    method: "POST",
    headers,
    body: JSON.stringify({ flow: flowName }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  if (!res.ok) {
    throw new Error(`DEFCON POST /api/entities failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<CreatedEntity>;
}
