import type { Workspace } from "@/platform/workspaces/workspace-domain";

export type HelpStep = {
  text: string;
  note?: string;
  warning?: string;
};

export type HelpChapter = {
  id: string;
  title: string;
  intro?: string;
  steps: HelpStep[];
};

export type HelpGuide = {
  title: string;
  intro: string;
  chapters: HelpChapter[];
};

export const HELP_PATHS: Record<Workspace, string> = {
  ADMIN: "/admin/help",
  TEACHER: "/teacher/help",
  STUDENT: "/student/help",
  CRM: "/seo/help",
};
