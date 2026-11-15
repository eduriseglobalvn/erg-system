import { expect, test, type Page } from "@playwright/test";

import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

// Lich giang day cua admin (LD F11): chon o -> lop/giao vien -> xung dot -> sua nhanh -> xuat ban. GraphQL duoc mock theo operationName.
const SCHOOL = { conflictCount: 0, hasDraft: false, periodCount: 0, schoolId: "s1", schoolName: "THCS Trương Công Định", schoolShortName: "Trương Công Định" };
const SLOTS = Array.from({ length: 10 }, (_, index) => ({
  endTime: `${String(7 + index).padStart(2, "0")}:45`, periodNo: index + 1, session: index < 5 ? "MORNING" : "AFTERNOON", startTime: `${String(7 + index).padStart(2, "0")}:00`,
}));
const TEMPLATE = { id: "tpl1", name: "Mặc định", periodsPerDay: 10, slots: SLOTS };
const BATCH = { affectedEventCount: 0, applyFrom: "2026-11-09", id: "b1", label: "Đợt 1", periodTemplateId: "tpl1", publishedAt: null, repeatWeeks: 1, schoolId: "s1", status: "DRAFT", version: 1 };
const side = { batchId: null, batchLabel: null, batchStatus: null, className: "9A1", classId: "c1", createdAt: null, createdByName: null, createdByRole: null, endTime: null, eventId: null, periodNo: 1, roomId: null, roomName: null, schoolId: "s1", schoolName: SCHOOL.schoolName, schoolShortName: SCHOOL.schoolShortName, startTime: null, subjectName: null, teacherId: "t1", teacherName: "T.Tuấn" };
const CONFLICT = {
  affectedWeeks: 1, clientRowId: null, endTime: "07:45", firstDate: "2026-11-09", fix: { kind: "CHANGE_TEACHER", reason: "", roomId: null, roomName: null, targetClassName: null, targetClientRowId: null, targetEventId: null, teacherId: "t2", teacherName: "Q.Vương" },
  id: "x1", kind: "TEACHER_TIME", leave: null, message: "Trùng giáo viên", mine: side, other: { ...side, className: "8A2", classId: "c2" }, periodNo: 1, severity: "ERROR", startTime: "07:00", totalWeeks: 1, travel: null, weekday: 1,
};
const slotTeacher = (teacherId: string, teacherName: string) => ({ busy: null, classAccess: "HAS", initials: teacherName.slice(0, 2), leave: null, sameSchoolNeighbor: null, state: "FREE", taughtHereLastWeek: false, teacherId, teacherName, travel: null, weeklyPeriods: 8 });
const draftResult = (conflicts: unknown[]) => ({ accessChanges: [], batch: BATCH, conflicts, rowIdMap: [], savedAt: "2026-11-09T00:00:00Z", version: 1 });
const workspace = { catalog: { assistantTeachers: [], classes: [], levels: [], rooms: [], schools: [], subjects: [], teachers: [] }, events: [], filterOptions: { classes: [], levels: [], schools: [], subjects: [], teachers: [] }, from: "2026-11-09", generatedAt: "2026-11-09T00:00:00Z", laneSummaries: [], permissions: { canCreate: true, canDelete: true, canPublish: true, canUpdate: true, canViewAggregate: true }, tenantId: "tenant-smoke", to: "2026-11-16", viewMode: "ALL" };

async function mockSchedule(page: Page) {
  const calls = { publish: 0, saves: 0 };
  await setupPortalNetwork(page, "lcms");
  await page.route(`**${API_ENDPOINTS.graphql}`, async (route) => {
    const operation = (route.request().postDataJSON() as { operationName?: string } | null)?.operationName ?? "";
    const respond = (data: unknown) => route.fulfill({ json: { data } });
    switch (operation) {
      case "TeachingCalendarPeriodTemplates": return respond({ lcms: { teachingPeriodTemplates: [TEMPLATE] } });
      case "TeachingCalendarOverviewSchools": return respond({ lcms: { teachingScheduleOverviewSchools: { items: [SCHOOL], quickCounts: { conflicts: 0, drafts: 0, empty: 0, travel: 0 }, total: 1 } } });
      case "TeachingCalendarOverviewGrid": return respond({ lcms: { teachingScheduleOverviewGrid: { cells: [], conflicts: [], holidays: [], schools: [SCHOOL], template: TEMPLATE, weekStart: "2026-11-09" } } });
      case "TeachingCalendarWorkspace": return respond({ lcms: { teachingCalendarWorkspace: workspace } });
      case "TeachingCalendarSlotOptions": return respond({ lcms: { teachingScheduleSlotOptions: { classes: [{ busy: null, classId: "c1", className: "9A1", grade: 9, state: "FREE" }], grade: 9, rooms: [], schoolName: SCHOOL.schoolName, teachers: [slotTeacher("t1", "T.Tuấn"), slotTeacher("t2", "Q.Vương")] } } });
      case "TeachingCalendarSaveScheduleDraft": calls.saves += 1; return respond({ saveTeachingScheduleDraft: draftResult(calls.saves === 1 ? [CONFLICT] : []) });
      case "TeachingCalendarPublishScheduleBatchV2": calls.publish += 1; return respond({ publishTeachingScheduleBatch: { ...BATCH, publishedAt: "2026-11-09T01:00:00Z", status: "PUBLISHED" } });
      default: return route.fallback();
    }
  });
  return calls;
}

for (const viewport of [{ height: 900, width: 1440 }, { height: 844, width: 390 }]) {
  test(`admin schedule at ${viewport.width}px: pick cell, see conflict, quick fix, publish`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const calls = await mockSchedule(page);
    await seedAuthenticatedPortal(page, "lcms");
    // GraphQL cua lich dung tenant mac dinh; phien smoke dung tenant rieng nen phai khop thi moi gui duoc.
    await page.addInitScript(() => {
      const key = "erg-learning.session.temp.lcms";
      const raw = sessionStorage.getItem(key);
      if (raw) sessionStorage.setItem(key, JSON.stringify({ ...JSON.parse(raw), tenantId: "erg" }));
    });
    await page.goto("/admin/calendar/schedule?schoolId=s1&week=2026-11-09", { timeout: 20_000, waitUntil: "domcontentloaded" });

    await expect(page.getByRole("grid", { name: "Thời khóa biểu" })).toBeVisible({ timeout: 30_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);

    await page.getByRole("gridcell", { name: "Ô trống" }).first().click({ force: true });
    await page.getByRole("combobox", { name: /Lớp/ }).click();
    await page.getByRole("option", { name: /9A1/ }).click();
    await page.getByRole("button", { name: "Giáo viên" }).click();
    await page.getByRole("option", { name: /T\.Tuấn/ }).click();

    await page.waitForTimeout(2_000); // tu luu sau 1,5 s
    await page.mouse.click(4, 4); // click ra ngoai dong popover o
    const conflicts = page.getByRole("article").filter({ hasText: "Trùng giáo viên" });
    await expect(conflicts).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Xuất bản cho giáo viên" })).toBeDisabled();

    await conflicts.getByRole("button", { name: /Đổi GV → Q\.Vương/ }).click();
    await expect(conflicts).toBeHidden({ timeout: 15_000 });

    await page.getByRole("button", { name: "Xuất bản cho giáo viên" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Xuất bản" }).click();
    await expect.poll(() => calls.publish).toBe(1);
  });
}
