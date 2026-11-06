import { ThemeProvider } from "@mui/material/styles";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { ChoiceOption } from "@/components/quiz/questions/choice-option";
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
    expect(style.backgroundColor).toBe("rgb(0, 113, 227)");
    expect(style.color).toBe("rgb(255, 255, 255)");
  });
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
