import { NORAD_REPO_PATH, WORKTREE_BASE } from "./config";
import { createEntity, type Entity, type EntityRefs, reportSignal } from "./defcon-client";
import {
  createWorktree,
  removeWorktree,
  validateWorktreePath,
  type WorktreeResult,
} from "./github-worktree";
import { logger } from "./logger";

const log = logger("entity-provisioner");

export interface ProvisionParams {
  flowName: string;
  externalId: string;
  repo: string;
  refs?: EntityRefs;
  payload?: Record<string, unknown>;
}

export interface ProvisionedEntity {
  entity: Entity;
  worktree: WorktreeResult;
}

function toBranchName(externalId: string): string {
  return `feature/${externalId.replace(/[^a-zA-Z0-9-]/g, "-")}`;
}

export async function provisionGitHubEntity(params: ProvisionParams): Promise<ProvisionedEntity> {
  const { flowName, externalId, repo, refs, payload } = params;
  const entityRefs: EntityRefs = { github: { repo }, ...refs };

  log.info(`provisioning entity for ${flowName} externalId=${externalId}`);

  const entity = await createEntity(flowName, entityRefs, payload);

  const branch = toBranchName(externalId);
  const worktreePath = validateWorktreePath(WORKTREE_BASE, branch);

  await createWorktree(NORAD_REPO_PATH, branch, worktreePath);

  await reportSignal(entity.id, "provisioned", {
    worktreePath,
    branch,
    repo,
  });

  log.info(`entity ${entity.id} provisioned: branch=${branch} path=${worktreePath}`);

  return {
    entity,
    worktree: { worktreePath, branch },
  };
}

export async function cleanupEntityWorktree(
  entityId: string,
  worktreePath: string,
  repoPath: string,
): Promise<void> {
  log.info(`cleaning up worktree for entity ${entityId}`);
  await removeWorktree(repoPath, worktreePath);
}
