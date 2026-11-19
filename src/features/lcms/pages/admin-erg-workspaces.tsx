"use client";

import { Link } from "@tanstack/react-router";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { useI18n } from "@/platform/i18n";

/**
 * Admin paths kept for old links that have no screen of their own (users, rubrics, report/*, setting/* ...).
 * They say "not found" in place instead of repeating the home title over an empty box (BUG-UI-005).
 */
export function AdminErgPortalWorkspace() {
  const { t } = useI18n();
  return (
    <ErgEmptyState
      title={t("notFound.title")}
      description={t("notFound.description")}
      action={<ErgButton component={Link} to={adminPath("/")}>{t("notFound.backHome")}</ErgButton>}
    />
  );
}
