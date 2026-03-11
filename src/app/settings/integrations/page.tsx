import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
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

  // Generate per-request state nonces to prevent CSRF on OAuth callbacks.
  const githubState = randomBytes(16).toString("hex");
  const linearState = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("oauth_state_github", githubState, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  cookieStore.set("oauth_state_linear", linearState, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const githubBase =
    GITHUB_APP_INSTALL_URL ||
    `https://github.com/login/oauth/authorize?client_id=${GITHUB_APP_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${APP_URL}/api/github/callback`)}`;
  const githubOauthUrl = `${githubBase}${githubBase.includes("?") ? "&" : "?"}state=${githubState}`;

  const linearOauthUrl = `https://linear.app/oauth/authorize?client_id=${LINEAR_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${APP_URL}/api/linear/callback`)}&response_type=code&scope=read,write&state=${linearState}`;

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
