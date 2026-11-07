import HomeIcon from "@mui/icons-material/Home";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("@/components/portal/use-portal-notifications", () => ({ notificationPortalFromPath: () => "lms", usePortalNotifications: () => ({ notifications: [], unreadCount: undefined }) }));
import ErgPortalLayout from "@/components/portal/ErgPortalLayout";

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: "/calendar" }),
  useNavigate: () => vi.fn(),
}));

it("coordinates sidebar and workspace movement through one shell column", () => {
  render(
    <ErgPortalLayout
      menuGroups={[]}
      portalInfo={{ name: "Admin" }}
    >
      <div>Lịch trung tâm</div>
    </ErgPortalLayout>,
  );

  const shell = screen.getByTestId("erg-portal-shell");
  const main = screen.getByTestId("erg-portal-main");
  expect(shell).toHaveAttribute("data-sidebar-width", "264");
  expect(getComputedStyle(main).width).not.toBe("0px");

  fireEvent.click(screen.getByRole("button", { name: "Thu gọn menu" }));

  expect(shell).toHaveAttribute("data-sidebar-width", "80");
  expect(main).toHaveAttribute(
    "data-sidebar-collapsed",
    "true",
  );
});

function mockViewport(width: number) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => {
      const max = /max-width:\s*(\d+)/.exec(query);
      return {
        matches: max ? width <= Number(max[1]) : false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
      };
    },
  });
}

const dock = {
  ariaLabel: "Điều hướng admin",
  activeId: "home",
  items: [
    { id: "home", label: "Trang chủ", path: "/admin", icon: HomeIcon },
    { id: "all", label: "Tất cả", path: "/admin", icon: HomeIcon, opensSheet: true },
  ],
  renderSheet: ({ open }: { open: boolean }) => (open ? <div role="dialog" aria-label="Tất cả chức năng" /> : null),
};

it("with mobileDock on a phone shows the dock instead of the hamburger and opens the sheet from Tất cả", () => {
  mockViewport(375);
  render(
    <ErgPortalLayout menuGroups={[]} mobileDock={dock} portalInfo={{ name: "Admin" }}>
      <div>Nội dung</div>
    </ErgPortalLayout>,
  );

  expect(screen.getByRole("navigation", { name: "Điều hướng admin" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Mở menu" })).toBeNull();
  // No permanent desktop sidebar competing with main for the single grid row.
  expect(screen.queryByRole("button", { name: "Thu gọn menu" })).toBeNull();
  expect(screen.getByText("Nội dung")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tất cả" }));
  expect(screen.getByRole("dialog", { name: "Tất cả chức năng" })).toBeInTheDocument();
});

it("keeps the hamburger and no dock on a tablet", () => {
  mockViewport(1000);
  render(
    <ErgPortalLayout menuGroups={[]} mobileDock={dock} portalInfo={{ name: "Admin" }}>
      <div>Nội dung</div>
    </ErgPortalLayout>,
  );

  expect(screen.queryByRole("navigation", { name: "Điều hướng admin" })).toBeNull();
  expect(screen.getByRole("button", { name: "Mở menu" })).toBeInTheDocument();
});

it("closes the open sheet when the viewport leaves phone width", () => {
  mockViewport(375);
  // A new element each time, so React does not bail out of the re-render.
  const tree = () => (
    <ErgPortalLayout menuGroups={[]} mobileDock={dock} portalInfo={{ name: "Admin" }}>
      <div>Nội dung</div>
    </ErgPortalLayout>
  );
  const { rerender } = render(tree());
  fireEvent.click(screen.getByRole("button", { name: "Tất cả" }));
  expect(screen.getByRole("dialog", { name: "Tất cả chức năng" })).toBeInTheDocument();

  mockViewport(1000);
  rerender(tree());
  expect(screen.queryByRole("dialog")).toBeNull();
  mockViewport(375);
  rerender(tree());
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("hides the header bell on a phone only when the dock carries the inbox tab", () => {
  mockViewport(375);
  const dockWithInbox = { ...dock, items: [...dock.items, { id: "inbox", label: "Hộp thư", path: "/admin/notifications", icon: HomeIcon }] };
  const { unmount, rerender } = render(
    <ErgPortalLayout menuGroups={[]} mobileDock={dockWithInbox} portalInfo={{ name: "Admin" }}>
      <div>Nội dung</div>
    </ErgPortalLayout>,
  );
  expect(screen.queryByRole("button", { name: /^Thông báo/ })).toBeNull();

  rerender(
    <ErgPortalLayout menuGroups={[]} mobileDock={dock} portalInfo={{ name: "Admin" }}>
      <div>Nội dung</div>
    </ErgPortalLayout>,
  );
  expect(screen.getByRole("button", { name: /^Thông báo/ })).toBeInTheDocument();
  unmount();

  render(
    <ErgPortalLayout menuGroups={[]} portalInfo={{ name: "Admin" }}>
      <div>Nội dung</div>
    </ErgPortalLayout>,
  );
  expect(screen.getByRole("button", { name: /^Thông báo/ })).toBeInTheDocument();
});
