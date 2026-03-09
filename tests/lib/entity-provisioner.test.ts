import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({
	DEFCON_URL: "http://localhost:3001",
	DEFCON_ADMIN_TOKEN: "",
	WORKTREE_BASE: "/tmp/norad-worktrees",
	NORAD_REPO_PATH: "/repos/wopr",
}));

vi.mock("@/lib/defcon-client", () => ({
	createEntity: vi.fn(),
	reportSignal: vi.fn(),
}));

vi.mock("@/lib/github-worktree", () => ({
	createWorktree: vi.fn(),
	removeWorktree: vi.fn(),
	validateWorktreePath: vi.fn((base: string, sub: string) => `${base}/${sub}`),
}));

import { cleanupEntityWorktree, provisionGitHubEntity } from "@/lib/entity-provisioner";
import { createEntity, reportSignal } from "@/lib/defcon-client";
import { createWorktree, removeWorktree, validateWorktreePath } from "@/lib/github-worktree";

const mockCreateEntity = vi.mocked(createEntity);
const mockReportSignal = vi.mocked(reportSignal);
const mockCreateWorktree = vi.mocked(createWorktree);
const mockRemoveWorktree = vi.mocked(removeWorktree);
const mockValidatePath = vi.mocked(validateWorktreePath);

describe("provisionGitHubEntity", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateEntity.mockResolvedValue({
			id: "e1",
			flowId: "f1",
			state: "init",
			artifacts: {},
			refs: {},
			history: [],
			createdAt: "2026-01-01T00:00:00Z",
			updatedAt: "2026-01-01T00:00:00Z",
		});
		mockReportSignal.mockResolvedValue(undefined);
		mockCreateWorktree.mockResolvedValue(undefined);
		mockValidatePath.mockImplementation((base, sub) => `${base}/${sub}`);
	});

	it("creates entity, provisions worktree, and reports artifacts", async () => {
		const result = await provisionGitHubEntity({
			flowName: "wopr-auto",
			externalId: "WOP-123",
			repo: "wopr-network/wopr",
		});

		expect(mockCreateEntity).toHaveBeenCalledWith(
			"wopr-auto",
			{ github: { repo: "wopr-network/wopr" } },
			undefined,
		);

		expect(mockValidatePath).toHaveBeenCalledWith("/tmp/norad-worktrees", "feature/WOP-123");

		expect(mockCreateWorktree).toHaveBeenCalledWith(
			"/repos/wopr",
			"feature/WOP-123",
			"/tmp/norad-worktrees/feature/WOP-123",
		);

		expect(mockReportSignal).toHaveBeenCalledWith("e1", "provisioned", {
			worktreePath: "/tmp/norad-worktrees/feature/WOP-123",
			branch: "feature/WOP-123",
			repo: "wopr-network/wopr",
		});

		expect(result.entity.id).toBe("e1");
		expect(result.worktree.branch).toBe("feature/WOP-123");
	});

	it("signals failure to defcon if worktree creation fails", async () => {
		mockCreateWorktree.mockRejectedValue(new Error("git failed"));

		await expect(
			provisionGitHubEntity({
				flowName: "wopr-auto",
				externalId: "WOP-123",
				repo: "wopr-network/wopr",
			}),
		).rejects.toThrow("git failed");

		expect(mockReportSignal).toHaveBeenCalledWith("e1", "failed", {
			error: "Error: git failed",
		});
	});
});

describe("cleanupEntityWorktree", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRemoveWorktree.mockResolvedValue(undefined);
	});

	it("removes the worktree", async () => {
		await cleanupEntityWorktree("e1", "/tmp/norad-worktrees/feature/WOP-123", "/repos/wopr");
		expect(mockRemoveWorktree).toHaveBeenCalledWith(
			"/repos/wopr",
			"/tmp/norad-worktrees/feature/WOP-123",
		);
	});

	it("rejects path outside WORKTREE_BASE", async () => {
		await expect(
			cleanupEntityWorktree("e1", "/etc/passwd", "/repos/wopr"),
		).rejects.toThrow("path traversal");
		expect(mockRemoveWorktree).not.toHaveBeenCalled();
	});
});
