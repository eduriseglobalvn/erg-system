# Audit ELEARNING API, Query, Cache và Offline

Ngày audit: 2026-07-28  
Task: `ERG-040`  
Phạm vi: `src/features/elearning`, query persistence và route entry liên quan

## Kết luận Senior

ELEARNING đã có nền tảng tốt hơn CRM: generated GraphQL types, mapper transport-to-domain, query key có tenant/account, policy `offlineCore` và IndexedDB persistence theo scope. Tuy nhiên boundary chưa hoàn chỉnh vì `useQuery` nằm trong workspace 1.742 dòng, query không truyền `AbortSignal`, API mode vẫn hiển thị mock profile trong lúc loading, và discussion/read-state chỉ tồn tại local.

Không split `StudentDashboardWorkspace` trước khi hoàn thiện boundary. Nếu split ngay, query/timer/mock/local mutations sẽ bị phân tán và làm khó chứng minh offline correctness.

## Inventory source và bundle

| Thành phần | Dòng | Trách nhiệm | Đánh giá |
|---|---:|---|---|
| `student-dashboard-workspace.tsx` | 1.742 | Query, loading fallback, announcements, discussions, quiz navigation, local attempt cleanup và presentation | God workspace; `ERG-022` |
| `student-dashboard-discussion-view.tsx` | 1.270 | Discussion feed và tương tác | God file; `ERG-041` |
| `student-dashboard-api.ts` | 301 | GraphQL request, generated DTO types, mapper profile/assignment/announcement | Boundary có nền tảng nhưng thiếu signal/parser |
| `mock-student-dashboard.ts` | 331 | Demo fixture | Chỉ hợp lệ khi không cấu hình API; cleanup production graph thuộc `ERG-074` |
| `student-dashboard-scores-view.tsx` | 298 | Score presentation | UI scope, không đổi trong audit |
| `discussion-feed-state.ts` | 232 | Pure discussion reducer/state helpers | Có unit tests |
| `student-dashboard-workspace.copy.tsx` | 198 | `viCopy/enCopy` locale content | Tên dễ hiểu nhầm là backup; thực tế đang được import |

`src/app/pages/elearning/elearning-page.tsx` mỏng và chỉ compose `StudentDashboardWorkspace`. Feature được đi qua app route/page boundary; workspace/quiz surfaces đã có lazy boundaries ở shell/router hiện tại. Audit không thay routing.

## GraphQL và DTO boundary

Điểm đạt:

- `student-dashboard.graphql` khai báo operation `ElearningStudentDashboard`.
- Generated types `ElearningStudentDashboardQuery` và variables được dùng trong API.
- API map response sang `StudentDashboardApiData`, không đưa raw GraphQL DTO trực tiếp vào UI.
- API-enabled empty assignments/announcements được giữ empty, không tự refill fixture.
- GraphQL errors được propagate để TanStack Query xử lý.

Điểm chưa đạt:

- Runtime vẫn nhúng thêm một chuỗi `ElearningStudentDashboardDocument`; operation có hai source cần đồng bộ thủ công.
- Không có runtime parser cho payload critical; `as never` trong test che nullability mismatch.
- `loadStudentDashboardData()` không nhận `AbortSignal`; `graphQlRequest` có hỗ trợ signal nhưng caller không truyền.
- Input tenant lấy từ default tenant helper; cần integration test chứng minh backend không tin client-controlled tenant.
- Mapping dùng nhiều fixture default (`studentDashboardProfile`, `sampleQuiz`) khi field thiếu; cần phân biệt compatibility default với mock data leakage.

## Query/cache/offline matrix

| Data family | Transport/query hiện tại | Key/policy | Persistence | Isolation | Cancellation | Mutation/invalidation |
|---|---|---|---|---|---|---|
| Profile/summary | GraphQL dashboard query | `student-dashboard / tenant / account`; `offlineCore` | Có, IndexedDB | portal persister + tenant/account key | Thiếu signal | Read-only |
| Assignments/courses/actions | Cùng dashboard query | Cùng key; stale 5 phút, GC 24 giờ | Có | Đạt ở key/storage scope | Thiếu signal/stale-race test | Không có command tại boundary này |
| Teacher announcements | Cùng dashboard query | Cùng key | Bị persist cùng dashboard | Tenant/account | Thiếu signal | Read IDs chỉ local state; không sync |
| Discussions | Static seed + local reducer | Không có query key | Không phải persisted query | Không có server tenant/account enforcement | Không áp dụng | Local create/reaction/notification only |
| Quiz attempts | `localQuizAttemptStore` | Ngoài dashboard query | Local attempt store | Theo assignment/quiz; cần account/tenant review | Không áp dụng | Cleanup demo marker bằng localStorage |
| Announcement popup/read state | React state + debounced timers | Không có query key | Mất khi reload | Chỉ trong component | Timer cleanup phụ thuộc hook | Không sync server |

## Persistence phản biện

Điểm đạt:

- `isPersistableQuery` chỉ cho `student-dashboard` và các offline-core LMS families.
- Auth/security/notification/token/credential/session patterns bị loại.
- Storage key được scope `portal:tenant:account` và đổi scope sẽ clear persisted data cũ.
- Cache buster version hóa serialized shape.

Rủi ro:

- Dashboard query persist cả profile và announcements cùng assignments; cần xác định dữ liệu nào thực sự cần offline.
- API mode trước khi query hoàn tất dùng `studentDashboardProfile` fixture làm profile fallback, có thể hiển thị danh tính/demo data không thuộc account hiện tại.
- `refetchOnWindowFocus: false` có thể giữ announcements/action cũ lâu hơn mong muốn; cần event/refetch policy rõ.
- Không có test hydrate expired cache, đổi tenant/account giữa session hoặc stale response sau filter/account switch.
- Memory fallback khi IndexedDB lỗi là best-effort và mất khi reload; UI phải phân biệt “offline cache không khả dụng”.

## Loading, cancellation và stale response

`queryFn: loadStudentDashboardData` bỏ qua context `{ signal }`. Vì vậy navigation/account switch không hủy request GraphQL dù `graphQlRequest` hỗ trợ signal. Remediation phải dùng:

```ts
queryFn: ({ signal }) => loadStudentDashboardData({ signal })
```

API phải truyền signal tới `graphQlRequest`. Abort không được chuyển thành auth/network toast. Query key đã chứa tenant/account, nhưng vẫn cần test chứng minh response account cũ không cập nhật surface mới sau switch.

Initial load phải dùng skeleton. Khi API enabled và chưa có hydrated cache đúng scope, không hiển thị mock profile/assignments. Background refetch được giữ dữ liệu cache hợp lệ và không block toàn màn hình.

## Mock và offline không đồng nghĩa

`hasApiBase() === false` hiện bật fixture cho demo/local development. Đây không phải offline production. Offline production là persisted query/attempt data đã lấy từ backend và được scope đúng identity. `ERG-074` phải tách mock khỏi production graph; không dùng fixture khi request thật lỗi hoặc thiết bị mất mạng.

## Test coverage

Hiện có:

- API fallback/error/empty-response: 3 tests.
- Discussion feed state: reducer/filter/notification tests.
- Discussion overview: aggregation tests.
- Query key, cache policy và persistence eligibility/scope tests ở `src/lib`.

Còn thiếu:

1. AbortSignal propagation từ query tới GraphQL fetch.
2. Runtime parser invalid-payload behavior.
3. API-mode initial loading không lộ mock profile.
4. Hydration đúng/sai buster và tenant/account switch eviction.
5. Stale response race khi account/tenant đổi.
6. Offline cache unavailable/expired behavior.
7. Discussion/announcement commands, rollback/invalidation và permission denial.
8. Workspace characterization/skeleton/error UI trước `ERG-022`.

## Remediation order

Audit tạo `ERG-082 — Hoàn thiện ELEARNING API/query/offline boundary`.

Thứ tự:

1. `ERG-030` integration harness và `ERG-057` signal foundation.
2. Runtime validation `ERG-017` và mutation invalidation policy `ERG-029`.
3. `ERG-082`: query hook/API signal, generated operation source, parser, loading isolation, offline scope tests và discussion/announcement commands.
4. `ERG-022`: split workspace, giữ UI.
5. `ERG-041`: split discussion view/feed trên command/query boundary đã ổn định.
6. Chạy lại acceptance phần còn lại của `ERG-040` trên structure mới.

## Task correction

- `ERG-022` phụ thuộc `ERG-040, ERG-075, ERG-082`.
- `ERG-041` phụ thuộc `ERG-022, ERG-040, ERG-082`.
- `ERG-082` có scope API/hooks/query persistence và DoD đo được; không gộp vào god-file split.

## Acceptance evidence

- API/query/cache/offline/cancellation status được ghi cho mọi data family.
- Focused API/discussion/persistence tests chạy độc lập.
- Full FE suite xanh.
- Không thay đổi UI, Matching hoặc runtime behavior trong audit.

## Implementation receipt 2026-07-28 — ERG-082

Phần read/query/offline đã được triển khai bằng TDD: API dùng trực tiếp `student-dashboard.graphql?raw` làm operation source duy nhất; TanStack Query truyền `AbortSignal` và tenant tới GraphQL transport; nested dashboard DTO được validate trước mapping; API mode không còn lấy identity/class/school từ fixture; feature query key cô lập tenant/account; anonymous dashboard không được persist; cache buster tăng lên `erg-query-cache-v3`.

Phần discussion/announcement command vẫn bị chặn bởi contract BE đã kiểm chứng. Vendored GraphQL chỉ có ELEARNING dashboard read và các mutation Teaching Schedule; OpenAPI không có discussion create/reply/reaction hoặc ELEARNING announcement-read command. REST notification `markRead` là notification-center contract, không phải class-announcement command và không được dùng thay thế. Unblock yêu cầu BE publish các operation versioned sau với tenant/account authorization, idempotency và normalized error DTO: discussion list/create/reply/reaction và announcement read. FE phải sync contract rồi tiếp tục RED tests cho optimistic rollback/invalidation; không bịa endpoint hoặc coi local React state là server success.
