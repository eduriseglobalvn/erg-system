import type { AccessScopeType } from "@/features/lcms/admin-operations/api/access-management-api";

export type WorkspaceSection = "profile" | "roles" | "access";

export type DraftPolicy = {
  scopeType: AccessScopeType | "";
  scopeId: string;
  roleGroup: string;
  modules: string[];
};

export type ProfileDraft = {
  fullName: string;
  phone: string;
  jobTitle: string;
  avatarUrl: string;
  bio: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  city: string;
  district: string;
  region: string;
};
