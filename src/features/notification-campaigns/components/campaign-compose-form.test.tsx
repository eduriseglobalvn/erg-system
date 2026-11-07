import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import type { AudienceBreakdown, CampaignResponse } from "../api/campaign-types";
import { CampaignComposeForm } from "./campaign-compose-form";
import { CampaignComposeScreen } from "./campaign-compose-screen";

const estimate = vi.hoisted(() => ({ data: undefined as AudienceBreakdown | undefined, error: null as unknown, isFetching: false }));
const create = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
const update = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
const send = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
const schedule = vi.hoisted(() => ({ mutateAsync: vi.fn(), at: "" }));
const detail = vi.hoisted(() => ({ data: undefined as CampaignResponse | undefined, isPending: false, error: null as unknown }));
const navigate = vi.hoisted(() => vi.fn());

vi.mock("../api/campaign-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/campaign-query")>()),
  useCampaignEstimate: () => estimate,
  useCreateCampaign: () => ({ ...create, isPending: false }),
  useUpdateCampaign: () => ({ ...update, isPending: false }),
  useSendCampaign: () => ({ ...send, isPending: false }),
  useScheduleCampaign: (at: string) => {
    schedule.at = at;
    return { mutateAsync: schedule.mutateAsync, isPending: false };
  },
  useCampaign: () => detail,
  usePeopleSearch: () => ({ data: undefined, isFetching: false }),
  useResolvePeople: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("../api/use-audience-directory", () => ({
  useAudienceDirectory: () => ({
    schools: [{ id: "s1", label: "THCS Cầu Giấy" }],
    grades: [{ id: "7", label: "Khối 7" }],
    classes: [{ id: "k7a", label: "7A" }],
    groups: [{ id: "g1", label: "Nhóm Toán" }],
    loading: false,
    error: null,
  }),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

beforeEach(() => {
  estimate.data = { total: 1336, teachers: 86, students: 1250 };
  estimate.error = null;
  estimate.isFetching = false;
  for (const m of [create, update, send, schedule]) m.mutateAsync.mockReset();
  navigate.mockReset();
  toast.success.mockReset();
  detail.data = undefined;
});

const primary = () => screen.getByRole("button", { name: /^(Gửi|Hẹn gửi) / });

function fillContent() {
  fireEvent.change(screen.getByLabelText("Tiêu đề"), { target: { value: "Lịch họp phụ huynh" } });
  fireEvent.change(screen.getByLabelText("Nội dung"), { target: { value: "Kính gửi thầy cô." } });
}

test("primary button shows the estimate total with the Vietnamese separator", () => {
  render(<CampaignComposeForm portalKind="admin" />);
  expect(primary()).toHaveTextContent("Gửi 1.336 người");
});

test("'Hẹn giờ' switches the primary label", () => {
  render(<CampaignComposeForm portalKind="admin" />);
  fireEvent.click(screen.getByRole("radio", { name: "Hẹn giờ" }));
  expect(primary()).toHaveTextContent("Hẹn gửi 1.336 người");
});

test("exactly one contained button; 'Lưu nháp' is outlined", () => {
  const { container } = render(<CampaignComposeForm portalKind="admin" />);
  expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Lưu nháp" })).toHaveClass("MuiButton-outlined");
});

test("a disabled primary shows why: no recipients", () => {
  render(<CampaignComposeForm portalKind="admin" />);
  expect(primary()).toBeDisabled();
  expect(screen.getByText("Chọn ít nhất một người nhận")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Lưu nháp" })).toBeDisabled();
});

test("a valid form is still blocked when the estimate fails (422)", () => {
  estimate.error = new Error("Tối đa 5.000 người nhận mỗi lần gửi");
  render(<CampaignComposeForm portalKind="admin" initial={{ audience: emptyAudienceWithPerson }} />);
  fillContent();
  expect(screen.getByRole("alert")).toHaveTextContent("Tối đa 5.000 người nhận mỗi lần gửi");
  expect(primary()).toBeDisabled();
  expect(screen.getByText("Sửa người nhận theo lỗi ở phần Gửi đến")).toBeInTheDocument();
});

test("retrying a failed send reuses the created campaign", async () => {
  create.mutateAsync.mockResolvedValue({ id: "c5" });
  update.mutateAsync.mockResolvedValue({ id: "c5" });
  send.mutateAsync.mockRejectedValueOnce(new Error("Mất kết nối")).mockResolvedValueOnce({ id: "c5", status: "SENT" });
  render(<CampaignComposeForm portalKind="admin" initial={{ audience: emptyAudienceWithPerson }} />);
  fillContent();
  fireEvent.click(primary());
  expect(await screen.findByRole("alert")).toHaveTextContent("Mất kết nối");
  fireEvent.click(primary());
  await waitFor(() => expect(navigate).toHaveBeenCalledWith({ href: "/admin/notifications?tab=SENT" }));
  expect(create.mutateAsync).toHaveBeenCalledTimes(1);
  expect(update.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ id: "c5" }));
  expect(send.mutateAsync).toHaveBeenCalledTimes(2);
});

test("edit mode: 'Lưu nháp' updates in place and stays on the page", async () => {
  update.mutateAsync.mockResolvedValue({ id: "c9" });
  render(<CampaignComposeForm campaignId="c9" initial={{ audience: emptyAudienceWithPerson, title: "T", body: "B" }} portalKind="teacher" />);
  fireEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
  await waitFor(() => expect(update.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ id: "c9" })));
  expect(create.mutateAsync).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
  expect(toast.success).toHaveBeenCalledWith("Đã lưu thay đổi");
});

test("a submit attempt shows title and body errors without blur", () => {
  render(<CampaignComposeForm portalKind="admin" initial={{ audience: emptyAudienceWithPerson }} />);
  fireEvent.submit(screen.getByLabelText("Tiêu đề").closest("form")!);
  expect(screen.getByText("Nhập tiêu đề")).toBeInTheDocument();
  expect(screen.getByText("Nhập nội dung")).toBeInTheDocument();
});

test("'Lưu nháp' creates the campaign and opens compose/$id", async () => {
  create.mutateAsync.mockResolvedValue({ id: "c42", status: "DRAFT" });
  render(<CampaignComposeForm portalKind="admin" initial={{ audience: emptyAudienceWithPerson }} />);
  fillContent();
  fireEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith({ href: "/admin/notifications/compose/c42", replace: true }));
  expect(create.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ title: "Lịch họp phụ huynh", body: "Kính gửi thầy cô.", priority: "INFO" }));
});

test("teacher: only class / group / people scopes, and the scope note", () => {
  render(<CampaignComposeForm portalKind="teacher" />);
  const scopes = screen.getByRole("radiogroup", { name: "Gửi đến" });
  for (const name of ["Toàn hệ thống", "Trường", "Khối", "Vai trò"]) expect(within(scopes).queryByRole("radio", { name })).toBeNull();
  expect(within(scopes).getByRole("radio", { name: "Lớp" })).toBeInTheDocument();
  expect(screen.getByText(/Giáo viên.*chỉ chọn được lớp mình dạy/)).toBeInTheDocument();
});

test("no Email row, no attachment button, no parent chip", () => {
  render(<CampaignComposeForm portalKind="admin" />);
  expect(screen.queryByText(/Email/)).toBeNull();
  expect(screen.queryByRole("button", { name: /Đính kèm/ })).toBeNull();
  expect(screen.queryByText(/Phụ huynh/)).toBeNull();
  expect(screen.getByText("Hộp thư trong ứng dụng")).toBeInTheDocument();
  expect(screen.getByRole("switch", { name: "Yêu cầu xác nhận đã đọc" })).toBeInTheDocument();
});

test("'Khẩn' shows the pin/push caption from the canvas", () => {
  render(<CampaignComposeForm portalKind="admin" />);
  const caption = "“Khẩn” ghim đầu Hộp thư và gửi đẩy kể cả khi người nhận tắt thông báo thường.";
  expect(screen.queryByText(caption)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Khẩn" }));
  expect(screen.getByText(caption)).toBeInTheDocument();
});

test("body counter and the 2,000 limit", () => {
  render(<CampaignComposeForm portalKind="admin" />);
  fireEvent.change(screen.getByLabelText("Nội dung"), { target: { value: "a".repeat(2001) } });
  expect(screen.getByText("2.001 / 2.000 ký tự")).toBeInTheDocument();
  fireEvent.blur(screen.getByLabelText("Nội dung"));
  expect(screen.getByText("Tối đa 2.000 ký tự")).toBeInTheDocument();
});

test("send now: create, send, then go to the notifications page", async () => {
  create.mutateAsync.mockResolvedValue({ id: "c1" });
  send.mutateAsync.mockResolvedValue({ id: "c1", status: "SENT" });
  // A picked person makes the audience non-empty (the people picker has its own tests).
  render(<CampaignComposeForm portalKind="teacher" initial={{ audience: emptyAudienceWithPerson }} />);
  fillContent();
  expect(primary()).toBeEnabled();
  fireEvent.click(primary());
  await waitFor(() => expect(navigate).toHaveBeenCalledWith({ href: "/teacher/notifications" }));
  expect(create.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ audience: expect.objectContaining({ userIds: ["u1"] }) }));
  expect(send.mutateAsync).toHaveBeenCalledWith("c1");
});

test("schedule: the chosen local time is sent as ISO", async () => {
  create.mutateAsync.mockResolvedValue({ id: "c2" });
  schedule.mutateAsync.mockResolvedValue({ id: "c2", status: "SCHEDULED" });
  const at = new Date(Date.now() + 2 * 3600_000);
  const local = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}T${String(at.getHours()).padStart(2, "0")}:00`;
  render(<CampaignComposeForm portalKind="admin" initial={{ audience: emptyAudienceWithPerson, sendMode: "schedule", scheduledAt: local }} />);
  fillContent();
  fireEvent.click(primary());
  await waitFor(() => expect(schedule.mutateAsync).toHaveBeenCalledWith("c2"));
  expect(schedule.at).toBe(new Date(at.getFullYear(), at.getMonth(), at.getDate(), at.getHours()).toISOString());
  expect(navigate).toHaveBeenCalledWith({ href: "/admin/notifications?tab=SENT" });
});

test("a 403 from the backend is shown inline", async () => {
  create.mutateAsync.mockRejectedValue(Object.assign(new Error("Forbidden"), { status: 403 }));
  render(<CampaignComposeForm portalKind="teacher" initial={{ audience: emptyAudienceWithPerson }} />);
  fillContent();
  fireEvent.click(primary());
  expect(await screen.findByRole("alert")).toHaveTextContent("chỉ gửi được cho lớp mình dạy");
});

test("edit mode loads the campaign into the form; sent campaigns are read-only", () => {
  detail.data = { id: "c7", status: "DRAFT", title: "Đã lưu", body: "Nội dung cũ", priority: "IMPORTANT", audience: { classIds: ["k7a"] } };
  const { unmount } = render(<CampaignComposeScreen campaignId="c7" portalKind="admin" />);
  expect(screen.getByLabelText("Tiêu đề")).toHaveValue("Đã lưu");
  expect(screen.getByRole("button", { name: "Quan trọng" })).toHaveAttribute("aria-pressed", "true");
  unmount();
  detail.data = { id: "c8", status: "SENT", title: "Xong" };
  render(<CampaignComposeScreen campaignId="c8" portalKind="admin" />);
  expect(screen.getByText(/không sửa được/)).toBeInTheDocument();
  expect(screen.queryByLabelText("Tiêu đề")).toBeNull();
});

const emptyAudienceWithPerson = {
  scope: "PEOPLE" as const,
  schoolIds: [],
  gradeIds: [],
  classIds: [],
  groupIds: [],
  roles: [],
  picked: [{ userId: "u1", displayName: "Nguyễn Minh", role: "STUDENT", meta: "Học sinh · 7A · HS0712" }],
  errors: [],
};
