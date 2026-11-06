import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";

import { ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { adminContentPathForSection } from "@/features/lcms/admin-content/admin-content-route";
import { useQuizEditorDraftQuery } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { viCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import { themeNameFor } from "@/features/lcms/quiz/quiz-theme/quiz-theme-name";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/** The theme lives on the quiz, not the assignment: this row shows it and jumps to the editor's theme dialog. */
export function AssignThemeRow({ quizId }: { quizId: string }) {
  const draft = useQuizEditorDraftQuery(quizId);
  if (draft.isPending) return <ErgSkeleton height={40} />;
  if (draft.isError) return null; // an unreadable draft must not show the default theme name as if it were the quiz's
  return (
    <ButtonBase
      component={Link}
      // The route tree is built from a path list, so the router has no typed search for it; the route's validateSearch accepts these.
      search={{ quizId, panel: "theme" } as never}
      sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: `${t.radius.control}px`, display: "flex", gap: 1, justifyContent: "space-between", px: 1.5, py: 1, textAlign: "left", width: "100%", "&:hover": { bgcolor: "action.hover" } }}
      to={adminContentPathForSection("quiz-editor")}
    >
      <Typography component="span" variant="body2">Theme bài · {themeNameFor(draft.data?.playerTemplate, viCopy)}</Typography>
      <Typography color="primary" component="span" sx={{ alignItems: "center", display: "inline-flex" }} variant="body2">
        Đổi theme
        <ChevronRightIcon fontSize="small" />
      </Typography>
    </ButtonBase>
  );
}
