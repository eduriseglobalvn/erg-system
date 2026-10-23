import { describe, expect, it } from "vitest";

import { trainingChartCopy } from "@/features/lcms/school-management/components/training/training-copy";

describe("training chart copy", () => {
  it("keeps every chart description concise", () => {
    expect(trainingChartCopy).toMatchObject({
      classHealth: { title: "Sức khỏe lớp" },
      scoreDistribution: { title: "Kết quả học sinh" },
      wave: { title: "Xu hướng đào tạo" },
    });
  });
});
