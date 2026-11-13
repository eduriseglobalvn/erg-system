export type WorkspaceSection = "profile" | "roles" | "access";

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
