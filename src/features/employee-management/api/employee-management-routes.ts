import { encodeApiPathSegment, type ContractPath } from "@/lib/api/contract-types";

const users = "/api/v1/admin/users" satisfies ContractPath;

export const employeeManagementRoutes = {
  users,
  user: (userId: string) => `${users}/${encodeApiPathSegment(userId)}` as ContractPath,
  status: (userId: string) => `${users}/${encodeApiPathSegment(userId)}/status` as ContractPath,
  roles: (userId: string) => `${users}/${encodeApiPathSegment(userId)}/roles` as ContractPath,
  resetCredential: (userId: string) => `${users}/${encodeApiPathSegment(userId)}/reset-credential` as ContractPath,
  activity: (userId: string) => `${users}/${encodeApiPathSegment(userId)}/activity` as ContractPath,
  securityEvents: (userId: string) => `${users}/${encodeApiPathSegment(userId)}/security-events` as ContractPath,
  securityFeed: `${users}/security-feed` satisfies ContractPath,
  sessions: (userId: string) => `${users}/${encodeApiPathSegment(userId)}/sessions` as ContractPath,
  revokeSession: (userId: string) => `${users}/${encodeApiPathSegment(userId)}/sessions/revoke` as ContractPath,
};
