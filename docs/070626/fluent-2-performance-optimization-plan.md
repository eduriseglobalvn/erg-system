# Plan Tối Ưu LMS Load Nhanh Nhưng Vẫn Giữ Fluent 2

## Summary

- Mục tiêu: giữ visual theo Fluent 2 / Microsoft 365, nhưng không để toàn bộ app phải trả chi phí bundle và render quá lớn.
- Nguyên tắc chính: Fluent 2 là design language, không có nghĩa là mọi control nhỏ trong bảng đều phải dùng component Fluent/Radix nặng.
- Hướng tối ưu: giữ Fluent UI cho shell, theme, button, input, toolbar, form chính; dùng component nhẹ tự viết nhưng cùng token Fluent cho bảng lớn, dropdown trong cell, badge, pill, search, checkbox hàng loạt.

## Current Findings

- Source hiện có import Fluent UI thật qua `@fluentui/react-components`.
- `FluentProvider` đang được dùng ở app root thông qua `ErgFluentProvider`.
- Một số UI primitive hiện đã import trực tiếp Fluent component, ví dụ input, checkbox, dashboard kit và erg Fluent components.
- Build output hiện có nhiều chunk lớn, đáng chú ý:
  - PDF worker khoảng 2MB+.
  - Main `index` chunk khoảng 600KB+.
  - PDF viewer chunk khoảng 400KB+.
  - Brand mark / portal asset chunk khoảng 400KB+.
  - Schedule / calendar chunk khoảng 280KB+.
- Việc đổi gần như toàn bộ native select sang custom `AppSelect` làm UI đồng nhất hơn, nhưng có thể tăng runtime cost trong bảng lớn vì mỗi dropdown là một interactive tree nặng hơn native control.

## Key Changes

### 1. Giữ Fluent 2, Nhưng Tách Theme Và Component Nặng

- Vẫn giữ `@fluentui/react-components` và `FluentProvider` ở app root để dùng token, màu, typography, focus ring.
- Không import component Fluent tùy tiện trong shared component lớn nếu chỉ cần style đơn giản.
- Tạo lớp UI primitive nhẹ theo Fluent 2:
  - `LmsButton`
  - `LmsSearchInput`
  - `LmsSelect`
  - `LmsNativeSelect`
  - `LmsGradePill`
  - `LmsDataTable`
  - `LmsCheckbox`
- Các primitive này dùng CSS/token Fluent để nhìn đẹp, nhưng DOM nhẹ hơn cho bảng dày.

### 2. Lazy Load Mạnh Hơn Theo Route Và Feature

- Shell LMS chỉ tải nav/header/account và màn đang mở.
- Lazy-load các màn nặng trong teacher shell:
  - Giao bài tập.
  - Kho bài tập.
  - Nhóm học sinh.
  - Quản lý lớp học.
  - Resources/PDF viewer.
  - Schedule/FullCalendar.
- PDF worker chỉ tải khi người dùng thật sự mở PDF.
- FullCalendar chỉ tải khi vào lịch, không được dính vào bundle chung.
- Notification/detail/account pages nếu không phải first screen cũng lazy-load.

### 3. Tối Ưu Dropdown Theo Chiến Lược Fluent Hybrid

- Dropdown filter chính vẫn dùng custom đẹp:
  - Môn học.
  - Lớp.
  - Khối.
  - Nhóm.
  - Trạng thái.
  - Category.
- Dropdown trong bảng hoặc lặp nhiều dòng không dùng Radix/Fluent Select nặng.
- Cột `Xếp loại` dùng pill Fluent nhẹ:
  - A Giỏi: xanh lá.
  - B Khá: xanh dương.
  - C Trung bình: vàng.
  - D Yếu: cam.
  - E Kém: đỏ.
- Nếu cần đổi xếp loại trong bảng:
  - Hiển thị pill ở giữa cell.
  - Có icon chevron nhỏ, clean.
  - Menu chỉ mount khi click, không render sẵn cho mọi row.
- Kết quả mong muốn: UI vẫn đẹp như Fluent, nhưng bảng không lag.

### 4. Chuẩn Hóa Search Input Một Lần Cho Toàn Source

- Dùng một component search duy nhất cho toàn app.
- Icon search và text nằm cùng một flex row, tránh absolute positioning gây lệch.
- Height thống nhất `32px` hoặc `36px`.
- Icon cách chữ khoảng `8px`.
- Không dùng selector global phức tạp để sửa từng trường hợp.
- Toàn bộ search ở LMS, CRM, LCMS, admin dùng lại component này.

### 5. Giảm CSS Gây Chậm Render

- Hạn chế global CSS kiểu `:has()` hoặc selector quá rộng quét toàn DOM.
- Chuyển sang class rõ ràng:
  - `.erg-search-control`
  - `.erg-select-control`
  - `.erg-table`
  - `.erg-grade-pill`
- CSS theo component, không sửa UI bằng selector lan toàn app.
- Giữ border/radius/shadow theo Fluent 2:
  - Radius `6-8px`.
  - Border nhẹ.
  - Shadow rất ít.
  - Hover tinh tế.

### 6. Tối Ưu Data Table Và Popup

- Bảng lớn cần component riêng:
  - Header sticky nhẹ.
  - Row height ổn định `36-40px`.
  - Cell không render component nặng nếu chỉ hiển thị text/badge.
  - Checkbox nhẹ, click đúng checkbox mới select.
- Popup danh sách học sinh/lớp/nhóm:
  - Không render sẵn tất cả popup.
  - Chỉ tạo popup khi click.
  - Title sticky, body scroll riêng.
  - Nội dung bảng có thể virtualize nếu danh sách dài.
- Các row/cell có action hoặc trạng thái nên memoize để tránh re-render toàn bảng.

### 7. Kiểm Soát Bundle Sau Mỗi Đợt Sửa

- Thêm hoặc dùng bundle analyzer để xem:
  - `index` chunk còn bao nhiêu.
  - Fluent UI chiếm bao nhiêu.
  - Radix Select chiếm bao nhiêu.
  - PDF/Calendar có bị kéo vào first load không.
- Mục tiêu thực tế:
  - First route không kéo PDF worker.
  - First route không kéo FullCalendar nếu không vào lịch.
  - LMS shell hiện nhanh trước, content màn nặng tải sau.
  - Các chunk theo route rõ ràng, không gom quá nhiều vào `index`.

## Implementation Order

1. Audit bundle hiện tại và ghi baseline.
2. Lazy-load lại LMS teacher shell và các feature nặng.
3. Tạo bộ primitive Fluent-light dùng chung cho search, select nhẹ, grade pill, table.
4. Thay dropdown lặp trong bảng bằng control nhẹ.
5. Tối ưu PDF/resource/calendar để chỉ load khi cần.
6. Dọn CSS global gây ảnh hưởng toàn app.
7. Chạy build, đo lại bundle, kiểm tra visual từng route.

## Test Plan

- Chạy:
  - `bun run typecheck`
  - `bun run build`
- Kiểm tra bundle:
  - So sánh asset size trước/sau.
  - Đảm bảo PDF worker không nằm ở first load.
  - Đảm bảo schedule/calendar không load ngoài route lịch.
- Kiểm tra browser:
  - `/homework`
  - `/homework/assign`
  - `/classes`
  - `/score`
  - `/attendance`
  - `/class-log`
  - `/resources`
- Kiểm tra mạng yếu:
  - Fast 3G hoặc Slow 4G.
  - CPU throttle `4x`.
  - Shell/menu phải hiện trước, không đợi PDF/calendar.
- Kiểm tra UI:
  - Search icon không lệch.
  - Dropdown chính vẫn đẹp.
  - Xếp loại đẹp, màu rõ, canh giữa.
  - Bảng không giật khi scroll.
  - Popup title không bị kéo mất.
  - Checkbox chỉ chọn khi click checkbox.

## Assumptions

- Vẫn dùng Fluent 2 làm visual system chính.
- Không gỡ `@fluentui/react-components`.
- Không quay về UI native thô toàn app.
- Ưu tiên tốc độ tải và độ mượt ở bảng lớn bằng cách dùng component nhẹ cùng style Fluent.
- Không đổi logic nghiệp vụ, chỉ tối ưu kiến trúc UI, bundle, render và CSS.
