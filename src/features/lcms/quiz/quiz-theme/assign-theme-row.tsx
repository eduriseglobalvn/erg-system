import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import { useId } from "react";

import { ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { adminContentPathForSection } from "@/features/lcms/admin-content/admin-content-route";
import { useQuizEditorDraftQuery } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { viCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import { themeNameFor } from "@/features/lcms/quiz/quiz-theme/quiz-theme-name";
import { hasApiBase } from "@/lib/api-client";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { createAuthRouteState, resolveAuthRouteAccess } from "@/platform/auth/router/auth-route-context";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

const rowSx = { alignItems: "center", border: 1, borderColor: "divider", borderRadius: `${t.radius.control}px`, display: "flex", gap: 1, justifyContent: "space-between", px: 1.5, py: 1, textAlign: "left", width: "100%" } as const;

/** The theme lives on the quiz, not the assignment: this row shows it and jumps to the editor's theme dialog. */
export function AssignThemeRow({ quizId }: { quizId: string }) {
  const draft = useQuizEditorDraftQuery(quizId);
  const captionId = useId();
  const { account, session } = useAuthSession("lms");
  // The editor route needs the ADMIN workspace and lms.quiz.create: same check as the route guard, so we never offer a dead link.
  const canEdit = resolveAuthRouteAccess(
    createAuthRouteState({ account, session, apiBacked: hasApiBase() }),
    { workspace: "ADMIN", permission: "lms.quiz.create" },
  ) === "allow";
  if (draft.isPending) return <ErgSkeleton height={40} />;
  if (draft.isError) return null; // an unreadable draft must not show the default theme name as if it were the quiz's
  const label = `Theme bài · ${themeNameFor(draft.data?.playerTemplate, viCopy)}`;
  if (!canEdit) {
    return (
      <Box aria-describedby={captionId} aria-label={label} role="group" sx={rowSx}>
        <Typography component="span" variant="body2">{label}</Typography>
        <Typography color="text.secondary" component="span" id={captionId} variant="caption">Cần quyền Admin để đổi theme</Typography>
      </Box>
    );
  }
  return (
    <ButtonBase
      component={Link}
      // The route tree is built from a path list, so the router has no typed search for it; the route's validateSearch accepts these.
      search={{ quizId, panel: "theme" } as never}
      sx={{ ...rowSx, "&:hover": { bgcolor: "action.hover" } }}
      to={adminContentPathForSection("quiz-editor")}
    >
      <Typography component="span" variant="body2">{label}</Typography>
      <Typography color="primary" component="span" sx={{ alignItems: "center", display: "inline-flex" }} variant="body2">
        Đổi theme
        <ChevronRightIcon fontSize="small" />
      </Typography>
    </ButtonBase>
  );
}
