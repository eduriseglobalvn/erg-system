import type { Page, Route } from "@playwright/test";

import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type { SmokePortal } from "./portal-smoke-fixtures";

export type PortalSmokeNetworkState = {
  failApi: boolean;
  failedRequests: number;
  pageErrors: string[];
};

const API_ROUTE_PATTERN = /^https?:\/\/[^/]+\/api\//;

const emptyPage = {
  hasNext: false,
  hasPrevious: false,
  items: [],
  page: 0,
  size: 20,
  totalItems: 0,
  totalPages: 0,
};

export async function setupPortalNetwork(page: Page, portal: SmokePortal) {
  const state: PortalSmokeNetworkState = { failApi: false, failedRequests: 0, pageErrors: [] };
  page.on("pageerror", (error) => state.pageErrors.push(error.message));

  await page.route(API_ROUTE_PATTERN, async (route) => {
    if (state.failApi) {
      state.failedRequests += 1;
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ code: "SMOKE_FAILURE", message: "Injected smoke failure" }) });
      return;
    }

    const url = new URL(route.request().url());
    if (url.pathname === API_ENDPOINTS.legacy.v1SessionsCurrent) {
      await json(route, sessionBootstrap(portal));
      return;
    }
    if (url.pathname === API_ENDPOINTS.graphql) {
      const request = route.request().postDataJSON() as { operationName?: string } | null;
      await json(route, { data: graphQlData(request?.operationName ?? "") });
      return;
    }

    await json(route, {});
  });

  return state;
}

function sessionBootstrap(portal: SmokePortal) {
  return {
    user: { id: `${portal}-smoke-user`, name: `${portal.toUpperCase()} Smoke User`, email: `${portal}@example.test` },
    permissions: { canAccessGlobalErg: true, roles: ["system.super_admin"], grantedPermissions: ["*"], deniedPermissions: [] },
    workspaces: ["ADMIN", "TEACHER", "STUDENT", "CRM"],
    currentScope: { level: "system", unitId: "tenant-smoke" },
    availableScopeOptions: [{ level: "system", unitId: "tenant-smoke", label: "ERG" }],
    manageableUnits: [
      { id: "tenant-smoke", type: "system", level: "system", name: "ERG" },
      { id: "school-alpha", type: "school", level: "school", name: "Trường Alpha" },
      { id: "school-beta", type: "school", level: "school", name: "Trường Beta" },
    ],
    manageableClasses: [
      { id: "class-10a1", name: "10A1", unitId: "school-alpha" },
      { id: "class-11a2", name: "11A2", unitId: "school-beta" },
    ],
  };
}

function graphQlData(operationName: string) {
  switch (operationName) {
    case "ElearningStudentDashboard":
      return {
        elearning: {
          studentDashboard: {
            tenantId: "tenant-smoke",
            viewer: { userId: "elearning-smoke-user", tenantId: "tenant-smoke", accountType: "STUDENT", accessLevel: "LEARNER" },
            profile: { userId: "elearning-smoke-user", studentId: "student-smoke", studentCode: "STU-SMOKE", fullName: "ELEARNING Smoke User", email: "elearning@example.test", schoolId: "school-smoke", academicClassId: "class-smoke", status: "ACTIVE", updatedAt: "2026-07-28T00:00:00Z" },
            summary: { activeAssignmentCount: 0, enrolledCourseCount: 0, pendingActionCount: 0, generatedAt: "2026-07-28T00:00:00Z", scoreSummary: { attemptedAssignmentCount: 0, averagePercent: 0, bestPercent: 0, completedAttemptCount: 0, passedAttemptCount: 0 } },
            courses: [], assignments: [], nextActions: [], announcements: [],
          },
        },
      };
    case "LmsTeacherHomeworkWorkspace":
      return { lms: { teacherHomeworkWorkspace: { assignments: emptyPage, classOptions: [], overdueStudents: emptyPage, pendingReviews: emptyPage, summary: {} } } };
    case "LmsClassWorkspace":
      return { lms: { classWorkspace: { assignments: emptyPage, classInfo: { id: "class-smoke" }, students: emptyPage } } };
    case "LmsAssignmentProgressWorkspace":
      return { lms: { assignmentProgressWorkspace: { assignment: { id: "assignment-smoke" }, attempts: emptyPage, missingLateStudents: emptyPage, recipients: emptyPage, summary: {} } } };
    case "LmsStudentGroups":
      return { lms: { studentGroups: [] } };
    case "TeachingCalendarMyTeachingSchedule":
      return {
        lms: {
          myTeachingCalendar: teachingCalendarWorkspace,
        },
      };
    default:
      return { lms: {}, lcms: {}, crm: {}, elearning: {} };
  }
}

const teachingCalendarWorkspace = {
  tenantId: "tenant-smoke",
  from: "2026-08-01",
  to: "2026-08-31",
  viewMode: "ALL",
  events: [
    {
      id: "calendar-event-alpha",
      batchId: "batch-smoke",
      title: "IC3 GS6 · Máy tính căn bản",
      startAt: "2026-08-13T08:00:00+07:00",
      endAt: "2026-08-13T09:00:00+07:00",
      date: "2026-08-13",
      startTime: "08:00",
      endTime: "09:00",
      schoolId: "school-alpha",
      schoolName: "Trường Alpha",
      classId: "class-10a1",
      className: "10A1",
      subjectId: "subject-it",
      subjectName: "Tin học",
      levelId: "level-ic3",
      levelName: "IC3 GS6",
      roomId: "room-101",
      roomName: "P.101",
      periodStart: 1,
      periodCount: 1,
      teachers: [{ userId: "lms-smoke-user", displayName: "LMS Smoke User", role: "MAIN", colorKey: "blue" }],
      status: "PUBLISHED",
      note: null,
      colorGroup: { key: "blue", label: "Trường Alpha", kind: "PUBLISHED" },
    },
    {
      id: "calendar-event-beta",
      batchId: "batch-smoke",
      title: "MOS Excel",
      startAt: "2026-08-15T13:30:00+07:00",
      endAt: "2026-08-15T14:30:00+07:00",
      date: "2026-08-15",
      startTime: "13:30",
      endTime: "14:30",
      schoolId: "school-beta",
      schoolName: "Trường Beta",
      classId: "class-11a2",
      className: "11A2",
      subjectId: "subject-office",
      subjectName: "Tin học văn phòng",
      levelId: "level-mos",
      levelName: "MOS",
      roomId: "room-202",
      roomName: "P.202",
      periodStart: 3,
      periodCount: 1,
      teachers: [{ userId: "lms-smoke-user", displayName: "LMS Smoke User", role: "MAIN", colorKey: "green" }],
      status: "PUBLISHED",
      note: null,
      colorGroup: { key: "green", label: "Trường Beta", kind: "PUBLISHED" },
    },
  ],
  filterOptions: {
    schools: [
      { id: "school-alpha", label: "Trường Alpha", count: 1, colorKey: "blue" },
      { id: "school-beta", label: "Trường Beta", count: 1, colorKey: "green" },
    ],
    classes: [
      { id: "class-10a1", label: "10A1", count: 1, colorKey: "blue" },
      { id: "class-11a2", label: "11A2", count: 1, colorKey: "green" },
    ],
    teachers: [{ id: "lms-smoke-user", label: "LMS Smoke User", count: 2, colorKey: "blue" }],
    subjects: [
      { id: "subject-it", label: "Tin học", count: 1, colorKey: "blue" },
      { id: "subject-office", label: "Tin học văn phòng", count: 1, colorKey: "green" },
    ],
    levels: [],
  },
  laneSummaries: [],
  catalog: {
    schools: [
      { id: "school-alpha", label: "Trường Alpha", count: 1, colorKey: "blue" },
      { id: "school-beta", label: "Trường Beta", count: 1, colorKey: "green" },
    ],
    classes: [
      { id: "class-10a1", schoolId: "school-alpha", label: "10A1", grade: "10", academicYear: "2026" },
      { id: "class-11a2", schoolId: "school-beta", label: "11A2", grade: "11", academicYear: "2026" },
    ],
    teachers: [{ id: "lms-smoke-user", label: "LMS Smoke User", colorKey: "blue" }],
    assistantTeachers: [],
    subjects: [
      { id: "subject-it", label: "Tin học" },
      { id: "subject-office", label: "Tin học văn phòng" },
    ],
    levels: [],
    rooms: [],
  },
  permissions: { canCreate: false, canUpdate: false, canDelete: false, canPublish: false, canViewAggregate: true },
  generatedAt: "2026-08-13T00:00:00Z",
};

async function json(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
}
