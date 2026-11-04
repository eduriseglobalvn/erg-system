import { PlayerErrorView, PlayerLoadingView } from "@/components/quiz/player-shell-runtime/player-load-views";
import { PlayerReadyView } from "./player-ready-view";
import type { PlayerShellProps } from "./player-shell-props";
import { usePlayerRuntime } from "./use-player-runtime";

/**
 * Runtime boundary. Ownership map (see player-shell-split.policy.test.ts):
 * - use-player-runtime: state, load/sync/time-up/keyboard hooks
 * - player-ready-view: navigator, MobilePlayerShell, FinalResultScreen, desktop layout
 * - player-shell-runtime-model: pure model
 */
export function PlayerShellRuntime(props: PlayerShellProps) {
  const rt = usePlayerRuntime(props);
  const { activeAttempt, activePackage, activeQuestion, activeQuiz, activeSession, loadState, quizPackageQuery } = rt;

  if (loadState.status === "loading") {
    return <PlayerLoadingView />;
  }

  if (loadState.status === "error" || !activeQuiz || !activeAttempt || !activePackage || !activeSession || !activeQuestion) {
    return (
      <PlayerErrorView
        message={loadState.status === "error" ? loadState.message : "Không thể mở bài làm."}
        onRetry={() => void quizPackageQuery.refetch()}
      />
    );
  }

  return (
    <PlayerReadyView
      rt={rt}
      ready={{ quiz: activeQuiz, attempt: activeAttempt, quizPackage: activePackage, question: activeQuestion, session: activeSession }}
      portableOffline={props.portableOffline}
      welcomeMeta={props.welcomeMeta}
      renderResultActions={props.renderResultActions}
    />
  );
}
