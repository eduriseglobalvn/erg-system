import { expect, test, type Page } from "@playwright/test";

import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { portalHost, seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

// Cong bao giang (CBG F8): GV xem so tuan -> diem danh + ghi so -> xac nhan cong tiet day -> HR chot thang -> admin nhac bao giang.
// GraphQL va REST duoc mock theo operationName / duong dan; khong can dang nhap that.
const endpoints = API_ENDPOINTS.timekeeping.teaching;
const MONTH = "2026-10";
const DESKTOP = { height: 900, width: 1440 };
const PHONE = { height: 844, width: 390 };

const addDays = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const period = (over: Record<string, unknown> = {}) => ({
  absentees: [], actualPeriod: 10, className: "6A4", classId: "c4", comment: null, eventId: "e1", happened: true, late: false, lessonTitle: "Bài 7: Hành vi bất hợp pháp",
  periodNo: 1, ppctPeriod: 10, status: "PENDING", subjectName: "Tin học IC3", version: 0, ...over,
});

/** Phien smoke dung tenant rieng; GraphQL cua cac man nay gui tenant mac dinh nen phai khop. */
async function seed(page: Page, portal: "lms" | "lcms") {
  await setupPortalNetwork(page, portal);
  await seedAuthenticatedPortal(page, portal);
  await page.addInitScript((key) => {
    const raw = sessionStorage.getItem(key);
    if (raw) sessionStorage.setItem(key, JSON.stringify({ ...JSON.parse(raw), tenantId: "erg" }));
  }, `erg-learning.session.temp.${portal}`);
}

type Operation = { variables: Record<string, unknown> };

/** Tra data theo operationName; moi lan goi duoc ghi lai trong `calls[operationName]`. */
async function mockGraphQl(page: Page, handlers: Record<string, (op: Operation) => unknown>) {
  const calls: Record<string, Operation[]> = {};
  await page.route(`**${API_ENDPOINTS.graphql}`, async (route) => {
    const body = route.request().postDataJSON() as { operationName?: string; variables?: Record<string, unknown> } | null;
    const name = body?.operationName ?? "";
    const handler = handlers[name];
    if (!handler) return route.fallback();
    const op = { variables: body?.variables ?? {} };
    (calls[name] ??= []).push(op);
    return route.fulfill({ json: { data: handler(op) } });
  });
  return calls;
}

/** Khung chuong trinh cua mon Tin hoc IC3: tiet 5-14. Man diem danh va sheet Doi bai tra bai theo tiet thuc te tu day. */
const curriculumRows = Array.from({ length: 10 }, (_, i) => ({ topic: "Chủ đề 3", period: i + 5, title: i + 5 === 8 ? "Bài 5: Báo cáo hành vi gây hại" : "Bài " + (i + 3) }));
async function mockCurriculum(page: Page) {
  await page.route(`**${API_ENDPOINTS.curriculum.collection("tree")}*`, (route) => route.fulfill({ json: { subjects: [{ subject: { id: "sub1", name: "Tin học IC3" } }] } }));
}

const noHorizontalScroll = async (page: Page, width: number) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

test.describe("GV: so dau bai tuan", () => {
  test("sua tiet thuc te tu luu, xac nhan ca tuan (1440)", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await seed(page, "lms");
    let actual = 10;
    let pending = 2;
    const weekOf = (weekStart: string) => ({
      weekStart, weekEnd: addDays(weekStart, 6), weekNo: 10, lagChip: null, stats: { taught: 2, confirmed: 2 - pending, pending },
      days: [0, 1, 2, 3, 4].map((i) => ({
        date: addDays(weekStart, i), session: "AFTERNOON",
        periods: i === 0 ? [period({ date: weekStart, actualPeriod: actual, lessonTitle: actual === 8 ? "Bài 5: Báo cáo hành vi gây hại" : "Bài 7: Hành vi bất hợp pháp", status: pending ? "PENDING" : "CONFIRMED" }), period({ date: weekStart, periodNo: 2, eventId: "e1", actualPeriod: 11, status: pending ? "PENDING" : "CONFIRMED" })] : [],
      })),
    });
    const calls = await mockGraphQl(page, {
      ClassLogTeacherWeek: ({ variables }) => ({ lms: { lessonLogTeacherWeek: weekOf(String(variables.weekStart)) } }),
      ClassLogUpdateEntry: ({ variables }) => {
        actual = (variables.input as { actualPeriod: number }).actualPeriod;
        return { updateLessonLogEntry: period({ actualPeriod: actual, version: 1 }) };
      },
      ClassLogConfirmWeek: () => {
        pending = 0;
        return { confirmLessonLogWeek: { taught: 2, confirmed: 2, pending: 0 } };
      },
    });
    await page.goto("/teacher/class-log?tab=teacher&week=2026-11-09", { timeout: 20_000, waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Sổ đầu bài" })).toBeVisible({ timeout: 30_000 });
    const confirm = page.getByRole("button", { name: "Xác nhận 2 tiết" });
    await expect(confirm).toBeEnabled();

    await page.getByRole("combobox", { name: /Tiết thực tế/ }).first().click();
    await page.getByRole("option", { name: "8", exact: true }).click();
    await expect.poll(() => calls.ClassLogUpdateEntry?.[0]?.variables).toMatchObject({ input: { actualPeriod: 8, eventId: "e1", expectedVersion: 0 } });
    await expect(page.getByText("Bài 5: Báo cáo hành vi gây hại").first()).toBeVisible();

    await confirm.click();
    await expect(page.getByRole("button", { name: "Xác nhận 0 tiết" })).toBeDisabled();
    expect(calls.ClassLogConfirmWeek).toHaveLength(1);
    await noHorizontalScroll(page, DESKTOP.width);
  });

  test("dien thoai: Bao giang doi bai day va xac nhan (390)", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await seed(page, "lms");
    const weekOf = (weekStart: string) => ({
      weekStart, weekEnd: addDays(weekStart, 6), weekNo: 10, lagChip: null, stats: { taught: 2, confirmed: 0, pending: 2 },
      days: [{ date: weekStart, session: "AFTERNOON", periods: [period({ date: weekStart, periodNo: 1 }), period({ date: weekStart, periodNo: 2, actualPeriod: 11 })] }],
    });
    await mockCurriculum(page);
    const calls = await mockGraphQl(page, {
      ClassLogTeacherWeek: ({ variables }) => ({ lms: { lessonLogTeacherWeek: weekOf(String(variables.weekStart)) } }),
      ClassLogUpdateEntry: () => ({ updateLessonLogEntry: period({ version: 1 }) }),
      ClassLogLessonCurriculum: () => ({ lms: { lessonLogCurriculum: curriculumRows } }),
      ClassLogConfirmWeek: () => ({ confirmLessonLogWeek: { taught: 2, confirmed: 2, pending: 0 } }),
    });
    await page.goto("/teacher/class-log", { timeout: 20_000, waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Sổ đầu bài" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("T10 · Bài 7: Hành vi bất hợp pháp")).toBeVisible();
    await noHorizontalScroll(page, PHONE.width);

    await page.getByRole("button", { name: "Đổi bài dạy 6A4" }).click();
    await expect(page.getByRole("button", { name: "Lưu · T10–11" })).toBeVisible();
    await page.getByRole("button", { name: "Lưu · T10–11" }).click();
    await expect.poll(() => calls.ClassLogUpdateEntry?.length).toBe(2);
    expect(calls.ClassLogUpdateEntry?.map((c) => (c.variables.input as { periodNo: number }).periodNo)).toEqual([1, 2]);

    await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await expect.poll(() => calls.ClassLogConfirmWeek?.length).toBe(1);
  });
});

test("GV: diem danh theo tiet roi luu vao so dau bai (1440)", async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await seed(page, "lms");
  const students = [{ id: "s1", fullName: "Lê An" }, { id: "s2", fullName: "Trần Bảo" }, { id: "s3", fullName: "Vũ Chi" }].map((s) => ({ ...s, username: s.id, studentCode: s.id }));
  await mockCurriculum(page);
  const calls = await mockGraphQl(page, {
    ClassLogTeacherDayPeriods: ({ variables }) => ({ lms: { teacherDayPeriods: [period({ date: String(variables.date) }), period({ date: String(variables.date), periodNo: 2, actualPeriod: 11 })] } }),
    LmsClassWorkspace: () => ({ lms: { classWorkspace: {
      tenantId: "erg", classInfo: { id: "c4", name: "6A4" }, students: { items: students, page: 0, size: 100, totalItems: 3, totalPages: 1, hasNext: false, hasPrevious: false },
      assignments: { items: [], page: 0, size: 1, totalItems: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    } } }),
    ClassLogLessonCurriculum: () => ({ lms: { lessonLogCurriculum: curriculumRows } }),
    ClassLogSaveAttendanceAndLog: ({ variables }) => ({ saveAttendanceAndLog: period({ absentees: [{ studentId: "s2", shortName: "Bảo", excused: false }], version: (variables.input as { expectedVersion?: number }).expectedVersion ?? 0 }) }),
  });
  await page.goto("/teacher/attendance", { timeout: 20_000, waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Điểm danh" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("navigation", { name: "Tiết trong ngày" })).toContainText("6A4");
  await expect(page.getByRole("group", { name: "Danh sách học sinh" })).toContainText("Trần Bảo", { timeout: 15_000 });

  await page.getByRole("radio", { name: "Trần Bảo: Vắng K" }).click();
  await page.getByRole("button", { name: "Lưu điểm danh & ghi sổ" }).click();
  await expect.poll(() => calls.ClassLogSaveAttendanceAndLog?.length).toBe(1);
  const input = calls.ClassLogSaveAttendanceAndLog?.[0]?.variables.input as { records: { studentId: string; status: string }[]; eventId: string; actualPeriod: number };
  expect(input.eventId).toBe("e1");
  expect(input.records).toHaveLength(3);
  expect(input.records.find((r) => r.studentId === "s2")?.status).not.toBe(input.records.find((r) => r.studentId === "s1")?.status);
});

test("GV: xac nhan bang cong tiet day thang 10 (1440)", async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await seed(page, "lms");
  let confirmed = false;
  const month = () => ({
    month: MONTH, status: "OPEN", total: 42, assistantTotal: 0, deadline: "2026-11-05", missingReports: [], cancelled: [], assistantRows: [],
    weeks: [0, 1, 2, 3].map((index) => ({ index, label: `Tuần ${index + 1}`, from: addDays("2026-10-05", index * 7), to: addDays("2026-10-11", index * 7) })),
    rows: [{ schoolName: "THCS Vân Đồn", subjectName: "Tin học IC3", level: "THCS", className: "6A4", total: 42, weekTotals: [10, 12, 10, 10] }],
    confirmation: confirmed ? { status: "CONFIRMED", version: 1, confirmedTotal: 42, confirmedAt: "2026-11-02T03:00:00Z" } : { status: "PENDING", version: 0 },
  });
  const posts: unknown[] = [];
  await page.route(`**${endpoints.myMonth(MONTH)}*`, (route) => route.fulfill({ json: month() }));
  await page.route(`**${endpoints.confirm(MONTH)}`, async (route) => {
    posts.push(route.request().postDataJSON());
    confirmed = true;
    await route.fulfill({ json: { status: "CONFIRMED", version: 1, confirmedTotal: 42 } });
  });
  await page.goto(`/teacher/timekeeping/timesheet?tab=periods&period=${MONTH}`, { timeout: 20_000, waitUntil: "domcontentloaded" });

  await expect(page.getByText("Bảng công tháng 10 đang chờ bạn xác nhận")).toBeVisible({ timeout: 30_000 });
  const send = page.getByRole("button", { name: "Xác nhận bảng công" });
  await expect(send).toBeDisabled();
  await page.getByRole("checkbox", { name: /Tôi xác nhận số tiết tháng 10\/2026 là 42 tiết/ }).check();
  await send.click();
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0]).toMatchObject({ total: 42, expectedVersion: 0 });
  await expect(page.getByText("Bạn đã xác nhận bảng công tháng 10")).toBeVisible();
});

test("HR: chot thang 10 khi du giao vien xac nhan (1440)", async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await seed(page, "lcms");
  let closed = false;
  const sheet = () => ({
    month: MONTH, status: closed ? "CLOSED" : "READY", teacherCount: 2, confirmedCount: 2,
    weeks: [0, 1, 2, 3].map((index) => ({ index, label: `Tuần ${index + 1}`, from: addDays("2026-10-05", index * 7), to: addDays("2026-10-11", index * 7) })),
    rows: ["t1", "t2"].map((teacherId, i) => ({ teacherId, teacherName: i ? "Nguyễn Văn Khoa" : "Thắm", schoolName: "THCS Vân Đồn", subjectName: "Tin học IC3", classNames: "6A4", total: 20 + i, weekTotals: [5, 5, 5, 5 + i], confirmation: { status: "CONFIRMED", version: 1, confirmedAt: "2026-11-02T03:00:00Z" } })),
  });
  let closes = 0;
  await page.route(`**${endpoints.adminMonth(MONTH)}*`, (route) => route.fulfill({ json: sheet() }));
  await page.route(`**${endpoints.adminMonthClose(MONTH)}`, async (route) => {
    closes += 1;
    closed = true;
    await route.fulfill({ json: sheet() });
  });
  await page.goto(`${portalHost("lcms")}/admin/employees/teaching-hours`, { timeout: 20_000, waitUntil: "domcontentloaded" });
  // Cong tiet day mo o tab Total; bang thang 10 la tab cuoi can bam (query bi bo khi cong admin chuyen host).
  await page.getByRole("tab", { name: "Tháng 10" }).click({ timeout: 30_000 });

  await expect(page.getByText("GV đã xác nhận đủ · sẵn sàng chốt")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Chốt tháng 10", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Chốt tháng 10", exact: true }).click();
  await expect.poll(() => closes).toBe(1);
  await expect(page.getByText("Đã chốt", { exact: true }).first()).toBeVisible();
});

test.describe("Admin: theo doi bao giang", () => {
  const matrix = (weekStart: string) => {
    const days = [0, 1, 2, 3, 4].map((i) => addDays(weekStart, i));
    const cells = (states: string[]) => states.map((state, i) => ({ date: days[i], state, periods: state === "NONE" ? 0 : 2 }));
    return {
      weekStart, days, stats: { periods: 14, teachers: 2, schools: 1, onTime: 8, late: 2, missing: 4 },
      rows: [
        { teacherId: "t1", teacherName: "Thắm", schoolName: "THCS Vân Đồn", cells: cells(["ON_TIME", "ON_TIME", "LATE", "MISSING", "MISSING"]) },
        { teacherId: "t2", teacherName: "Hồng Thị Nguyệt", schoolName: "THPT Long Trường", cells: cells(["ON_TIME", "ON_TIME", "ON_TIME", "NONE", "ON_TIME"]) },
      ],
    };
  };

  for (const viewport of [DESKTOP, PHONE]) {
    test(`ma tran GV x ngay, chon o, nhac giao vien (${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await seed(page, "lcms");
      const calls = await mockGraphQl(page, {
        ClassLogLessonReportMatrix: ({ variables }) => ({ lms: { lessonReportMatrix: matrix(String(variables.weekStart)) } }),
        ClassLogRemindLessonReport: () => ({ remindLessonReport: 1 }),
      });
      await page.goto(`${portalHost("lcms")}/admin/training/lesson-reports`, { timeout: 20_000, waitUntil: "domcontentloaded" });

      await expect(page.getByRole("heading", { name: /^Theo dõi báo giảng · Tuần / })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText("2 giáo viên · 2 trường")).toBeVisible();
      await expect(page.getByText("12 / 18 buổi")).toBeVisible();

      await page.getByRole("button", { name: /Thắm · .* · Chưa báo/ }).first().click();
      await expect(page.getByRole("complementary", { name: "Chi tiết ô báo giảng" })).toContainText("Quá hạn");

      await page.getByRole("button", { name: "Nhắc 1 giáo viên" }).click();
      await expect.poll(() => calls.ClassLogRemindLessonReport?.[0]?.variables).toEqual({ teacherIds: ["t1"] });
      await expect(page.getByText("Đã nhắc 1 giáo viên.")).toBeVisible();
      await noHorizontalScroll(page, viewport.width);
    });
  }
});
