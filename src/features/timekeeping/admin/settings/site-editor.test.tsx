import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { PolicyVersions, SiteConfig } from "../../api/timekeeping-types";
import { BLANK_SITE, siteToForm, type SiteForm } from "./settings-model";
import { SettingsForm } from "./settings-form";
import { SiteEditor } from "./site-editor";

vi.mock("@tanstack/react-router", () => ({ useBlocker: () => ({ status: "idle", proceed: undefined, reset: undefined }) }));
vi.mock("@/lib/graphql-client", () => ({ getDefaultTenantId: () => "t1" }));
vi.mock("@/features/employee-management/hooks/use-employee-management", () => ({ useEmployees: () => ({ data: { users: [] }, isPending: false, isError: false }) }));
vi.mock("../../api/timekeeping-config-query", () => {
  const mutation = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, isError: false, error: null, reset: vi.fn() });
  return {
    useRemoteRules: () => ({ data: [], isPending: false, isError: false, refetch: vi.fn() }),
    useDeleteRemoteRule: mutation,
    useDeleteSite: mutation,
    useSaveSite: mutation,
    useSavePolicy: mutation,
    useSaveRemoteRule: mutation,
  };
});

const SITE: SiteConfig = { id: "s1", schoolId: "sc1", name: "Cơ sở Cầu Giấy", address: "1 Duy Tân", lat: 21.03, lng: 105.78, radiusM: 150, active: true };
const VERSIONS: PolicyVersions = {
  current: { lateToleranceMin: 5, lateBlockMin: 15, explanationsPerMonth: 3, explanationWindowDays: 3, annualLeaveDays: 12, seniorityStepYears: 5, lockDayOfMonth: 8, requireFace: true, allowOutside: false, approvalChains: {} },
};

function Harness({ initial = siteToForm(SITE) }: { initial?: SiteForm }) {
  const [value, setValue] = useState(initial);
  return <SiteEditor onChange={(patch) => setValue({ ...value, ...patch })} showErrors value={value} />;
}

const renderForm = () =>
  render(<SettingsForm onSelect={vi.fn()} schoolFilter={null} schoolId="sc1" schoolName="Cầu Giấy" selectedId="s1" sites={[SITE]} versions={VERSIONS} />);
const saveButton = () => screen.getByRole("button", { name: "Lưu thay đổi" });

describe("SiteEditor", () => {
  it("rejects a radius outside 50-500 m and a latitude outside -90..90", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Bán kính (m)"), { target: { value: "40" } });
    expect(screen.getByText("Bán kính từ 50 đến 500 m")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Vĩ độ"), { target: { value: "95" } });
    expect(screen.getByText("Vĩ độ không hợp lệ")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Kinh độ"), { target: { value: "181" } });
    expect(screen.getByText("Kinh độ không hợp lệ")).toBeInTheDocument();
  });

  it("opens Google Maps in a new tab without leaking the opener", () => {
    render(<Harness />);
    const link = screen.getByRole("link", { name: "Mở trên Google Maps" });
    expect(link).toHaveAttribute("href", "https://www.google.com/maps?q=21.03,105.78");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("offers no map link for a new site without coordinates", () => {
    render(<Harness initial={BLANK_SITE} />);
    expect(screen.queryByRole("link", { name: "Mở trên Google Maps" })).not.toBeInTheDocument();
  });
});

describe("SettingsForm header", () => {
  it("keeps Lưu thay đổi disabled until something changes", () => {
    renderForm();
    expect(saveButton()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Huỷ" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/^Tên địa điểm/), { target: { value: "Cơ sở mới" } });
    expect(saveButton()).toBeEnabled();
  });

  it("restores the loaded values on Huỷ", () => {
    renderForm();
    const name = screen.getByLabelText(/^Tên địa điểm/);
    fireEvent.change(name, { target: { value: "Cơ sở mới" } });
    fireEvent.change(screen.getByLabelText("Bán kính (m)"), { target: { value: "300" } });
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(screen.getByLabelText(/^Tên địa điểm/)).toHaveValue("Cơ sở Cầu Giấy");
    expect(screen.getByLabelText("Bán kính (m)")).toHaveValue("150");
    expect(saveButton()).toBeDisabled();
  });

  it("blocks saving an invalid radius", () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Bán kính (m)"), { target: { value: "40" } });
    expect(screen.getByText("Bán kính từ 50 đến 500 m")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("shows neither QR nor overtime anywhere in the first tab", () => {
    const { container } = renderForm();
    expect(container.textContent).not.toMatch(/\bQR\b|Làm thêm|\bOT\b/);
    expect(screen.getByText("Áp dụng theo cơ sở · thay đổi có hiệu lực từ kỳ công tiếp theo")).toBeInTheDocument();
  });
});
