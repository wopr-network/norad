import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { APP_URL, GITHUB_APP_CLIENT_ID, GITHUB_APP_CLIENT_SECRET } from "@/lib/config";
import {
  createIntegration,
  listIntegrations,
  updateIntegrationCredentials,
} from "@/lib/defcon-client";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const installationId = req.nextUrl.searchParams.get("installation_id");
  const state = req.nextUrl.searchParams.get("state");

  // Validate CSRF state nonce
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("oauth_state_github")?.value;
  cookieStore.delete("oauth_state_github");
  if (!expectedState || state !== expectedState) {
    return NextResponse.redirect(`${APP_URL}/settings/integrations?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/settings/integrations?error=missing_code`);
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: GITHUB_APP_CLIENT_ID,
      client_secret: GITHUB_APP_CLIENT_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${APP_URL}/settings/integrations?error=token_exchange_failed`);
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?error=${encodeURIComponent(tokenData.error ?? "no_token")}`,
    );
  }

  // Upsert the integration — update if one already exists, create otherwise
  const existing = await listIntegrations("vcs").catch(() => []);
  const current = existing.find((i) => i.provider === "github");

  const credentials = {
    provider: "github" as const,
    accessToken: tokenData.access_token,
    ...(installationId ? { installationId: Number(installationId) } : {}),
  };

  if (current) {
    await updateIntegrationCredentials(current.id, credentials);
  } else {
    await createIntegration({
      name: "GitHub",
      category: "vcs",
      provider: "github",
      credentials,
    });
  }

  return NextResponse.redirect(`${APP_URL}/settings/integrations?connected=github`);
}
