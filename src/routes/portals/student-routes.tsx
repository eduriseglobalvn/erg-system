import { createRoute, redirect } from "@tanstack/react-router";

import { studentPath } from "@/platform/workspaces/workspace-paths";
import {
  authedRoute,
  DesktopReleasePage,
  HelpGuidePage,
  LearningOutcomesPage,
  permissionStaticData,
  PortableExamPage,
  StudentGameRoomPage,
  StudentGamesPage,
  StudentPage,
} from "@/routes/portals/route-shared";

// The Student dashboard switches tabs with component state (not pathnames), so it has no Outlet:
// /student renders it directly and the other pages are standalone siblings under `_authed`.
// Matrix permissions (incl. the staff-preview alternates) and the canonical-host / elearning-host
// handling are all in authedBeforeLoad.
const studentRedirectRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/student",
  staticData: permissionStaticData("/student", "STUDENT"),
  component: StudentPage,
});

const studentProfileRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: studentPath("/profile"),
  // Students have no account.self.read (owner rule 11/11); their profile is the dashboard's account tab.
  beforeLoad: () => {
    throw redirect({ href: "/student?tab=account", replace: true });
  },
});

const studentPortableExamRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/student/exams/portable",
  staticData: permissionStaticData("/student/exams/portable", "STUDENT"),
  component: () => <PortableExamPage workspace="STUDENT" />,
});

const studentDesktopReleaseRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/student/downloads/desktop",
  staticData: permissionStaticData("/student/downloads/desktop", "STUDENT"),
  component: () => <DesktopReleasePage workspace="STUDENT" />,
});

const learningOutcomesStudentRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/student/learning-outcomes",
  staticData: permissionStaticData("/student/learning-outcomes", "STUDENT"),
  component: () => <LearningOutcomesPage workspace="STUDENT" />,
});

const studentHelpRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/student/help",
  staticData: permissionStaticData("/student/help", "STUDENT"),
  component: () => <HelpGuidePage workspace="STUDENT" />,
});

const studentGamesRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/student/games",
  staticData: permissionStaticData("/student/games", "STUDENT"),
  component: StudentGamesPage,
});

function StudentGameRoom() {
  const { roomId } = studentGameRoomRoute.useParams();
  return <StudentGameRoomPage roomId={roomId} />;
}

const studentGameRoomRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/student/games/$roomId",
  staticData: permissionStaticData("/student/games", "STUDENT"),
  component: StudentGameRoom,
});

/** Children of `_authed`. */
export const studentRoutes = [
  studentHelpRoute,
  studentProfileRoute,
  studentRedirectRoute,
  studentPortableExamRoute,
  studentDesktopReleaseRoute,
  learningOutcomesStudentRoute,
  studentGamesRoute,
  studentGameRoomRoute,
];
