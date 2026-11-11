# 04 — Đồng nhất dữ liệu giữa các màn hình

Mục tiêu: một con số chỉ có **một nơi tính** (BE), mọi màn hình đọc từ đúng nơi đó. FE không tự tính lại số liệu nghiệp vụ.

## 1. Nguyên tắc (áp dụng cho mọi task)

1. **BE tính, FE hiển thị.** FE chỉ được làm tròn và định dạng. Không cộng, chia, lọc trạng thái để ra số liệu nghiệp vụ.
2. **Một số liệu, một hàm BE.** Hai màn hình cần cùng số liệu thì gọi cùng một truy vấn/đoạn JPQL dùng chung (mẫu: `J/lms/persistence/LatestHandedInAttempt.java`).
3. **Từ vựng trạng thái nằm ở BE** (`J/lms/LmsStatePolicy.java`). FE nhận cờ boolean đã tính sẵn, không giữ danh sách chuỗi.
4. **Một tài nguyên, một module API trên FE, một bộ query key.** Màn hình khác import module đó, không viết `apiRequest` riêng.
5. **Mọi đường dẫn FE gọi phải có trong contract BE.** Kiểm bằng `bun run contract:check` trong CI.
6. **Sau mutation, invalidate đúng key** của mọi màn hình hiển thị dữ liệu vừa đổi.

## 2. Ma trận số liệu → nguồn sự thật

Cột "Trạng thái": `LỆCH` = đã xác minh là khác nhau; `ĐÚNG` = đã xác minh cùng nguồn; `CHƯA SOÁT` = agent phải soát theo mục 4.

### 2.1 Điểm số

Định nghĩa đề xuất (chủ dự án đã yêu cầu cho trang học sinh): **điểm của một học sinh ở một bài giao = điểm lần nộp mới nhất**. Điểm trung bình = trung bình cộng các điểm đó.

| Số liệu | Màn hình | Hàm BE hiện tại | Trạng thái | Việc cần làm |
|---|---|---|---|---|
| Điểm TB của học sinh | Học sinh › Trang chủ, Tài khoản | `AttemptRepository.summarizeStudentDashboardScores` (dòng 443-471, có `LatestHandedInAttempt.OF_ATTEMPT`) | ĐÚNG (chuẩn tham chiếu) | — |
| Điểm từng bài đã nộp | Học sinh › Bài đã nộp | Card bài giao, join lần nộp mới nhất (`AssignmentRepository`, commit `f29cca4`) | ĐÚNG | — |
| Điểm TB của lớp | Giáo viên › Danh sách lớp, Báo cáo lớp (`src/features/lms/api/lms-classroom-api.ts:191`) | `AttemptRepository.summarizeClassWorkspaceScores` (dòng 427-441) — **mọi lượt làm** | **LỆCH** | Thêm `LatestHandedInAttempt.OF_ATTEMPT` |
| Điểm TB của bài giao | Giáo viên › Tiến độ bài giao | `StudentProgressRepository.summarizeAssignment` — `avg(student_progress.score)` | **LỆCH (nguồn khác)** | Xem 2.2 |
| Điểm TB trong báo cáo quiz | Báo cáo | `QuizReportService.java:98,124,135` — lấy từ summary, thiếu thì tự tính từ danh sách | **LỆCH (hai nhánh)** | Một nhánh duy nhất |
| Điểm TB từng học sinh trong lớp | Giáo viên › Quản lý lớp (`class-management-page.tsx:363,445-448`) | `StudentMetrics.averageScore` | CHƯA SOÁT | Truy nguồn, so với chuẩn |
| Xếp loại A/B/C/D/E | `class-management-page.tsx:445-448` — **FE tự tính** từ `averageScore` | — | **LỆCH nguyên tắc 1** | Chuyển ngưỡng xếp loại về BE hoặc về một hằng số dùng chung có test |
| Điểm cao nhất, số bài đạt | Học sinh › Trang chủ | cùng `summarizeStudentDashboardScores` | ĐÚNG | — |

### 2.2 `student_progress` so với `lms_attempts`

Hai bảng cùng giữ điểm. `student_progress` là bảng tổng hợp (một dòng cho mỗi học sinh × bài × bài giao); `lms_attempts` là sự thật gốc (một dòng mỗi lượt làm).

Việc phải làm (task `G3-02`):

1. Tìm mọi nơi ghi `student_progress.score` (`grep -rn "setScore\|progress.score" J/`). Ghi lại nó được cập nhật khi nào: mỗi lượt nộp, hay chỉ lượt đầu, hay lượt điểm cao nhất.
2. Viết test tích hợp: học sinh nộp 40 → 60 → 90; khẳng định `student_progress.score = 90` và ba màn hình (học sinh, lớp, tiến độ bài giao) cùng ra 90.
3. Nếu test đỏ: sửa nơi ghi cho đúng "lần nộp mới nhất". Nếu không sửa gọn được: đổi truy vấn tổng hợp sang đọc `lms_attempts` với `LatestHandedInAttempt`.
4. Chạy một câu đối soát trên bản sao dữ liệu thật (không phải production) và ghi số dòng lệch vào task:

```sql
select count(*) from student_progress p
join lateral (
  select a.percent from lms_attempts a
  where a.tenant_id = p.tenant_id and a.assignment_id = p.assignment_id
    and a.student_id = p.student_id
    and lower(a.status) in ('submitted','graded','completed','needs_review','review_required')
  order by a.updated_at desc, a.id desc limit 1
) latest on true
where p.score is distinct from latest.percent;
```

(Tên cột `student_id` của `student_progress` phải kiểm lại trong entity trước khi chạy.)

### 2.3 Số lượng và tiến độ

| Số liệu | Màn hình | Nguồn | Trạng thái |
|---|---|---|---|
| Số bài đã nộp / tổng số bài (ví dụ "1/3 bài") | Học sinh › Trang chủ | `summarizeStudentDashboardScores` + danh sách bài | ĐÚNG (đã kiểm ở phiên 10/11) |
| Số học sinh đã nộp của một bài | Giáo viên › Tiến độ | `student_progress` đếm `status = 'submitted'` — **không tính** `graded`, `completed` | **CẦN XÁC MINH**: `summarizeAssignment` chỉ đếm `submitted`; nếu bài đã chấm chuyển sang `graded` thì số "đã nộp" giảm |
| Sĩ số lớp | Danh sách lớp, Quản lý trường, Trang chủ admin | Nhiều read model (`lmsClassWorkspace`, `lcmsSchoolOperations`, `lcmsSchoolDirectory`) | CHƯA SOÁT |
| Số trường / học sinh / nhân sự | Admin › Trang chủ | Dùng chung cache với "Quản lý trường học" (learning `.trail/learnings/2026-11-05-the-admin-home-is-built-only-vuong.md`) | ĐÚNG theo learning; không soát lại |
| Tỉ lệ hoàn thành lớp | Báo cáo lớp (`class-reports-workspace.tsx:42`) | `selectedClass.completionRate` | CHƯA SOÁT |
| Số thông báo chưa đọc | Header mọi cổng | `/api/v1/notifications/unread-count` | CHƯA SOÁT (xem thêm DATA-05) |

### 2.4 Gọi sai chỗ (đã xác minh)

| FE gọi | Tình trạng BE | Thay bằng |
|---|---|---|
| `/api/lms/access-management/options`, `/scopes`, `/preview`, `/users`, `/users/{id}/access` | Không tồn tại → 403 | `/api/v1/roles`, `/api/v1/permissions/catalog`, `/api/v1/users/{id}/role-assignments`, `/api/v1/users/{id}/effective-permissions`, `/api/v1/users/{id}/preview` |
| POST `/api/lms/education-units`, PATCH `/api/lms/education-units/{id}` | Không tồn tại → 403 | `/api/v1/lms/education-units` (kiểm tra contract có POST/PATCH không; nếu không có thì ẩn chức năng) |
| `/api/lms/auth/accounts/{id}/avatar` | Không có trong contract | Kiểm tra nơi dùng; thay hoặc xoá |
| `/api/v1/users/{id}/access-scopes` | Không có trong contract | Kiểm tra nơi dùng |
| `/api/lms/attempts`, `/api/lms/quizzes` | Không có trong contract | Xoá nếu không còn nơi gọi |

Tái tạo danh sách này bất cứ lúc nào bằng script so sánh (đặt vào `scripts/check-api-endpoints-in-contract.mjs` ở task `G3-04`): đọc mọi chuỗi `/api/...` trong `src/lib/api/api-endpoints.ts`, chuẩn hoá `${...}` thành `{}`, so với khoá `paths` của `contracts/backend/erg-openapi.json`. Kết quả hôm 10/11: 173 đường dẫn FE, 25 không có trong contract (trong đó 8 là tiền tố gốc như `/api/v1`, hợp lệ).

## 3. Độ trễ chấp nhận được theo màn hình

BE cache L1/L2 TTL 30 s cho read model LMS (60 s cho danh mục, 15 phút cho cây chương trình, 10 phút cho gói quiz). FE: `realtime` 15 s, `transactional` 60 s, `reference` 10 phút, `offlineCore` 5 phút + lưu 24 giờ (`src/lib/query-policy.ts`).

| Màn hình | Sau hành động | Độ trễ tối đa chấp nhận | Cơ chế hiện có | Cần thêm |
|---|---|---|---|---|
| Học sinh › Trang chủ | Chính học sinh nộp bài | Tức thì | BE xoá cache theo học sinh (`LmsReadCacheInvalidator.java:78`) | FE: `invalidateQueries` key dashboard sau khi nộp — **kiểm tra có chưa** |
| Giáo viên › Tiến độ bài giao | Học sinh nộp | 60 s | BE xoá `lmsAssignmentProgress` theo phạm vi | Nút "Làm mới" + ghi "cập nhật lúc hh:mm" |
| Giáo viên › Danh sách lớp | Thêm/xoá học sinh | Tức thì với người thao tác, 60 s với người khác | `@CacheEvict(allEntries=true)` (PERF-05) | FE invalidate sau mutation |
| Học sinh › Danh sách bài | Giáo viên giao bài mới | 60 s | BE xoá `lmsStudentAssignments` | Thông báo đẩy mở lại danh sách |
| Admin › Trang chủ | Sửa trường | 60 s | Dùng chung cache | — |
| Bất kỳ màn hình `offlineCore` | Mất mạng rồi có lại | Hiện dữ liệu cũ + nhãn "đang ngoại tuyến" | `OfflineShellStatus` | Kiểm tra mọi màn hình persist đều có nhãn |

Màn hình nào không đạt cột "tối đa chấp nhận" thì tạo task con trong giai đoạn 3.

## 4. Quy trình soát một màn hình (cho các dòng CHƯA SOÁT)

Với mỗi màn hình có số liệu:

1. Mở component, tìm hook dữ liệu → hàm API → endpoint/operation.
2. Ở BE, tìm controller → service → repository → câu SQL/JPQL. Ghi `file:dòng`.
3. Ghi một dòng vào bảng 2.x: số liệu, màn hình, hàm BE.
4. Nếu số liệu này đã có dòng khác trong bảng với hàm BE khác → đó là lệch. So điều kiện lọc (trạng thái, khoảng ngày, lượt làm nào) và ghi khác biệt.
5. Nếu FE có phép tính (`reduce`, `filter(...).length`, chia phần trăm) trên dữ liệu nghiệp vụ → vi phạm nguyên tắc 1; chuyển về BE.
6. Viết một test tích hợp BE cho mỗi cặp màn hình cùng số liệu: cùng dữ liệu vào, hai endpoint ra cùng số.

Danh sách màn hình phải soát, theo thứ tự ưu tiên:

1. Học sinh: Trang chủ, Bài tập, Bài đã nộp, Tài khoản, Kết quả bài làm (đã soát điểm; còn phần thời gian làm bài, số câu đúng).
2. Giáo viên LMS: Danh sách lớp, Quản lý lớp, Báo cáo lớp, Tiến độ bài giao, Chấm bài tự luận (hàng chờ `needs_review`).
3. LCMS: Ngân hàng câu hỏi (số lần dùng), Ngân hàng đề, Quản lý trường học.
4. Admin: Trang chủ, Nhân sự, Phân quyền.
5. Chấm công: Hôm nay, Tháng, Duyệt đơn (số ngày công, số phút trễ — có bị tính ở cả FE và BE không).
6. Báo cáo xuất file: số trong file Excel/PDF phải bằng số trên màn hình cùng bộ lọc.

Lệnh tìm phép tính đáng ngờ ở FE:

```bash
grep -rnE "\.reduce\(|\.filter\([^)]*\)\.length|/ *[a-zA-Z.]+\.length|Math\.round\([^)]*\* *100" \
  --include=*.ts --include=*.tsx src/features | grep -v "\.test\."
```

Mỗi kết quả phải được phân loại: *định dạng hiển thị* (giữ) hay *tính số liệu nghiệp vụ* (chuyển về BE).

## 5. Múi giờ và ngày

Quy định đã có trong `CLAUDE.md` (FE): dùng `@/domain/formatters/format-date`, cấm `toISOString().split("T")[0]`. BE lưu `timestamptz`, JDBC `time_zone: Asia/Ho_Chi_Minh` (`application.yml`).

Điểm phải soát thêm (chưa làm trong đợt này):

- Hạn nộp bài: so `dueAt` ở FE dùng giờ máy học sinh. Máy lệch giờ → học sinh thấy "còn hạn" nhưng BE từ chối. BE là nơi quyết định; FE chỉ hiển thị và phải xử lý lỗi "quá hạn" rõ ràng.
- Chấm công: "hôm nay" phải do BE xác định (`/api/v1/timekeeping/me/clock` đã có) — kiểm tra FE không tự suy ra ngày.
- Báo cáo theo ngày: ranh giới ngày theo giờ Việt Nam ở cả truy vấn SQL (`at time zone 'Asia/Ho_Chi_Minh'`).

Lệnh kiểm nhanh FE:

```bash
grep -rnE "toISOString\(\)\.(split|slice)|new Date\(\)\.get(Date|Day|Month)|toLocale(Date|Time)?String\(\)" \
  --include=*.ts --include=*.tsx src | grep -v "\.test\."
```
