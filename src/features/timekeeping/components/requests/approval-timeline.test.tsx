import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { RequestView } from "../../api/timekeeping-types";
import { ApprovalTimeline } from "./approval-timeline";
import { timelineSteps } from "./request-model";

const PENDING: RequestView = {
  id: "r1",
  code: "DT-2026-0012",
  type: "LEAVE",
  status: "PENDING",
  currentStep: 1,
  submittedAt: "2026-11-06T08:00:00",
  steps: [
    { stepNo: 1, status: "WAITING", approverName: "Trần Minh", resolver: "MANAGER", viewedAt: "2026-11-06T08:15:00", dueAt: "2026-11-08T08:00:00" },
    { stepNo: 2, status: "WAITING", approverName: "Lê Hoa", resolver: "SCHOOL_ROLE:VICE_PRINCIPAL" },
  ],
};

describe("timelineSteps", () => {
  it("lists the submission, the waiting step and the step still to come", () => {
    const steps = timelineSteps(PENDING);
    expect(steps.map((s) => s.state)).toEqual(["done", "current", "todo"]);
    expect(steps[0].title).toBe("Đã gửi đơn");
    expect(steps[1].title).toBe("Trần Minh");
    expect(steps[1].meta).toContain("đang chờ · đã xem 08:15");
    expect(steps[1].meta).toContain("Hạn xử lý 08/11");
    expect(steps[2].meta).toContain("chưa tới");
  });

  it("says when the waiting approver has not opened the request", () => {
    const unseen = { ...PENDING, steps: [{ ...PENDING.steps![0], viewedAt: undefined }] };
    expect(timelineSteps(unseen)[1].meta).toContain("đang chờ · chưa xem");
  });

  it("marks approved and rejected steps and leaves skipped ones out", () => {
    const decided: RequestView = {
      ...PENDING,
      status: "REJECTED",
      steps: [
        { stepNo: 1, status: "SKIPPED", resolver: "MANAGER" },
        { stepNo: 2, status: "APPROVED", approverName: "Trần Minh", actedAt: "2026-11-06T09:00:00" },
        { stepNo: 3, status: "REJECTED", approverName: "Lê Hoa", actedAt: "2026-11-06T10:00:00", comment: "Thiếu người dạy thay" },
      ],
    };
    const steps = timelineSteps(decided);
    expect(steps.map((s) => s.state)).toEqual(["done", "done", "rejected"]);
    expect(steps[2].meta).toContain("từ chối");
    expect(steps[2].meta).toContain("Thiếu người dạy thay");
  });
});

describe("ApprovalTimeline", () => {
  it("renders an ordered list that spells out each state", () => {
    render(<ApprovalTimeline request={PENDING} />);
    const list = screen.getByRole("list", { name: "Luồng duyệt" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveTextContent("Trần Minh (Đang chờ)");
    expect(items[2]).toHaveTextContent("Lê Hoa (Chưa tới)");
  });
});
