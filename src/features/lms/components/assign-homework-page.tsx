import { AssignHomeworkDesktopView } from "@/features/lms/components/assign-homework-desktop-view";
import { AssignHomeworkMobileView } from "@/features/lms/components/assign-homework-mobile-view";
import {
  type AssignHomeworkPageProps,
  useAssignHomeworkController,
} from "@/features/lms/components/use-assign-homework-controller";

export function AssignHomeworkPage(props: AssignHomeworkPageProps) {
  const model = useAssignHomeworkController(props);

  return model.isMobile
    ? <AssignHomeworkMobileView model={model} />
    : <AssignHomeworkDesktopView model={model} />;
}
