export type AuthMode = "legacy-bearer" | "oidc-bff";

export function getAuthMode(): AuthMode {
  return import.meta.env.VITE_AUTH_MODE === "oidc-bff" ? "oidc-bff" : "legacy-bearer";
}

export function isBffAuthEnabled() {
  return getAuthMode() === "oidc-bff";
}
