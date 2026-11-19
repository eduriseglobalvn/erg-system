import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const enableNotifications = vi.fn();
let hookState = "default";

vi.mock("@/features/notifications/api/notification-device-api", () => ({
  fetchWebPushConfig: vi.fn(async () => ({ enabled: true, provider: "webpush", publicKey: "BPk" })),
}));
vi.mock("@/features/lms/mobile/hooks/use-pwa-notifications", () => ({
  usePwaNotifications: () => ({ busy: false, enableNotifications, state: hookState }),
}));
vi.mock("@/platform/auth/api/auth-storage", () => ({ getAuthScope: () => ({ accountId: "acc-1" }) }));

function setPermission(permission: NotificationPermission, subscription: object | null = null) {
  vi.stubGlobal("Notification", { permission, requestPermission: vi.fn() });
  vi.stubGlobal("PushManager", function PushManager() {});
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { getRegistration: async () => ({ pushManager: { getSubscription: async () => subscription } }) },
  });
}

// Fresh module per test: «Để sau» is remembered for the whole app open (module scope).
let PushPermissionPrompt: typeof import("./push-permission-prompt").PushPermissionPrompt;

const renderPrompt = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PushPermissionPrompt portal="lms" />
    </QueryClientProvider>,
  );

beforeEach(async () => {
  vi.resetModules();
  ({ PushPermissionPrompt } = await import("./push-permission-prompt"));
  hookState = "default";
  window.localStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());

test("asks on app open while permission is default and no subscription exists", async () => {
  setPermission("default");
  renderPrompt();
  expect(await screen.findByText("Nhận thông báo từ ERG?")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Để sau" }));
  await waitFor(() => expect(screen.queryByText("Nhận thông báo từ ERG?")).not.toBeInTheDocument());
});

test("stays quiet when permission is granted but the browser lost its subscription (re-subscribes silently)", async () => {
  setPermission("granted");
  renderPrompt();
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(screen.queryByText("Nhận thông báo từ ERG?")).not.toBeInTheDocument();
});

test("stays quiet once subscribed", async () => {
  setPermission("granted", { endpoint: "https://fcm.googleapis.com/x" });
  hookState = "enabled";
  renderPrompt();
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(screen.queryByText("Nhận thông báo từ ERG?")).not.toBeInTheDocument();
});

test("denied: shows the how-to hint once per account", async () => {
  setPermission("denied");
  const first = renderPrompt();
  expect(await screen.findByText("Thông báo đang bị chặn")).toBeInTheDocument();
  first.unmount();
  renderPrompt();
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(screen.queryByText("Thông báo đang bị chặn")).not.toBeInTheDocument();
});

test("renders nothing without PushManager (iOS 15, Safari tab)", () => {
  vi.stubGlobal("Notification", { permission: "default" });
  const { container } = renderPrompt();
  expect(container).toBeEmptyDOMElement();
});
