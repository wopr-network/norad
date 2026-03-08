"use client";

import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { Entity, Flow } from "@/lib/defcon-client";
import type { DefconConnectionStatus, DefconEvent } from "@/lib/defcon-ws";
// DefconConnectionStatus used in handleWsStatus param type
import { useDefconEvents } from "@/lib/defcon-ws";
import { StateColumn } from "./state-column";

interface BoardState {
  flows: Flow[];
  entityMap: Record<string, Entity[]>; // key: `${flowId}::${stateName}`
  counts: Record<string, Record<string, number>>; // flowId -> stateName -> count
}

interface PipelineBoardProps {
  initial: BoardState;
}

export function PipelineBoard({ initial }: PipelineBoardProps) {
  const [board, setBoard] = useState<BoardState>(initial);
  const [wsStatus, setWsStatus] = useState<"connecting" | "live" | "error" | "closed">(
    "connecting",
  );
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refreshEntities = useCallback(async () => {
    try {
      const { getDefconStatus, getFlows, getEntitiesByState } = await import("@/lib/defcon-client");
      const [status, flows] = await Promise.all([getDefconStatus(), getFlows()]);
      const entityMap: Record<string, Entity[]> = {};
      await Promise.all(
        flows.flatMap((flow) =>
          flow.states.map(async (state) => {
            const key = `${flow.id}::${state.name}`;
            try {
              entityMap[key] = await getEntitiesByState(flow.id, state.name);
            } catch {
              entityMap[key] = [];
            }
          }),
        ),
      );
      setBoard({ flows, entityMap, counts: status.flows });
      setLastRefresh(new Date());
    } catch {
      // silently ignore poll errors
    }
  }, []);

  // Poll every 10s as fallback
  useEffect(() => {
    const t = setInterval(refreshEntities, 10000);
    return () => clearInterval(t);
  }, [refreshEntities]);

  const handleWsEvent = useCallback(
    (event: DefconEvent) => {
      if (
        event.type === "entity.transitioned" ||
        event.type === "entity.created" ||
        event.type === "entity.claimed"
      ) {
        refreshEntities();
      }
    },
    [refreshEntities],
  );

  const handleWsStatus = useCallback((status: DefconConnectionStatus) => {
    if (status === "open") setWsStatus("live");
    else if (status === "error") setWsStatus("error");
    else if (status === "closed") setWsStatus("closed");
    else setWsStatus("connecting");
  }, []);

  useDefconEvents(handleWsEvent, handleWsStatus);

  const flows = board.flows;

  return (
    <div>
      {/* Status bar */}
      <div
        className="flex items-center justify-between px-6 py-2 border-b text-xs"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
              style={{
                background:
                  wsStatus === "live"
                    ? "var(--accent-green)"
                    : wsStatus === "error"
                      ? "var(--accent-red)"
                      : "var(--accent-amber)",
              }}
            />
            {wsStatus === "live" ? "LIVE" : wsStatus === "error" ? "DISCONNECTED" : "CONNECTING"}
          </span>
          <span>refreshed {lastRefresh.toLocaleTimeString()}</span>
        </div>
        <button
          type="button"
          onClick={refreshEntities}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <Spinner size={12} />
          refresh
        </button>
      </div>

      {/* Board */}
      <div className="p-6 overflow-x-auto">
        {flows.length === 0 ? (
          <div className="text-sm text-center py-16" style={{ color: "var(--muted-foreground)" }}>
            no flows configured
          </div>
        ) : (
          flows.map((flow) => (
            <div key={flow.id} className="mb-10">
              <h2
                className="text-xs font-bold tracking-[0.25em] uppercase mb-4"
                style={{ color: "var(--muted-foreground)" }}
              >
                {flow.name}
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {flow.states.map((state) => {
                  const key = `${flow.id}::${state.name}`;
                  const count = board.counts[flow.id]?.[state.name] ?? 0;
                  const entities = board.entityMap[key] ?? [];
                  return (
                    <StateColumn key={state.id} state={state} count={count} entities={entities} />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
