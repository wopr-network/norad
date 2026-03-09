import { logger } from "@/lib/logger";
import { getScheduler } from "@/lib/sources/cron-scheduler";

const log = logger("instrumentation");

export async function register() {
  // Only run scheduler on the server (not edge runtime)
  if (typeof (globalThis as Record<string, unknown>).EdgeRuntime === "undefined") {
    log.info("Starting cron scheduler");
    getScheduler().start();
  }
}
