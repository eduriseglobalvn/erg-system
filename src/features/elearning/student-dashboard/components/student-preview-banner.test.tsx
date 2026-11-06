import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { StudentPreviewBanner } from "./student-preview-banner";

it("shows the preview notice only in preview mode", () => {
  const { rerender } = render(<StudentPreviewBanner preview />);
  expect(screen.getByText("Bạn đang xem với tư cách giáo viên. Bài làm không được tính điểm.")).toBeTruthy();
  rerender(<StudentPreviewBanner preview={false} />);
  expect(screen.queryByText(/với tư cách giáo viên/)).toBeNull();
});
