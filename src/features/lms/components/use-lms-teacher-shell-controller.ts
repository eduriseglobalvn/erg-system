import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import {
  assignmentRuns,
  classroomSchools,
  classroomSnapshots,
  defaultClassId,
  defaultSchoolId,
} from "@/features/lms/classroom/api/mock-classroom-data";
import type { AssignmentRun } from "@/features/lms/classroom/types/classroom-types";
import { loadLmsTeacherHomeworkWorkspace, mapAssignmentsToRuns } from "@/features/lms/api/lms-teacher-homework-api";
import { lmsAssignmentReadQueryKeys } from "@/features/lms/api/lms-assignment-command-query";
import { loadLmsDashboardBootstrap } from "@/features/lms/infrastructure/lms-dashboard-api";
import { getCurrentAcademicYear } from "@/features/lms/learning-resources/api/teacher-resource-dashboard-api";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile";
import { fetchUnreadNotificationCount, notificationQueryKeys } from "@/features/notifications/api/notification-api";
import { isSchedulePublishedNotification, resolveLmsTeacherRuns } from "@/features/lms/components/lms-teacher-shell-utils";
import {
  LMS_MENU_GROUPS,
  lmsMobileDockItems,
  lmsNavItems,
  resolveMobileSection,
  resolveSection,
} from "@/features/lms/components/lms-teacher-shell-config";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-api";
import { canNavigateToLmsPath, filterLmsNavigation } from "@/features/lms/navigation/lms-navigation";
import { hasApiBase } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

export function useLmsTeacherShellController() {
  const { actions, account, session } = useAuthSession("lms");
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const apiBacked = hasApiBase();
  const tenantId = session?.tenantId ?? "";
  const notificationScope = useMemo(() => ({ accountId: account?.id, tenantId }), [account?.id, tenantId]);
  const pathname = location.pathname;
  const progressAssignmentId = new URLSearchParams(location.searchStr).get("assignmentId");
  const activeSection = resolveSection(pathname);
  const activeMobileSection = resolveMobileSection(pathname);
  const shouldLoadHomeworkWorkspace = activeSection === "home" || activeSection === "homework";
  const [requestedSchoolId, setSelectedSchoolId] = useState("");
  const [requestedClassId, setSelectedClassId] = useState("");
  const [createdRuns, setCreatedRuns] = useState<AssignmentRun[]>([]);
  const bootstrapQuery = useQuery({
    queryKey: queryKeys.lmsTeacherShell.bootstrap(tenantId, account?.id),
    queryFn: ({ signal }) => loadLmsDashboardBootstrap(signal),
    enabled: apiBacked,
    staleTime: QUERY_POLICIES.reference.staleTime,
    gcTime: QUERY_POLICIES.reference.gcTime,
    refetchOnWindowFocus: false,
  });
  const notificationUnreadQuery = useQuery({
    queryKey: notificationQueryKeys.unreadCount("lms", notificationScope),
    queryFn: ({ signal }) => fetchUnreadNotificationCount("lms", signal),
    enabled: apiBacked,
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
  const homeworkWorkspaceQuery = useQuery({
    queryKey: lmsAssignmentReadQueryKeys.homeworkWorkspace(tenantId, account?.id),
    queryFn: ({ signal }) => loadLmsTeacherHomeworkWorkspace({ page: 0, size: 50, status: "active", tenantId }, signal),
    enabled: apiBacked && shouldLoadHomeworkWorkspace,
    staleTime: QUERY_POLICIES.offlineCore.staleTime,
    gcTime: QUERY_POLICIES.offlineCore.gcTime,
    refetchOnWindowFocus: false,
  });
  const schools = useMemo(
    () => bootstrapQuery.data?.schools.length ? bootstrapQuery.data.schools : apiBacked ? [] : classroomSchools,
    [apiBacked, bootstrapQuery.data?.schools],
  );
  const classes = useMemo(
    () => bootstrapQuery.data?.classes.length ? bootstrapQuery.data.classes : apiBacked ? [] : classroomSnapshots,
    [apiBacked, bootstrapQuery.data?.classes],
  );
  const workspaceRuns = useMemo(
    () =>
      homeworkWorkspaceQuery.data
        ? mapAssignmentsToRuns(homeworkWorkspaceQuery.data.assignments.items, homeworkWorkspaceQuery.data.classOptions)
        : [],
    [homeworkWorkspaceQuery.data],
  );
  const runs = useMemo(
    () => resolveLmsTeacherRuns({ apiBacked, createdRuns, fallbackRuns: assignmentRuns, workspaceRuns }),
    [apiBacked, createdRuns, workspaceRuns],
  );
  const bootstrapSelection = useMemo(() => {
    const scope = bootstrapQuery.data?.managementScope;
    const scopedSchoolId =
      scope?.centerId && schools.some((school) => school.id === scope.centerId)
        ? scope.centerId
        : schools[0]?.id ?? (apiBacked ? "" : defaultSchoolId);
    const classInScope =
      scope?.level === "class"
        ? classes.find((classroom) => classroom.id === scope.classId && classroom.schoolId === scopedSchoolId)
        : undefined;
    const firstClassInSchool = classes.find((classroom) => classroom.schoolId === scopedSchoolId);

    return {
      schoolId: scopedSchoolId,
      classId: classInScope?.id ?? firstClassInSchool?.id ?? classes[0]?.id ?? (apiBacked ? "" : defaultClassId),
    };
  }, [apiBacked, bootstrapQuery.data?.managementScope, classes, schools]);
  const selectedSchoolId = schools.some((school) => school.id === requestedSchoolId)
    ? requestedSchoolId
    : bootstrapSelection.schoolId;
  const selectedClassOptions = useMemo(
    () => classes.filter((classroom) => classroom.schoolId === selectedSchoolId),
    [classes, selectedSchoolId],
  );
  const selectedClassId = selectedClassOptions.some((classroom) => classroom.id === requestedClassId)
    ? requestedClassId
    : selectedClassOptions.some((classroom) => classroom.id === bootstrapSelection.classId)
      ? bootstrapSelection.classId
      : selectedClassOptions[0]?.id ?? classes[0]?.id ?? (apiBacked ? "" : defaultClassId);
  const selectedClass = selectedClassOptions.find((classroom) => classroom.id === selectedClassId) ?? selectedClassOptions[0];
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? schools[0] ?? (apiBacked ? undefined : classroomSchools[0]);
  const selectedSchoolName = selectedSchool?.name ?? "ERG";
  const activeNav = lmsNavItems.find((item) => item.id === activeSection) ?? lmsNavItems[0];
  const activeMobileNav = lmsMobileDockItems.find((item) => item.id === activeMobileSection) ?? {
    ...lmsMobileDockItems[0],
    label: activeNav.label,
  };
  const teacherName = account?.fullName || "Lê Thị Thùy";
  const teacherEmail = account?.email || "teacher@erg.edu.vn";
  const learningResourceScope = useMemo(
    () => ({
      accountId: account?.id,
      academicYear: getCurrentAcademicYear(),
      selectedSchoolId,
      tenantId,
    }),
    [account?.id, selectedSchoolId, tenantId],
  );
  const isMobile = useLmsMobileBreakpoint();
  const unreadNotificationCount = notificationUnreadQuery.data?.unread ?? 0;
  const grantedPermissions = useMemo(
    () => bootstrapQuery.data?.permissions.grantedPermissions ?? session?.permissions ?? [],
    [bootstrapQuery.data?.permissions.grantedPermissions, session?.permissions],
  );
  const deniedPermissions = useMemo(
    () => bootstrapQuery.data?.permissions.deniedPermissions ?? session?.deniedPermissions ?? [],
    [bootstrapQuery.data?.permissions.deniedPermissions, session?.deniedPermissions],
  );
  const filteredMenuGroups = useMemo(
    () => filterLmsNavigation(LMS_MENU_GROUPS, grantedPermissions, deniedPermissions),
    [deniedPermissions, grantedPermissions],
  );
  const mobileDockItems = useMemo(
    () =>
      lmsMobileDockItems
        .filter((item) => canNavigateToLmsPath(item.path, grantedPermissions, deniedPermissions))
        .map((item) => (item.id === "notifications" ? { ...item, badgeCount: unreadNotificationCount } : item)),
    [deniedPermissions, grantedPermissions, unreadNotificationCount],
  );

  useEffect(() => {
    if (!bootstrapQuery.error) return;
    console.error("Cannot load LMS teacher bootstrap", bootstrapQuery.error);
  }, [bootstrapQuery.error]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const handleNotificationMessage = (event: MessageEvent) => {
      if (event.data?.type !== "erg:notification-push") return;

      const portal = typeof event.data.payload?.portal === "string" ? event.data.payload.portal.toLowerCase() : "lms";
      if (portal !== "lms") return;

      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root("lms", notificationScope) });
      if (isSchedulePublishedNotification(event.data.payload)) {
        void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lms", tenantId) });
      }
    };

    navigator.serviceWorker.addEventListener("message", handleNotificationMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleNotificationMessage);
  }, [notificationScope, queryClient, tenantId]);

  function selectSchool(schoolId: string) {
    const firstClass = classes.find((classroom) => classroom.schoolId === schoolId);
    setSelectedSchoolId(schoolId);
    setSelectedClassId(firstClass?.id ?? classes[0]?.id ?? defaultClassId);
  }

  function signOut() {
    actions.signOut();
    logoutAccount();
    void navigate({ replace: true, to: "/login" });
  }

  function handleSchoolChange(e: { target: { value: string } }) {
    selectSchool(e.target.value);
  }

  function handleClassChange(e: { target: { value: string } }) {
    setSelectedClassId(e.target.value);
  }

  function handleLocalAssignmentCreated(title: string, subject: string, destination: string) {
    if (!apiBacked) {
      const newRun: AssignmentRun = {
        id: `assignment-${Date.now()}`,
        title,
        subjectLabel: subject,
        targetLevel: selectedClass?.className ?? "Cả lớp",
        activeClasses: 1,
        completionRate: 0,
        submittedCount: 0,
        inProgressCount: 0,
        needsReviewCount: 0,
        dueLabel: "Hạn nộp sau 7 ngày",
      };
      setCreatedRuns((current) => [newRun, ...current]);
    }
    void navigate({ href: teacherPath(destination) });
  }

  const lmsPortalInfo = {
    name: "Teacher Workspace ERG",
    plan: "",
    centerName: selectedSchoolName,
    userName: teacherName,
    userEmail: teacherEmail,
    workspaceCapabilities: session?.workspaces,
    workspacePortals: session?.portals ?? ["lms"],
  };

  return {
    requestedSchoolId,
    setSelectedSchoolId,
    requestedClassId,
    setSelectedClassId,
    createdRuns,
    setCreatedRuns,
    navigate,
    queryClient,
    apiBacked,
    tenantId,
    notificationScope,
    pathname,
    progressAssignmentId,
    activeSection,
    activeMobileSection,
    shouldLoadHomeworkWorkspace,
    bootstrapQuery,
    notificationUnreadQuery,
    homeworkWorkspaceQuery,
    schools,
    classes,
    workspaceRuns,
    runs,
    bootstrapSelection,
    selectedSchoolId,
    selectedClassOptions,
    selectedClassId,
    selectedClass,
    selectedSchool,
    selectedSchoolName,
    activeNav,
    activeMobileNav,
    teacherName,
    teacherEmail,
    learningResourceScope,
    isMobile,
    unreadNotificationCount,
    grantedPermissions,
    deniedPermissions,
    filteredMenuGroups,
    mobileDockItems,
    selectSchool,
    signOut,
    handleSchoolChange,
    handleClassChange,
    handleLocalAssignmentCreated,
    lmsPortalInfo,
  };
}

export type LmsTeacherShellController = ReturnType<typeof useLmsTeacherShellController>;
