import { AssignHomeworkDesktopView } from "@/features/lms/components/assign-homework-desktop-view";
import { AssignHomeworkMobile } from "@/features/lms/components/assign-homework-mobile";
import {
  type AssignHomeworkPageProps,
  useAssignHomeworkController,
} from "@/features/lms/components/use-assign-homework-controller";

export function AssignHomeworkPage(props: AssignHomeworkPageProps) {
  const model = useAssignHomeworkController(props);

  return model.isMobile
    ? <AssignHomeworkMobile model={model} />
    : <AssignHomeworkDesktopView model={model} />;
}
