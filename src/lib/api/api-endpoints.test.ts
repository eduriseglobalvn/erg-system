import { expect, test } from "vitest";

import { API_ENDPOINTS } from "@/lib/api/api-endpoints";

test("central registry exposes critical static endpoints", () => {
  expect(API_ENDPOINTS.auth.login).toBe("/api/v1/auth/login");
  expect(API_ENDPOINTS.auth.refresh).toBe("/api/v1/auth/refresh");
  expect(API_ENDPOINTS.adminUsers.root).toBe("/api/v1/admin/users");
  expect(API_ENDPOINTS.graphql).toBe("/api/v1/graphql");
  expect(API_ENDPOINTS.audit.events).toBe("/api/v1/audit/events");
  expect(API_ENDPOINTS.reports.assignmentProgress).toBe("/api/v1/reports/jobs/assignment-progress");
});

test("central registry encodes every dynamic path segment", () => {
  expect(API_ENDPOINTS.adminUsers.detail("user/1")).toBe("/api/v1/admin/users/user%2F1");
  expect(API_ENDPOINTS.lms.attemptAnswer("attempt 1", "question/1")).toBe(
    "/api/v1/lms/attempts/attempt%201/answers/question%2F1",
  );
});

test("keeps nested curriculum resources as path segments", () => {
  expect(API_ENDPOINTS.curriculum.subjectLevels("subject-1")).toBe("/api/v1/curriculum/subjects/subject-1/levels");
  expect(API_ENDPOINTS.curriculum.levelTopics("level/1")).toBe("/api/v1/curriculum/levels/level%2F1/topics");
  expect(API_ENDPOINTS.curriculum.topicContentItems("topic/1")).toBe("/api/v1/curriculum/topics/topic%2F1/content-items");
});

test("encodes report job identifiers for status and download paths", () => {
  expect(API_ENDPOINTS.reports.job("job/1")).toBe("/api/v1/reports/jobs/job%2F1");
  expect(API_ENDPOINTS.reports.download("job/1")).toBe("/api/v1/reports/jobs/job%2F1/download");
});

test("exposes portable package manifest, download, update, and revoke routes", () => {
  expect(API_ENDPOINTS.lcms.quizPackageManifest("pkg/1")).toBe("/api/v1/lcms/quiz-packages/pkg%2F1/manifest");
  expect(API_ENDPOINTS.lcms.quizPackageDownload("pkg-1")).toBe("/api/v1/lcms/quiz-packages/pkg-1/download");
  expect(API_ENDPOINTS.lcms.quizPackageUpdates("quiz-1", { channel: "stable", currentVersion: 2, runtimeVersion: "1.0.0" })).toBe(
    "/api/v1/lcms/quiz-packages/updates?quizId=quiz-1&channel=stable&currentVersion=2&runtimeVersion=1.0.0",
  );
  expect(API_ENDPOINTS.lcms.quizPackageRevoke("pkg-1")).toBe("/api/v1/lcms/quiz-packages/pkg-1/revoke");
});
