import { expect, test, type Page } from "@playwright/test";

import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

// Admin: ngay nghi (them 1 ngay -> hien tren luoi) va doi tiet da xuat ban (Sua tiet / Doi giao vien, xem truoc dryRun). Mock theo operationName.
const SLOTS = [6, 7].map((periodNo) => ({ endTime: `${String(7 + periodNo)}:45`, periodNo, session: "AFTERNOON", startTime: `${String(7 + periodNo)}:00` }));
const TEMPLATE = { id: "tpl1", name: "Mặc định", periodsPerDay: 7, slots: SLOTS };
const EVENT = {
  batchId: "b1", classId: "c1", className: "9A4", colorGroup: { key: "blue", kind: "PUBLISHED", label: "Trương Công Định" }, date: "2026-11-11", endAt: "2026-11-11T14:45:00+07:00", endTime: "14:45",
  id: "e1", levelId: null, levelName: null, myRole: "MAIN", note: null, periodCount: 1, periodStart: 6, roomId: "r1", roomName: "PM 03", schoolId: "s1", schoolName: "THCS Trương Công Định",
  startAt: "2026-11-11T14:00:00+07:00", startTime: "14:00", status: "PUBLISHED", subjectId: "sub1", subjectName: "IC3",
  teachers: [{ colorKey: "blue", displayName: "Q.Vương", role: "MAIN", userId: "t1" }], title: "9A4 · IC3", version: 3,
};
const workspace = {
  catalog: { assistantTeachers: [], classes: [], levels: [], rooms: [], schools: [], subjects: [{ id: "sub1", label: "IC3" }], teachers: [] },
  events: [EVENT], filterOptions: { classes: [], levels: [], schools: [], subjects: [], teachers: [] }, from: "2026-11-09", generatedAt: "2026-11-09T00:00:00Z", laneSummaries: [],
  permissions: { canCreate: true, canDelete: true, canPublish: true, canUpdate: true, canViewAggregate: true }, tenantId: "erg", to: "2026-11-15", viewMode: "ALL",
};
const teacher = (teacherId: string, teacherName: string) => ({ busy: null, classAccess: "HAS", initials: teacherName.slice(0, 2), leave: null, sameSchoolNeighbor: null, state: "FREE", taughtHereLastWeek: false, teacherId, teacherName, travel: null, weeklyPeriods: 8 });
const changeResult = { applied: false, affectedCount: 1, blocking: false, conflicts: [], events: [] };

async function openAdmin(page: Page, width: number, height: number) {
  await page.setViewportSize({ height, width });
  const network = await setupPortalNetwork(page, "lcms");
  await seedAuthenticatedPortal(page, "lcms");
  // GraphQL cua lich dung tenant mac dinh; phien smoke dung tenant rieng nen phai khop (nhu admin-teaching-schedule).
  await page.addInitScript(() => {
    const key = "erg-learning.session.temp.lcms";
    const raw = sessionStorage.getItem(key);
    if (raw) sessionStorage.setItem(key, JSON.stringify({ ...JSON.parse(raw), tenantId: "erg" }));
  });
  return network;
}

for (const viewport of [{ height: 900, width: 1440 }, { height: 844, width: 390 }]) {
  test(`days off at ${viewport.width}px: add a day off and see it on the grid`, async ({ page }) => {
    const network = await openAdmin(page, viewport.width, viewport.height);
    const holidays: unknown[] = [];
    const posted: Array<Record<string, unknown>> = [];
    await page.route(`**${API_ENDPOINTS.timekeeping.admin.holidays}*`, async (route) => {
      const request = route.request();
      if (new URL(request.url()).pathname !== API_ENDPOINTS.timekeeping.admin.holidays) return route.fallback();
      if (request.method() === "POST") {
        const body = request.postDataJSON() as { from: string; kind: string; name: string; payMode: string; teachingAction: string };
        posted.push(body);
        holidays.push({ date: body.from, id: "h1", kind: body.kind, name: body.name, payMode: body.payMode, teachingAction: body.teachingAction });
      }
      return route.fulfill({ json: holidays });
    });
    await page.route(`**${API_ENDPOINTS.timekeeping.admin.saturdayModes}*`, (route) => route.fulfill({ json: [] }));
    await page.route(`**${API_ENDPOINTS.graphql}`, (route) => {
      if ((route.request().postDataJSON() as { operationName?: string } | null)?.operationName !== "TeachingCalendarDayLoads") return route.fallback();
      return route.fulfill({ json: { data: { lcms: { teachingScheduleDayLoads: [] } } } });
    });
    await page.goto("/admin/calendar/days-off?month=2026-12", { timeout: 20_000, waitUntil: "domcontentloaded" });

    await expect(page.getByRole("button", { name: "Thêm ngày nghỉ" }).first()).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Thêm ngày nghỉ" }).first().click();
    await page.getByRole("textbox", { name: "Tên ngày nghỉ" }).fill("Nghỉ thử nghiệm");
    await page.getByRole("radio", { name: "Lễ nhà nước" }).click(); // khoa «Tính lương» = Có lương
    await page.getByRole("button", { name: "Thêm ngày nghỉ" }).last().click();

    await expect.poll(() => posted.length).toBe(1);
    expect(posted[0]).toMatchObject({ from: expect.stringMatching(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/), kind: "STATE", name: "Nghỉ thử nghiệm", payMode: "PAID" });
    await expect(page.getByText("Nghỉ thử nghiệm").first()).toBeVisible();
    expect(network.pageErrors).toEqual([]);
  });
}

test("admin edits a published slot and swaps its teacher: both show a dryRun preview before saving", async ({ page }) => {
  const network = await openAdmin(page, 1440, 900);
  const calls: Array<{ input: Record<string, unknown>; operation: string }> = [];
  await page.clock.setFixedTime(new Date("2026-11-11T08:00:00+07:00"));
  await page.route(`**${API_ENDPOINTS.graphql}`, async (route) => {
    const body = route.request().postDataJSON() as { operationName?: string; variables?: { input?: Record<string, unknown> } } | null;
    const operation = body?.operationName ?? "";
    const respond = (data: unknown) => route.fulfill({ json: { data } });
    switch (operation) {
      case "TeachingCalendarWorkspace": return respond({ lcms: { teachingCalendarWorkspace: workspace } });
      case "TeachingCalendarPeriodTemplates": return respond({ lcms: { teachingPeriodTemplates: [TEMPLATE] } });
      case "TeachingCalendarSchoolPeriodAssignments": return respond({ lcms: { schoolPeriodAssignments: [{ current: true, effectiveFrom: null, schoolId: "s1", schoolName: "THCS Trương Công Định", templateId: "tpl1", templateName: "Mặc định" }] } });
      case "TeachingCalendarSlotOptions": return respond({ lcms: { teachingScheduleSlotOptions: { classes: [], grade: 9, rooms: [{ busy: null, roomId: "r1", roomName: "PM 03", seatCount: 30, state: "FREE", usualForClass: true }], schoolName: "THCS Trương Công Định", teachers: [teacher("t1", "Q.Vương"), teacher("t2", "T.Tuấn")] } } });
      case "TeachingCalendarEditScheduleSlot": calls.push({ input: body?.variables?.input ?? {}, operation }); return respond({ editTeachingScheduleSlot: changeResult });
      case "TeachingCalendarSwapScheduleTeacher": calls.push({ input: body?.variables?.input ?? {}, operation }); return respond({ swapTeachingScheduleTeacher: changeResult });
      default: return route.fallback();
    }
  });
  await page.goto("/admin/calendar", { timeout: 20_000, waitUntil: "domcontentloaded" });

  const eventButton = page.getByRole("button", { name: /2026-11-11, 14:00 – 14:45, 9A4/ });
  await expect(eventButton).toBeVisible({ timeout: 30_000 });

  await eventButton.click();
  await page.getByRole("button", { name: "Sửa", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Sửa tiết" });
  await expect(edit.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
  await edit.getByRole("combobox", { name: /Tiết/ }).click();
  await page.getByRole("option", { name: /Tiết 7/ }).click();
  await expect(edit.getByText(/1 tiết sẽ đổi/)).toBeVisible();
  expect(calls.at(-1)).toMatchObject({ operation: "TeachingCalendarEditScheduleSlot", input: { dryRun: true, eventId: "e1", expectedVersion: 3, periodNo: 7 } });
  await edit.getByRole("button", { name: "Huỷ" }).click();

  await eventButton.click();
  await page.getByRole("button", { name: "Đổi giáo viên" }).click();
  const swap = page.getByRole("dialog", { name: "Đổi giáo viên" });
  await swap.getByRole("button", { name: "Giáo viên nghỉ" }).click();
  await swap.getByRole("listbox", { name: "Giáo viên" }).getByRole("option", { name: /T\.Tuấn/ }).click();
  await expect(swap.getByText(/1 tiết sẽ đổi/)).toBeVisible();
  expect(calls.at(-1)).toMatchObject({ operation: "TeachingCalendarSwapScheduleTeacher", input: { dryRun: true, eventId: "e1", expectedVersion: 3, newTeacherId: "t2", reason: "TEACHER_ON_LEAVE" } });
  expect(calls.every((call) => call.input.dryRun === true)).toBe(true);
  expect(network.pageErrors).toEqual([]);
});
