import { expect, test } from "vitest";

import { getSeoForLocation, SITE_SEO } from "./seo";

test("public pages keep the site title and may be indexed", () => {
  expect(getSeoForLocation("/")).toMatchObject({ title: SITE_SEO.title, indexable: true });
  expect(getSeoForLocation("/login/")).toMatchObject({ title: SITE_SEO.title, indexable: true });
});

test("signed-in pages get their own tab title and stay out of search results", () => {
  expect(getSeoForLocation("/teacher/attendance")).toMatchObject({ title: "Điểm danh | ERG LMS", indexable: false });
  expect(getSeoForLocation("/admin/schools/classes").title).toBe("Quản lý trường học | ERG LMS");
  expect(getSeoForLocation("/student/help").title).toBe("Hướng dẫn | ERG LMS");
  expect(getSeoForLocation("/admin/notifications/compose/abc").title).toBe("Soạn thông báo | ERG LMS");
  expect(getSeoForLocation("/teacher/unknown-page").title).toBe("Giáo viên | ERG LMS");
  expect(getSeoForLocation("/profile").title).toBe("Hồ sơ cá nhân | ERG LMS");
});
