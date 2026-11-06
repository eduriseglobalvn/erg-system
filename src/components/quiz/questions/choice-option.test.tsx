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
    expect(getComputedStyle(screen.getByText("Đáp án đúng")).color).toBe("rgb(22, 163, 74)");
  });

  it("labels a wrong pick in the error colour", () => {
    renderThemed(<ChoiceOption mode="single" onClick={noop} selected reviewTag="pickedWrong">Sai</ChoiceOption>);
    expect(getComputedStyle(screen.getByText("Bạn chọn")).color).toBe("rgb(217, 45, 32)");
  });

  it("labels a correct pick as 'Bạn chọn' only", () => {
    renderThemed(<ChoiceOption mode="single" onClick={noop} selected reviewTag="picked">Đúng</ChoiceOption>);
    expect(screen.getByText("Bạn chọn")).toBeTruthy();
    expect(screen.queryByText("Đáp án đúng")).toBeNull();
  });
});
