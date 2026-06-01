export type AccountRole = "teacher" | "coordinator" | "admin";
export type AuthProvider = "password" | "google" | "apple";

export type TeacherAccount = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  role: AccountRole;
  provider: AuthProvider;
  department: string;
  title: string;
  features: string[];
  isProfileCompleted?: boolean;
  status?: string;
  createdAt: string;
  lastLoginAt: string | null;
};

export type AuthMode = "login" | "register";
export type AccountTab = "profile" | "security" | "permissions";

export type Notice = {
  tone: "success" | "error" | "info";
  message: string;
};

export type LoginFormState = {
  email: string;
  password: string;
};

export type RegisterFormState = {
  fullName: string;
  email: string;
  department: string;
  password: string;
  confirmPassword: string;
};

export type ProfileFormState = {
  fullName: string;
  phone: string;
  department: string;
  title: string;
  avatarUrl?: string;
  bio?: string;
};

export type PasswordFormState = {
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
};

