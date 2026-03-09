export const DEFCON_URL = process.env.DEFCON_URL ?? "http://localhost:3001";
export const DEFCON_ADMIN_TOKEN = process.env.DEFCON_ADMIN_TOKEN ?? "";
export const RADAR_URL = process.env.RADAR_URL ?? "http://localhost:8080";
// Browser-side WebSocket URL — must be set to the publicly reachable DEFCON WS endpoint
export const DEFCON_WS_URL = process.env.NEXT_PUBLIC_DEFCON_WS_URL ?? "";
// Browser-side WS token — separate from server-side DEFCON_ADMIN_TOKEN
export const DEFCON_WS_TOKEN = process.env.NEXT_PUBLIC_DEFCON_WS_TOKEN ?? "";
export const GITHUB_BASE_URL = "https://github.com/";
export const LINEAR_BASE_URL = "https://linear.app/wopr/issue/";
export const SOURCES_CONFIG_PATH = process.env.SOURCES_CONFIG_PATH ?? "./norad.sources.json";
