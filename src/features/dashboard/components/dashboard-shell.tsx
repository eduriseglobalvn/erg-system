import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CreateEducationUnitDialog } from "@/features/admin-operations";
import { DashboardContextBar } from "@/features/dashboard/components/dashboard-context-bar";
import { buildDashboardSections, type DashboardScopeMode } from "@/features/dashboard/config/dashboard-navigation";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";
import {
  classroomSnapshots,
  classroomSchools,
  defaultClassId,
  defaultSchoolId,
} from "@/features/classroom/api/mock-classroom-data";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/classroom/types/classroom-types";
import {
  loadLmsDashboardBootstrap,
  updateLmsCurrentScope,
  type LmsEducationUnitDTO,
} from "@/features/lms/infrastructure/lms-dashboard-api";
import { useI18n } from "@/features/i18n";
import type { QuestionBankQuestion } from "@/features/question-bank";
import type { ContentScope, DashboardUserPermissions, ManagementScope } from "@/types/scope-types";

import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import { hasApiBase } from "@/lib/api-client";

const COMPACT_DASHBOARD_BREAKPOINT = 1280;
const SCOPE_SYNC_DEBOUNCE_MS = 250;
type DashboardPortal = "lms";
const DASHBOARD_CONTEXT_STORAGE_KEY = "erg:lms-dashboard-context:v1";

type StoredDashboardContext = {
  activeLeafId?: string;
  activePortal?: DashboardPortal;
  managementScope?: ManagementScope;
};

function readStoredDashboardContext(): StoredDashboardContext {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DASHBOARD_CONTEXT_STORAGE_KEY);
    if (!raw) return {};
    const value = JSON.parse(raw) as StoredDashboardContext;
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function writeStoredDashboardContext(value: StoredDashboardContext) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DASHBOARD_CONTEXT_STORAGE_KEY, JSON.stringify(value));
}

function normalizeStoredLeafId(leafId?: string) {
  if (leafId === "admin-learning-structure" || leafId === "admin-learning-resources") return "admin-internal-docs";
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
  const { actions: authActions } = useAuthSession();
  const { t } = useI18n();
  const apiBacked = hasApiBase();
  const storedContext = useMemo(readStoredDashboardContext, []);
  const [schools, setSchools] = useState<ClassroomSchool[]>(() => (apiBacked ? [] : classroomSchools));
  const [manageableUnits, setManageableUnits] = useState<LmsEducationUnitDTO[]>([]);
  const [systemUnits, setSystemUnits] = useState<LmsEducationUnitDTO[]>([]);
  const [classes, setClasses] = useState<ClassroomSnapshot[]>(() => (apiBacked ? [] : classroomSnapshots));
  const [currentUserPermissions, setCurrentUserPermissions] = useState<DashboardUserPermissions>({
    canAccessGlobalErg: !apiBacked,
    assignedCenterIds: apiBacked ? [] : classroomSchools.map((school) => school.id),
  });
  const [managementScope, setManagementScope] = useState<ManagementScope>(() =>
    storedContext.managementScope ?? (apiBacked ? { level: "global" } : { level: "class", centerId: defaultSchoolId, classId: defaultClassId }),
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
  const scopeSyncTimerRef = useRef<number | null>(null);
  const lastSyncedScopeRef = useRef<ManagementScope | null>(null);
  const bootstrapQuery = useQuery({
    queryKey: ["dashboard", "bootstrap"],
    queryFn: loadLmsDashboardBootstrap,
    enabled: apiBacked,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });

  const activeLeaf = availableLeaves.find((leaf) => leaf.id === activeLeafId) ?? defaultLeaf;
  const allowedSchoolIds = currentUserPermissions.assignedCenterIds;
  const visibleSchools = currentUserPermissions.canAccessGlobalErg
    ? schools
    : schools.filter((school) => allowedSchoolIds.includes(school.id));
  const selectedSchoolId = managementScope.centerId ?? defaultSchoolId;
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? schools[0] ?? classroomSchools[0]!;
  const selectedClassOptions = classes.filter((classroom) => classroom.schoolId === selectedSchoolId);
  const firstClassInSchool = selectedClassOptions[0];
  const selectedClassId =
    managementScope.level === "class" ? managementScope.classId : firstClassInSchool?.id ?? defaultClassId;
  const isSchoolDenied =
    managementScope.level !== "global" &&
    !currentUserPermissions.canAccessGlobalErg &&
    Boolean(managementScope.centerId) &&
    !allowedSchoolIds.includes(managementScope.centerId);
  const contentScope: ContentScope =
    managementScope.level === "global"
      ? { type: "global" }
      : { type: "center", centerId: selectedSchool.id, centerName: selectedSchool.name };

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
    if (!availableLeaves.some((leaf) => leaf.id === activeLeafId)) {
      setActiveLeafId(defaultLeaf.id);
    }
  }, [activeLeafId, availableLeaves, defaultLeaf.id]);

  useEffect(() => {
    writeStoredDashboardContext({
      activeLeafId: activeLeaf.id,
      activePortal,
      managementScope,
    });
  }, [activeLeaf.id, activePortal, managementScope]);

  useEffect(() => {
    if (!bootstrapQuery.data) return;

    setSchools(bootstrapQuery.data.schools);
    setManageableUnits(bootstrapQuery.data.manageableUnits);
    setSystemUnits(bootstrapQuery.data.systemUnits);
    setClasses(bootstrapQuery.data.classes);
    setCurrentUserPermissions(bootstrapQuery.data.permissions);
    lastSyncedScopeRef.current = bootstrapQuery.data.managementScope;
    if (!storedContext.managementScope) {
      setManagementScope(bootstrapQuery.data.managementScope);
    }
  }, [bootstrapQuery.data, storedContext.managementScope]);

  useEffect(() => {
    if (!bootstrapQuery.error) return;
    console.error("Cannot load LMS bootstrap", bootstrapQuery.error);
  }, [bootstrapQuery.error]);

  useEffect(() => {
    return () => {
      if (scopeSyncTimerRef.current) {
        window.clearTimeout(scopeSyncTimerRef.current);
      }
    };
  }, []);

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

    if (scopeSyncTimerRef.current) {
      window.clearTimeout(scopeSyncTimerRef.current);
    }

    scopeSyncTimerRef.current = window.setTimeout(() => {
      lastSyncedScopeRef.current = nextScope;
      void updateLmsCurrentScope(nextScope).catch(() => {
        // Keep the UI optimistic; the next successful selection will re-sync the server scope.
        if (scopesEqual(lastSyncedScopeRef.current, nextScope)) {
          lastSyncedScopeRef.current = null;
        }
      });
      scopeSyncTimerRef.current = null;
    }, SCOPE_SYNC_DEBOUNCE_MS);
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
    };

    setSchools((current) => (current.some((school) => school.id === nextSchool.id) ? current : [...current, nextSchool]));
    setCurrentUserPermissions((current) => ({
      ...current,
      assignedCenterIds: current.assignedCenterIds.includes(unit.id)
        ? current.assignedCenterIds
        : [...current.assignedCenterIds, unit.id],
    }));
    setManagementScope({ level: "center", centerId: unit.id });
  }

  const dashboardContent = (
    <DashboardContent
      activeLeaf={activeLeaf}
      canAccessGlobalErg={currentUserPermissions.canAccessGlobalErg}
      contentScope={contentScope}
      deniedSchoolName={isSchoolDenied ? selectedSchool?.name : undefined}
      managementScope={managementScope}
      onOpenLeaf={openLeaf}
      pendingQuestionImports={pendingQuestionImports}
      selectedClassId={selectedClassId}
      selectedSchoolId={selectedSchoolId}
      onQuestionImportsHandled={() => setPendingQuestionImports([])}
      onCreateQuizFromBank={createQuizFromBank}
    />
  );

  return (
    <div className="flex h-screen max-h-screen flex-col overflow-hidden bg-[#f4f8fd] text-slate-950">
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
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen} className="h-full">
          <SidebarTrigger
            aria-label={t("sidebar.expandMenu")}
            className="fixed left-3 top-3 z-50 border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
          />
          <AppSidebar
            activeLeafId={activeLeaf.id}
            dashboardSections={dashboardSections}
            onSelectLeaf={openLeaf}
          />
          <SidebarInset className="min-h-0 flex-1 overflow-hidden">
            <div className="flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-hidden">
                {dashboardContent}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
      <CreateEducationUnitDialog
        open={createEducationUnitOpen}
        onOpenChange={setCreateEducationUnitOpen}
        onCreated={handleEducationUnitCreated}
      />
    </div>
  );
}
