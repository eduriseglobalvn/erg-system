export type DashboardLeafVariant =
  | "admin-overview"
  | "admin-centers"
  | "admin-create-unit"
  | "admin-members"
  | "admin-sheet-import"
  | "admin-internal-docs"
  | "admin-permissions"
  | "seo-overview"
  | "seo-schools"
  | "seo-opportunities"
  | "seo-pnl"
  | "seo-followups"
  | "seo-handover"
  | "overview"
  | "school-pulse"
  | "question-bank"
  | "quiz-bank"
  | "quiz-editor"
  | "lcms-template"
  | "class-active"
  | "class-ended"
  | "class-students"
  | "class-reports"
  | "placeholder";

export type DashboardLeaf = {
  id: string;
  title: string;
  breadcrumb: string[];
  description: string;
  variant: DashboardLeafVariant;
};

export type DashboardGroup = {
  iconKey?: "operations" | "materials" | "classroom" | "docs" | "settings" | "admin" | "members";
  title: string;
  items: DashboardLeaf[];
};
