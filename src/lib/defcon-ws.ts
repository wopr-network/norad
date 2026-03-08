"use client";

import { useEffect, useRef } from "react";
import { DEFCON_WS_TOKEN, DEFCON_WS_URL } from "./config";
import { logger } from "./logger";

const log = logger("defcon-ws");

export type DefconEventType =
  | "entity.created"
  | "entity.transitioned"
  | "entity.updated"
  | "entity.claimed";

export interface DefconEvent {
  type: DefconEventType;
  payload: Record<string, unknown>;
}

function getWsUrl(): string {
  if (!DEFCON_WS_URL) return "";
  if (DEFCON_WS_TOKEN) {
    return `${DEFCON_WS_URL}?token=${encodeURIComponent(DEFCON_WS_TOKEN)}`;
  }
  return DEFCON_WS_URL;
}

export type DefconConnectionStatus = "connecting" | "open" | "closed" | "error";

export function useDefconEvents(
  handler: (event: DefconEvent) => void,
  onStatusChange?: (status: DefconConnectionStatus) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const statusHandlerRef = useRef(onStatusChange);
  statusHandlerRef.current = onStatusChange;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      const url = getWsUrl();
      if (!url) {
        log.warn("NEXT_PUBLIC_DEFCON_WS_URL not set — WebSocket disabled");
        statusHandlerRef.current?.("closed");
        return;
      }
      log.info("connecting to", url);
      statusHandlerRef.current?.("connecting");
      ws = new WebSocket(url);

      ws.addEventListener("open", () => {
        log.info("ws connected");
        statusHandlerRef.current?.("open");
      });

      ws.addEventListener("message", (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as DefconEvent;
          handlerRef.current(data);
        } catch {
          log.warn("ws message parse error");
        }
      });

      ws.addEventListener("close", () => {
        statusHandlerRef.current?.("closed");
        if (!destroyed) {
          log.warn("ws closed, reconnecting in 5s");
          reconnectTimer = setTimeout(connect, 5000);
        }
      });

      ws.addEventListener("error", () => {
        log.error("ws error");
        statusHandlerRef.current?.("error");
        ws?.close();
      });
    }

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);
}
