import { expect, test } from "vitest";

import { toLibrarySubjects } from "@/features/lms/learning-resources/hooks/use-learning-resource-library-catalog";

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
