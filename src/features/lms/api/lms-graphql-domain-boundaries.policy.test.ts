import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const apiDir = join(process.cwd(), "src/features/lms/api");
const domains = [
  ["lms-graphql-api.ts", "LmsLearningResourceLibrary"],
  ["lms-classroom-api.ts", "LmsClassWorkspace"],
  ["lms-teacher-homework-api.ts", "LmsTeacherHomeworkWorkspace"],
  ["lms-assignment-progress-api.ts", "LmsAssignmentProgressWorkspace"],
] as const;

describe("LMS GraphQL domain boundaries", () => {
  it("owns one operation per domain file and keeps every owner below 300 lines", () => {
    for (const [fileName, operationName] of domains) {
      const path = join(apiDir, fileName);
      expect(existsSync(path), `${fileName} must exist`).toBe(true);
      const source = readFileSync(path, "utf8");
      const operations = [...source.matchAll(/operationName:\s*"([^"]+)"/g)].map((match) => match[1]);

      expect(source.split(/\r?\n/).length, `${fileName} line count`).toBeLessThan(300);
      expect(operations, `${fileName} operation ownership`).toEqual([operationName]);
    }
  });

  it("keeps the compatibility module free of documents and requests", () => {
    const source = readFileSync(join(apiDir, "lms-assignment-workspace-api.ts"), "utf8");

    expect(source).not.toMatch(/query\s+Lms/);
    expect(source).not.toContain("graphQlRequest");
    expect(source.split(/\r?\n/).length).toBeLessThan(40);
  });
});
