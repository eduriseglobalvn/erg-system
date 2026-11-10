import { describe, expect, it } from "vitest";

import { studentPasswordError } from "./student-password-dialog";

describe("studentPasswordError", () => {
  it("asks for the current password, 8+ characters, a change and a matching confirmation", () => {
    expect(studentPasswordError("", "matkhau-moi", "matkhau-moi")).toBe("Nhập mật khẩu hiện tại.");
    expect(studentPasswordError("cu", "ngan", "ngan")).toBe("Mật khẩu mới cần ít nhất 8 ký tự.");
    expect(studentPasswordError("matkhau-cu", "matkhau-cu", "matkhau-cu")).toBe("Mật khẩu mới phải khác mật khẩu hiện tại.");
    expect(studentPasswordError("cu", "matkhau-moi", "matkhau-khac")).toBe("Xác nhận mật khẩu chưa khớp.");
    expect(studentPasswordError("cu", "matkhau-moi", "matkhau-moi")).toBeNull();
  });
});
