import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { DeleteTeacherScheduleDialog } from "./delete-teacher-schedule-dialog";

it("submits a bounded teacher schedule deletion", async () => {
  const onDelete = vi.fn().mockResolvedValue({ affectedEventCount: 4, deleted: true, eventId: "teacher-1" });
  render(
    <DeleteTeacherScheduleDialog
      onDelete={onDelete}
      schools={[{ id: "school-1", name: "ERG School" }]}
      teachers={[{ id: "teacher-1", name: "Nguyễn Văn A" }]}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Xóa lịch giáo viên" }));
  fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "2026-07-13" } });
  fireEvent.change(screen.getByLabelText("Đến ngày"), { target: { value: "2026-07-19" } });
  fireEvent.click(screen.getByRole("button", { name: "Xác nhận xóa lịch" }));

  await waitFor(() => expect(onDelete).toHaveBeenCalledWith({
    dateFrom: "2026-07-13",
    dateTo: "2026-07-19",
    schoolIds: ["school-1"],
    teacherUserId: "teacher-1",
  }));
});
