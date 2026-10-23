import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { LmsScopeSheet } from "./lms-scope-sheet";

describe("LmsScopeSheet", () => {
  it("contains no Tailwind or lucide implementation", () => {
    const source = readFileSync(resolve("src/features/lms/mobile/components/lms-scope-sheet.tsx"), "utf8");
    expect(source).not.toContain("lucide-react");
    expect(source).not.toContain("className=");
  });

  it("selects a teaching class and closes", () => {
    const onClassChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <LmsScopeSheet
        classes={[{ className: "Lớp 10A", id: "class-1", schoolId: "school-1" }]}
        onClassChange={onClassChange}
        onOpenChange={onOpenChange}
        onSchoolChange={vi.fn()}
        open
        schools={[{ id: "school-1", name: "Trường ERG" }]}
        selectedClassId=""
        selectedSchoolId="school-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Lớp 10A/ }));
    expect(onClassChange).toHaveBeenCalledWith("class-1");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
