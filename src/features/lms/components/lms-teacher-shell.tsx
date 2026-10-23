import { Box } from "@mui/material";

import ErgPortalLayout from "@/components/portal/ErgPortalLayout";
import {
  LmsHeaderClassControl,
  LmsHeaderSchoolControl,
} from "@/features/lms/components/lms-teacher-shell-presentation";
import {
  LmsTeacherDesktopContent,
  LmsTeacherMobileContent,
} from "@/features/lms/components/lms-teacher-shell-workspaces";
import { useLmsTeacherShellController } from "@/features/lms/components/use-lms-teacher-shell-controller";
import { LmsMobileShell } from "@/features/lms/mobile";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

export function LmsTeacherShell() {
  const model = useLmsTeacherShellController();

  if (model.isMobile) {
    return (
      <Box sx={{ bgcolor: "background.default", display: "flex", height: "100dvh", minHeight: "100dvh", minWidth: 0, overflow: "hidden", width: "100%" }}>
        <LmsMobileShell
          activeLabel={model.activeMobileNav.label}
          activeSection={model.activeMobileSection}
          classes={model.classes}
          dockItems={model.mobileDockItems}
          schoolName={model.selectedSchoolName}
          schools={model.schools}
          selectedClassId={model.selectedClass?.id ?? ""}
          selectedClassName={model.selectedClass?.className ?? "Lớp học"}
          selectedSchoolId={model.selectedSchoolId}
          teacherEmail={model.teacherEmail}
          teacherName={model.teacherName}
          unreadNotificationCount={model.unreadNotificationCount}
          onClassChange={model.setSelectedClassId}
          onOpenNotifications={() => void model.navigate({ href: teacherPath("/notifications") })}
          onNavigate={(path) => void model.navigate({ href: path })}
          onSchoolChange={model.selectSchool}
          onSignOut={model.signOut}
        >
          <LmsTeacherMobileContent model={model} />
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
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, bgcolor: "#FFFFFF" }}>
        <Box
          component="main"
          className="lms-teacher-shell"
          sx={{ flex: 1, minHeight: 0, overflow: "auto", overflowX: "hidden" }}
        >
          <LmsTeacherDesktopContent model={model} />
        </Box>
      </Box>
    </ErgPortalLayout>
  );
}
