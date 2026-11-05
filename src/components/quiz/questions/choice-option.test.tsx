import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChoiceOption } from "@/components/quiz/questions/choice-option";

describe("ChoiceOption image", () => {
  it("renders the option image", () => {
    render(<ChoiceOption mode="single" onClick={() => {}} selected={false} image={{ url: "u", alt: "Ảnh A" }}>A</ChoiceOption>);
    expect(screen.getByAltText("Ảnh A")).toBeTruthy();
  });
});
