export const WORKSPACES = ["ADMIN", "TEACHER", "STUDENT", "CRM"] as const;
export type Workspace = (typeof WORKSPACES)[number];

export const ERG_WORKSPACE_DOMAINS = {
  public: "erg.edu.vn",
  auth: "auth.erg.edu.vn",
  lms: "lms.erg.edu.vn",
  crm: "crm.erg.edu.vn",
  api: "api.erg.edu.vn",
} as const;

export type WorkspaceEnvironment = "local" | "staging" | "production";
export type WorkspaceDomainConfig = {
  public: string;
  auth: string;
  lms: string;
  crm: string;
  api: string;
  environment: WorkspaceEnvironment;
};

export function getWorkspaceDomainConfig(environment = readWorkspaceEnvironment()): WorkspaceDomainConfig {
  if (environment === "production") return { ...ERG_WORKSPACE_DOMAINS, environment };
  if (environment === "staging") {
    return {
      public: "erg.edu.vn",
      auth: "auth.erg.edu.vn",
      lms: "lms.erg.edu.vn",
      crm: "crm.erg.edu.vn",
      api: "api.erg.edu.vn",
      environment,
    };
  }
  return {
    public: "erg.edu.local",
    auth: "auth.erg.edu.local",
    lms: "lms.erg.edu.local",
    crm: "crm.erg.edu.local",
    api: "api.erg.edu.local",
    environment,
  };
}

function readWorkspaceEnvironment(): WorkspaceEnvironment {
  const value = typeof import.meta !== "undefined" ? import.meta.env?.VITE_ERG_ENV : undefined;
  return value === "production" || value === "staging" ? value : "local";
}

const workspacePaths: Record<Workspace, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
  CRM: "/",
};

type LocationLike = {
  hostname: string;
  pathname: string;
  port?: string;
  protocol?: string;
};

export type WorkspaceLocation =
  | { kind: "workspace"; workspace: Workspace }
  | { kind: "auth" }
  | { kind: "public" }
  | { kind: "unknown" };

function normalizeHost(hostname: string) {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

function firstPathSegment(pathname: string) {
  return pathname.trim().toLowerCase().split("/").filter(Boolean)[0] ?? "";
}

function workspaceForSegment(segment: string): Workspace | undefined {
  if (segment === "admin") return "ADMIN";
  if (segment === "teacher") return "TEACHER";
  if (segment === "student") return "STUDENT";
  return undefined;
}

export function resolveWorkspaceLocation(location: LocationLike): WorkspaceLocation {
  const hostname = normalizeHost(location.hostname);
  const segment = firstPathSegment(location.pathname);

  if (hostname === ERG_WORKSPACE_DOMAINS.auth || hostname === "localhost" && segment === "auth") {
    return { kind: "auth" };
  }

  if (hostname === ERG_WORKSPACE_DOMAINS.public || hostname === "localhost" && !segment) {
    return { kind: "public" };
  }

  if (hostname === ERG_WORKSPACE_DOMAINS.crm || hostname === "crm.erg.edu.local") {
    return { kind: "workspace", workspace: "CRM" };
  }

  if (
    hostname === ERG_WORKSPACE_DOMAINS.lms ||
    hostname === "lms.erg.edu.local" ||
    hostname === "lcms.erg.edu.local" ||
    hostname === "localhost"
  ) {
    const workspace = workspaceForSegment(segment);
    return workspace ? { kind: "workspace", workspace } : { kind: "unknown" };
  }

  return { kind: "unknown" };
}

export function workspaceUrl(workspace: Workspace, path = "", options?: { origin?: string }) {
  const origin = options?.origin ?? `https://${ERG_WORKSPACE_DOMAINS.lms}`;
  const basePath = workspacePaths[workspace];
  const suffix = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${origin.replace(/\/$/, "")}${basePath === "/" ? "" : basePath}${suffix}`;
}
