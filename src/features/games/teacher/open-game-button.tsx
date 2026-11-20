import SportsEsportsOutlinedIcon from "@mui/icons-material/SportsEsportsOutlined";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

/** "Mở trò chơi" on a quiz row of the exercise bank: opens the game picker for that quiz. Hidden without lms.games.host. */
export function OpenGameButton({ quizId }: { quizId: string }) {
  const navigate = useNavigate();
  const auth = useAuthSession("lms");
  const allowed = evaluatePermission({ permission: "lms.games.host", grantedPermissions: auth.session?.permissions, deniedPermissions: auth.session?.deniedPermissions });
  if (!allowed) return null;
  return (
    <ErgButton
      leadingIcon={<SportsEsportsOutlinedIcon />}
      onClick={(event) => {
        event.stopPropagation();
        void navigate({ href: `${teacherPath("/games/new")}?quizId=${encodeURIComponent(quizId)}` });
      }}
      size="small"
      variant="outlined"
    >
      Mở trò chơi
    </ErgButton>
  );
}
