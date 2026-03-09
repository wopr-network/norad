import { execFile as execFileCb } from "child_process";
import path from "path";
import { logger } from "./logger";

const log = logger("github-worktree");

export interface WorktreeResult {
  worktreePath: string;
  branch: string;
}

/**
 * Validate that a branch/subpath resolves inside the base directory.
 * Returns the resolved absolute path. Throws on traversal attempt.
 */
export function validateWorktreePath(base: string, subpath: string): string {
  if (path.isAbsolute(subpath)) {
    throw new Error(`path traversal: absolute path rejected: ${subpath}`);
  }
  const resolvedBase = path.resolve(base);
  const resolved = path.resolve(base, subpath);
  if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
    throw new Error(`path traversal: ${subpath} resolves outside ${base}`);
  }
  return resolved;
}

function execGit(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFileCb("git", args, { cwd }, (err, stdout, stderr) => {
      if (err) {
        log.error(`git ${args.join(" ")} failed:`, stderr || err.message);
        reject(err);
        return;
      }
      resolve(stdout);
    });
  });
}

export async function createWorktree(
  repoPath: string,
  branch: string,
  worktreePath: string,
): Promise<void> {
  log.info(`creating worktree branch=${branch} path=${worktreePath}`);
  await execGit(["worktree", "add", worktreePath, "-b", branch], repoPath);
}

export async function removeWorktree(repoPath: string, worktreePath: string): Promise<void> {
  log.info(`removing worktree path=${worktreePath}`);
  await execGit(["worktree", "remove", "--force", worktreePath], repoPath);
}
