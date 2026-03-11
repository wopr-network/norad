import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { APP_URL, LINEAR_CLIENT_ID, LINEAR_CLIENT_SECRET } from "@/lib/config";
import {
  createIntegration,
  listIntegrations,
  updateIntegrationCredentials,
} from "@/lib/defcon-client";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  // Validate CSRF state nonce
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("oauth_state_linear")?.value;
  cookieStore.delete("oauth_state_linear");
  if (!expectedState || state !== expectedState) {
    return NextResponse.redirect(`${APP_URL}/settings/integrations?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/settings/integrations?error=missing_code`);
  }

  const redirectUri = `${APP_URL}/api/linear/callback`;

  const tokenRes = await fetch("https://api.linear.app/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: LINEAR_CLIENT_ID,
      client_secret: LINEAR_CLIENT_SECRET,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${APP_URL}/settings/integrations?error=token_exchange_failed`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    scope?: string;
  };

  if (!tokenData.access_token) {
    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?error=${encodeURIComponent(tokenData.error ?? "no_token")}`,
    );
  }

  // Fetch the workspace ID from Linear
  const meRes = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "{ organization { id urlKey } }" }),
  });

  let workspaceId: string | undefined;
  if (meRes.ok) {
    const meData = (await meRes.json()) as {
      data?: { organization?: { id: string; urlKey: string } };
    };
    workspaceId = meData.data?.organization?.id;
  }

  const credentials = {
    provider: "linear" as const,
    accessToken: tokenData.access_token,
    ...(workspaceId ? { workspaceId } : {}),
  };

  const existing = await listIntegrations("issue_tracker").catch(() => []);
  const current = existing.find((i) => i.provider === "linear");

  if (current) {
    await updateIntegrationCredentials(current.id, credentials);
  } else {
    await createIntegration({
      name: "Linear",
      category: "issue_tracker",
      provider: "linear",
      credentials,
    });
  }

  return NextResponse.redirect(`${APP_URL}/settings/integrations?connected=linear`);
}
