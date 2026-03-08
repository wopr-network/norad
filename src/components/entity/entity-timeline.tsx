import { Badge, stateVariant } from "@/components/ui/badge";
import type { EntityHistory } from "@/lib/defcon-client";

interface EntityTimelineProps {
  history: EntityHistory[];
  currentState: string;
}

export function EntityTimeline({ history, currentState }: EntityTimelineProps) {
  return (
    <div className="flex flex-col gap-0">
      {history.map((entry, i) => {
        const isLast = i === history.length - 1;
        const isCurrent = entry.toState === currentState && isLast;
        return (
          <div key={entry.id} className="flex gap-3">
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
                <Badge variant={stateVariant(entry.toState)}>{entry.toState}</Badge>
                {isCurrent && (
                  <span className="text-xs" style={{ color: "var(--accent-green)" }}>
                    current
                  </span>
                )}
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  via {entry.trigger}
                </span>
              </div>
              <div className="flex gap-3 text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                <span>{new Date(entry.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
