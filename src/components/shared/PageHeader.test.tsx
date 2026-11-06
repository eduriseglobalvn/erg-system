import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ErgMuiProvider } from "@/themes/ErgMuiProvider";
import PageHeader from "./PageHeader";

it("renders title, subtitle, actions and breadcrumbs through the shared header", () => {
  render(
    <ErgMuiProvider>
      <PageHeader
        actions={<button type="button">Thêm</button>}
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Học sinh" }]}
        subtitle="Mô tả"
        title="Học sinh"
      />
    </ErgMuiProvider>,
  );
  expect(screen.getByRole("heading", { level: 1, name: "Học sinh" })).toBeInTheDocument();
  expect(screen.getByText("Mô tả")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Thêm" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/");
});

it("renders only the title when optional props are missing", () => {
  render(
    <ErgMuiProvider>
      <PageHeader title="Trang" />
    </ErgMuiProvider>,
  );
  expect(screen.getByRole("heading", { name: "Trang" })).toBeInTheDocument();
  expect(screen.queryByRole("navigation")).toBeNull();
});
