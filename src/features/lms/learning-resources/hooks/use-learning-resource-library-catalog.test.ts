import { expect, test } from "vitest";

import {
  libraryBootstrapQueryKey,
  libraryProgressQueryKey,
  toLibrarySubjects,
} from "@/features/lms/learning-resources/hooks/use-learning-resource-library-catalog";

test("scopes library bootstrap and progress keys by tenant and account", () => {
  expect(libraryBootstrapQueryKey({ academicYear: "2025-2026", schoolId: "school-a", tenantId: "tenant-a" })).toEqual([
    "learning-resources",
    "library-bootstrap",
    "tenant-a",
    "school-a",
    "2025-2026",
  ]);
  expect(
    libraryProgressQueryKey({
      academicYear: "2025-2026",
      accountId: "teacher-a",
      schoolId: "school-a",
      tenantId: "tenant-a",
    }),
  ).toEqual(["learning-resources", "library-progress", "tenant-a", "teacher-a", "school-a", "2025-2026"]);
});

test("merges separated library progress into catalog lessons", () => {
  const subjects = toLibrarySubjects(
    {
      schoolId: "school-1",
      academicYear: "2025-2026",
      subjects: [
        {
          id: "subject-1",
          label: "IC3",
          groups: [
            {
              id: "group-1",
              label: "Level 1",
              lessons: [
                {
                  id: "lesson-1",
                  label: "Bai 1",
                  resources: [
                    {
                      id: "resource-1",
                      title: "Slide 1",
                      type: "lecture",
                      fileType: "PPTX",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    new Map([["lesson-1", 60]]),
  );

  expect(subjects[0].sections[0].lessons[0].progress.progressRate).toBe(60);
  expect(subjects[0].sections[0].progress.progressRate).toBe(60);
});
