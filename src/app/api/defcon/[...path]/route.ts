import { type NextRequest, NextResponse } from "next/server";
import { DEFCON_ADMIN_TOKEN, DEFCON_URL } from "@/lib/config";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const search = req.nextUrl.search;
  const url = `${DEFCON_URL}/api/${path.map(encodeURIComponent).join("/")}${search}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(DEFCON_ADMIN_TOKEN ? { Authorization: `Bearer ${DEFCON_ADMIN_TOKEN}` } : {}),
      },
      next: { revalidate: 0 },
    });

    const body = await res.json();
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream unavailable" }, { status: 502 });
  }
}
