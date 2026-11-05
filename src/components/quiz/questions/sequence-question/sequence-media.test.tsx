import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { SequenceImageControls } from "@/components/quiz/questions/sequence-question/sequence-media";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError } }));

describe("SequenceImageControls", () => {
  beforeEach(() => toastError.mockClear());

  test.each([
    ["image/heic", 1024, "Chỉ nhận ảnh PNG, JPG, GIF hoặc WebP."],
    ["image/png", 5 * 1024 * 1024 + 1, "Ảnh lớn hơn 5 MB."],
  ])("rejects %s of %i bytes with a toast and leaves the image alone", async (type, size, message) => {
    const onChange = vi.fn();
    render(<SequenceImageControls label="Ảnh" onChange={onChange} />);
    const file = new File(["x"], "a.img", { type });
    Object.defineProperty(file, "size", { value: size });

    fireEvent.change(screen.getByLabelText("Ảnh"), { target: { files: [file] } });

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(message));
    expect(onChange).not.toHaveBeenCalled();
  });
});
