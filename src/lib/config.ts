// Silo connection
export const SILO_URL = process.env.SILO_URL ?? "http://localhost:3001";
export const SILO_ADMIN_TOKEN = process.env.SILO_ADMIN_TOKEN ?? "";
// Browser-side WebSocket URL — must be set to the publicly reachable silo WS endpoint
export const SILO_WS_URL = process.env.NEXT_PUBLIC_SILO_WS_URL ?? "";
// Browser-side WS token — separate from server-side SILO_ADMIN_TOKEN
export const SILO_WS_TOKEN = process.env.NEXT_PUBLIC_SILO_WS_TOKEN ?? "";
export const GITHUB_BASE_URL = "https://github.com/";
export const LINEAR_BASE_URL = "https://linear.app/wopr/issue/";

// Single-tenant: WOPR tenant ID
export const WOPR_TENANT_ID = process.env.WOPR_TENANT_ID ?? "wopr";

// GitHub App OAuth
export const GITHUB_APP_ID = process.env.GITHUB_APP_ID ?? "";
export const GITHUB_APP_CLIENT_ID = process.env.GITHUB_APP_CLIENT_ID ?? "";
export const GITHUB_APP_CLIENT_SECRET = process.env.GITHUB_APP_CLIENT_SECRET ?? "";
export const GITHUB_APP_INSTALL_URL = process.env.GITHUB_APP_INSTALL_URL ?? "";

// Linear OAuth
export const LINEAR_CLIENT_ID = process.env.LINEAR_CLIENT_ID ?? "";
export const LINEAR_CLIENT_SECRET = process.env.LINEAR_CLIENT_SECRET ?? "";
export const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
