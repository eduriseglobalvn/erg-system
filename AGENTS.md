# ERG System — Comprehensive Codebase Map & Agent Guide

> **Mục đích tài liệu:** Bản đồ kiến trúc và sơ đồ chi tiết toàn bộ mã nguồn của dự án **ERG System** (`react-erg-elerning-fe`).  
> Bất kỳ AI Agent nào (**Claude, Codex, Antigravity, Cursor, Copilot...**) hoặc Kỹ sư phần mềm khi đọc file này đều nắm bắt được vai trò của từng thư mục, từng file, phạm vi quản lý và các nguyên tắc kiến trúc cốt lõi của hệ thống.

---

## 1. Tổng quan hệ thống (System Overview)

- **Sản phẩm:** ERG EduRise Global System — Nền tảng SaaS giáo dục tích hợp đa không gian làm việc (Multi-tenant Portal Platform).
- **4 Không gian làm việc chính (Workspaces):**
  1. **ADMIN (Quản trị học thuật & hệ thống):** Quản lý nội dung học thuật, ngân hàng câu hỏi, trình soạn thảo đề thi (Quiz Editor), cấu trúc chương trình khung, phân hiệu trường học (School Management), đồng bộ giáo trình. *(Thuật ngữ cũ LCMS đã khai tử)*.
  2. **TEACHER (Giảng viên / Vận hành giảng dạy):** Quản lý lớp học, điểm danh, lịch giảng dạy, sổ đầu bài, tài nguyên học tập, giảng dạy ngoại tuyến.
  3. **STUDENT (Học sinh / Học tập & Thi):** Bảng điều khiển học sinh (Student Dashboard), làm bài tập, thi trực tuyến, ứng dụng PWA di động, thi ngoại tuyến (Portable Exam). *(Thuật ngữ cũ E-Learning đã khai tử)*.
  4. **CRM (Customer Relationship Management):** Quản lý học viên tiềm năng, tuyển sinh, thông tin khách hàng, tư vấn.
- **Công nghệ nền tảng (Tech Stack):**
  - **Framework & Bundler:** React 19, TypeScript 6, Vite 8
  - **Routing:** TanStack Router (type-safe routing dựa trên domain/host và pathname: `/admin`, `/teacher`, `/student`, `/crm`)
  - **Data Fetching & Cache:** TanStack Query v5 + IndexedDB persistence (hỗ trợ Offline-first)
  - **Giao diện (UI Design System):** ERG Enterprise UI (MUI Material v7 + Emotion + `@mui/icons-material` path imports + hệ thống wrapper `src/components/erg-mui`)
  - **Desktop Container:** Tauri v2 (Rust backend, siêu nhẹ ~5MB phục vụ thi ngoại tuyến không cần mạng)
  - **PWA:** `vite-plugin-pwa` hỗ trợ học sinh học trên thiết bị di động với mạng 3G/chập chờn.
  - **Backend API:** Đồng bộ hợp đồng kiểu dữ liệu với `erg-spring` thông qua REST OpenAPI (`erg-openapi.json`) và GraphQL (`schema.graphqls`).

---

## 2. Nguyên tắc kiến trúc cốt lõi (Core Architecture Principles)

1. **Feature-First Architecture:** Toàn bộ nghiệp vụ kinh doanh đặt trong `src/features/<feature>/` (gồm `api/`, `components/`, `hooks/`, `types/`).
2. **Thin Pages Pattern:** Các component trong `src/app/pages/` chỉ là trang wrapper mỏng, chịu trách nhiệm kết hợp các feature components và layout. Không viết logic nghiệp vụ phức tạp trực tiếp tại page.
3. **MUI Enterprise Design System:**
   - Sử dụng các wrapper tại `src/components/erg-mui/` (`ErgButton`, `ErgCard`, `ErgTable`, `ErgTextField`, `ErgBadge`,...).
   - Sử dụng `@mui/icons-material` qua path import (ví dụ: `import AddIcon from "@mui/icons-material/Add"`).
   - Định kiểu qua `sx` prop và theme tokens tại `src/themes/erg-enterprise-tokens.ts`.
4. **Offline-First & PWA:**
   - Caching truy vấn bằng TanStack Query tích hợp lưu trữ IndexedDB.
   - Giao diện nạp dữ liệu dùng Skeleton (`src/routes/route-feedback.tsx`), không dùng spinner chặn màn hình.
5. **Backend Contract Drift Gate:**
   - Hợp đồng API được khóa bằng mã băm SHA-256 trong `contracts/backend/`.
   - File sinh tự động `src/lib/api/generated/` không sửa tay; cập nhật qua script `bun run contract:rest:sync` hoặc `bun run contract:graphql:sync`.
6. **Locked UI Components:**
   - Giao diện ghép nối câu hỏi (Matching Question) tại `src/components/quiz/questions/matching-question.tsx` và styles tương ứng là vùng giao diện cố định, không tùy tiện thay đổi layout hay hiệu ứng kéo thả.
7. **Workspace Naming Standard:**
   - Chỉ sử dụng 4 workspace chuẩn: `ADMIN`, `TEACHER`, `STUDENT`, `CRM`.
   - Không dùng lại các thuật ngữ đã khai tử (`LCMS`, `E-Learning`) trong mã nguồn mới, giao diện hoặc tài liệu.

---

## 3. Sơ đồ cây thư mục & Vai trò từng file (Directory & File Map)

```
erg-system/
├── contracts/               # Hợp đồng API backend (OpenAPI & GraphQL) được sha256-locked
├── deploy/                  # Cấu hình triển khai Docker và Desktop Releases
├── docs/                    # Tài liệu kiến trúc, biên bản refactor và governance specs
├── public/                  # Static assets công khai phục vụ web (icon, manifest, fonts)
├── scripts/                 # Scripts tự động hóa build, lint governance, sync API contracts
├── src/                     # Toàn bộ mã nguồn ứng dụng (Frontend Source Code)
├── src-tauri/               # Ứng dụng Desktop Tauri v2 (Rust) cho Portable Offline Exam
├── .env.example             # Biến môi trường mẫu
├── bun.lock                 # Bun lockfile cố định phiên bản dependencies
├── codegen.ts               # Cấu hình GraphQL Code Generator (sinh type từ schema.graphqls)
├── eslint.config.js         # Cấu hình ESLint cho toàn bộ dự án
├── index.html               # Entry point HTML của ứng dụng Web
├── package.json             # Khai báo dependencies và scripts thực thi
├── playwright.config.ts     # Cấu hình kiểm thử E2E Playwright đa phân hệ (admin, lms, crm, elearning)
├── portable.html            # Entry point HTML phục vụ build ứng dụng thi ngoại tuyến (Portable)
├── tsconfig.json            # Cấu hình TypeScript nền tảng
├── vite.config.ts           # Cấu hình Vite chính cho Web Application
└── vite.portable.config.ts  # Cấu hình Vite tối ưu cho bản build Portable Exam Desktop
```

---

### 3.1. Thư mục gốc & File cấu hình dự án

| File / Thư mục | Vai trò & Trách nhiệm quản lý |
| :--- | :--- |
| `package.json` | Danh sách package và các lệnh: `dev`, `build`, `test`, `contract:check`, `verify:api-contract`, `typecheck`,... |
| `vite.config.ts` | Cấu hình bundler Vite: alias `@`, plugin React, PWA, code-splitting chunks, server proxy. |
| `vite.portable.config.ts` | Cấu hình đóng gói giao diện phòng thi độc lập (portable exam) nhúng vào Tauri desktop. |
| `codegen.ts` | Cấu hình tự động sinh TypeScript types từ `contracts/backend/schema.graphqls` ra `src/lib/api/generated/graphql.ts`. |
| `playwright.config.ts` | Cấu hình chạy test E2E cho các workspace: `lms`, `admin`, `crm`, `student`. |
| `portable.html` | File HTML tối giản dùng để tải bộ engine thi ngoại tuyến trong ứng dụng desktop. |
| `index.html` | File HTML chính, nạp font Manrope / JetBrains Mono và thẻ `#root` nạp ứng dụng. |
| `docker-compose.yml` & `Dockerfile` | Hỗ trợ đóng gói container hóa frontend để chạy độc lập hoặc tích hợp CI/CD. |

---

### 3.2. `contracts/` — Quản trị hợp đồng Backend API

| File | Vai trò & Trách nhiệm quản lý |
| :--- | :--- |
| `contracts/backend/erg-openapi.json` | Bản sao contract OpenAPI REST từ backend `erg-spring`. |
| `contracts/backend/erg-openapi.lock.json` | File khóa SHA-256 đảm bảo bản REST contract không bị thay đổi ngầm. |
| `contracts/backend/schema.graphqls` | Bản sao schema GraphQL từ backend `erg-spring`. |
| `contracts/backend/schema.graphqls.lock.json` | File khóa SHA-256 bảo vệ tính toàn vẹn của GraphQL schema. |

---

### 3.3. `scripts/` — Scripts kiểm thử, quản trị & tự động hóa

| File | Vai trò & Trách nhiệm quản lý |
| :--- | :--- |
| `scripts/api-contract-lib.mjs` | Thư viện tính toán SHA-256 checksum và kiểm tra khóa contract. |
| `scripts/sync-api-contract.mjs` | Đồng bộ file `erg-openapi.json` từ repo `erg-spring` và cập nhật khóa SHA-256. |
| `scripts/sync-graphql-contract.mjs` | Đồng bộ `schema.graphqls` từ backend và cập nhật khóa SHA-256. |
| `scripts/check-legacy-ui.mjs` | Script kiểm tra và cảnh báo nếu có code mới vi phạm quy chuẩn thiết kế MUI Enterprise. |
| `scripts/check-bundle-budget.mjs` | Giám sát kích thước file bundle sau khi build để đảm bảo tải nhanh trên mạng 3G. |
| `scripts/check-cross-repo-governance.mjs` | Kiểm soát ranh giới trách nhiệm giữa các repository vệ tinh của ERG. |
| `scripts/check-frontend-repository-drift.mjs` | Kiểm tra sự sai lệch cấu trúc frontend so với các quy chuẩn chuẩn hóa. |
| `scripts/build-portable-exam.mjs` | Script tự động build và đóng gói gói đề thi phòng thi ngoại tuyến. |
| `scripts/desktop-release.mjs` | Quy trình chuẩn bị cấu hình, tạo SHA-256 và sinh manifest phát hành bản desktop Tauri. |

---

### 3.4. `src-tauri/` — Ứng dụng Desktop Portable Exam (Rust + Tauri v2)

| File / Thư mục | Vai trò & Trách nhiệm quản lý |
| :--- | :--- |
| `src-tauri/Cargo.toml` | Khai báo dependencies của ứng dụng native Rust (Tauri core, window management). |
| `src-tauri/tauri.conf.json` | Cấu hình quyền, kích thước cửa sổ, bảo mật sandbox của ứng dụng máy tính. |
| `src-tauri/src/main.rs` | Entry point mã nguồn Rust khởi chạy ứng dụng desktop. |
| `src-tauri/src/lib.rs` | Đăng ký các native commands gọi từ React qua invoke handler (quản lý file đề thi offline). |
| `src-tauri/capabilities/` | Định nghĩa chính sách phân quyền bảo mật runtime của Tauri. |

---

### 3.5. `src/` — Kiến trúc chi tiết mã nguồn chính

#### `src/` (Root Level)
- `App.tsx`: Component gốc thiết lập các Provider (`QueryClientProvider`, `ErgMuiProvider`, `RouterProvider`).
- `main.tsx`: Khởi tạo ứng dụng web, mount vào thẻ `#root`.
- `portable-main.tsx`: Khởi tạo ứng dụng chạy trong môi trường desktop offline (không yêu cầu kết nối mạng).
- `index.css`: Cấu hình reset CSS, nạp font chữ.

---

#### `src/app/` — Cổng điều hướng & Trang phân hệ (App Routing & Pages)

- **`src/app/portal-route-registry.ts`**: Đăng ký tập trung hằng số đường dẫn (paths) của toàn bộ các workspace: Admin, Teacher (LMS), CRM, Student.
- **`src/app/router/`**:
  - `route-guards.ts`: Bộ lọc kiểm tra quyền truy cập (permission guards, workspace enforcement).
  - `portal-host-resolution.ts`: Phân giải tên miền / subdomain để xác định workspace hiện tại.
  - `legacy-route-redirects.ts`: Chuyển hướng các URL cũ tương thích ngược sang cấu trúc URL mới.
- **`src/app/pages/`** (Thin Pages compose feature components):
  - `admin/`: Trang quản trị nội dung học thuật, ngân hàng đề thi, quản lý trường học (Workspace: **ADMIN**).
  - `teacher/`: Giao diện chuyên biệt cho giáo viên: lớp học, điểm danh, tài nguyên (Workspace: **TEACHER**).
  - `student/`: Giao diện chuyên biệt cho học sinh: bài tập, khóa học, thi trực tuyến (Workspace: **STUDENT**).
  - `crm/`: Trang điều phối khách hàng, tuyển sinh, lead dashboard (Workspace: **CRM**).
  - `auth/`: Trang đăng nhập đa phân hệ, phục hồi mật khẩu.

---

#### `src/components/` — Hệ thống Components tái sử dụng

- **`erg-mui/` (Hệ thống thiết kế chuẩn ERG Enterprise):**
  - `ErgButton.tsx`: Nút chuẩn doanh nghiệp với hiệu ứng hover và kích thước chuẩn.
  - `ErgCard.tsx`: Khối thẻ hiển thị dữ liệu với border và shadow chuẩn theme.
  - `ErgTable.tsx`: Bảng dữ liệu mật độ cao (dense table) tối ưu hiển thị danh sách lớn.
  - `ErgTextField.tsx`, `ErgSelect.tsx`: Trường nhập liệu đồng bộ validation và spacing.
  - `ErgBadge.tsx`: Huy hiệu trạng thái với 4 màu nghiệp vụ (success, warning, error, info).
  - `charts/`: Wrapper biểu đồ tích hợp palette màu ERG.
  - `offline/`: Huy hiệu và thanh báo trạng thái mất kết nối mạng.
- **`portal/` (Layout khung hệ thống Portal):**
  - `ErgPortalLayout.tsx`: Khung giao diện toàn màn hình phối hợp Sidebar + Header + Workspace.
  - `ErgPortalSidebar.tsx`: Thanh điều hướng bên trái (280px), tự động gập/mở, phân cấp menu.
  - `ErgPortalHeader.tsx`: Thanh tiêu đề (64px) chứa thông tin workspace, tài khoản, thông báo.
  - `portal-workspace-switcher.tsx`: Menu thả xuống chuyển đổi tức thì giữa 4 workspaces (ADMIN / TEACHER / STUDENT / CRM).
  - `portal-sidebar-logo.tsx`: Hiển thị logo ERG và trạng thái phân hệ hiện hành.
- **`quiz/` (Bộ hiển thị đề thi & câu hỏi):**
  - `questions/matching-question.tsx`: Giao diện nối cột/ghép thẻ câu hỏi (được bảo vệ, không sửa đổi layout).
  - `questions/multiple-choice-question.tsx`: Giao diện câu hỏi trắc nghiệm một/nhiều lựa chọn.
  - `questions/fill-blank-question.tsx`: Giao diện câu hỏi điền từ vào chỗ trống.
  - `quiz-timer.tsx`: Đồng hồ đếm ngược thời gian làm bài, cảnh báo khi sắp hết giờ.
  - `quiz-progress-bar.tsx`: Thanh tiến độ hiển thị câu đã làm / chưa làm.
- **`shared/` (Components nghiệp vụ dùng chung):**
  - Dialog xác nhận, thanh tìm kiếm nâng cao, màn hình trạng thái rỗng (Empty State), bộ lọc ngày tháng.
- **`ui/` (Legacy components):**
  - Bộ linh kiện cũ dựa trên Radix/shadcn được giữ lại tương thích ngược cho các màn hình chưa chuyển đổi.

---

#### `src/features/` — Nghiệp vụ kinh doanh (Feature Modules)

Mỗi module trong `src/features/` là một đơn vị độc lập hoàn chỉnh, bao gồm API client, components giao diện, hooks nghiệp vụ và kiểu dữ liệu:

1. **`lcms/` (Nghiệp vụ phân hệ ADMIN - Quản trị học thuật & vận hành trường):**
   - *Ghi chú: Thư mục vật lý `lcms` phục vụ toàn bộ nghiệp vụ của phân hệ **ADMIN** (thuật ngữ cũ LCMS đã khai tử).*
   - `admin-content/`: Soạn thảo và duyệt nội dung giáo trình, học liệu.
   - `admin-operations/`: Quản lý chương trình khung, phân phối kế hoạch dạy học, biểu đồ lộ trình môn học (`curriculum-roadmap-view`).
   - `quiz/quiz-editor/`: Trình soạn thảo ngân hàng câu hỏi, tạo đề thi ma trận, thiết lập cấu hình chấm điểm.
   - `school-management/`: Quản lý cơ cấu phân hiệu, khối lớp, phân môn, gán học sinh, hỗ trợ nhập liệu học sinh/lớp học qua file Excel (`class-import-dialog`, `student-spreadsheet-grid`).
   - `imports/`: Bộ chuyển đổi và nạp dữ liệu từ Google Sheets/CSV (`google-sheets-csv-adapter.ts`).
2. **`elearning/` (Nghiệp vụ phân hệ STUDENT - Học tập & Thi trực tuyến):**
   - *Ghi chú: Thư mục vật lý `elearning` phục vụ toàn bộ nghiệp vụ của phân hệ **STUDENT** (thuật ngữ cũ E-Learning đã khai tử).*
   - `student-dashboard/`: Bảng điều khiển học tập của học sinh trên Web và Mobile.
   - `competencies/`: Lộ trình phát triển kỹ năng và chuẩn đầu ra học sinh.
   - `content-player/`: Trình phát bài giảng đa phương tiện và học liệu số.
   - `portable-exam/`: Phòng thi ngoại tuyến độc lập cho học sinh.
3. **`lms/` (Nghiệp vụ phân hệ TEACHER - Vận hành lớp học):**
   - `classroom/`: Quản lý buổi học, điểm danh sĩ số từng tiết, nhận xét học viên.
   - `weekly-class-log/`: Sổ đầu bài điện tử ghi nhận tiến trình từng tuần.
   - `offline-teaching/`: Bộ đệm lưu trữ dữ liệu lớp học khi giáo viên giảng dạy tại nơi không có kết nối Internet.
   - `learning-resources/`: Thư viện tài liệu đính kèm bài học.
   - `mobile/`: Giao diện tinh gọn cho giáo viên thao tác nhanh trên điện thoại.
4. **`crm/` (Nghiệp vụ phân hệ CRM - Khách hàng & Tuyển sinh):**
   - Quản lý Leads, Contacts, cơ hội tuyển sinh, pipeline chuyển đổi, chăm sóc học viên.
5. **`access-management/`**:
   - Quản lý phân quyền người dùng (RBAC), ma trận vai trò (Admin, Manager, Teacher, Student), chính sách truy cập tài nguyên.
6. **`audit/`**:
   - Ghi nhận nhật ký hệ thống, lịch sử thao tác của người dùng, báo cáo kiểm toán bảo mật.
7. **`desktop-release/`**:
   - Tích hợp phát hành phiên bản máy tính (Tauri desktop), kiểm tra bản cập nhật, gói cài đặt ngoại tuyến.
8. **`employee-management/`**:
   - Quản lý nhân sự và đội ngũ giảng viên: hồ sơ giáo viên, phòng ban, phân công chuyên môn, điểm danh nhân sự.
9. **`integrations/`**:
   - Tích hợp dịch vụ bên ngoài: Google Drive lưu trữ tài liệu, Google Calendar lịch giảng dạy, nền tảng học trực tuyến.
10. **`notifications/`**:
    - Hệ thống thông báo nội bộ, chuông thông báo header, phân loại cảnh báo theo phân hệ.
11. **`portable-package-export/`**:
    - Đóng gói toàn bộ đề thi, học liệu và bài kiểm tra thành file nén zip mã hóa để chuyển giao cho các phòng thi offline.
12. **`profile/`**:
    - Quản lý thông tin cá nhân, cài đặt bảo mật hai lớp (2FA), tùy chọn giao diện cá nhân.
13. **`reporting/`**:
    - Báo cáo số liệu quản trị, biểu đồ tăng trưởng, thống kê kết quả học tập và năng suất giáo viên.
14. **`runtime-stubs/`**:
    - Dữ liệu mẫu (mock data fixtures) hỗ trợ chạy kiểm thử và phát triển tính năng cục bộ khi backend chưa sẵn sàng.
15. **`teaching-calendar/`**:
    - Thời khóa biểu giảng dạy, lưới hiển thị lịch học theo tuần/tháng, kiểm tra trùng lịch giáo viên/phòng học.

---

#### `src/platform/` — Hạ tầng nền tảng (Platform Infrastructure)

- **`auth/` (Hệ thống xác thực & phân quyền):**
  - `api/auth-token-storage.ts`: Quản lý lưu trữ an toàn JWT Access Token & Refresh Token.
  - `components/portal-login-page.tsx`: Màn hình đăng nhập doanh nghiệp hợp nhất.
  - `components/portal-route-gates.tsx`: Các cổng chặn (Gates) bảo vệ route yêu cầu đăng nhập.
  - `permissions/workspace-capability-projection.ts`: Tính toán quyền hạn của người dùng tương ứng với phân hệ đang mở.
- **`workspaces/` (Hệ thống phân vùng không gian làm việc):**
  - `workspace-domain.ts`: Định nghĩa 4 workspace chính thức (`ADMIN`, `TEACHER`, `STUDENT`, `CRM`).
  - `workspace-switcher.ts`: Chuyển đổi ngữ cảnh làm việc giữa các workspace.
  - `workspace-paths.ts`: Điều hướng đường dẫn tương ứng với vai trò (`/admin`, `/teacher`, `/student`, `/`).
  - `workspace-route.ts`: Chuẩn hóa hostname và route domain cho từng workspace.
- **`offline/`**:
  - Quản lý đồng bộ ngầm khi khôi phục mạng, lưu trữ IndexedDB, giám sát trạng thái trực tuyến/ngoại tuyến.
- **`desktop/`**:
  - Giao tiếp với lớp Tauri Rust: gọi native dialog, ghi đọc file cục bộ, thoát toàn màn hình khi làm bài thi.
- **`i18n/`**:
  - Đa ngôn ngữ (Tiếng Việt `vi`, Tiếng Anh `en`), từ điển dịch thuật và hook `useTranslation`.

---

#### `src/lib/` — Thư viện tiện ích, Data Fetching & API Layer

- **`api/`**:
  - `create-api-client.ts`: Tạo instance fetcher có gắn kèm Token, refresh tự động và gắn mã lỗi chuẩn.
  - `generated/erg-openapi.ts`: Toàn bộ TypeScript types được sinh tự động từ OpenAPI REST contract.
  - `generated/graphql.ts`: Toàn bộ types & operations được sinh tự động từ GraphQL schema.
- **`api-client.ts`**: Client REST API chính của toàn bộ hệ thống.
- **`graphql-client.ts`**: Client GraphQL thực thi queries và mutations.
- **`query-client.ts`**: Cấu hình `QueryClient` của TanStack Query với các mức `staleTime`, `gcTime` và chính sách retry.
- **`query-persistence.ts`**: Lưu trữ cache truy vấn xuống bộ nhớ trình duyệt để hoạt động ngoại tuyến.
- **`quiz.ts` & `assessment-engine.ts`**: Bộ máy xử lý và chấm điểm bài kiểm tra, tính tỷ lệ điểm từng loại câu hỏi.
- **`network-quality.ts`**: Nhận biết tốc độ kết nối (3G, 4G, Wifi) để tự động nén kích thước ảnh và tối ưu tải dữ liệu.
- **`client-telemetry.ts`**: Ghi nhận hiệu năng và lỗi giao diện người dùng.

---

#### `src/routes/` — Cấu hình Route tập trung (TanStack Router)

- **`app-routes.tsx`**: File trung tâm khởi tạo Route Tree của ứng dụng:
  - Khởi tạo Router Context (thông tin Auth, Workspace).
  - Cấu hình điều hướng dựa trên subdomain hoặc path (`/admin`, `/teacher`, `/student`, `/crm`).
  - Gắn kèm các Route Error Boundary và Suspense Pending Skeletons.
- **`route-feedback.tsx`**: Component hiển thị khung xương tải trang (Skeleton loading) và giao diện báo lỗi (Error Fallback).

---

#### `src/themes/` — Theme giao diện & Design Tokens

- **`erg-enterprise-tokens.ts`**: Khai báo bảng mã màu chuẩn (Primary tím `#696CFF`, Success xanh lục, Warning cam, Neutral xám,...), bán kính bo góc (border radius 8px), bóng đổ và khoảng cách.
- **`erg-enterprise-theme.tsx`**: Tạo MUI Theme instance với typography chuẩn (Manrope cho chữ thông thường, JetBrains Mono cho số/mã lệnh) và overrides cho MUI Material.
- **`ErgMuiProvider.tsx`**: Provider bọc ngoài ứng dụng cung cấp Theme của MUI Material.

---

#### `src/stores/` — Quản lý State toàn cục

- **`persisted-store.ts`**: Lưu trữ các tùy biến trạng thái người dùng (trạng thái thu gọn sidebar, phân hệ được chọn gần nhất, tùy chọn hiển thị bảng dữ liệu).

---

## 4. Các lệnh thực thi thông dụng (CLI Commands)

| Lệnh | Mục đích thực hiện |
| :--- | :--- |
| `bun run dev` | Khởi chạy máy chủ phát triển cục bộ Vite (HMR). |
| `bun run build` | Kiểm tra kiểu dữ liệu (`tsc -b`) và đóng gói mã nguồn sản phẩm (`vite build`). |
| `bun run typecheck` | Chạy trình biên dịch TypeScript để phát hiện toàn bộ lỗi kiểu dữ liệu. |
| `bun run test` | Thực thi toàn bộ bộ kiểm thử đơn vị & tích hợp với Vitest. |
| `bun run contract:check` | Kiểm tra tính toàn vẹn của hợp đồng API (OpenAPI & GraphQL) với backend `erg-spring`. |
| `bun run verify:api-contract` | Cổng kiểm tra toàn diện: Check contract drift + Typecheck + API tests. |
| `bun run contract:rest:sync` | Đồng bộ hợp đồng REST OpenAPI mới từ repo backend và sinh lại types. |
| `bun run contract:graphql:sync`| Đồng bộ schema GraphQL mới từ backend và chạy GraphQL Code Generator. |
| `bun run lint` | Quét kiểm tra lỗi cú pháp và tiêu chuẩn code bằng ESLint. |
| `bun run e2e` | Chạy kiểm thử tự động toàn diện từ đầu đến cuối với Playwright. |
| `bun run portable:build` | Đóng gói phiên bản giao diện phòng thi ngoại tuyến cho ứng dụng desktop. |
| `bun run tauri:dev` | Khởi chạy ứng dụng máy tính Tauri v2 trong môi trường phát triển. |

---

## 5. Hướng dẫn nhanh cho AI Agents khi sửa mã (Agent Working Rules)

1. **Khi thêm màn hình hoặc tính năng mới:**
   - Sử dụng đúng 4 phân hệ chính thức: **ADMIN** (`/admin`), **TEACHER** (`/teacher`), **STUDENT** (`/student`), **CRM** (`/`).
   - Tuyệt đối không khai báo hoặc hiển thị các thuật ngữ cũ đã khai tử: `LCMS`, `E-Learning`.
   - Sử dụng các linh kiện chuẩn tại `src/components/erg-mui/`.
   - Tạo trang mỏng tại `src/app/pages/` để nhúng feature component vào.
   - Khai báo đường dẫn vào `src/app/portal-route-registry.ts` và tích hợp vào cây route tại `src/routes/app-routes.tsx`.
2. **Khi tương tác với Backend:**
   - Dùng các types đã sinh sẵn từ `@/lib/api/generated/erg-openapi` hoặc `@/lib/api/generated/graphql`.
   - Không tự ý sửa tay các file trong `src/lib/api/generated/` hoặc `contracts/backend/`.
3. **Tuyệt đối không vi phạm:**
   - Không sửa cấu trúc hoặc hiệu ứng kéo thả của `src/components/quiz/questions/matching-question.tsx`.
   - Không tự ý sinh lại các file logs/screenshots rác vào thư mục gốc dự án.
