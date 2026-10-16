import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadLearningResourceLibraryBootstrap,
  loadLearningResourceLibraryProgress,
} from "@/features/lms/learning-resources/api/learning-resource-api";
import {
  learningResourceLibraryBootstrapQueryOptions,
  learningResourceLibraryProgressQueryOptions,
} from "@/features/lms/learning-resources/api/learning-resource-query";

vi.mock("@/features/lms/learning-resources/api/learning-resource-api", () => ({
  loadLearningResourceLibraryBootstrap: vi.fn(),
  loadLearningResourceLibraryProgress: vi.fn(),
}));

describe("learning resource query cancellation", () => {
  beforeEach(() => {
    vi.mocked(loadLearningResourceLibraryBootstrap).mockReset();
    vi.mocked(loadLearningResourceLibraryProgress).mockReset();
  });

  it("forwards the bootstrap query signal", async () => {
    const signal = new AbortController().signal;
    const options = learningResourceLibraryBootstrapQueryOptions({
      accountId: "teacher-a",
      academicYear: "2026-2027",
      schoolId: "school-a",
      tenantId: "tenant-a",
    });

    await options.queryFn({ signal } as never);

    expect(loadLearningResourceLibraryBootstrap).toHaveBeenCalledWith(
      { academicYear: "2026-2027", schoolId: "school-a", tenantId: "tenant-a" },
      signal,
    );
  });

  it("forwards the progress query signal", async () => {
    const signal = new AbortController().signal;
    const options = learningResourceLibraryProgressQueryOptions({
      accountId: "teacher-a",
      academicYear: "2026-2027",
      schoolId: "school-a",
      tenantId: "tenant-a",
    });

    await options.queryFn({ signal } as never);

    expect(loadLearningResourceLibraryProgress).toHaveBeenCalledWith(
      { academicYear: "2026-2027", schoolId: "school-a", tenantId: "tenant-a" },
      signal,
    );
  });
});
