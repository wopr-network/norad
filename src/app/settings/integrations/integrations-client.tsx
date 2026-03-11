"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Integration } from "@/lib/defcon-client";

interface Props {
  github: Integration | null;
  linear: Integration | null;
  githubOauthUrl: string;
  linearOauthUrl: string;
  flash: string | null;
  error: string | null;
}

export function IntegrationsClient({
  github,
  linear,
  githubOauthUrl,
  linearOauthUrl,
  flash,
  error,
}: Props) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1
          className="text-xs tracking-[0.25em] uppercase font-bold mb-1"
          style={{ color: "var(--accent-green)" }}
        >
          Settings
        </h1>
        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
          Integrations
        </h2>
        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          Connect external services to the WOPR tenant.
        </p>
      </div>

      {flash && (
        <div
          className="text-xs px-4 py-3 rounded"
          style={{
            background: "rgba(0,255,136,0.08)",
            border: "1px solid var(--accent-green)",
            color: "var(--accent-green)",
          }}
        >
          {flash === "github" ? "GitHub connected successfully." : null}
          {flash === "linear" ? "Linear connected successfully." : null}
        </div>
      )}

      {error && (
        <div
          className="text-xs px-4 py-3 rounded"
          style={{
            background: "rgba(255,56,96,0.08)",
            border: "1px solid var(--accent-red)",
            color: "var(--accent-red)",
          }}
        >
          Connection failed: {error.replaceAll("_", " ")}
        </div>
      )}

      <IntegrationCard
        name="GitHub"
        description="Connect a GitHub App installation to enable CI checks, PR status, and merge queue operations."
        provider="github"
        integration={github}
        connectUrl={githubOauthUrl}
        connectLabel="Install GitHub App"
      />

      <IntegrationCard
        name="Linear"
        description="Connect a Linear workspace to track issue state and post comments from flow gates."
        provider="linear"
        integration={linear}
        connectUrl={linearOauthUrl}
        connectLabel="Connect Linear"
        supportsApiKey
      />
    </div>
  );
}

function IntegrationCard({
  name,
  description,
  provider,
  integration,
  connectUrl,
  connectLabel,
  supportsApiKey,
}: {
  name: string;
  description: string;
  provider: string;
  integration: Integration | null;
  connectUrl: string;
  connectLabel: string;
  supportsApiKey?: boolean;
}) {
  const router = useRouter();
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleSaveApiKey() {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      const body = integration
        ? { credentials: { provider, accessToken: apiKey } }
        : {
            name,
            category: provider === "github" ? "vcs" : "issue_tracker",
            provider,
            credentials: { provider, accessToken: apiKey },
          };

      const path = integration
        ? `/api/defcon/admin/integrations/${integration.id}`
        : "/api/defcon/admin/integrations";

      await fetch(path, {
        method: integration ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setShowKeyInput(false);
      setApiKey("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!integration) return;
    setDisconnecting(true);
    try {
      await fetch(`/api/defcon/admin/integrations/${integration.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div
      className="rounded-lg p-5 space-y-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {name}
            </span>
            {integration ? (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(0,255,136,0.12)", color: "var(--accent-green)" }}
              >
                Connected
              </span>
            ) : (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(74,96,112,0.2)", color: "var(--muted-foreground)" }}
              >
                Not connected
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {description}
          </p>
          {integration && (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              ID: <span style={{ color: "var(--foreground)" }}>{integration.id}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {integration ? (
            <>
              <a
                href={connectUrl}
                className="text-xs px-3 py-1.5 rounded transition-colors"
                style={{
                  background: "var(--muted)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                Reconnect
              </a>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-xs px-3 py-1.5 rounded transition-colors"
                style={{ color: "var(--accent-red)", border: "1px solid var(--accent-red)" }}
              >
                {disconnecting ? "Removing…" : "Disconnect"}
              </button>
            </>
          ) : (
            <a
              href={connectUrl}
              className="text-xs px-3 py-1.5 rounded transition-colors font-bold"
              style={{ background: "var(--accent-green)", color: "#000" }}
            >
              {connectLabel}
            </a>
          )}
        </div>
      </div>

      {supportsApiKey && (
        <div>
          {showKeyInput ? (
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste API key…"
                className="flex-1 text-xs px-3 py-1.5 rounded bg-transparent outline-none"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                // biome-ignore lint/a11y/noAutofocus: intentional focus on reveal
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                disabled={saving || !apiKey.trim()}
                className="text-xs px-3 py-1.5 rounded font-bold"
                style={{ background: "var(--accent-green)", color: "#000" }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowKeyInput(false);
                  setApiKey("");
                }}
                className="text-xs px-3 py-1.5 rounded"
                style={{ color: "var(--muted-foreground)" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowKeyInput(true)}
              className="text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              {integration ? "Update via API key instead →" : "Use API key instead →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
