import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock child_process before importing module
vi.mock("node:child_process", () => ({
	execFile: vi.fn(),
}));

// Mock config
vi.mock("@/lib/config", () => ({
	WORKTREE_BASE: "/tmp/norad-worktrees",
	NORAD_REPO_PATH: "/repos/wopr",
}));

import { execFile } from "node:child_process";
import { createWorktree, removeWorktree, validateWorktreePath } from "@/lib/github-worktree";

const mockExecFile = vi.mocked(execFile);

describe("validateWorktreePath", () => {
	it("accepts a valid path under base", () => {
		const result = validateWorktreePath("/tmp/norad-worktrees", "feature/WOP-123");
		expect(result).toBe("/tmp/norad-worktrees/feature/WOP-123");
	});

	it("rejects path traversal", () => {
		expect(() =>
			validateWorktreePath("/tmp/norad-worktrees", "../../etc/passwd"),
		).toThrow("path traversal");
	});

	it("rejects absolute paths", () => {
		expect(() =>
			validateWorktreePath("/tmp/norad-worktrees", "/etc/passwd"),
		).toThrow("path traversal");
	});
});

describe("createWorktree", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("calls git worktree add with correct args", async () => {
		mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
			const callback = typeof _opts === "function" ? _opts : cb;
			callback?.(null, "", "");
			return {} as ReturnType<typeof execFile>;
		});

		await createWorktree(
			"/repos/wopr",
			"feature/WOP-123",
			"/tmp/norad-worktrees/feature/WOP-123",
		);
		expect(mockExecFile).toHaveBeenCalledWith(
			"git",
			["worktree", "add", "/tmp/norad-worktrees/feature/WOP-123", "-b", "feature/WOP-123"],
			{ cwd: "/repos/wopr" },
			expect.any(Function),
		);
	});

	it("rejects on git error", async () => {
		mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
			const callback = typeof _opts === "function" ? _opts : cb;
			callback?.(new Error("already exists"), "", "");
			return {} as ReturnType<typeof execFile>;
		});

		await expect(
			createWorktree(
				"/repos/wopr",
				"feature/WOP-123",
				"/tmp/norad-worktrees/feature/WOP-123",
			),
		).rejects.toThrow("already exists");
	});
});

describe("removeWorktree", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("calls git worktree remove --force", async () => {
		mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
			const callback = typeof _opts === "function" ? _opts : cb;
			callback?.(null, "", "");
			return {} as ReturnType<typeof execFile>;
		});

		await removeWorktree("/repos/wopr", "/tmp/norad-worktrees/feature/WOP-123");
		expect(mockExecFile).toHaveBeenCalledWith(
			"git",
			["worktree", "remove", "--force", "/tmp/norad-worktrees/feature/WOP-123"],
			{ cwd: "/repos/wopr" },
			expect.any(Function),
		);
	});
});
