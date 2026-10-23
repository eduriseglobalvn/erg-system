# Quiz Editor — UI/Flow Inventory

> Snapshot inventory of every visible control, section, and flow on `https://lcms.erg.edu.local:3001/quiz-editor`.

---

## 1. Global Shell (LCMS portal)

### 1.1 App header
- Chất lượng kết nối indicator (Mạng tốt)
- Tìm kiếm nhanh (⌘K)
- Ngôn ngữ switcher (VN)
- Trợ lý button
- Thông báo bell with badge (24)
- Thiết lập button
- User avatar “E” — ERG Super Admin

### 1.2 Sidebar navigation (relevant items)
- Giảng dạy section
  - Học viên
  - Khóa học
  - Lớp học
  - Buổi học
  - Bài tập
  - Bài tập & tài liệu
  - **Tạo Quiz** (active)
  - Quản lý học liệu

---

## 2. Quiz Editor Workspace

### 2.1 Top ribbon

| Button | Icon | Dropdown/Action |
|--------|------|-----------------|
| Câu hỏi | chevron-down | Add 14 question types |
| Nhóm câu hỏi | — | Add group |
| Giới thiệu | chevron-down | Add intro/user-info/instruction slide |
| Thuộc tính bài kiểm tra | — | Open right property panel |
| Giao diện player | — | Open player template dialog |
| Xem trước | — | Open preview dialog |
| Xuất bản | — | Open publish dialog |
| Quản lý kết quả | — | Open results dialog |

### 2.2 Left outline panel

- Header: “Quản lý câu hỏi” + quiz title
- Sort dropdown: “Sắp xếp câu hỏi theo Loại câu hỏi”
- Search box: “Tìm kiếm”
- Quiz title row
- Filter buttons (type + count):
  - Tất cả loại câu hỏi 15
  - Trang hướng dẫn 1
  - Chọn nhiều đáp án 1
  - Chọn một đáp án 1
  - Đúng / Sai 1
  - Kéo và thả 1
  - Nối cặp 1
  - Sắp xếp thứ tự 1
  - Điền vào chỗ trống 1
  - Chọn từ danh sách 1
  - Kéo từ 1
  - Điểm nóng 1
  - Trả lởi ngắn 1
  - Số học 1
  - Thang Likert 1
  - Tự luận 1

### 2.3 Manager table

Columns:
1. ID
2. Loại câu hỏi
3. Câu hỏi
4. Phản hồi
5. Nhóm
6. Điểm
7. Media
8. Chỉnh sửa

Header actions:
- Mở trình sửa
- Nhân bản
- Xóa

Rows: 15 slides (ID 1–15).

### 2.4 Status bar

- Slide counter: “Câu 4 trên 14”
- Quiz title
- Group count, question count, current group name

---

## 3. Introduction Slide Picker Dialog

Title: “Giới thiệu”
Options:
- Trang thông tin (Welcome icon)
- Thông tin ngườii dùng
- Trang hướng dẫn (! icon)
Actions: Áp dụng, Hủy

---

## 4. Quiz Properties Panel

### 4.1 Tabs
- Thông tin bài kiểm tra
- Cài đặt bài kiểm tra
- Kết quả bài kiểm tra
- Thiết lập câu hỏi
- Khác

### 4.2 Thông tin bài kiểm tra
- Player surface note
- Intro layout selector: Wave intro / Framed intro / Visual intro / Focus intro
- Organization text field (ERG Teacher Hub)
- Version text field (Version 1.0)
- Contributors text field

### 4.3 Cài đặt bài kiểm tra
- Điểm đạt — Tỷ lệ đạt
- Giới hạn thờii gian
- Xáo trộn
- Nộp bài

### 4.4 Kết quả bài kiểm tra
- Phản hồi radio group: Theo kết quả / Bất kể kết quả
- “Khi ngườii dùng đạt:” text field
- “Khi ngườii dùng chưa đạt:” text field
- Kết thúc checkboxes:
  - Hiển thị thống kê trên trang kết quả
  - Hiển thị nút hoàn tất trên trang kết quả
- Liên kết khi đạt / chưa đạt text fields
- Review button label (REVIEW QUIZ)
- Thank-you message (Thank you!)
- “Mở liên kết trong cửa sổ hiện tại” checkbox
- Live result preview panel (sidebar with table of contents)

### 4.5 Thiết lập câu hỏi
- Mặc định cho câu hỏi:
  - Điểm dương spinbutton (10)
  - Điểm âm spinbutton (0)
  - Trộn đáp án checkbox (checked)
  - Trộn câu hỏi checkbox
- Phông chữ mặc định:
  - Phông cho câu hỏi dropdown (Public Sans)
  - Phông cho đáp án dropdown (Public Sans)
- Phản hồi mặc định:
  - Phản hồi khi đúng (Chính xác!)
  - Phản hồi khi sai (Chưa đúng, hãy thử lại.)

### 4.6 Khác
- Bảo vệ bằng mật khẩu radios:
  - Không bảo vệ
  - Chỉ truy cập bằng mật khẩu
  - Truy cập bằng mã ngườii dùng và mật khẩu
  - Mật khẩu text field (disabled)
- Giới hạn truy cập theo domain — Domain text field
- Metadata trang:
  - Mô tả text field
  - Từ khóa text field

Actions: Áp dụng, Hủy

---

## 5. Question Editor Dialog

### 5.1 Header
- Title: “Trình biên tập câu hỏi”
- Breadcrumb: Nhóm / Loại câu hỏi
- Close button

### 5.2 Ribbon toolbar

| Group | Controls |
|-------|----------|
| Bảng tạm | Cắt, Sao chép, Dán |
| Phông chữ | Font family dropdown, font size dropdown, bold, italic, underline buttons |
| Điểm | Điểm spinbutton, Số lần làm spinbutton |
| Phản hồi | Phản hồi dropdown, Rẽ nhánh dropdown |
| Chèn | Hình ảnh, Ghi chú (disabled), Công thức (disabled), Âm thanh (disabled), Video (disabled) |
| Xem trước | Spell (disabled), Xem trước |

### 5.3 Canvas

- “Màn hình học sinh” label
- Live preview of selected question
- Tabs: Câu hỏi / Phản hồi đúng / Phản hồi sai
- Editable title textbox
- Editable choices/answer content
- Navigation buttons: Câu trước, Câu tiếp theo

### 5.4 Right sidebar (inspector)

Sections:
- Media và thiết lập
  - Thêm ảnh button
- Nội dung trả lởi
  - Choice list / Add step / Add choice
- Phản hồi và điểm
- Thiết lập câu hỏi
  - Checkboxes e.g. “Hiển thị hướng dẫn bài kiểm tra”

### 5.5 Footer
- Câu trước / Câu tiếp theo navigation
- Lưu / Hủy

---

## 6. Preview Dialog

- Title: “Xem trước”
- Device/player shell header: “ERG E-LEARNING — Màn hình học sinh”
- Question number / title
- Question content (observed: drag-drop food items)
- Tabs: Câu hỏi / Phản hồi đúng / Phản hồi sai
- Navigation: Câu trước / Câu tiếp theo
- Actions: Xong, Đóng

---

## 7. Key Flows

1. **Add question:** Ribbon → Câu hỏi → select type → new row appears in table → open editor.
2. **Edit question:** Click “Chỉnh sửa” in table → question editor dialog opens.
3. **Configure quiz:** Ribbon → Thuộc tính bài kiểm tra → right panel → tabs → apply.
4. **Preview quiz:** Ribbon → Xem trước → preview dialog.
5. **Publish quiz:** Ribbon → Xuất bản → publish dialog.
6. **Manage results:** Ribbon → Quản lý kết quả → results dialog.
7. **Reorder:** Not directly visible; assumed drag in table or outline.
8. **Delete/duplicate:** Select row → header buttons.

---

## 8. Disabled / Placeholder Features Observed

- Ghi chú insert
- Công thức insert
- Âm thanh insert
- Video insert
- Spell checker

These should be enabled or removed in the rebuild.
