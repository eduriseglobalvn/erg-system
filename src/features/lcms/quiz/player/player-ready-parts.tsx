import { AnswerKeyCard } from "@/components/quiz/player-shell-parts";
import { PlayerOfflineBanner } from "@/components/quiz/player-status";
import { QuestionNavigator } from "@/components/quiz/question-navigator";
import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { playerViewportClass } from "@/components/quiz/player-shell-runtime/player-shell-styles";
import type { Question, Quiz } from "@/domain/quiz/types";
import type { ComponentProps, CSSProperties } from "react";

type RendererProps = ComponentProps<typeof QuestionRenderer>;

type QuestionBodyProps = {
  online: boolean;
  question: Question;
  value: RendererProps["value"];
  onChange: RendererProps["onChange"];
  submitted: boolean;
  result: RendererProps["result"];
  submitError: string | null;
};

export function PlayerQuestionBody({ online, question: readyQuestion, value, onChange, submitted, result, submitError }: QuestionBodyProps) {
  return (
    <>
      {online ? null : <PlayerOfflineBanner />}

      <QuestionRenderer
        key={readyQuestion.id}
        question={readyQuestion}
        value={value}
        onChange={onChange}
        submitted={submitted}
        reviewMode={submitted}
        result={result}
      />

      {submitted && readyQuestion.kind === "hotspot" ? <AnswerKeyCard question={readyQuestion} /> : null}

      {submitError ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
          {submitError}
        </div>
      ) : null}

    </>
  );
}

type SidebarProps = {
  answeredQuestionIds: string[];
  bookmarkedQuestionIds: string[];
  currentIndex: number;
  quiz: Quiz;
  query: string;
  questions: Question[];
  started: boolean;
  style: CSSProperties;
  onIntroClick: () => void;
  onJumpToQuestion: (index: number) => void;
  onQueryChange: (value: string) => void;
};

export function PlayerSidebar(props: SidebarProps) {
  return (
    <QuestionNavigator
      answeredQuestionIds={props.answeredQuestionIds}
      className={playerViewportClass}
      currentIndex={props.currentIndex}
      flaggedQuestionIds={props.bookmarkedQuestionIds}
      introSubtitle={props.quiz.subtitle}
      onIntroClick={props.onIntroClick}
      onJumpToQuestion={props.onJumpToQuestion}
      onQueryChange={props.onQueryChange}
      query={props.query}
      questions={props.questions}
      showIntro={!props.started}
      started={props.started}
      style={props.style}
    />
  );
}
