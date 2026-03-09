import { Badge } from "@/components/ui/badge";
import type { Source, Watch } from "@/lib/radar-client";

interface SourcesPanelProps {
  sources: Source[];
  watchesBySource: Record<string, Watch[]>;
}

export function SourcesPanel({ sources, watchesBySource }: SourcesPanelProps) {
  return (
    <div>
      <h2
        className="text-xs font-bold tracking-widest uppercase mb-3"
        style={{ color: "var(--muted-foreground)" }}
      >
        Sources &amp; Watches
      </h2>
      {sources.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          no sources configured
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {sources.map((src) => {
            const watches = watchesBySource[src.id] ?? [];
            return (
              <div
                key={src.id}
                className="rounded border p-3"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono" style={{ color: "var(--foreground)" }}>
                    {src.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {src.type}
                    </span>
                    <Badge variant={src.enabled ? "green" : "muted"}>
                      {src.enabled ? "on" : "off"}
                    </Badge>
                  </div>
                </div>
                {watches.length > 0 && (
                  <div
                    className="mt-2 flex flex-col gap-1 pl-3 border-l"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {watches.map((w) => (
                      <div key={w.id} className="flex items-center justify-between text-xs">
                        <span style={{ color: "var(--muted-foreground)" }}>
                          {w.name} → {w.action}
                        </span>
                        <Badge variant={w.enabled ? "green" : "muted"}>
                          {w.enabled ? "on" : "off"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
