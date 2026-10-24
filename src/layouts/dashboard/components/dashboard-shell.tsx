import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import { AppSidebar } from "@/components/app-sidebar";
import { CreateEducationUnitDialog } from "@/features/lcms/admin-operations";
import { DashboardContextBar } from "@/layouts/dashboard/components/dashboard-context-bar";
import { buildDashboardSections, type DashboardScopeMode } from "@/layouts/dashboard/config/dashboard-navigation";
import { DashboardContent } from "@/layouts/dashboard/components/dashboard-content";
import {
  classroomSnapshots,
  classroomSchools,
  defaultClassId,
  defaultSchoolId,
} from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomSchool } from "@/features/lms/classroom/types/classroom-types";
import {
  loadLmsDashboardBootstrap,
  updateLmsCurrentScope,
  type LmsEducationUnitDTO,
} from "@/features/lms/infrastructure/lms-dashboard-api";
import { useI18n } from "@/platform/i18n";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank";
import type { ContentScope, DashboardUserPermissions, ManagementScope } from "@/types/scope-types";

import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { hasApiBase } from "@/lib/api-client";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { useDebouncedCallback } from "@/hooks/use-paced-callback";
import { createPersistedStore } from "@/stores/persisted-store";

const COMPACT_DASHBOARD_BREAKPOINT = 1280;
const SCOPE_SYNC_DEBOUNCE_MS = 250;
type DashboardPortal = "lms";
const DASHBOARD_CONTEXT_STORAGE_KEY = "erg:lms-dashboard-context:v1";

type StoredDashboardContext = {
  activeLeafId?: string;
  activePortal?: DashboardPortal;
  managementScope?: ManagementScope;
};

const dashboardContextStore = createPersistedStore<StoredDashboardContext>(DASHBOARD_CONTEXT_STORAGE_KEY, {});

function readStoredDashboardContext(): StoredDashboardContext {
  return dashboardContextStore.get();
}

function writeStoredDashboardContext(value: StoredDashboardContext) {
  dashboardContextStore.set(value);
}

function normalizeStoredLeafId(leafId?: string) {
  if (leafId === "admin-learning-structure" || leafId === "admin-internal-docs") return "admin-learning-resources";
  return leafId;
}

function scopesEqual(left: ManagementScope | null | undefined, right: ManagementScope | null | undefined) {
  if (!left || !right) return false;

  return (
    left.level === right.level &&
    left.centerId === right.centerId &&
    ("classId" in left ? left.classId : undefined) === ("classId" in right ? right.classId : undefined)
  );
}

export function DashboardShell() {
  const { actions: authActions, account } = useAuthSession();
  const { t } = useI18n();
  const apiBacked = hasApiBase();
  const fixturesEnabled = runtimeFixturesEnabled();
  const tenantId = getDefaultTenantId();
  const storedContext = useMemo(() => readStoredDashboardContext(), []);
  const [createdSchools, setCreatedSchools] = useState<ClassroomSchool[]>([]);
  const [createdCenterIds, setCreatedCenterIds] = useState<string[]>([]);
  const [selectedManagementScope, setManagementScope] = useState<ManagementScope | null>(() =>
    storedContext.managementScope ?? (apiBacked || !fixturesEnabled ? null : { level: "class", centerId: defaultSchoolId, classId: defaultClassId }),
  );
  const bootstrapQuery = useQuery({
    queryKey: queryKeys.dashboard.bootstrap("lms", tenantId, account?.id),
    queryFn: ({ signal }) => loadLmsDashboardBootstrap(signal),
    enabled: apiBacked,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  const bootstrapData = bootstrapQuery.data;
  const bootstrapPermissions = useMemo<DashboardUserPermissions>(
    () => bootstrapData?.permissions ?? {
      canAccessGlobalErg: fixturesEnabled && !apiBacked,
      assignedCenterIds: apiBacked || !fixturesEnabled ? [] : classroomSchools.map((school) => school.id),
      roles: apiBacked || !fixturesEnabled ? [] : ["teacher", "lms_teacher_standard"],
      grantedPermissions: apiBacked || !fixturesEnabled ? [] : ["lms.*", "account.self.*"],
      deniedPermissions: [],
    },
    [apiBacked, bootstrapData?.permissions, fixturesEnabled],
  );
  const schools = useMemo(() => {
    const baseSchools = bootstrapData?.schools ?? (fixturesEnabled && !apiBacked ? classroomSchools : []);
    return createdSchools.reduce(
      (nextSchools, school) => (nextSchools.some((item) => item.id === school.id) ? nextSchools : [...nextSchools, school]),
      baseSchools,
    );
  }, [apiBacked, bootstrapData?.schools, createdSchools, fixturesEnabled]);
  const manageableUnits = bootstrapData?.manageableUnits ?? [];
  const systemUnits = bootstrapData?.systemUnits ?? [];
  const classes = bootstrapData?.classes ?? (fixturesEnabled && !apiBacked ? classroomSnapshots : []);
  const currentUserPermissions = useMemo<DashboardUserPermissions>(
    () => ({
      ...bootstrapPermissions,
      assignedCenterIds: createdCenterIds.reduce(
        (ids, centerId) => (ids.includes(centerId) ? ids : [...ids, centerId]),
        bootstrapPermissions.assignedCenterIds,
      ),
    }),
    [bootstrapPermissions, createdCenterIds],
  );
  const managementScope = useMemo<ManagementScope>(
    () => selectedManagementScope ?? bootstrapData?.managementScope ?? { level: "global" },
    [bootstrapData?.managementScope, selectedManagementScope],
  );
  const activePortal: DashboardPortal = "lms";
  const isSchoolScope = managementScope.level === "class";
  const scopeMode: DashboardScopeMode = managementScope.level === "global"
      ? "system"
      : managementScope.level === "center"
        ? "center"
        : "school";
  const canManageMembers = !isSchoolScope && (currentUserPermissions.canAccessGlobalErg || managementScope.level === "center");
  const dashboardSections = useMemo(
    () => buildDashboardSections(t, { scopeMode, showMemberManagement: canManageMembers }),
    [canManageMembers, scopeMode, t],
  );
  const availableLeaves = useMemo(
    () => dashboardSections.flatMap((section) => section.items),
    [dashboardSections],
  );
  const defaultLeaf = dashboardSections[0]?.items[0] ?? dashboardSections[1]!.items[0]!;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLeafId, setActiveLeafId] = useState(() => normalizeStoredLeafId(storedContext.activeLeafId) ?? defaultLeaf.id);
  const [createEducationUnitOpen, setCreateEducationUnitOpen] = useState(false);
  const [pendingQuestionImports, setPendingQuestionImports] = useState<QuestionBankQuestion[]>([]);
  const lastSyncedScopeRef = useRef<ManagementScope | null>(null);
  const syncScope = useDebouncedCallback((nextScope: ManagementScope) => {
    lastSyncedScopeRef.current = nextScope;
    void updateLmsCurrentScope(nextScope).catch(() => {
      // Keep the UI optimistic; the next successful selection will re-sync the server scope.
      if (scopesEqual(lastSyncedScopeRef.current, nextScope)) {
        lastSyncedScopeRef.current = null;
      }
    });
  }, SCOPE_SYNC_DEBOUNCE_MS);

  const activeLeaf = availableLeaves.find((leaf) => leaf.id === activeLeafId) ?? defaultLeaf;
  const allowedSchoolIds = currentUserPermissions.assignedCenterIds;
  const visibleSchools = currentUserPermissions.canAccessGlobalErg
    ? schools
    : schools.filter((school) => allowedSchoolIds.includes(school.id));
  const selectedSchoolId = managementScope.centerId ?? (fixturesEnabled ? defaultSchoolId : "");
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? schools[0];
  const selectedClassOptions = classes.filter((classroom) => classroom.schoolId === selectedSchoolId);
  const firstClassInSchool = selectedClassOptions[0];
  const selectedClassId =
    managementScope.level === "class" ? managementScope.classId : firstClassInSchool?.id ?? (fixturesEnabled ? defaultClassId : "");
  const isSchoolDenied =
    managementScope.level !== "global" &&
    !currentUserPermissions.canAccessGlobalErg &&
    Boolean(managementScope.centerId) &&
    !allowedSchoolIds.includes(managementScope.centerId);
  const contentScope: ContentScope =
    managementScope.level === "global"
      ? { type: "global" }
      : { type: "center", centerId: selectedSchool?.id ?? managementScope.centerId, centerName: selectedSchool?.name ?? "Phạm vi hiện tại" };

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${COMPACT_DASHBOARD_BREAKPOINT - 1}px)`);

    const syncSidebarState = (event?: MediaQueryListEvent) => {
      const isCompact = event?.matches ?? mediaQuery.matches;
      if (isCompact) {
        setSidebarOpen(false);
      }
    };

    syncSidebarState();
    mediaQuery.addEventListener("change", syncSidebarState);

    return () => mediaQuery.removeEventListener("change", syncSidebarState);
  }, []);

  useEffect(() => {
    writeStoredDashboardContext({
      activeLeafId: activeLeaf.id,
      activePortal,
      managementScope,
    });
  }, [activeLeaf.id, activePortal, managementScope]);

  useEffect(() => {
    if (!bootstrapQuery.data) return;

    lastSyncedScopeRef.current = bootstrapQuery.data.managementScope;
  }, [bootstrapQuery.data]);

  useEffect(() => {
    if (!bootstrapQuery.error) return;
    console.error("Cannot load LMS bootstrap", bootstrapQuery.error);
  }, [bootstrapQuery.error]);

  function openLeaf(leafId: string) {
    if (leafId === "admin-create-unit") {
      if (currentUserPermissions.canAccessGlobalErg) {
        setCreateEducationUnitOpen(true);
      }
      return;
    }

    setActiveLeafId(normalizeStoredLeafId(leafId) ?? leafId);
  }

  function createQuizFromBank(questions: QuestionBankQuestion[]) {
    setPendingQuestionImports(questions);
    setActiveLeafId("course-modules");
  }

  function scheduleScopeSync(nextScope: ManagementScope) {
    if (!currentUserPermissions.canAccessGlobalErg && nextScope.level === "global") {
      return;
    }

    if (scopesEqual(lastSyncedScopeRef.current, nextScope)) {
      return;
    }

    syncScope.run(nextScope);
  }

  function selectScopeRoot(value: string) {
    if (value === "global" && currentUserPermissions.canAccessGlobalErg) {
      const nextScope: ManagementScope = { level: "global" };
      if (activePortal === "lms" && scopesEqual(managementScope, nextScope)) {
        return;
      }
      setManagementScope(nextScope);
      scheduleScopeSync(nextScope);
      setActiveLeafId("admin-overview");
      return;
    }

    const firstClass = classes.find((classroom) => classroom.schoolId === value);
    const nextScope: ManagementScope = firstClass
      ? { level: "class", centerId: value, classId: firstClass.id }
      : { level: "center", centerId: value };
    if (activePortal === "lms" && scopesEqual(managementScope, nextScope)) {
      return;
    }
    setManagementScope(nextScope);
    scheduleScopeSync(nextScope);
    setActiveLeafId(nextScope.level === "center" ? "admin-overview" : "ops-overview");
  }

  function selectClass(classId: string) {
    const nextClass = classes.find((snapshot) => snapshot.id === classId);
    if (nextClass) {
      const nextScope: ManagementScope = { level: "class", centerId: nextClass.schoolId, classId: nextClass.id };
      if (scopesEqual(managementScope, nextScope)) {
        return;
      }
      setManagementScope(nextScope);
      scheduleScopeSync(nextScope);
    }
  }

  function handleEducationUnitCreated(unit: LmsEducationUnitDTO) {
    const nextSchool: ClassroomSchool = {
      id: unit.id,
      name: unit.name,
      clusterId: "central",
      principal: unit.type === "school" ? "Quản trị trường" : "Quản trị trung tâm",
      activeStudents: 0,
      activeClasses: 0,
      completionRate: 0,
      averageScore: 0,
      overdueAssignments: 0,
      flaggedStudents: 0,
      metricsAvailable: false,
    };

    setCreatedSchools((current) => (current.some((school) => school.id === nextSchool.id) ? current : [...current, nextSchool]));
    setCreatedCenterIds((current) => (current.includes(unit.id) ? current : [...current, unit.id]));
    setManagementScope({ level: "center", centerId: unit.id });
  }

  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  const handleOpenQuiz = (quizId: string) => {
    setCurrentQuizId(quizId);
  };

  const dashboardContent = (
    <DashboardContent
      activeLeaf={activeLeaf}
      adminCenters={schools}
      adminClasses={classes}
      canAccessGlobalErg={currentUserPermissions.canAccessGlobalErg}
      contentScope={contentScope}
      deniedSchoolName={isSchoolDenied ? selectedSchool?.name : undefined}
      managementScope={managementScope}
      onOpenLeaf={openLeaf}
      onOpenQuiz={handleOpenQuiz}
      quizEditorQuizId={currentQuizId}
      pendingQuestionImports={pendingQuestionImports}
      selectedClassId={selectedClassId}
      selectedSchoolId={selectedSchoolId}
      onQuestionImportsHandled={() => setPendingQuestionImports([])}
      onCreateQuizFromBank={createQuizFromBank}
    />
  );

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        maxHeight: "100dvh",
        overflow: "hidden",
      }}
    >
      <DashboardContextBar
      canAccessGlobalErg={currentUserPermissions.canAccessGlobalErg}
      activePortal={activePortal}
      classes={selectedClassOptions}
        managementScope={managementScope}
        onOpenLeaf={openLeaf}
        onSelectClass={selectClass}
        onSelectScopeRoot={selectScopeRoot}
        onLogout={authActions.signOut}
        schools={visibleSchools}
        manageableUnits={manageableUnits}
        systemUnits={systemUnits}
        selectedClassId={selectedClassId}
        selectedSchoolId={selectedSchoolId}
      />
      <Box sx={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <IconButton
          aria-label={t("sidebar.expandMenu")}
          onClick={() => setSidebarOpen(true)}
          sx={{
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            display: { xs: "inline-flex", md: "none" },
            left: 12,
            position: "fixed",
            top: 12,
            zIndex: (theme) => theme.zIndex.drawer + 2,
          }}
        >
          <MenuRoundedIcon />
        </IconButton>

        <Box sx={{ display: { xs: "none", md: "block" }, height: "100%" }}>
          <AppSidebar
            activeLeafId={activeLeaf.id}
            dashboardSections={dashboardSections}
            onSelectLeaf={openLeaf}
          />
        </Box>

        <Drawer
          onClose={() => setSidebarOpen(false)}
          open={sidebarOpen}
          slotProps={{ paper: { sx: { width: 280 } } }}
          sx={{ display: { xs: "block", md: "none" } }}
        >
          <Box sx={{ height: "100%" }}>
            <AppSidebar
              activeLeafId={activeLeaf.id}
              dashboardSections={dashboardSections}
              onSelectLeaf={(leafId) => {
                openLeaf(leafId);
                setSidebarOpen(false);
              }}
            />
          </Box>
        </Drawer>

        <Box component="main" sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {dashboardContent}
        </Box>
      </Box>
      <CreateEducationUnitDialog
        open={createEducationUnitOpen}
        onOpenChange={setCreateEducationUnitOpen}
        onCreated={handleEducationUnitCreated}
      />
    </Box>
  );
}
