import { type NextRequest, NextResponse } from "next/server";
import { RADAR_URL } from "@/lib/config";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const search = req.nextUrl.search;
  const url = `${RADAR_URL}/api/${path.map(encodeURIComponent).join("/")}${search}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 0 },
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "upstream unavailable" }, { status: 502 });
    }

    const body = await res.json();
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream unavailable" }, { status: 502 });
  }
}
