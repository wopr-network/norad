import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({
  RADAR_URL: "http://test-radar",
}));

import { getEntityActivity } from "@/lib/radar-client";

describe("getEntityActivity", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches activity with since=0 by default", async () => {
    const mockPage = {
      items: [
        {
          id: "a1",
          entityId: "e1",
          slotId: "s1",
          seq: 1,
          type: "start",
          data: {},
          createdAt: 1000,
        },
      ],
      nextSeq: 2,
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPage),
    });

    const result = await getEntityActivity("e1");
    expect(result).toEqual(mockPage);

    const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://test-radar/api/entities/e1/activity?since=0");
  });

  it("passes since parameter", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [], nextSeq: 5 }),
    });

    await getEntityActivity("e1", 5);

    const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://test-radar/api/entities/e1/activity?since=5");
  });

  it("throws on non-ok response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(getEntityActivity("e1")).rejects.toThrow("RADAR 500");
  });
});
