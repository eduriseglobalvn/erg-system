import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/platform/i18n/i18n-provider";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import { AdminErgPortalWorkspace } from "./admin-erg-workspaces";

const navigate = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));

describe("AdminErgPortalWorkspace (BUG-UI-005)", () => {
  it("says not found and leads back to the admin home", () => {
    render(<I18nProvider><AdminErgPortalWorkspace /></I18nProvider>);
    const back = screen.getByRole("button");
    fireEvent.click(back);
    expect(navigate).toHaveBeenCalledWith({ to: adminPath("/") });
  });
});
