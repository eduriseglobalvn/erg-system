import { describe, expect, it } from "vitest";
import {
  getAvailableDialogOptions,
  getCanSubmit,
  getDialogSubtitle,
  getDialogTitle,
  getSubmitHint,
  getSubmitLabel,
  isLevelNode,
  resolveTaxonomyMode,
} from "./learning-resource-authoring-create-dialog-model";
import type { StudioNode } from "@/features/lcms/admin-operations/types/learning-resource-authoring";

const mockLevelNode: StudioNode = {
  id: "lvl-1",
  kind: "group",
  label: "Level 1",
  order: 1,
  sourceKind: "category",
  optionId: "lvl-1",
  children: [],
  location: { subjectId: "sub-1", categoryId: "lvl-1" },
};

describe("learning-resource-authoring-create-dialog-model", () => {
  it("resolves level mode strictly when state.mode is level or root", () => {
    expect(resolveTaxonomyMode({ mode: "level" }, null)).toBe("level");
    expect(resolveTaxonomyMode({ mode: "root" }, null)).toBe("level");
    expect(resolveTaxonomyMode({ mode: "topic" }, null)).toBe("topic");
    expect(resolveTaxonomyMode({ mode: "subject" }, null)).toBe("subject");
  });

  it("returns correct dialog titles for level, topic, and subject", () => {
    expect(getDialogTitle("level", null)).toBe("Tạo chặng học (Level)");
    expect(getDialogTitle("topic", null)).toBe("Tạo chủ đề");
    expect(getDialogTitle("subject", null)).toBe("Tạo môn học");
    expect(getDialogTitle(null, "lecture")).toBe("Thêm bài học");
    expect(getDialogTitle(null, "exercise")).toBe("Gắn bài tập từ Quiz bank");
    expect(getDialogTitle(null, "resource")).toBe("Gắn tài liệu");
  });

  it("returns correct submit labels", () => {
    expect(getSubmitLabel("level", null, false)).toBe("Tạo chặng học");
    expect(getSubmitLabel("topic", null, false)).toBe("Tạo chủ đề");
    expect(getSubmitLabel(null, "lecture", false)).toBe("Thêm bài học");
    expect(getSubmitLabel(null, "exercise", false)).toBe("Gắn bài tập");
    expect(getSubmitLabel(null, "resource", false)).toBe("Gắn tài liệu");
    expect(getSubmitLabel("level", null, true)).toBe("Đang lưu...");
  });

  it("returns concise subtitles without redundant long explanations", () => {
    expect(getDialogSubtitle("level", null)).toBe("Chặng học phân cấp theo trình độ.");
    expect(getDialogSubtitle("topic", null)).toBe("Chủ đề học tập.");
  });

  it("identifies level nodes correctly", () => {
    expect(isLevelNode(mockLevelNode)).toBe(true);
    expect(isLevelNode({ ...mockLevelNode, kind: "lesson" })).toBe(false);
  });

  it("validates submission requirements for level and topic", () => {
    expect(
      getCanSubmit({
        draftLevelId: "",
        draftSubjectId: "sub-1",
        label: "Level 1",
        resourceUrl: "",
        saving: false,
        selectedExerciseIds: [],
        selectedOption: null,
        slidesUrl: "",
        taxonomyMode: "level",
      }),
    ).toBe(true);

    expect(
      getCanSubmit({
        draftLevelId: "",
        draftSubjectId: "",
        label: "Level 1",
        resourceUrl: "",
        saving: false,
        selectedExerciseIds: [],
        selectedOption: null,
        slidesUrl: "",
        taxonomyMode: "level",
      }),
    ).toBe(false);
  });
});
