import { FormViewRibbon } from "@/features/lcms/quiz/quiz-editor/components/ribbon/form-view-ribbon";
import type {
  IntroSlideKind,
  QuestionCreationPreset,
  QuestionType,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type {
  CourseScopeOption,
  LevelScopeOption,
  TopicOption,
} from "@/features/lcms/quiz/quiz-editor/components/ribbon/form-view-ribbon";

type RibbonProps = {
  searchValue: string;
  courseOptions: CourseScopeOption[];
  selectedCourseId: string;
  levelOptions: LevelScopeOption[];
  selectedLevelId: string | null;
  topicOptions: TopicOption[];
  selectedTopicId: string;
  onChangeCourse: (value: string) => void;
  onChangeLevel: (value: string) => void;
  onChangeTopic: (value: string) => void;
  onChangeSearch: (value: string) => void;
  onAddQuestion: (type: QuestionType, preset?: QuestionCreationPreset) => void;
  onAddIntroduction: (type: IntroSlideKind) => void;
  onOpenPlayerTemplate: () => void;
  onOpenPublish: () => void;
};

export function QuizEditorRibbon(props: RibbonProps) {
  return (
    <FormViewRibbon
      searchValue={props.searchValue}
      courseOptions={props.courseOptions}
      selectedCourseId={props.selectedCourseId}
      levelOptions={props.levelOptions}
      selectedLevelId={props.selectedLevelId}
      topicOptions={props.topicOptions}
      selectedTopicId={props.selectedTopicId}
      onChangeCourse={props.onChangeCourse}
      onChangeLevel={props.onChangeLevel}
      onChangeTopic={props.onChangeTopic}
      onChangeSearch={props.onChangeSearch}
      onAddQuestion={props.onAddQuestion}
      onAddIntroduction={props.onAddIntroduction}
      onOpenPlayerTemplate={props.onOpenPlayerTemplate}
      onOpenPublish={props.onOpenPublish}
    />
  );
}
