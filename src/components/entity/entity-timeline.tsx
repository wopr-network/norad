import { Badge, stateVariant } from "@/components/ui/badge";
import type { EntityHistory } from "@/lib/defcon-client";

function duration(from: string, to?: string): string {
  const ms = new Date(to ?? Date.now()).getTime() - new Date(from).getTime();
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

interface EntityTimelineProps {
  history: EntityHistory[];
  currentState: string;
}

export function EntityTimeline({ history, currentState }: EntityTimelineProps) {
  return (
    <div className="flex flex-col gap-0">
      {history.map((entry, i) => {
        const isLast = i === history.length - 1;
        const isCurrent = entry.state === currentState && isLast;
        return (
          <div key={`${entry.state}-${entry.enteredAt}`} className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div
                className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                style={{
                  background: isCurrent ? "var(--accent-green)" : "var(--border)",
                }}
              />
              {!isLast && (
                <div
                  className="w-px flex-1 my-1"
                  style={{ background: "var(--border)", minHeight: "24px" }}
                />
              )}
            </div>
            {/* Content */}
            <div className="pb-4 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant={stateVariant(entry.state)}>{entry.state}</Badge>
                {isCurrent && (
                  <span className="text-xs" style={{ color: "var(--accent-green)" }}>
                    current
                  </span>
                )}
              </div>
              <div className="flex gap-3 text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                <span>{new Date(entry.enteredAt).toLocaleString()}</span>
                <span>·</span>
                <span>{duration(entry.enteredAt, entry.exitedAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
