import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FramePickerPage } from "@/features/elearning/student-tier/components/frame-picker-page";
import { MyTierPage } from "@/features/elearning/student-tier/components/my-tier-page";
import { MINH_ANH, MY_FRAMES, PROMOTION, TIER_TABLE, renderWithQuery } from "@/features/elearning/student-tier/components/tier-fixtures";
import { TierPromotionDialog } from "@/features/elearning/student-tier/components/tier-promotion-dialog";
import { TierTablePage } from "@/features/elearning/student-tier/components/tier-table-page";

const api = vi.hoisted(() => ({ loadMyTier: vi.fn(), loadTierTable: vi.fn(), loadMyFrames: vi.fn(), selectFrame: vi.fn(), acknowledgeTierPromotion: vi.fn() }));
vi.mock("@/features/elearning/student-tier/api/student-tier-api", async (original) => ({ ...(await original<object>()), ...api }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const contained = () => document.body.querySelectorAll(".MuiButton-contained").length;

beforeEach(() => {
  vi.clearAllMocks();
  api.loadMyTier.mockResolvedValue(MINH_ANH);
  api.loadTierTable.mockResolvedValue(TIER_TABLE);
  api.loadMyFrames.mockResolvedValue(MY_FRAMES);
  api.selectFrame.mockResolvedValue({});
});

describe("MyTierPage (H15)", () => {
  it("shows the design sample", async () => {
    renderWithQuery(<MyTierPage accountId="a1" studentName="Nguyễn Minh Anh" gradeLabel="khối 7" />);
    expect(await screen.findByText("Đồng 2")).toBeTruthy();
    expect(screen.getByText(/cả khóa · #92 \/ 128 khối 7 · top 72%/)).toBeTruthy();
    expect(screen.getByText("Vượt 3 bạn trong khối lên Đồng 1")).toBeTruthy();
    expect(screen.getByText("mốc tuần này 1.325 XP")).toBeTruthy();
    expect(screen.getByText("Vượt 8 bạn lên Bạc, mở khung viền Bạc")).toBeTruthy();
    expect(screen.getByText("mốc tuần này 1.480 XP")).toBeTruthy();
    expect(screen.getByText("Bạn ở đây")).toBeTruthy();
    expect(await screen.findByText(/Top 65–82% · 22 bạn/)).toBeTruthy();
    expect(contained()).toBe(1);
  });

  it("colours the tier name and fills the bars by cutoffs, not by XP over cutoff", async () => {
    renderWithQuery(<MyTierPage accountId="a4" studentName="Nguyễn Minh Anh" gradeLabel="khối 7" />);
    const name = await screen.findByText("Đồng 2");
    expect(getComputedStyle(name).color).toBe("rgb(138, 67, 26)");
    await screen.findByText(/Top 65–82% · 22 bạn/);
    const fills = [...document.querySelectorAll("[data-design='H15.hero'] [aria-hidden='true'] > div")].map((el) => (el as HTMLElement).style.width || getComputedStyle(el).width);
    expect(fills).toContain("39%");
    expect(fills).toContain("58%");
    expect(document.querySelector("[data-design='H15.connector']")).toBeTruthy();
  });

  it("asks for more hand-ins when not eligible", async () => {
    api.loadMyTier.mockResolvedValue({ ...MINH_ANH, eligible: false, tierKey: null, division: null, submittedCount: 1 });
    renderWithQuery(<MyTierPage accountId="a2" studentName="Nguyễn Minh Anh" />);
    expect(await screen.findByText("Nộp thêm 2 bài để được xếp bậc")).toBeTruthy();
  });

  it("shows an error with a retry", async () => {
    api.loadMyTier.mockRejectedValue(new Error("boom"));
    renderWithQuery(<MyTierPage accountId="a3" studentName="Nguyễn Minh Anh" />);
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});

describe("TierTablePage (H18)", () => {
  it("marks the viewer's cell Đồng 2 and lists the rank range", async () => {
    renderWithQuery(<TierTablePage accountId="b1" gradeLabel="Khối 7" />);
    const cell = (await screen.findAllByText("≥ 1.185 XP"))[0].closest("[aria-current]") as HTMLElement;
    expect(within(cell).getByText("Bạn")).toBeTruthy();
    expect(within(cell).getByText("hạng #90–94")).toBeTruthy();
    expect(within(cell).getByText("1.185", { selector: "span" })).toBeTruthy();
    expect(document.querySelectorAll("[data-design='H18m.cell']").length).toBeGreaterThan(0);
    expect(screen.getByText("Không chia cấp · các bạn Cao thủ xếp theo XP")).toBeTruthy();
  });

  it("links back to Bậc của bạn and names the ISO week in the subtitle", async () => {
    const onBack = vi.fn();
    renderWithQuery(<TierTablePage accountId="b2" gradeLabel="Khối 7" onBack={onBack} />);
    fireEvent.click(await screen.findByRole("button", { name: /Bậc của bạn/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/mốc XP của tuần \d+, tính lại 0 giờ thứ Hai/)).toBeTruthy();
  });
});

describe("TierPromotionDialog (H16)", () => {
  const props = { promotion: PROMOTION, studentName: "Nguyễn Minh Anh", gradeLabel: "khối 7", next: { tierKey: "bac", division: 4, minXp: 1655, studentsToPass: 2 }, open: true };

  it("celebrates Đồng 1 -> Bạc 5", () => {
    renderWithQuery(<TierPromotionDialog {...props} onClose={vi.fn()} onUseFrame={vi.fn()} onViewTier={vi.fn()} />);
    expect(screen.getByText("Lên bậc Bạc!")).toBeTruthy();
    expect(screen.getByText("11 bạn")).toBeTruthy();
    expect(screen.getByText(/giờ ở top 63%/)).toBeTruthy();
    expect(screen.getByText("Đồng 1")).toBeTruthy();
    expect(screen.getByText("Bạc 5")).toBeTruthy();
    expect(screen.getByText("Khung viền Bạc đã mở")).toBeTruthy();
    expect(screen.getByText("Tiếp: Bạc 4")).toBeTruthy();
    expect(screen.getByText("vượt 2 bạn")).toBeTruthy();
    expect(contained()).toBe(1);
  });

  it("uses the frame or defers", () => {
    const onClose = vi.fn();
    const onUseFrame = vi.fn();
    renderWithQuery(<TierPromotionDialog {...props} onClose={onClose} onUseFrame={onUseFrame} onViewTier={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Dùng khung Bạc" }));
    fireEvent.click(screen.getByRole("button", { name: "Để sau" }));
    expect(onUseFrame).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("FramePickerPage (H17)", () => {
  it("saves only after a change and keeps locked frames disabled", async () => {
    renderWithQuery(<FramePickerPage accountId="c1" studentName="Nguyễn Minh Anh" className="Lớp 7A" currentSchoolYear="2026-2027" />);
    expect(await screen.findByText("4 / 8 đã mở · khung đã mở giữ mãi, kể cả khi tụt bậc hay sang khóa mới")).toBeTruthy();
    const save = screen.getByRole("button", { name: "Lưu khung Đồng" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(screen.getByText("Lên Bạc để mở · còn vượt 8 bạn")).toBeTruthy();
    expect(screen.getByText("Đã đạt ở khóa hè 2026")).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Bạc Lên Bạc để mở/ }).getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(screen.getByRole("radio", { name: /Sắt/ }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu khung Sắt" }));
    await waitFor(() => expect(api.selectFrame).toHaveBeenCalledWith("sat"));
    expect(contained()).toBe(1);
  });
});
