import { describe, expect, it } from "vitest";

import { flattenMenuItems } from "@/features/lcms/lcms-menu";
import {
  COURSE_STRUCTURE_WORKSPACE_LABEL,
  LEARNING_RESOURCE_WORKSPACE_LABEL,
} from "@/components/learning-resources/learning-resource-workspace-labels";

import { ADMIN_CONTENT_MENU_ITEM, ADMIN_MENU_GROUPS } from "./admin-content-menu";

describe("Admin information architecture", () => {
  it("presents one Admin workspace with authoring nested under Content", () => {
    const items = flattenMenuItems(ADMIN_MENU_GROUPS);
    const paths = items.flatMap((item) => (item.path ? [item.path] : []));

    expect(ADMIN_CONTENT_MENU_ITEM.path).toBe("/admin/content");
    expect(ADMIN_CONTENT_MENU_ITEM.children?.[0]).toMatchObject({ label: COURSE_STRUCTURE_WORKSPACE_LABEL });
    expect(ADMIN_CONTENT_MENU_ITEM.children?.[1]).toMatchObject({ label: LEARNING_RESOURCE_WORKSPACE_LABEL });
    expect(ADMIN_CONTENT_MENU_ITEM.children?.map((item) => item.path)).toEqual([
      "/admin/content/structure",
      "/admin/content/resources",
      "/admin/content/quiz-bank",
      "/admin/content/questions",
      "/admin/content/quiz-editor",
    ]);
    expect(paths).toEqual(expect.arrayContaining([
      "/admin/content",
      "/admin/content/structure",
      "/admin/content/resources",
      "/admin/content/quiz-bank",
      "/admin/content/questions",
      "/admin/content/quiz-editor",
    ]));
    expect(paths).not.toEqual(expect.arrayContaining(["/resources", "/quiz-bank", "/questions", "/quiz-editor"]));
    expect(ADMIN_MENU_GROUPS.map((group) => group.label)).toContain("Nội dung");
    expect(items.map((item) => item.label).join(" ")).not.toMatch(/LCMS|author portal/i);
  });
});
