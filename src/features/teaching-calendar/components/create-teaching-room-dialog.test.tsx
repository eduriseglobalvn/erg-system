import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { CreateTeachingRoomDialog } from "./create-teaching-room-dialog";

it("creates a room in the selected school and returns it to the schedule form", async () => {
  const createdRoom = { id: "room-2", label: "P.202", schoolId: "school-1" };
  const onCreate = vi.fn().mockResolvedValue(createdRoom);
  const onCreated = vi.fn();

  render(
    <CreateTeachingRoomDialog
      onClose={vi.fn()}
      onCreate={onCreate}
      onCreated={onCreated}
      open
      schoolId="school-1"
    />,
  );

  fireEvent.change(screen.getByLabelText("Tên phòng mới"), { target: { value: "P.202" } });
  fireEvent.click(screen.getByRole("button", { name: "Tạo phòng" }));

  await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ roomName: "P.202", schoolId: "school-1" }));
  expect(onCreated).toHaveBeenCalledWith(createdRoom);
});
