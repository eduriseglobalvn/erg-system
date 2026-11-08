import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/platform/i18n";
import { AuthFormPanel } from "./auth-form-panel";
import { NoticeBanner } from "./portal-login-presentation";

const loginForm = { email: "", password: "" } as never;

function renderPanel() {
  return render(
    <I18nProvider><AuthFormPanel
      loginForm={loginForm}
      onForgotPassword={vi.fn()}
      onLoginFormChange={vi.fn()}
      onLoginSubmit={vi.fn()}
      onRememberMeChange={vi.fn()}
      onShowPasswordToggle={vi.fn()}
      rememberMe={false}
      showPassword={false}
    /></I18nProvider>,
  );
}

describe("AuthFormPanel", () => {
  it("uses the generic credential label for every role", () => {
    renderPanel();
    expect(screen.getByText("Email hoặc mã học sinh")).toBeTruthy();
  });

  it("keeps the required-field error hidden while typing until the field is blurred", () => {
    renderPanel();
    const email = document.querySelector<HTMLInputElement>('input[autocomplete="username"]')!;

    fireEvent.focus(email);
    fireEvent.change(email, { target: { value: "a" } });
    fireEvent.change(email, { target: { value: "" } });
    expect(screen.queryByText("Email hoặc mã học sinh là bắt buộc.")).toBeNull();

    fireEvent.blur(email);
    expect(screen.getByText("Email hoặc mã học sinh là bắt buộc.")).toBeTruthy();
  });

  it("warns when Caps Lock is on in the password field and clears on blur", () => {
    renderPanel();
    const password = document.querySelector<HTMLInputElement>('input[autocomplete="current-password"]')!;

    fireEvent.keyUp(password, { key: "a", modifierCapsLock: true });
    expect(screen.getByText("Caps Lock đang bật.")).toBeTruthy();

    fireEvent.keyUp(password, { key: "a", modifierCapsLock: false });
    expect(screen.queryByText("Caps Lock đang bật.")).toBeNull();

    fireEvent.keyUp(password, { key: "a", modifierCapsLock: true });
    fireEvent.blur(password);
    expect(screen.queryByText("Caps Lock đang bật.")).toBeNull();
  });
});

describe("NoticeBanner", () => {
  it("exposes error notices as role=alert", () => {
    render(<NoticeBanner notice={{ tone: "error", message: "Sai mật khẩu." }} />);
    expect(screen.getByRole("alert").textContent).toContain("Sai mật khẩu.");
  });
});
