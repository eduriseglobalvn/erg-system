import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PwaInstallBanner } from "./pwa-install-banner";

const install = vi.hoisted(() => ({ value: { canInstall: false, installed: false, platform: "ios", promptInstall: vi.fn(async () => "unavailable" as const) } }));
vi.mock("@/hooks/use-install-prompt", () => ({ useInstallPrompt: () => install.value }));

afterEach(() => {
  window.localStorage.clear();
  install.value = { canInstall: false, installed: false, platform: "ios", promptInstall: vi.fn(async () => "unavailable" as const) };
});

describe("PwaInstallBanner", () => {
  it("shows iPhone steps on iOS", () => {
    render(<PwaInstallBanner />);
    fireEvent.click(screen.getByText("Cài ERG lên màn hình chính"));
    expect(screen.getByText("Cài ERG trên iPhone/iPad")).toBeInTheDocument();
    expect(screen.getByText(/Thêm vào MH chính/)).toBeInTheDocument();
  });

  it("shows Android steps when no native prompt is available", () => {
    install.value = { ...install.value, platform: "android" };
    render(<PwaInstallBanner />);
    fireEvent.click(screen.getByText("Cài ERG lên màn hình chính"));
    expect(screen.getByText("Cài ERG trên Android")).toBeInTheDocument();
  });

  it("stays hidden on desktop, when installed, and after dismissal", () => {
    install.value = { ...install.value, platform: "desktop" };
    const { unmount } = render(<PwaInstallBanner />);
    expect(screen.queryByText("Cài ERG lên màn hình chính")).toBeNull();
    unmount();

    install.value = { ...install.value, platform: "ios", installed: true };
    render(<PwaInstallBanner />).unmount();
    expect(screen.queryByText("Cài ERG lên màn hình chính")).toBeNull();

    install.value = { ...install.value, installed: false };
    render(<PwaInstallBanner />);
    fireEvent.click(screen.getByRole("button", { name: "Để sau" }));
    expect(screen.queryByText("Cài ERG lên màn hình chính")).toBeNull();
    expect(window.localStorage.getItem("erg-pwa-install-dismissed")).not.toBeNull();
  });
});
