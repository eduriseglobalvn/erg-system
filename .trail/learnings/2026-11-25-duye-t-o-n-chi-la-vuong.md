---
title: Duyệt đơn chỉ làm ở portal admin; đơn nghỉ phép phải kèm file Word mới gửi được
author: Vuong
date: 2026-11-25
branch: fix/student-import-codes
cost: { minutes: 1, tokens: 2129 }
id: l-036aa34c
scope: repo
status: active
src: agent
touches:
  - src/features/timekeeping/components/requests/leave-request-form.tsx
  - src/features/lms/components/lms-teacher-shell-config.tsx
---

## Decided
Chủ dự án (25/11/2026): trang Duyệt đơn bị gỡ hẳn khỏi portal giáo viên, kể cả với người có quyền admin. Việc duyệt chỉ làm ở portal admin. Thông báo "Đơn chờ duyệt" vì vậy trỏ sang trang duyệt của admin.
Đơn nghỉ phép chỉ gửi duyệt được khi đã tải lên file Word (.doc/.docx) điền theo mẫu BM01-ĐXNP/ERG; lưu nháp thì chưa cần. Chỉ nhận Word, không nhận PDF hay ảnh.

## Tried and ruled out
Giữ trang duyệt ở portal giáo viên cho người chỉ có portal này (tổ trưởng, phó hiệu trưởng): chủ dự án chọn bỏ hẳn, nên người duyệt cần vào được portal admin.
Lưu file vào kho ảnh chấm công: kho đó chỉ phục vụ ảnh và không trả tên file, nên file đơn nằm ngay trong bảng đơn.

## Watch out
Sửa một đơn đang chờ sẽ tạo nháp mới, nháp mới chưa có file nên người dùng phải chọn lại file.
File tối đa 2 MB (giới hạn upload chung của backend).

In the code: `src/features/timekeeping/components/requests/leave-form-file.tsx`, `src/features/timekeeping/components/requests/leave-request-form.tsx`, `src/features/lms/components/lms-teacher-shell-config.tsx`, `public/forms/don-xin-nghi-phep.docx`; backend `V201__timekeeping_request_form.sql`, `RequestRules.checkForSubmit` (FORM_REQUIRED), `RequestNotifier.APPROVER_URL`.
