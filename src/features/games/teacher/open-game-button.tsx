import SportsEsportsOutlinedIcon from "@mui/icons-material/SportsEsportsOutlined";
import { useNavigate } from "@tanstack/react-router";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { useCanHostGames } from "@/features/games/teacher/use-last-games";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

/** "Mở trò chơi" on a quiz row of the exercise bank: opens the game picker for that quiz. Hidden without lms.games.host. */
export function OpenGameButton({ quizId }: { quizId: string }) {
  const navigate = useNavigate();
  if (!useCanHostGames()) return null;
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
