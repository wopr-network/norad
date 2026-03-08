"use client";

import { useEffect, useRef } from "react";
import { DEFCON_ADMIN_TOKEN, DEFCON_URL } from "./config";
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
  return `${DEFCON_URL.replace(/^http/, "ws")}/ws`;
}

export function useDefconEvents(handler: (event: DefconEvent) => void): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      const url = getWsUrl();
      log.info("connecting to", url);
      ws = new WebSocket(url);

      if (DEFCON_ADMIN_TOKEN) {
        // Send auth after open (protocol-level auth)
        ws.addEventListener("open", () => {
          ws?.send(JSON.stringify({ type: "auth", token: DEFCON_ADMIN_TOKEN }));
          log.info("ws connected");
        });
      }

      ws.addEventListener("message", (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as DefconEvent;
          handlerRef.current(data);
        } catch {
          log.warn("ws message parse error");
        }
      });

      ws.addEventListener("close", () => {
        if (!destroyed) {
          log.warn("ws closed, reconnecting in 5s");
          reconnectTimer = setTimeout(connect, 5000);
        }
      });

      ws.addEventListener("error", () => {
        log.error("ws error");
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
