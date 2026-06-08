# Kế Hoạch Responsive Mobile & PWA Cho LMS

Ngày lập: 08/06/2026  
Phạm vi: `src/features/lms`, LMS teacher portal, các màn giáo viên dùng hằng ngày trên mobile/PWA.  
Nguồn tham chiếu nội bộ: `responsive-design`, `react-pwa-designer`, `erg-system-ui`, source LMS hiện tại.

## 1. Mục Tiêu

Biến LMS hiện tại từ một web dashboard desktop-first thành trải nghiệm **mobile-first PWA** dùng được như app giáo viên trên điện thoại, nhưng vẫn giữ desktop/tablet mạnh cho các màn cần dữ liệu dày như bảng điểm, điểm danh, tài nguyên, lịch dạy.

Mục tiêu không phải là ép toàn bộ desktop UI co xuống mobile. Với LMS, mobile phải có cách nhìn riêng:

- Điều hướng chính bằng bottom navigation/dock, giống app native.
- Header gọn, chỉ giữ context quan trọng: trường, lớp, tài khoản/thông báo.
- Calendar tham khảo Google Calendar: day/agenda/week rõ ràng, thao tác nhanh, event bottom sheet.
- Bảng điểm và điểm danh tham khảo Google Sheets: grid có frozen row/column, horizontal scroll có kiểm soát, cell focus rõ, toolbar compact.
- Các flow như giao bài, tài nguyên, sổ đầu bài phải chuyển thành wizard/list/detail/bottom sheet thay vì bảng lớn nguyên khối.
- PWA phải có manifest, install prompt, service worker, offline shell, cache strategy, safe-area handling.

## 2. Hiện Trạng Source LMS

### 2.1 Shell LMS

File chính: `src/features/lms/components/lms-teacher-shell.tsx`.

Hiện tại shell là desktop/tablet oriented:

- Root dùng `h-screen max-h-screen overflow-hidden`.
- Header sticky cao `h-16`.
- Desktop nav ngang chỉ hiện từ `xl`.
- Dưới `xl` đang dùng một hàng nav scroll ngang ở header.
- School select ẩn dưới `lg`; class select vẫn hiện.
- Main có chế độ `overflow-hidden` cho các màn như assign, exercise bank, progress, class.
- Các route LMS đã lazy load: homework, score, attendance, schedule, classLog, resources, reports, account, notifications.

Vấn đề mobile:

- Top nav scroll ngang không đủ “app-like”, khó dùng một tay.
- Header chiếm nhiều vertical space nếu cộng nav phụ.
- Chưa xử lý rõ `100dvh`, safe area, iOS address bar.
- Chưa có bottom nav/dock.
- Chưa có mobile-first route shell riêng cho PWA.

### 2.2 Bảng Điểm

File chính: `src/features/lms/components/score-sheet-panel.tsx`.

Điểm mạnh hiện tại:

- Dùng TanStack Table.
- Có `useVirtualList`.
- Có sticky columns.
- Có search debounce.
- Có context menu, drawer học sinh, dialog đổi xếp loại.
- Có width tính bằng `clamp`.

Vấn đề mobile:

- Table vẫn có width rất lớn, logic sticky `left` cố định theo desktop.
- Context menu dùng tọa độ chuột, không phù hợp touch.
- Popup hover xem lịch sử không phù hợp mobile.
- Input trong cell nhỏ, touch target chưa đủ 44px.
- Toolbar có nhiều control cùng hàng.
- Cần chế độ Google Sheets/mobile spreadsheet riêng.

### 2.3 Điểm Danh

File chính: `src/features/lms/components/attendance-sheet-panel.tsx`.

Điểm mạnh hiện tại:

- Có TanStack Table, virtualization.
- Có date focus.
- Có export Excel.
- Có split pane giữa bảng điểm danh và curriculum distribution.
- Có sticky columns.
- Có disabled future date.
- Có context menu và drawer học sinh.

Vấn đề mobile:

- Split pane không hợp mobile.
- Bảng `min-w-[920px]`, curriculum panel table dài.
- Resize pane bằng pointer desktop không cần trên mobile.
- Trạng thái điểm danh cần thao tác cực nhanh bằng ngón tay, không nên buộc zoom/scroll quá nhiều.
- Cần các mode riêng: `Hôm nay`, `Tuần`, `Theo học sinh`, `Chương trình`.

### 2.4 Calendar / Lịch Dạy

Files chính:

- `src/features/lms/components/teaching-schedule/teaching-schedule-panel.tsx`
- `src/features/lms/components/teaching-schedule/teaching-schedule-calendar.tsx`
- `src/index.css`

Điểm mạnh hiện tại:

- Đã mô phỏng Google Calendar khá tốt.
- Có FullCalendar với day/week/month/year.
- Có top bar, view menu, sidebar filter, mini month.
- Sidebar ẩn dưới `lg`.
- CSS calendar đã có media query dưới `920px`.

Vấn đề mobile:

- FullCalendar week grid trên điện thoại rất dễ chật.
- Quick event popover fixed desktop chưa hợp touch.
- Create/edit dialog cần chuyển bottom sheet.
- Sidebar filter ẩn nhưng chưa có mobile replacement rõ.
- Cần default mobile view là `timeGridDay` hoặc agenda list, không phải week.

### 2.5 Giao Bài

File chính: `src/features/lms/components/assign-homework-page.tsx`.

Hiện tại:

- Step 1 thiết lập bài, chọn đối tượng.
- Step 2 chọn tài nguyên.
- Nhiều table lớn: lớp, nhóm, học sinh, tài nguyên.
- Có modal preview lớp/nhóm fixed desktop.
- Footer riêng.

Vấn đề mobile:

- Form setup đang grid desktop.
- Bảng học sinh/tài nguyên quá rộng.
- Modal preview nên thành bottom sheet hoặc full-screen sheet.
- Footer phải sticky bottom, tính safe area.
- Flow nên giống wizard native: `Thiết lập -> Đối tượng -> Tài nguyên -> Xác nhận`.

### 2.6 Tài Nguyên Học Tập

File chính: `src/features/lms/learning-resources/components/learning-resource-library-page.tsx`.

Hiện tại:

- Explorer kiểu Windows: tree trái, breadcrumb, grid/list, status bar.
- Resource viewer modal.
- PDF/slide viewer có phần điều khiển.

Vấn đề mobile:

- Tree + breadcrumb + list desktop không phù hợp mobile.
- Cần drill-down navigation theo folder.
- Search và filter phải nổi bật.
- Viewer cần full-screen, gesture-friendly.
- PDF/slide nên cache có chọn lọc, không cache bừa toàn bộ.

### 2.7 Sổ Đầu Bài, Class, Reports, Logs

Các file liên quan:

- `src/features/lms/weekly-class-log/components/weekly-class-log-page.tsx`
- `src/features/lms/classroom/components/class-management-page.tsx`
- `src/features/lms/classroom/components/class-students-table.tsx`
- `src/features/lms/components/homework-progress-page.tsx`
- `src/features/lms/components/exercise-bank-page.tsx`
- `src/features/lms/components/lms-login-logs-page.tsx`

Đặc điểm chung:

- Nhiều table `erg-data-table`.
- Nhiều `min-w` từ 880px đến 1650px.
- Desktop đang hợp lý cho dữ liệu dày, nhưng mobile cần view thay thế.

## 3. Nguyên Tắc Thiết Kế Mobile/PWA

### 3.1 Không Thu Nhỏ Desktop

Mobile LMS phải có thông tin ưu tiên khác desktop:

- Desktop: so sánh nhiều cột, thao tác batch, xem overview rộng.
- Mobile: xử lý nhanh một lớp, một ngày, một học sinh, một bài, một event.

Do đó mỗi màn cần có `mobile view model`, không chỉ thêm `overflow-x-auto`.

### 3.2 Breakpoint Chiến Lược

Áp dụng mobile-first:

- Base: mobile portrait `<640px`.
- `sm >= 640px`: phone ngang/small tablet.
- `md >= 768px`: tablet portrait.
- `lg >= 1024px`: tablet landscape/laptop.
- `xl >= 1280px`: desktop LMS hiện tại.

Với component phức tạp, ưu tiên container query:

- Table toolbar tự đổi layout theo container width.
- Card/list item tự đổi density theo parent.
- Resource explorer grid tự đổi số cột bằng `auto-fit/minmax`.

Không hardcode theo thiết bị. Breakpoint phải dựa vào lúc layout bắt đầu vỡ.

### 3.3 Mobile App Chrome

Cho PWA:

- Root shell dùng `min-height: 100dvh`, không dùng `100vh` cho mobile.
- Có `padding-bottom: env(safe-area-inset-bottom)`.
- Bottom nav/dock cao khoảng 64-72px, cộng safe area.
- Main content có bottom padding để không bị dock che.
- Header mobile cao 52-56px, chỉ chứa logo/context/action chính.
- Tránh modal nhỏ ở giữa màn hình; mobile ưu tiên full-screen sheet hoặc bottom sheet.

### 3.4 Touch Target

- Nút chính: tối thiểu 44x44px.
- Cell có thể tap: tối thiểu 40px, tốt nhất 44px ở mobile.
- Icon-only button: 44x44px, có `aria-label`.
- Checkbox/radio trong list: vùng click cả row, không chỉ ô 18px.
- Cell bảng điểm/điểm danh cần active/focus state rất rõ.

## 4. Kiến Trúc Đề Xuất

### 4.1 Tạo LMS Mobile/PWA Layer Theo Feature-First

Không nhét toàn bộ responsive logic vào file hiện tại. Đề xuất thêm:

```text
src/features/lms/mobile/
├── components/
│   ├── lms-mobile-shell.tsx
│   ├── lms-bottom-dock.tsx
│   ├── lms-mobile-top-bar.tsx
│   ├── lms-scope-sheet.tsx
│   ├── mobile-bottom-sheet.tsx
│   └── mobile-segmented-tabs.tsx
├── hooks/
│   ├── use-lms-mobile-breakpoint.ts
│   ├── use-safe-area.ts
│   └── use-install-prompt.ts
├── pwa/
│   ├── lms-pwa-cache-policy.ts
│   └── lms-offline-state.ts
└── index.ts
```

Mỗi màn nặng có mobile component riêng:

```text
src/features/lms/components/score/mobile-score-sheet-panel.tsx
src/features/lms/components/attendance/mobile-attendance-sheet-panel.tsx
src/features/lms/components/teaching-schedule/mobile-teaching-schedule-panel.tsx
src/features/lms/components/homework/mobile-assign-homework-page.tsx
src/features/lms/learning-resources/components/mobile-learning-resource-library-page.tsx
```

Nếu chưa muốn tách folder ngay, có thể đặt mobile component cạnh file hiện tại. Nhưng không nên để một file 900 dòng phình thành 1500 dòng.

### 4.2 Điều Hướng Bottom Dock

Ảnh user đưa có dock bo tròn với 5 icon. LMS có 7 section, không nên nhồi hết 7 vào dock. Đề xuất:

Dock mobile gồm 5 mục chính:

1. `Home/Bài tập` - icon `Home` hoặc `ClipboardList`.
2. `Điểm` - icon `GraduationCap`.
3. `Điểm danh` - icon `CalendarCheck`.
4. `Lịch` - icon `CalendarDays`.
5. `Thêm` - icon `CircleUserRound` hoặc `Grid3X3/Menu`.

Trong `Thêm` mở bottom sheet:

- Sổ đầu bài.
- Tài nguyên.
- Báo cáo.
- Tài khoản.
- Thông báo.
- Đăng xuất.

Lý do:

- 5 item là ngưỡng tốt cho bottom nav một tay.
- Các màn dùng nhiều hằng ngày giữ ở dock.
- Màn ít dùng hơn chuyển vào sheet, tránh dock quá chật.

Visual:

- Dock fixed bottom, pill shape, background `#1f2433` hoặc token dark-surface riêng.
- Active icon dùng ERG blue hoặc yellow-green như ảnh nếu muốn app-like hơn, nhưng phải kiểm tra contrast.
- Dock có shadow nhẹ, không orb/gradient.
- Label có thể ẩn ở width nhỏ, hiện label ngắn ở `sm`.
- Safe area: `bottom: max(12px, env(safe-area-inset-bottom))`.

### 4.3 Mobile Top Bar

Top bar mobile nên có:

- Logo nhỏ hoặc title màn hiện tại.
- Scope compact: class name là chính, school nằm trong subtitle hoặc scope sheet.
- Notification icon.
- Avatar/account.

School/class select không nên chiếm header. Thay bằng:

- Button scope: `6A1 · ERG Alpha`.
- Tap mở `LmsScopeSheet` bottom sheet.
- Trong sheet có search/select trường/lớp, gần đây, lớp đang dạy hôm nay.

### 4.4 Preserve Desktop

Không phá desktop:

- Desktop `xl` tiếp tục dùng `LmsTeacherShell` hiện tại.
- Mobile/tablet có thể dùng conditional render:
  - `LmsTeacherShell` nhận `isMobile`.
  - Hoặc tạo `LmsTeacherResponsiveShell` chọn giữa desktop shell và mobile shell.
- Route và data provider dùng chung.
- Query bootstrap giữ `staleTime: 5 phút`, `gcTime: 30 phút`.

## 5. Kế Hoạch PWA

### 5.1 Cài Nền PWA

Hiện repo chưa có `vite-plugin-pwa`, chưa thấy service worker hoặc web manifest đầy đủ. Cần thêm:

- `vite-plugin-pwa`.
- `public/manifest.webmanifest` hoặc cấu hình manifest trong Vite.
- Icons: 192x192, 512x512, maskable icons.
- Apple touch icon.
- Meta:
  - `theme-color`.
  - `apple-mobile-web-app-capable`.
  - `apple-mobile-web-app-status-bar-style`.
  - `mobile-web-app-capable`.

Manifest đề xuất:

```json
{
  "name": "ERG LMS",
  "short_name": "ERG LMS",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#0f6cbd",
  "background_color": "#f8fafc",
  "start_url": "/homework?source=pwa",
  "scope": "/",
  "categories": ["education", "productivity"]
}
```

Manifest production nên bổ sung thêm các field sau:

- `description`: mô tả rõ đây là app LMS cho giáo viên ERG.
- `lang`: `vi-VN`.
- `dir`: `ltr`.
- `id`: nên ổn định, ví dụ `/lms`.
- `screenshots`: ít nhất một desktop và một mobile screenshot để tăng chất lượng install listing.
- `shortcuts`: các lối tắt PWA cho màn dùng nhiều:
  - `Bài tập`: `/homework`.
  - `Điểm danh`: `/attendance`.
  - `Bảng điểm`: `/score`.
  - `Lịch`: `/calendar`.

Ví dụ shortcut:

```json
{
  "name": "Điểm danh",
  "short_name": "Điểm danh",
  "description": "Mở nhanh màn điểm danh lớp học",
  "url": "/attendance?source=pwa-shortcut",
  "icons": [{ "src": "/icons/shortcut-attendance-96x96.png", "sizes": "96x96", "type": "image/png" }]
}
```

### 5.2 Icon Validation Bắt Buộc

Theo `react-pwa-designer`, icon sai kích thước thật là nguyên nhân phổ biến nhất làm PWA không install được mà không có lỗi rõ ràng.

Icon tối thiểu bắt buộc:

- `android-chrome-192x192.png`: đúng 192x192.
- `android-chrome-512x512.png`: đúng 512x512.
- `apple-touch-icon.png`: đúng 180x180.

Icon khuyến nghị:

- `favicon-16x16.png`: 16x16.
- `favicon-32x32.png`: 32x32.
- `icon-72x72.png`, `icon-96x96.png`, `icon-128x128.png`, `icon-144x144.png`, `icon-152x152.png`, `icon-384x384.png`.

Quy tắc:

- Dùng PNG cho PWA icons. Không dùng JPG/GIF/SVG cho manifest icons.
- Manifest `sizes` phải khớp đúng kích thước pixel thật.
- Icon maskable phải giữ nội dung quan trọng trong safe zone trung tâm khoảng 80%.
- File nằm trong `public/` để Vite copy ra root `dist`.
- Không tin tên file. Phải verify kích thước thật trước deploy.

Lệnh kiểm tra:

```bash
file public/android-chrome-192x192.png
file public/android-chrome-512x512.png
file public/apple-touch-icon.png
```

Nếu có ImageMagick:

```bash
identify public/android-chrome-192x192.png
identify public/android-chrome-512x512.png
identify public/apple-touch-icon.png
```

Kỳ vọng:

- `192 x 192` cho Android 192.
- `512 x 512` cho Android 512.
- `180 x 180` cho Apple touch icon.

Nếu kích thước không khớp, Chrome/Edge/Samsung Internet có thể không hiện install prompt dù manifest nhìn có vẻ đúng.

### 5.3 Service Worker Strategy

Không cache tùy tiện tất cả API vì LMS có dữ liệu điểm danh/điểm số nhạy và thay đổi nhanh.

Đề xuất:

- App shell/assets: `CacheFirst` với revision từ build.
- Route shell: `NetworkFirst` fallback offline page.
- Bootstrap/navigation config: `NetworkFirst`, timeout ngắn, fallback cache cũ có cảnh báo.
- Static learning resources metadata: `StaleWhileRevalidate`.
- PDF/slide/video: cache opt-in, không tự động cache toàn bộ.
- Mutations điểm danh/bảng điểm/giao bài: network-only ở phase đầu.
- Offline queue chỉ làm sau khi có backend idempotency/version conflict.

Với Vite PWA plugin, cấu hình hướng đề xuất:

```ts
VitePWA({
  registerType: "autoUpdate",
  includeAssets: [
    "favicon.ico",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png"
  ],
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    navigateFallback: "/offline.html",
    navigateFallbackDenylist: [/^\/api\//],
    runtimeCaching: [
      {
        urlPattern: /^\/api\/lms\/bootstrap/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "lms-bootstrap",
          networkTimeoutSeconds: 3,
          expiration: { maxEntries: 20, maxAgeSeconds: 5 * 60 }
        }
      },
      {
        urlPattern: /^\/api\/lms\/learning-resources/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "lms-resource-catalog",
          expiration: { maxEntries: 80, maxAgeSeconds: 30 * 60 }
        }
      }
    ]
  }
})
```

Lưu ý quan trọng:

- Không copy nguyên cấu hình `api-cache` một giờ cho toàn bộ `/api`, vì score/attendance/progress có thể bị stale nguy hiểm.
- Runtime caching phải phân loại endpoint theo nghiệp vụ.
- `navigateFallbackDenylist` phải loại `/api` để API lỗi không trả về HTML offline page.
- Service worker phải có fetch handler; nếu không Chrome sẽ báo “page does not work offline”.

### 5.4 Phân Loại Runtime Caching Theo Endpoint

Đề xuất policy:

| Nhóm request | Strategy | TTL | Lý do |
|---|---:|---:|---|
| JS/CSS/assets build | precache / CacheFirst | theo revision build | An toàn, có hash |
| Font local/woff2 | CacheFirst | 1 năm | Ít đổi |
| LMS bootstrap/scope/nav | NetworkFirst | 5 phút | Cần nhanh nhưng không quá stale |
| Calendar events | NetworkFirst | 1-5 phút | Có thay đổi nhưng mobile cần resume |
| Homework list/progress | NetworkFirst | 30-60 giây | Dữ liệu hoạt động thay đổi |
| Learning resource catalog | StaleWhileRevalidate | 5-30 phút | Metadata ít đổi |
| PDF/slide/video resource | CacheFirst opt-in | theo version/hash | Chỉ cache khi user chọn lưu offline |
| Score sheet | NetworkOnly hoặc NetworkFirst TTL rất thấp | 0-30 giây | Dữ liệu nhạy |
| Attendance current day | NetworkOnly hoặc NetworkFirst TTL rất thấp | 0-15 giây | Dữ liệu nhạy |
| Mutations | NetworkOnly | không cache | Tránh ghi nhầm |
| Auth/token/role | NetworkOnly/no-store | không cache | Bảo mật |
| Login logs/audit | NetworkOnly/no-store | không cache | Bảo mật |

### 5.5 Offline UX

Offline phase 1:

- App mở được.
- Hiển thị shell, cached last-known data cho navigation/bootstrap nếu có.
- Các màn nhập liệu nhạy hiện read-only hoặc cảnh báo “Đang offline, chưa thể lưu”.
- Tài nguyên đã cache có thể mở.
- Có banner nhỏ: `Đang offline · dữ liệu có thể chưa mới`.

Offline phase 2:

- Cho phép điểm danh offline nếu backend hỗ trợ:
  - client mutation id.
  - version/revision.
  - conflict detection.
  - retry queue.
  - audit log.

Không nên làm offline mutation cho điểm số trước khi có cơ chế conflict thật.

### 5.6 Offline Storage Và IndexedDB

LocalStorage không đủ cho PWA LMS. Nếu cần lưu dữ liệu offline, dùng IndexedDB qua wrapper rõ ràng.

Đề xuất object stores:

- `lmsLastKnownBootstrap`: dữ liệu shell/scope cuối cùng.
- `lmsResourceCatalog`: metadata học liệu theo version.
- `lmsSavedResources`: tài nguyên user chọn lưu offline, có hash/version.
- `lmsDrafts`: draft giao bài/form chưa submit.
- `lmsMutationQueue`: chỉ dùng phase 2 khi backend hỗ trợ conflict.

Quy tắc:

- Không lưu token access dài hạn vào IndexedDB cho service worker đọc.
- Không lưu điểm số/điểm danh offline dưới dạng mutation queue nếu chưa có idempotency.
- Dữ liệu offline phải có `updatedAt`, `scopeId`, `userId`, `version`.
- Khi user đổi tài khoản hoặc scope, clear hoặc partition cache theo account/scope.

### 5.7 Install Prompt

Tạo hook `useInstallPrompt`:

- Bắt `beforeinstallprompt`.
- Hiển thị banner nhẹ trong LMS mobile sau vài lần dùng.
- Không chặn workflow.
- Có action `Cài app ERG LMS`.
- Nếu iOS Safari, hiện hướng dẫn Add to Home Screen bằng sheet ngắn.

Điều kiện thực tế:

- Chrome/Edge chỉ phát `beforeinstallprompt` khi app đủ installability.
- User thường phải ở lại trang khoảng 30 giây và có tương tác.
- Nếu app đã installed hoặc mở trong incognito, prompt có thể không xuất hiện.
- iOS không có automatic install prompt; chỉ hướng dẫn Share -> Add to Home Screen.

Hook nên trả về:

- `canInstall`.
- `isInstalled`.
- `promptInstall`.
- `platform`: `android`, `ios`, `desktop`, `unknown`.

### 5.8 Service Worker Update UX

PWA production phải có update prompt, vì service worker có thể giữ bản cũ.

Đề xuất:

- `registerType: "autoUpdate"` cho phase đầu nếu không muốn user tự xử lý nhiều.
- Vẫn nên có banner khi có bản mới:
  - `Có phiên bản LMS mới`.
  - Action: `Cập nhật`.
  - Sau khi update: reload có kiểm soát.
- Không reload tự động khi giáo viên đang nhập điểm/điểm danh/giao bài.
- Nếu đang có dirty form/cell edits, trì hoãn update hoặc yêu cầu xác nhận.

Checklist update:

- Service worker file không bị CDN/browser cache lâu.
- `index.html`, `manifest.json`, service worker dùng `Cache-Control: no-cache`.
- Asset hash build dùng cache dài.
- Khi deploy mới, old caches được cleanup.

### 5.9 HTTPS, Scope Và Hosting

PWA yêu cầu HTTPS ngoài localhost.

Repo hiện dev server có HTTPS nếu tồn tại `certs/erg-dev.pfx`, còn production phải đảm bảo:

- HTTPS hợp lệ.
- Không mixed content.
- Manifest served đúng MIME type: `application/manifest+json` hoặc `application/json`.
- Service worker served từ root hoặc scope đúng.
- Nếu muốn scope toàn app là `/`, service worker phải ở root.
- `start_url` phải nằm trong `scope`.

Cache headers đề xuất:

```text
/assets/*              Cache-Control: public, max-age=31536000, immutable
/index.html            Cache-Control: no-cache
/manifest.webmanifest  Cache-Control: no-cache
/sw.js                 Cache-Control: no-cache, no-store, must-revalidate
/workbox-*.js          Cache-Control: no-cache
```

### 5.10 PWA Troubleshooting Checklist

Nếu install prompt không hiện, kiểm tra theo thứ tự:

1. App có chạy HTTPS hoặc localhost không?
2. Manifest load được không?
3. Manifest có `name`, `short_name`, `start_url`, `display: standalone`, `icons` không?
4. `prefer_related_applications` có bị set `true` không? Nếu có, bỏ.
5. Icon 192/512 có đúng kích thước thật không?
6. Service worker có registered và active không?
7. Service worker có fetch handler không?
8. User đã tương tác/ở trang đủ lâu chưa?
9. App đã installed trước đó chưa?
10. DevTools Application -> Manifest -> Installability báo gì?

Diagnostic script có thể chạy trong console:

```js
(async () => {
  const checks = [];
  checks.push({ name: "HTTPS", pass: location.protocol === "https:" || location.hostname === "localhost", value: location.protocol });
  try {
    const manifestResp = await fetch("/manifest.webmanifest").catch(() => fetch("/manifest.json"));
    const manifest = await manifestResp.json();
    checks.push({ name: "Manifest loads", pass: manifestResp.ok, value: manifestResp.status });
    checks.push({ name: "Manifest has name", pass: Boolean(manifest.name), value: manifest.name });
    checks.push({ name: "Manifest has icons", pass: (manifest.icons?.length ?? 0) >= 2, value: `${manifest.icons?.length ?? 0} icons` });
  } catch (error) {
    checks.push({ name: "Manifest", pass: false, value: error.message });
  }
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    checks.push({ name: "SW registered", pass: Boolean(reg), value: reg?.scope || "Not registered" });
    checks.push({ name: "SW active", pass: Boolean(reg?.active), value: reg?.active?.state || "Not active" });
  } else {
    checks.push({ name: "SW supported", pass: false, value: "Not supported" });
  }
  console.table(checks);
})();
```

### 5.11 Lighthouse Và Mục Tiêu Chất Lượng PWA

Mục tiêu production:

- Lighthouse PWA: 100.
- Accessibility: 100 hoặc càng gần 100 càng tốt.
- Best Practices: >95.
- Performance mobile: >90 nếu dữ liệu mock/asset hợp lý.
- LCP: <2.5s.
- INP: <200ms; nếu theo checklist cũ dùng FID thì <100ms.
- CLS: <0.1.

Các route cần audit riêng:

- `/homework`.
- `/attendance`.
- `/score`.
- `/calendar`.
- `/resources`.

Không chỉ audit trang login/home. Route bảng điểm/điểm danh mới là nơi rủi ro performance thật.

## 6. Thiết Kế Mobile Theo Màn

### 6.1 Homework / Bài Tập

Desktop hiện có bảng assignment lớn và floating menu. Mobile nên đổi thành:

- Feed/list card theo bài tập.
- Mỗi card hiển thị:
  - Tên bài.
  - Môn.
  - Lớp/đối tượng.
  - Trạng thái.
  - Hạn nộp.
  - Tiến độ nộp/chấm.
- Filter/search ở top sticky hoặc collapsible.
- Primary FAB hoặc dock action: `Giao bài`.
- Swipe action không bắt buộc; nếu dùng phải có fallback menu.

Các action:

- Tap card mở detail/progress.
- More menu mở: xem tiến độ, sửa, kết thúc, sao chép, xuất báo cáo.
- Filter sheet: môn, lớp, trạng thái, thời gian.

Không nên:

- Hiển thị table assignment 8 cột trên mobile.
- Dùng horizontal scroll cho màn danh sách bài tập chính.

### 6.2 Assign Homework / Giao Bài

Mobile flow nên là wizard 4 bước:

1. `Thiết lập`: tên bài, môn, số lần làm, thời lượng, ngày bắt đầu/kết thúc.
2. `Đối tượng`: giao theo lớp/khối/nhóm; chọn học sinh bằng searchable checklist.
3. `Tài nguyên`: list tài nguyên, search/filter, preview.
4. `Xác nhận`: tổng kết, số lớp/học sinh, thời gian, tài nguyên, nút giao bài.

UI:

- Header wizard có back + title + step indicator.
- Footer sticky bottom có `Tiếp tục` / `Giao bài`, safe area.
- Date picker nên dùng native input hoặc bottom sheet picker.
- Preview lớp/nhóm chuyển thành full-screen sheet.
- Student selection dùng list row, checkbox area 44px, search sticky.

### 6.3 Score Sheet / Bảng Điểm

Mục tiêu: giống Google Sheets trên mobile, nhưng ít cột hơn lúc đầu.

Đề xuất 3 chế độ:

1. `Sheet`: grid ngang có frozen student column.
2. `Học sinh`: xem/chỉnh điểm theo từng học sinh.
3. `Cột điểm`: xem/chỉnh một bài/chủ đề cho toàn lớp.

Default mobile:

- Nếu width `<640px`, mở chế độ `Học sinh` hoặc `Cột điểm` tùy route state.
- Có nút chuyển `Sheet / Học sinh / Cột`.

Sheet mode:

- Frozen left column: tên học sinh.
- Header row sticky.
- Horizontal scroll như Google Sheets.
- Cell tap mở bottom sheet edit score/history.
- Long press mở action sheet, thay cho context menu chuột.
- Hover popup lịch sử đổi thành tap sheet `Lịch sử điểm`.
- Offline/manual score có dirty state rõ.

Student mode:

- Danh sách học sinh dạng card compact.
- Tap học sinh mở detail:
  - Tổng điểm.
  - Xếp loại.
  - Danh sách chủ đề/bài.
  - Điểm offline/bonus.
  - Lịch sử.

Column mode:

- Chọn cột điểm bằng horizontal chips/dropdown.
- List học sinh + input điểm.
- Save bar sticky bottom.

Performance:

- Giữ virtualization.
- Không render popup cho từng cell.
- Cell editor mount một instance duy nhất.
- Debounce search.
- Không invalidate toàn bộ bảng sau từng cell nếu có batch save.

### 6.4 Attendance / Điểm Danh

Mobile nên ưu tiên tốc độ điểm danh trong lớp.

Đề xuất 4 tab:

1. `Hôm nay`: danh sách học sinh + trạng thái nhanh.
2. `Tuần`: grid nhỏ theo ngày/tiết, Google Sheets style.
3. `Học sinh`: lịch sử điểm danh theo từng học sinh.
4. `Chương trình`: curriculum distribution.

Default mobile: `Hôm nay`.

Hôm nay mode:

- Header: lớp, ngày, tiết, môn.
- List học sinh:
  - Tên.
  - Badge tổng vắng.
  - Segmented status: Có mặt / Muộn / Vắng / Phép.
- Tap status đổi nhanh.
- Bulk actions ở top/bottom sheet:
  - Tất cả có mặt.
  - Lọc chưa điểm danh.
  - Xuất Excel.

Tuần mode:

- Frozen student column.
- Hiện 3-5 ngày quanh ngày focus.
- Cell 44px ở mobile.
- Horizontal scroll có shadow edge.
- Future date disabled.

Chương trình:

- Không đặt cạnh split pane trên mobile.
- Chuyển thành tab hoặc bottom sheet.
- Hiển thị timeline/list theo tiết, current lesson nổi bật.

Context menu:

- Right-click menu hiện tại thay bằng long-press/tap `More`.
- Action sheet: mở hồ sơ, thêm note, đổi trạng thái.

### 6.5 Calendar / Lịch Làm Việc

Tham khảo Google Calendar:

Desktop giữ hiện tại. Mobile đổi behavior:

- Default view: `timeGridDay` hoặc custom agenda list.
- Week view chỉ dùng khi phone ngang/tablet.
- Month view hiển thị dot/event count, tap ngày mở agenda.
- Sidebar filter chuyển thành bottom sheet `Lịch & bộ lọc`.
- Top bar gọn:
  - Today.
  - Prev/next.
  - Title.
  - View/filter icon.
- Create event bằng FAB `+`.
- Event tap mở bottom sheet, không dùng popover fixed.
- Edit/create dialog chuyển full-screen sheet hoặc bottom sheet cao 90dvh.

FullCalendar config theo mobile:

- `<640px`: initial view `timeGridDay`, `dayMaxEvents` thấp, slot height lớn hơn.
- `640-1024px`: week/day tùy orientation.
- `>=1024px`: giữ desktop week/month/year.

CSS:

- Dùng `100dvh`.
- Giảm header chrome.
- Event text không quá nhiều dòng.
- Ẩn axis phụ nếu gây chật.

### 6.6 Learning Resources / Tài Nguyên

Mobile không nên dùng Windows Explorer hai cột.

Đề xuất:

- Root screen: search, grade chips, subject chips, categories.
- Category tree thành drill-down list:
  - Mỗi folder là row/card.
  - Breadcrumb thành top path ngắn hoặc back stack.
- Resource grid:
  - Mobile: 1-2 cột card.
  - Tablet: 2-3 cột.
  - Desktop: giữ explorer grid/list.
- List mode vẫn có, nhưng chỉ hiển thị: tên, loại, cập nhật.
- Viewer full-screen:
  - PDF/slide/video chiếm toàn màn.
  - Controls bottom overlay.
  - Back/close rõ.
  - Cache resource theo opt-in: `Lưu offline`.

### 6.7 Weekly Class Log / Sổ Đầu Bài

Mobile nên là form/timeline:

- Danh sách tuần/buổi dạng cards.
- Tap mở entry detail.
- Form nhập nhận xét, nội dung dạy, bài tập, trạng thái.
- Nếu có bảng tuần, chỉ dùng ở tablet/desktop.
- Mobile tránh table nhiều cột.

### 6.8 Reports / Báo Cáo

Mobile:

- Metric cards 2 cột hoặc 1 cột.
- Chart/list ưu tiên insight ngắn.
- Filter sheet.
- Export button ở toolbar hoặc action sheet.
- Không dùng dashboard card quá nhiều gây kéo dài vô ích.

### 6.9 Account / Notifications / Login Logs

Mobile:

- Account là screen riêng.
- Notifications là list, detail full-screen.
- Login logs không dùng table 1650px; chuyển thành timeline/list:
  - thiết bị.
  - thời gian.
  - IP/location nếu có.
  - trạng thái.

## 7. Data, Cache Và Offline Với PWA

### 7.1 Cache Màn Nào

Nên cache:

- App shell, route chunks, CSS, icons.
- LMS bootstrap: trường, lớp, teacher profile, navigation.
- Calendar events gần đây, nhưng phải revalidate.
- Learning resource catalog metadata.
- Resource file nếu user chọn lưu offline.
- Last opened screens để resume nhanh.

Không nên cache lâu:

- Điểm số.
- Điểm danh.
- Assignment submission/progress đang thay đổi.
- Role/permission/token.
- Login logs.
- Audit/risky admin data.

### 7.2 React Query Stale Time Gợi Ý

- Shell/bootstrap/scope: 5 phút, đang phù hợp source hiện tại.
- Calendar: 1-5 phút tùy backend.
- Homework list: 30-60 giây.
- Score sheet: 0-30 giây hoặc manual refetch nếu đang edit.
- Attendance current day: 0-15 giây nếu nhiều người cùng sửa; nếu chỉ giáo viên phụ trách sửa thì có thể 30 giây.
- Resource catalog: 5-30 phút.
- Resource file: cache theo version/hash.

### 7.3 Offline Mutation Rủi Ro

Không làm offline write bừa cho:

- Điểm số.
- Điểm danh.
- Giao bài.
- Đổi xếp loại.
- Khóa tài khoản học sinh.

Muốn offline write phải có:

- Idempotency key.
- Server revision/version.
- Conflict response.
- Retry queue inspect được.
- UI báo pending/synced/failed.
- Audit log.

Phase đầu nên readonly offline, trừ tài nguyên đã tải.

## 8. Accessibility Và Mobile UX

Bắt buộc:

- Bottom dock có `aria-label`, active state, focus visible.
- Sheet/dialog trap focus và đóng bằng Esc/back.
- Touch target 44px.
- Status không chỉ dựa màu: attendance phải có label/symbol.
- Cell edit có screen reader label: học sinh, cột điểm/ngày, trạng thái.
- Không dùng hover-only interaction trên mobile.
- Context menu phải có touch alternative.
- Toast không là nơi duy nhất báo lỗi lưu dữ liệu.
- PWA offline banner không che bottom dock.

## 9. Rủi Ro Kỹ Thuật

### 9.1 Bảng Dữ Liệu Lớn

Rủi ro:

- DOM lớn làm lag mobile.
- Sticky nhiều cột + horizontal scroll có thể jank.
- Input trong cell gây re-render nhiều.

Giảm rủi ro:

- Giữ virtualization.
- Chỉ sticky 1-2 cột trên mobile.
- Tách mobile editor thành bottom sheet.
- Batch save.
- Memoize columns/rows.
- Không mount popup per cell.

### 9.2 FullCalendar Trên Mobile

Rủi ro:

- Week/month view chật.
- Drag/drop event khó chính xác bằng ngón tay.
- Dialog/popover desktop không dùng tốt.

Giảm rủi ro:

- Mobile default day/agenda.
- Tắt hoặc hạn chế drag/drop trên phone nếu gây lỗi.
- Event edit qua bottom sheet.
- Tăng slot height/touch target.

### 9.3 PWA Cache Sai

Rủi ro:

- User thấy điểm/điểm danh cũ.
- Token/role thay đổi nhưng app vẫn cache UI cũ.
- Offline mutation conflict.

Giảm rủi ro:

- Không cache token trong service worker.
- API nhạy dùng network-first/no-store theo policy.
- Offline banner rõ.
- Invalidate khi account/session/scope thay đổi.
- Không offline write ở phase đầu.

### 9.4 iOS Safari

Rủi ro:

- `100vh` sai khi address bar đổi.
- Safe area che dock/footer.
- PWA install prompt không chuẩn như Android.
- File download/export Excel có khác biệt.

Giảm rủi ro:

- Dùng `100dvh`, `svh`, safe-area.
- Test iPhone Safari thật.
- Hướng dẫn Add to Home Screen riêng.
- Kiểm tra export XLSX trên iOS.

## 10. Thứ Tự Triển Khai Đề Xuất

### Phase 0: Audit & Baseline

Mục tiêu: đo hiện trạng trước khi sửa.

Việc cần làm:

- Chạy build/typecheck hiện tại.
- Mở LMS ở các viewport: 390x844, 430x932, 768x1024, 1024x768, 1440x900.
- Chụp screenshot các màn:
  - Homework.
  - Assign homework.
  - Score.
  - Attendance.
  - Calendar.
  - Resources.
  - Weekly class log.
- Ghi lại overflow, text overlap, tap target nhỏ, modal vỡ.

Deliverable:

- Checklist lỗi responsive hiện tại.
- Không sửa lớn ở phase này.

### Phase 1: PWA Foundation

Mục tiêu: LMS cài được như app và có app shell ổn.

Việc cần làm:

- Thêm `vite-plugin-pwa`.
- Thêm manifest/icons/meta, gồm `lang`, `id`, `screenshots`, `shortcuts`.
- Generate icon đúng kích thước thật: 192x192, 512x512, 180x180, 16x16, 32x32.
- Thêm script/checklist validate icon dimensions trước deploy.
- Thêm service worker cache app shell.
- Cấu hình runtime caching theo endpoint, không cache chung toàn bộ `/api`.
- Thêm offline fallback.
- Thêm install prompt hook.
- Thêm service worker update prompt, không auto reload khi đang có dirty form/cell.
- Thêm safe-area CSS tokens:
  - `--safe-top`.
  - `--safe-bottom`.
  - `--mobile-dock-height`.
- Chuyển mobile root shell sang `100dvh`.
- Thêm cache headers yêu cầu cho production deployment.

Deliverable:

- Android Chrome cài được PWA.
- iOS Safari có Add to Home Screen metadata.
- Offline mở được shell.
- DevTools Application -> Manifest không báo icon/installability error.
- Service worker update có UX rõ.

### Phase 2: Mobile LMS Shell & Bottom Dock

Mục tiêu: tạo experience app-like.

Việc cần làm:

- Tạo `LmsMobileShell`.
- Tạo `LmsBottomDock`.
- Tạo `LmsMobileTopBar`.
- Tạo `LmsScopeSheet`.
- Thay top nav scroll ngang bằng bottom dock ở mobile.
- Main content có bottom padding tránh dock.
- Giữ desktop shell hiện tại từ `xl`.

Deliverable:

- Mobile navigation dùng được một tay.
- Không mất route hiện có.
- School/class đổi bằng bottom sheet.

### Phase 3: Homework & Assign Flow

Mục tiêu: màn bài tập/giao bài dùng tốt trên phone.

Việc cần làm:

- Homework list -> card feed.
- Filter/search -> sticky + bottom sheet.
- Assign homework -> wizard 4 bước.
- Student/resource table -> list/checklist mobile.
- Modal preview -> full-screen/bottom sheet.
- Footer sticky safe-area.

Deliverable:

- Giáo viên giao bài trên phone không cần zoom ngang.

### Phase 4: Attendance Mobile

Mục tiêu: điểm danh nhanh như app native.

Việc cần làm:

- Tạo mobile attendance component.
- Default `Hôm nay`.
- List học sinh + segmented status.
- Week grid Google Sheets style.
- Curriculum thành tab riêng.
- Context menu -> action sheet.
- Export Excel vẫn có nhưng không chiếm primary UI.

Deliverable:

- Điểm danh cả lớp bằng mobile trong vài phút, ít lỗi chạm.

### Phase 5: Score Mobile

Mục tiêu: bảng điểm dùng được trên phone mà không phá desktop.

Việc cần làm:

- Tạo 3 mode: Sheet / Học sinh / Cột điểm.
- Bottom sheet cell editor.
- Tap history thay hover popup.
- Long press/action sheet thay right-click.
- Sticky chỉ giữ student column.
- Batch save và dirty state.

Deliverable:

- Xem/chỉnh điểm từng học sinh hoặc từng cột điểm trên mobile.

### Phase 6: Calendar Mobile

Mục tiêu: lịch dạy giống Google Calendar mobile.

Việc cần làm:

- Mobile default day/agenda.
- Month tap -> agenda day.
- Filter sidebar -> bottom sheet.
- Quick event popover -> bottom sheet.
- Create/edit -> full-screen sheet.
- FAB tạo lịch.

Deliverable:

- Giáo viên xem lịch hôm nay/tuần và sửa event nhanh trên phone.

### Phase 7: Resources, Weekly Log, Reports

Mục tiêu: các màn phụ không bị desktop table ép vào phone.

Việc cần làm:

- Resources -> drill-down mobile explorer.
- Viewer -> full-screen.
- Weekly log -> timeline/form.
- Reports -> metric cards/filter sheet.
- Login logs -> timeline.

Deliverable:

- Các route phụ dùng được trong PWA, không horizontal-scroll vô tội vạ.

### Phase 8: QA, Performance, Real Device

Mục tiêu: đảm bảo mobile thật không vỡ.

Việc cần làm:

- Test viewport:
  - iPhone SE width 375.
  - iPhone 14/15 width 390/430.
  - Android 360/412.
  - iPad 768.
  - Desktop 1440.
- Test PWA installed mode.
- Test offline/online transitions.
- Test keyboard input trong score/attendance.
- Test orientation change.
- Lighthouse PWA/accessibility/performance.
- Playwright screenshot cho route chính.

Deliverable:

- Không horizontal overflow ngoài các grid có chủ đích.
- Không text overlap.
- Dock không che nội dung.
- Bảng lớn không lag rõ trên dataset mock lớn.

## 11. Acceptance Criteria

PWA:

- App installable trên Android Chrome.
- iOS có icon/name/theme đúng khi Add to Home Screen.
- Offline shell mở được.
- Online/offline banner đúng.
- Không cache sai dữ liệu nhạy.
- Icon manifest đúng kích thước thật, đặc biệt 192x192, 512x512, 180x180.
- Manifest có `start_url`, `scope`, `display: standalone`, `theme_color`, `background_color`, `shortcuts`.
- Service worker active, có fetch handler, có fallback offline.
- API nhạy không trả về offline HTML fallback.
- Có update prompt hoặc auto-update policy không làm mất dữ liệu đang nhập.
- Lighthouse PWA đạt 100 trên production/preview build.

Shell:

- Bottom dock hiển thị đúng mobile.
- 5 item chính rõ ràng.
- `More` sheet chứa route phụ.
- Scope sheet đổi trường/lớp được.
- Header không quá cao.

Responsive:

- Không có text/button overlap ở 375px.
- Touch target chính tối thiểu 44px.
- Main content không bị bottom dock che.
- `100dvh`/safe area xử lý iOS/Android.

Score/Attendance:

- Desktop giữ bảng mạnh hiện tại.
- Mobile có view riêng, không chỉ table scroll.
- Cell edit/tap rõ.
- Hover/right-click có alternative touch.
- Virtualization còn hoạt động.

Calendar:

- Mobile default day/agenda.
- Event detail dùng bottom sheet.
- Filter dùng bottom sheet.
- Month/week không vỡ layout.

Resources:

- Mobile drill-down thay tree 2 cột.
- Viewer full-screen.
- Tài nguyên lớn không tự cache bừa.

## 12. Các File Ưu Tiên Sửa/Tạo

Ưu tiên tạo mới:

- `src/features/lms/mobile/components/lms-mobile-shell.tsx`
- `src/features/lms/mobile/components/lms-bottom-dock.tsx`
- `src/features/lms/mobile/components/lms-mobile-top-bar.tsx`
- `src/features/lms/mobile/components/lms-scope-sheet.tsx`
- `src/features/lms/mobile/components/mobile-bottom-sheet.tsx`
- `src/features/lms/mobile/hooks/use-install-prompt.ts`
- `src/features/lms/mobile/hooks/use-online-status.ts`
- `src/features/lms/mobile/hooks/use-service-worker-update.ts`
- `src/features/lms/mobile/hooks/use-lms-mobile-breakpoint.ts`
- `src/features/lms/mobile/pwa/lms-pwa-cache-policy.ts`
- `src/features/lms/mobile/pwa/lms-offline-storage.ts`
- `public/offline.html`
- `public/manifest.webmanifest`
- `public/android-chrome-192x192.png`
- `public/android-chrome-512x512.png`
- `public/apple-touch-icon.png`
- `public/favicon-16x16.png`
- `public/favicon-32x32.png`

Ưu tiên sửa:

- `src/features/lms/components/lms-teacher-shell.tsx`
- `src/features/lms/components/score-sheet-panel.tsx`
- `src/features/lms/components/attendance-sheet-panel.tsx`
- `src/features/lms/components/teaching-schedule/teaching-schedule-panel.tsx`
- `src/features/lms/components/teaching-schedule/teaching-schedule-calendar.tsx`
- `src/features/lms/components/assign-homework-page.tsx`
- `src/features/lms/learning-resources/components/learning-resource-library-page.tsx`
- `src/styles/globals.css`
- `src/index.css`
- `vite.config.ts`
- `index.html`

Ưu tiên không động mạnh:

- Business data/mock hiện tại, trừ khi cần tách view model.
- Desktop table behavior đang dùng tốt.
- Route path hiện tại.

## 13. Kết Luận

LMS hiện có nền desktop khá mạnh, nhất là các bảng dữ liệu dày và calendar. Nhưng để thành PWA mobile tốt, không nên “responsive hóa” bằng vài class Tailwind. Cần một lớp mobile shell và mobile view model riêng cho các màn nghiệp vụ lớn.

Thứ tự đúng là:

1. Làm PWA foundation và mobile shell.
2. Đổi navigation sang bottom dock.
3. Chuyển từng màn theo workflow mobile thật.
4. Giữ desktop nguyên sức mạnh.
5. Kiểm thử bằng device/viewport thực tế.

Nếu làm đúng, ERG LMS sẽ có hai trải nghiệm song song: desktop mạnh như hệ thống quản lý dữ liệu, mobile/PWA nhanh như app giáo viên dùng trên lớp.

## 14. Bổ Sung Theo `react-pwa-designer`: Kiến Trúc React PWA Cho LMS

Phần này bổ sung trực tiếp từ checklist và pattern của `react-pwa-designer`, áp vào source ERG LMS hiện tại. Mục tiêu là biến kế hoạch responsive thành kế hoạch PWA có thể triển khai, vận hành, debug và kiểm chứng được.

### 14.1 PWA Foundation Cần Đạt

Hiện source đã có nền tảng tốt:

- `vite.config.ts` đã dùng `vite-plugin-pwa`.
- `public/manifest.webmanifest` đã có `name`, `short_name`, `start_url`, `scope`, `display`, `display_override`, `orientation`, `theme_color`, `background_color`, `icons`, `shortcuts`.
- `index.html` đã có `manifest`, `apple-touch-icon`, `theme-color`, `mobile-web-app-capable`, `apple-mobile-web-app-capable`.
- `public/offline.html` đã nằm trong nhóm file cần có.

Việc cần bổ sung/kiểm lại:

- Kiểm tra kích thước thật của icon, không chỉ tin vào tên file. Icon 192x192, 512x512 và apple 180x180 sai kích thước là lỗi kinh điển làm Chrome/Edge không hiện install prompt mà không báo rõ.
- Manifest hiện `start_url` là `/homework?source=pwa`; cần xác nhận router sản phẩm thật có route `/homework` khi mở app standalone. Nếu route LMS thật nằm dưới prefix khác thì phải chỉnh `start_url` và `shortcuts`.
- `index.html` vẫn có `title`, `description`, OG/Twitter content thiên về “MOS & IC3” hơn “ERG LMS cho giáo viên”. Nếu PWA này ưu tiên LMS teacher portal, cần đổi metadata theo LMS hoặc tách metadata theo portal.
- `theme_color` nên khớp top bar mobile. Nếu mobile shell dùng màu nền sáng/Fluent, giữ `#0f6cbd` chỉ nên là accent/status bar, không để cảm giác app bị lệch nhận diện.
- Production bắt buộc HTTPS. Localhost được miễn, nhưng domain staging/production phải test installability bằng Chrome DevTools Application > Manifest.

Checklist kỹ thuật bắt buộc:

- Service worker registered, activated, có fetch handler.
- Offline fallback hoạt động cho navigation shell.
- API route không bị trả về `offline.html`.
- App installable trên Android Chrome.
- iOS Add to Home Screen có icon/name/status bar đúng.
- Lighthouse PWA đạt 100 trên preview/production build.

### 14.2 Service Worker Và Cache Strategy Cho LMS

Không được cache toàn bộ API LMS theo kiểu “cứ GET là cache”. LMS có dữ liệu điểm, điểm danh, token, role, session và dữ liệu học sinh; cache sai vừa tạo lỗi nghiệp vụ vừa có rủi ro bảo mật.

Phân tầng cache đề xuất:

| Nhóm dữ liệu | Ví dụ màn/API | Strategy | TTL gợi ý | Lý do |
| --- | --- | --- | --- | --- |
| Static app shell | JS/CSS/fonts/icon/offline.html | Precache/CacheFirst | Theo build hash | Mở app nhanh, dùng offline shell |
| Font Google CSS | fonts.googleapis.com | StaleWhileRevalidate | 7 ngày | Không nhạy cảm, cải thiện first load |
| Font files | fonts.gstatic.com | CacheFirst | 1 năm | File immutable, ít rủi ro |
| Bootstrap ít nhạy | education units, cây môn/lớp, resource tree | NetworkFirst | 3-5 phút | Mobile cần mở nhanh nhưng vẫn ưu tiên dữ liệu mới |
| Catalog tài nguyên | library resources, recent opened | StaleWhileRevalidate | 15-30 phút | Có thể xem danh mục cũ trong ngắn hạn |
| Progress/tổng quan | homework progress summary | NetworkFirst | 30-60 giây | Cho phép chống mạng yếu nhưng không để stale lâu |
| Điểm danh | attendance sheet, attendance mutation | NetworkOnly | Không cache | Dữ liệu nghiệp vụ thời gian thực, dễ sai |
| Bảng điểm | scores, score mutation | NetworkOnly | Không cache | Dữ liệu nhạy và cần nhất quán |
| Auth/session/token | login, refresh, `/me`, sessions | NetworkOnly | Không cache | Tránh rò rỉ quyền/session |
| Quiz attempt | attempts, submissions | NetworkOnly hoặc background draft riêng | Không cache bằng Workbox route chung | Không được replay sai bài làm |
| File/PDF/media lớn | resource viewer | NetworkOnly hoặc user-triggered cache | Theo chọn của người dùng | Tránh đầy cache, tránh offline nhầm file không được phép |

Đề xuất hiện tại trong `vite.config.ts` đã đi đúng hướng: denylist `/api`, `/auth`, `/sso` cho navigation fallback; NetworkOnly cho auth/scores/attendance; TTL ngắn cho bootstrap/progress; StaleWhileRevalidate cho catalog tài nguyên. Cần tiếp tục giữ nguyên nguyên tắc này khi thêm API thật.

Điểm phải kiểm tra thêm:

- Workbox `navigateFallbackDenylist` phải bao hết route backend nhạy như `/api/`, `/auth/`, `/sso/`, `/oauth/`, `/graphql` nếu sau này có GraphQL.
- Nếu thêm GraphQL, tuyệt đối không runtime-cache toàn bộ `POST /graphql`. Chỉ cache persisted query GET rất rõ ràng, không chứa token/PII trong URL.
- Mutation không bao giờ cache bằng service worker.
- Cache key không được chứa token, bearer, refresh token, session id.
- Khi logout phải dọn cache nghiệp vụ theo user hoặc dùng cache version/user partition để tránh giáo viên A nhìn stale shell/data của giáo viên B trên cùng máy.

### 14.3 Offline UX: Offline Shell Không Đồng Nghĩa Offline Nghiệp Vụ

Với LMS, PWA offline đúng là:

- App mở được khi mất mạng.
- Shell, bottom dock, offline page, thông báo mạng hiển thị ổn.
- Các màn đọc ít nhạy có thể hiện dữ liệu stale ngắn hạn nếu có cache.
- Các thao tác ghi như điểm danh, nhập điểm, giao bài, nộp bài, đổi lịch phải báo “cần mạng” hoặc đưa vào draft queue có kiểm soát.

Không nên hứa offline toàn bộ ở phase đầu. Offline toàn bộ cho LMS rất khó vì liên quan conflict, audit log, role, timestamp, version dữ liệu.

Phân loại offline theo màn:

| Màn | Offline nên làm | Offline không nên làm ở phase đầu |
| --- | --- | --- |
| Home/dashboard | Hiện shell, last summary ngắn hạn, banner offline | Không cho xác nhận số liệu như dữ liệu mới |
| Homework progress | Cho xem cache 30-60 giây hoặc last known snapshot có nhãn | Không cho chấm/đổi trạng thái nếu chưa có conflict policy |
| Assign homework | Có thể giữ draft local chưa gửi | Không auto-submit khi mạng lại nếu thiếu xác nhận |
| Score | Có thể giữ draft điểm local nếu thiết kế version/conflict | Không ghi điểm offline trực tiếp |
| Attendance | Có thể draft trong buổi học với cảnh báo rất rõ | Không sync ngầm khi lịch/ngày/lớp đã đổi |
| Calendar | Xem lịch cache ngắn hạn | Không tạo/sửa event offline ở phase đầu |
| Resources | Xem catalog cache; file chỉ cache khi user mở/tải | Không cache toàn bộ kho tài nguyên |
| Account/session | Không offline | Không dùng cached auth để cấp quyền API |

Nếu cần offline write sau này, phải có mô hình:

- Draft local theo `userId + classId + date + entityId`.
- Entity version hoặc `updatedAt` từ server.
- Conflict state rõ: server mới hơn, local mới hơn, hoặc cần người dùng chọn.
- Audit log ghi thời điểm local edit và thời điểm server accept.
- Nút sync thủ công, không chỉ sync ngầm.

### 14.4 State Management Cho Mobile PWA

Theo `react-pwa-designer`, không nên dồn mọi state vào Context hoặc local state. LMS nên tách state theo bản chất:

| Loại state | Nơi đặt | Ví dụ |
| --- | --- | --- |
| Local UI state | `useState`/`useReducer` trong component | mở bottom sheet, tab active, cell đang focus |
| Shared UI state trong mobile shell | Context nhỏ hoặc hook trong `src/features/lms/mobile` | dock active, scope sheet, install prompt |
| Server state | React Query/TanStack Query nếu được đưa vào | class list, score sheet, attendance, calendar events |
| URL state | Search params/router | view calendar, selected date, filters có thể share link |
| Draft/form state | React Hook Form/Zod hoặc reducer feature-level | giao bài, nhập điểm hàng loạt, event form |
| App-wide auth/role | Auth context/platform hiện có | user, token, role, permission |

Nguyên tắc quan trọng:

- Server data không nên copy vào global store chỉ để tiện dùng. Dữ liệu server cần cache/invalidate/query key rõ.
- Mobile view model có thể tách khỏi desktop table, nhưng data source nên dùng chung hook/API để tránh lệch nghiệp vụ.
- Filter/pagination/scope quan trọng nên đi qua URL hoặc query key, không chỉ state tạm.
- Draft có rủi ro mất dữ liệu nên lưu local có schema/version, không để rải rác trong nhiều component.

### 14.5 Layout Patterns Cần Áp Vào LMS Mobile

Các lỗi layout PWA/mobile hay gặp trong source dashboard là container `h-screen`, nested flex, table overflow, dock che nội dung. Pattern cần chuẩn hóa:

- Shell mobile dùng `min-h-dvh` hoặc `height: 100dvh`, không chỉ `100vh`.
- Root shell nên là `flex flex-col overflow-hidden`.
- Header/top bar và bottom dock dùng `flex-shrink-0`.
- Vùng content dùng `flex-1 min-h-0 overflow-y-auto`.
- Mọi panel có scroll nội bộ phải có cặp `min-h-0 + overflow-y-auto`.
- Bottom dock phải cộng padding đáy: `padding-bottom: calc(env(safe-area-inset-bottom) + <dock height>)`.
- Sheet/drawer mobile dùng safe area ở đáy và max-height theo `dvh`.
- Bảng kiểu Google Sheets chỉ được horizontal scroll trong vùng grid, không làm cả page tràn ngang.
- Khi có drag/resize trên desktop, tắt transition trong lúc kéo; mobile không nên dùng resize pane.

Checklist layout theo viewport:

- 360x740: không overlap, không horizontal page overflow.
- 375x812: dock không che CTA/footer.
- 390x844: bottom sheet còn thấy nút chính.
- 414x896: header không quá cao.
- 768x1024: tablet có thể dùng layout lai, không ép bottom dock nếu desktop/tablet shell tốt hơn.
- Landscape mobile: ưu tiên content scroll được, không khóa màn.

### 14.6 Component Strategy: shadcn/ui Và ERG UI Kit

PWA mobile nên dùng primitives quen thuộc thay vì tự vẽ quá nhiều:

- Action: `Button` + lucide icon.
- Mode switch: `Tabs` hoặc segmented control.
- Bottom sheet: `Sheet`/Dialog adaptation hoặc `MobileBottomSheet`.
- Filters: `Sheet`, `Command`, `Select`.
- Feedback: `Toast`, `Alert`, `Skeleton`, `Progress`.
- Confirmation: `AlertDialog`.
- Data dense: table/grid riêng, không cố dùng card cho mọi dòng.

Với ERG LMS, không nên biến tất cả thành card. Card chỉ hợp cho summary, quick action, resource item. Bảng điểm, điểm danh, calendar cần pattern chuyên dụng:

- Score mobile: spreadsheet mode + student mode + column mode.
- Attendance mobile: today mode + week grid + curriculum mode.
- Calendar mobile: day agenda + event bottom sheet.
- Resources mobile: drill-down list + full-screen viewer.
- Assign homework mobile: wizard + sticky step footer + draft state.

### 14.7 Performance Và Bundle Strategy

LMS có nhiều màn nặng: FullCalendar, PDF viewer, TanStack Table/Virtual, DnD, quiz editor. PWA mobile không được bắt người dùng tải hết khi chỉ mở điểm danh.

Chiến lược:

- Giữ lazy route cho các màn lớn.
- Manual chunks hiện có trong `vite.config.ts` cho `fullcalendar`, `pdfjs`, `tanstack`, `radix`, `dnd`, `icons` là hợp lý.
- Không preload các chunk rất nặng như `pdfjs`, `fullcalendar`, `assign-homework-page` trong HTML nếu mobile không cần ngay.
- Route nào trong bottom dock có xác suất mở cao thì preload theo intent hoặc sau idle, không preload tất cả ngay lúc login.
- Table lớn phải giữ virtualization ở desktop/tablet; mobile view nên giảm số cell render, không render toàn bộ grid ẩn.
- Search/filter nên debounce 200-400ms; nhập điểm/điểm danh không debounce UI feedback, chỉ debounce sync nếu có.

Ngưỡng kiểm soát:

- LCP mobile dưới 2.5s trên preview/production.
- CLS dưới 0.1, đặc biệt khi dock/top bar xuất hiện.
- Initial JS không kéo theo PDF/calendar/editor nếu đang mở homework/attendance.
- Tap-to-interactive cho điểm danh dưới 100ms cảm nhận.

### 14.8 Security, Token Và Role Trong PWA

PWA không thay đổi nguyên tắc bảo mật: service worker và cache không được trở thành “backend phụ”.

Nguyên tắc:

- Token vẫn do auth layer hiện tại quản lý; service worker không lưu token.
- Role/permission chỉ dùng để ẩn/hiện UI, không thay server authorization.
- API backend vẫn phải check token, role, scope trường/lớp.
- Cached UI không đồng nghĩa có quyền truy cập dữ liệu mới.
- Khi user logout, clear hoặc version hóa cache LMS liên quan user.
- Không cache response chứa thông tin nhạy như bảng điểm, điểm danh, hồ sơ học sinh, session logs.
- Nếu dùng GraphQL sau này, persisted query/public bootstrap có thể cache rất ngắn; mutation và query nhạy phải NetworkOnly.

Các tình huống cần test:

- Giáo viên logout rồi login bằng tài khoản khác trên cùng máy.
- Token hết hạn khi app đang offline.
- User bị đổi role/quyền khi app đang mở.
- Mở PWA từ shortcut `/score` khi chưa login.
- Service worker đang giữ app shell cũ sau deploy role/route mới.

### 14.9 Install Prompt Và Update Prompt

Install prompt không phải lúc nào cũng hiện ngay. Browser thường yêu cầu HTTPS, manifest hợp lệ, service worker active, icon đúng kích thước, app chưa được cài, user đã tương tác và ở lại đủ lâu.

Cần thiết kế mobile shell:

- Không spam install CTA.
- Chỉ hiện “Cài app” sau khi bắt được `beforeinstallprompt`.
- Nếu iOS không có `beforeinstallprompt`, hiện hướng dẫn Add to Home Screen rất gọn trong account/more sheet.
- Update prompt phải tránh mất draft đang nhập. Nếu có draft giao bài/điểm danh/điểm, hỏi người dùng trước khi reload.
- Nếu `registerType: autoUpdate`, vẫn nên có UI báo “Có bản cập nhật” khi service worker waiting/activated để người dùng hiểu vì sao app đổi.

### 14.10 Verification Bổ Sung Theo PWA Designer

Lệnh/check cần đưa vào quy trình release:

```powershell
bun run typecheck
bun run build
npx vite preview --host 0.0.0.0 --port 4173
```

Kiểm icon thật:

```powershell
Get-Item public\android-chrome-192x192.png, public\android-chrome-512x512.png, public\apple-touch-icon.png
```

Nếu có ImageMagick hoặc công cụ tương đương:

```powershell
magick identify public\android-chrome-192x192.png
magick identify public\android-chrome-512x512.png
magick identify public\apple-touch-icon.png
```

DevTools checklist:

- Application > Manifest: không có lỗi installability.
- Application > Service Workers: service worker activated and running.
- Application > Cache Storage: cache đúng nhóm, không có score/attendance/auth response.
- Network offline: mở app thấy offline shell, không crash.
- Network offline: API nhạy không bị trả HTML fallback.
- Lighthouse: PWA 100, Accessibility càng gần 100 càng tốt.

Playwright/browser viewport cần chụp:

- `/homework` 375x812.
- `/attendance` 375x812.
- `/score` 375x812.
- `/calendar` 390x844.
- `/resources` 390x844.
- Desktop `1440x900` cho các route trên để xác nhận không vỡ UI cũ.

### 14.11 Thứ Tự Triển Khai Đề Xuất Sau Khi Bổ Sung PWA Designer

1. Chốt PWA foundation: manifest, icon dimensions, metadata LMS, service worker denylist/cache policy.
2. Chốt mobile shell: `100dvh`, safe area, bottom dock, top bar, more sheet, scope sheet.
3. Chuẩn hóa state hooks: online status, install prompt, service worker update, breakpoint.
4. Tách từng mobile view theo feature: score, attendance, calendar, homework, resources.
5. Bổ sung cache policy theo API thật, không cache dữ liệu nhạy.
6. Kiểm chứng installability và offline bằng Chrome DevTools.
7. Kiểm screenshot mobile/desktop để bảo đảm desktop không bị ảnh hưởng.

Kết luận bổ sung: PWA cho LMS không chỉ là thêm manifest và service worker. Phần quan trọng nhất là cache đúng dữ liệu, không cache sai quyền/token, giữ offline UX trung thực, và thiết kế mobile workflows riêng cho giáo viên thao tác nhanh trong lớp.
