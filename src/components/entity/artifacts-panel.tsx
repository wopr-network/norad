interface ArtifactsPanelProps {
  artifacts: Record<string, unknown>;
}

export function ArtifactsPanel({ artifacts }: ArtifactsPanelProps) {
  const entries = Object.entries(artifacts);
  if (entries.length === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        no artifacts
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-col gap-0.5">
          <span
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: "var(--muted-foreground)" }}
          >
            {key}
          </span>
          <pre
            className="text-xs rounded p-2 overflow-x-auto"
            style={{
              background: "var(--muted)",
              color: "var(--foreground)",
              fontFamily: "inherit",
            }}
          >
            {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
