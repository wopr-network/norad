import { type NextRequest, NextResponse } from "next/server";
import { SILO_ADMIN_TOKEN, SILO_URL, WOPR_TENANT_ID } from "@/lib/config";

function siloHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Tenant-Id": WOPR_TENANT_ID,
    ...(SILO_ADMIN_TOKEN ? { Authorization: `Bearer ${SILO_ADMIN_TOKEN}` } : {}),
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const search = req.nextUrl.search;
  const url = `${SILO_URL}/api/${path.map(encodeURIComponent).join("/")}${search}`;

  try {
    const res = await fetch(url, { headers: siloHeaders(), next: { revalidate: 0 } });
    const body = await res.json();
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream unavailable" }, { status: 502 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${SILO_URL}/api/${path.map(encodeURIComponent).join("/")}`;

  try {
    const body = await req.text();
    const res = await fetch(url, {
      method: "POST",
      headers: siloHeaders(),
      body: body || undefined,
    });
    if (res.status === 204 || !res.headers.get("content-type")?.includes("application/json")) {
      return new NextResponse(null, { status: res.status });
    }
    const responseBody = await res.json();
    return NextResponse.json(responseBody, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream unavailable" }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${SILO_URL}/api/${path.map(encodeURIComponent).join("/")}`;

  try {
    const body = await req.text();
    const res = await fetch(url, {
      method: "PATCH",
      headers: siloHeaders(),
      body: body || undefined,
    });
    if (res.status === 204 || !res.headers.get("content-type")?.includes("application/json")) {
      return new NextResponse(null, { status: res.status });
    }
    const responseBody = await res.json();
    return NextResponse.json(responseBody, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream unavailable" }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${SILO_URL}/api/${path.map(encodeURIComponent).join("/")}`;

  try {
    const res = await fetch(url, { method: "DELETE", headers: siloHeaders() });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const responseBody = await res.json();
    return NextResponse.json(responseBody, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream unavailable" }, { status: 502 });
  }
}
