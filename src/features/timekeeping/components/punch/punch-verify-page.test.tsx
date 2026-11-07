import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api-client/errors";
import { NEARBY_FIX, PUNCH_RESULT, TODAY } from "@/test/fixtures/timekeeping-punch-fixtures";
import { PunchVerifyPage } from "./punch-verify-page";

const h = vi.hoisted(() => ({
  api: { today: vi.fn(), punch: vi.fn(), recordFaceConsent: vi.fn() },
  navigate: vi.fn(),
  camera: {
    videoRef: { current: null },
    start: vi.fn(),
    stop: vi.fn(),
    capture: vi.fn(),
    supported: true,
    fallbackInputProps: {},
  },
}));
vi.mock("../../api/timekeeping-api", async (original) => ({ ...(await original<object>()), timekeepingApi: h.api }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => h.navigate }));
vi.mock("../../hooks/use-server-clock", () => ({ useServerClock: () => ({ now: () => new Date(2026, 10, 6, 7, 24, 0), offsetMs: 0, ready: true }) }));
vi.mock("../../hooks/use-geolocation", () => ({ useGeolocation: () => ({ reading: NEARBY_FIX, error: null, request: vi.fn() }) }));
vi.mock("../../hooks/use-camera-capture", () => ({ useCameraCapture: () => h.camera }));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><PunchVerifyPage /></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  h.camera.start.mockResolvedValue(undefined);
  h.camera.capture.mockResolvedValue(new Blob(["x"], { type: "image/jpeg" }));
  h.api.today.mockResolvedValue(TODAY);
});

describe("PunchVerifyPage (G02)", () => {
  it("asks for face consent before opening the camera, and declining returns to G01", async () => {
    h.api.today.mockResolvedValue({ ...TODAY, faceConsented: false });
    renderPage();
    expect(await screen.findByText("Đồng ý lưu ảnh khuôn mặt")).toBeInTheDocument();
    expect(h.camera.start).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Không đồng ý" }));
    expect(h.navigate).toHaveBeenCalledWith({ href: "/teacher/timekeeping" });
  });

  it("sends the same Idempotency-Key when the first attempt fails on the network", async () => {
    h.api.punch.mockRejectedValueOnce(new ApiClientError("Cannot connect", "NETWORK_ERROR", 0)).mockResolvedValueOnce(PUNCH_RESULT);
    renderPage();
    const button = await screen.findByRole("button", { name: "Chụp & chấm vào" });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    await screen.findByText(/lượt chấm sẽ không bị trùng/);
    fireEvent.click(screen.getByRole("button", { name: "Chụp & chấm vào" }));
    await screen.findByText("Đã chấm vào lúc 07:24");
    expect(h.api.punch).toHaveBeenCalledTimes(2);
    const [first, second] = h.api.punch.mock.calls;
    expect(first[1]).toBeTruthy();
    expect(second[1]).toBe(first[1]);
  });

  it("shows a REJECTED message in place and does not open G03", async () => {
    h.api.punch.mockRejectedValue(new ApiClientError("Ngoài vùng chấm công", "PUNCH_REJECTED", 422));
    renderPage();
    const button = await screen.findByRole("button", { name: "Chụp & chấm vào" });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    expect(await screen.findByText("Ngoài vùng chấm công")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xong" })).not.toBeInTheDocument();
  });
});
