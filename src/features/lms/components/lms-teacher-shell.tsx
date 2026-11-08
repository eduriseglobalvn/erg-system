import Box from "@mui/material/Box";
import { Outlet } from "@tanstack/react-router";

import ErgPortalLayout from "@/components/portal/ErgPortalLayout";
import { ERG_FULL_VIEWPORT_FALLBACK } from "@/components/portal/erg-mobile-dock";
import {
  LmsHeaderClassControl,
  LmsHeaderSchoolControl,
} from "@/features/lms/components/lms-teacher-shell-presentation";
import { LmsTeacherShellContext } from "@/features/lms/components/lms-teacher-shell-context";
import { useLmsTeacherShellController } from "@/features/lms/components/use-lms-teacher-shell-controller";
import { LmsMobileShell } from "@/features/lms/mobile";

/** Teacher workspace layout: owns school/class state and chrome; each page is a child route rendered in <Outlet />. */
export function LmsTeacherShell() {
  const model = useLmsTeacherShellController();
  return (
    <LmsTeacherShellContext.Provider value={model}>
      <LmsTeacherShellFrame model={model} />
    </LmsTeacherShellContext.Provider>
  );
}

function LmsTeacherShellFrame({ model }: { model: ReturnType<typeof useLmsTeacherShellController> }) {
  if (model.isMobile) {
    return (
      <Box sx={{ bgcolor: "background.default", display: "flex", height: "100dvh", minHeight: "100dvh", ...ERG_FULL_VIEWPORT_FALLBACK, minWidth: 0, overflow: "hidden", width: "100%" }}>
        <LmsMobileShell
          activeLabel={model.activeMobileNav.label}
          activeSection={model.activeMobileSection}
          classes={model.classes}
          dockItems={model.mobileDockItems}
          hideDock={model.pathname.endsWith("/homework/assign")}
          moreItems={model.mobileMoreItems}
          schoolName={model.selectedSchoolName}
          schools={model.schools}
          selectedClassId={model.selectedClass?.id ?? ""}
          selectedClassName={model.selectedClass?.className ?? "Lớp học"}
          selectedSchoolId={model.selectedSchoolId}
          teacherEmail={model.teacherEmail}
          teacherName={model.teacherName}
          onClassChange={model.setSelectedClassId}
          onNavigate={(path) => void model.navigate({ href: path })}
          onSchoolChange={model.selectSchool}
          onSignOut={model.signOut}
        >
          <Outlet />
        </LmsMobileShell>
      </Box>
    );
  }

  return (
    <ErgPortalLayout
      contentMode="flush"
      headerControls={
        <LmsHeaderSchoolControl
          schoolId={model.selectedSchoolId}
          schools={model.schools}
          onSchoolChange={model.handleSchoolChange}
        />
      }
      headerTrailingControls={
        model.selectedClassOptions.length ? (
          <LmsHeaderClassControl
            classes={model.selectedClassOptions}
            selectedClassId={model.selectedClass?.id ?? ""}
            onClassChange={model.handleClassChange}
          />
        ) : null
      }
      menuGroups={model.filteredMenuGroups}
      notificationCount={model.unreadNotificationCount}
      portalInfo={model.lmsPortalInfo}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, bgcolor: "background.paper" }}>
        <Box
          component="main"
          sx={{ flex: 1, minHeight: 0, overflow: "auto", overflowX: "hidden" }}
        >
          <Outlet />
        </Box>
      </Box>
    </ErgPortalLayout>
  );
}
