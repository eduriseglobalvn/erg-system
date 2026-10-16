import type { TeacherAccount } from "@/platform/auth/types/auth-types";
export type ProfileFormState = { fullName: string; phone: string; department: string; title: string; avatarUrl: string; bio: string };
export type PasswordFormState = { currentPassword: string; nextPassword: string; confirmPassword: string };
export type ProfileTab = "profile" | "security";
export type ProfileNotice = { tone: "success" | "error"; message: string };
export const CROP_PREVIEW_SIZE = 320;
export const CROP_OUTPUT_SIZE = 512;
export type AvatarCropState = {
  file: File; previewUrl: string; zoom: number; offset: { x: number; y: number };
  image: { width: number; height: number } | null;
  drag: { pointerId: number; startX: number; startY: number; originX: number; originY: number } | null;
};
export const EMPTY_PROFILE_FORM: ProfileFormState = { fullName: "", phone: "", department: "ERG", title: "Giáo viên", avatarUrl: "", bio: "" };
export const EMPTY_PASSWORD_FORM: PasswordFormState = { currentPassword: "", nextPassword: "", confirmPassword: "" };
export function profileFormFromAccount(account: TeacherAccount | null): ProfileFormState {
  return {
    fullName: account?.fullName ?? EMPTY_PROFILE_FORM.fullName, phone: account?.phone ?? EMPTY_PROFILE_FORM.phone,
    department: account?.department ?? EMPTY_PROFILE_FORM.department, title: account?.title ?? EMPTY_PROFILE_FORM.title,
    avatarUrl: account?.avatarUrl ?? EMPTY_PROFILE_FORM.avatarUrl, bio: account?.bio ?? EMPTY_PROFILE_FORM.bio,
  };
}

