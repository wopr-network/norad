import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({
	DEFCON_URL: "http://localhost:3001",
	DEFCON_ADMIN_TOKEN: "test-token",
}));

import { createEntity, reportSignal } from "@/lib/defcon-client";

describe("createEntity", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("POSTs to /api/entities and returns the entity", async () => {
		const mockEntity = { id: "e1", flowId: "f1", state: "init", artifacts: {} };
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockEntity),
		});

		const result = await createEntity("my-flow", { github: { repo: "wopr-network/wopr" } });
		expect(result).toEqual(mockEntity);

		const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(url).toBe("http://localhost:3001/api/entities");
		expect(opts.method).toBe("POST");
		expect(JSON.parse(opts.body)).toEqual({
			flow: "my-flow",
			refs: { github: { repo: "wopr-network/wopr" } },
		});
	});

	it("throws on non-ok response", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
		});

		await expect(createEntity("my-flow")).rejects.toThrow("DEFCON 500");
	});
});

describe("reportSignal", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("POSTs to /api/entities/:id/report with signal and artifacts", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ ok: true }),
		});

		await reportSignal("e1", "provisioned", {
			worktreePath: "/tmp/wt/feature/WOP-123",
			branch: "feature/WOP-123",
			repo: "wopr-network/wopr",
		});

		const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(url).toBe("http://localhost:3001/api/entities/e1/report");
		expect(opts.method).toBe("POST");
		const body = JSON.parse(opts.body);
		expect(body.signal).toBe("provisioned");
		expect(body.artifacts.worktreePath).toBe("/tmp/wt/feature/WOP-123");
	});
});
