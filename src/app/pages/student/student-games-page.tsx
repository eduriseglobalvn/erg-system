import { HackJoin } from "@/features/games/hack/hack-join";
import { HackThemeProvider } from "@/features/games/hack/hack-theme";

/** /student/games: enter the room code (full screen, no portal shell). */
export function StudentGamesPage() {
  return (
    <HackThemeProvider>
      <HackJoin />
    </HackThemeProvider>
  );
}

export default StudentGamesPage;
