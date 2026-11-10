import { ThemeProvider } from "@mui/material/styles";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { ChoiceOption, choiceReviewTag } from "@/components/quiz/questions/choice-option";
import ergEnterpriseTheme from "@/themes/erg-enterprise-theme";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const renderThemed = (ui: ReactElement) => render(<ThemeProvider theme={ergEnterpriseTheme}>{ui}</ThemeProvider>);
const noop = () => {};

describe("ChoiceOption image", () => {
  it("renders the option image", () => {
    render(<ChoiceOption mode="single" onClick={noop} selected={false} image={{ url: "u", alt: "Ảnh A" }}>A</ChoiceOption>);
    expect(screen.getByAltText("Ảnh A")).toBeTruthy();
  });
});

describe("ChoiceOption letter key", () => {
  it("is round (radius.chip) with a 1.5px border", () => {
    renderThemed(<ChoiceOption letter="B" mode="single" onClick={noop} selected={false}>Phương án</ChoiceOption>);
    const style = getComputedStyle(screen.getByText("B"));
    expect(style.borderRadius).toBe(`${ergEnterpriseTokens.radius.chip}px`);
    expect(style.borderWidth).toBe("1.5px");
  });

  it("fills with primary when selected", () => {
    renderThemed(<ChoiceOption letter="A" mode="single" onClick={noop} selected>Phương án</ChoiceOption>);
    const style = getComputedStyle(screen.getByText("A"));
    // jsdom cannot resolve var(): the template accent/contrast vars sit over the ERG primary and its contrast text.
    expect(style.backgroundColor).toBe("var(--quiz-accent, #0071E3)");
    expect(style.color).toBe("var(--quiz-accent-contrast, #fff)");
  });
});

describe("ChoiceOption hover", () => {
  // jsdom has no :hover, so read emotion's emitted rules: a selected option must not repaint its (maybe dark) highlight on hover.
  const hoverRule = (selected: boolean) => {
    renderThemed(<ChoiceOption mode="single" onClick={noop} selected={selected}>Phương án</ChoiceOption>);
    const css = Array.from(document.querySelectorAll("style")).map((el) => el.textContent ?? "").join("");
    return screen.getByRole("button").className.split(" ").some((name) => css.includes(`.${name}:hover`));
  };

  it("keeps a selected option as it is", () => expect(hoverRule(true)).toBe(false));
  it("tints an unselected option", () => expect(hoverRule(false)).toBe(true));
});

describe("ChoiceOption review tag", () => {
  it("labels the correct answer", () => {
    renderThemed(<ChoiceOption mode="single" onClick={noop} selected={false} reviewTag="correct">Đúng</ChoiceOption>);
    expect(getComputedStyle(screen.getByText("Đáp án đúng")).color).toBe("rgb(15, 114, 51)");
  });

  it("labels a wrong pick in the error colour", () => {
    renderThemed(<ChoiceOption mode="single" onClick={noop} selected reviewTag="pickedWrong">Sai</ChoiceOption>);
    expect(getComputedStyle(screen.getByText("Bạn chọn")).color).toBe("rgb(180, 35, 24)");
  });

  it("labels a correct pick in success colour as both", () => {
    renderThemed(<ChoiceOption letter="A" mode="single" onClick={noop} selected reviewTag="picked">Đúng</ChoiceOption>);
    expect(screen.getByText("Đáp án đúng · Bạn chọn")).toBeTruthy();
    expect(getComputedStyle(screen.getByText("A")).backgroundColor).toBe("rgb(22, 163, 74)");
  });

  it("fills the letter key for correct, picked and pickedWrong", () => {
    renderThemed(<>
      <ChoiceOption letter="A" mode="single" onClick={noop} selected={false} reviewTag="correct">a</ChoiceOption>
      <ChoiceOption letter="B" mode="single" onClick={noop} selected reviewTag="picked">b</ChoiceOption>
      <ChoiceOption letter="C" mode="single" onClick={noop} selected reviewTag="pickedWrong">c</ChoiceOption>
      <ChoiceOption letter="D" mode="single" onClick={noop} selected={false}>d</ChoiceOption>
    </>);
    expect(getComputedStyle(screen.getByText("A")).backgroundColor).toBe("rgb(22, 163, 74)");
    expect(getComputedStyle(screen.getByText("A")).color).toBe("rgb(255, 255, 255)");
    expect(getComputedStyle(screen.getByText("B")).backgroundColor).toBe("rgb(22, 163, 74)");
    expect(getComputedStyle(screen.getByText("C")).backgroundColor).toBe("rgb(217, 45, 32)");
    expect(getComputedStyle(screen.getByText("D")).backgroundColor).not.toBe("rgb(22, 163, 74)");
  });

  it("derives tags from legacy flags", () => {
    renderThemed(<>
      <ChoiceOption mode="single" onClick={noop} selected={false} reviewMode showCorrect>X</ChoiceOption>
      <ChoiceOption mode="single" onClick={noop} selected reviewMode showCorrect>Y</ChoiceOption>
      <ChoiceOption mode="single" onClick={noop} selected reviewMode showWrong>Z</ChoiceOption>
    </>);
    expect(screen.getByText("Đáp án đúng")).toBeTruthy();
    expect(screen.getByText("Đáp án đúng · Bạn chọn")).toBeTruthy();
    expect(screen.getByText("Bạn chọn")).toBeTruthy();
  });
});

describe("ChoiceOption multiple mode", () => {
  it("shows a check badge only for a selected multiple option", () => {
    renderThemed(<>
      <ChoiceOption letter="A" mode="multiple" onClick={noop} selected>A1</ChoiceOption>
      <ChoiceOption letter="B" mode="multiple" onClick={noop} selected={false}>B1</ChoiceOption>
      <ChoiceOption letter="C" mode="single" onClick={noop} selected>C1</ChoiceOption>
    </>);
    expect(screen.getAllByTestId("choice-check-badge")).toHaveLength(1);
  });
});

describe("ChoiceOption under a dark teacher highlight", () => {
  const darkTheme = (ui: ReactElement) => {
    const surface = document.body.appendChild(document.createElement("div"));
    surface.style.setProperty("--quiz-highlight", "#14532d");
    surface.style.setProperty("--quiz-highlight-contrast", "#fff");
    return render(<ThemeProvider theme={ergEnterpriseTheme}>{ui}</ThemeProvider>, { container: surface.appendChild(document.createElement("div")) });
  };

  it.each([["picked", ergEnterpriseTokens.statusTint.success.bg], ["pickedWrong", ergEnterpriseTokens.statusTint.error.bg]] as const)(
    "paints a %s option with a status tint, not the dark highlight, so the dark label stays readable",
    (reviewTag, tint) => {
      darkTheme(<ChoiceOption mode="single" onClick={noop} selected reviewTag={reviewTag}>Phương án</ChoiceOption>);
      const style = getComputedStyle(screen.getByRole("button"));
      expect(style.backgroundColor).not.toContain("--quiz-highlight");
      expect(style.backgroundColor.toLowerCase()).toBe(tint.toLowerCase().replace(/^#(..)(..)(..)$/, (_, r, g, b) => `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`));
    },
  );

  it("keeps the highlight and its contrast text on a plain selected option", () => {
    darkTheme(<ChoiceOption mode="single" onClick={noop} selected>Phương án</ChoiceOption>);
    expect(getComputedStyle(screen.getByRole("button")).backgroundColor).toContain("var(--quiz-highlight");
    expect(getComputedStyle(screen.getByText("Phương án")).color).toContain("var(--quiz-highlight-contrast");
  });
});

describe("choiceReviewTag", () => {
  it("a right answer the learner did not tick reads as missed on a multiple-response question, plain right on a single one", () => {
    expect(choiceReviewTag(true, false, true, true)).toBe("missed");
    expect(choiceReviewTag(true, false, true)).toBe("correct");
    expect(choiceReviewTag(true, true, true, true)).toBe("picked");
    expect(choiceReviewTag(false, false, true, true)).toBeUndefined();
  });

  it("a missed option says so and gets a dashed border", () => {
    renderThemed(<ChoiceOption letter="A" mode="multiple" onClick={noop} reviewTag="missed" selected={false}>Phương án</ChoiceOption>);
    expect(screen.getByText("Đáp án đúng · Bạn bỏ sót")).toBeTruthy();
    expect(getComputedStyle(screen.getByRole("button")).borderStyle).toBe("dashed");
  });
});
