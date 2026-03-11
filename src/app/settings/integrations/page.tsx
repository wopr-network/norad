import {
  APP_URL,
  GITHUB_APP_CLIENT_ID,
  GITHUB_APP_INSTALL_URL,
  LINEAR_CLIENT_ID,
} from "@/lib/config";
import { listIntegrations } from "@/lib/defcon-client";
import { IntegrationsClient } from "./integrations-client";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  const [vcsIntegrations, trackerIntegrations] = await Promise.all([
    listIntegrations("vcs").catch(() => []),
    listIntegrations("issue_tracker").catch(() => []),
  ]);

  const github = vcsIntegrations.find((i) => i.provider === "github") ?? null;
  const linear = trackerIntegrations.find((i) => i.provider === "linear") ?? null;

  const githubOauthUrl =
    GITHUB_APP_INSTALL_URL ||
    `https://github.com/login/oauth/authorize?client_id=${GITHUB_APP_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${APP_URL}/api/github/callback`)}`;

  const linearOauthUrl = `https://linear.app/oauth/authorize?client_id=${LINEAR_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${APP_URL}/api/linear/callback`)}&response_type=code&scope=read,write`;

  return (
    <IntegrationsClient
      github={github}
      linear={linear}
      githubOauthUrl={githubOauthUrl}
      linearOauthUrl={linearOauthUrl}
      flash={params.connected ?? null}
      error={params.error ?? null}
    />
  );
}
