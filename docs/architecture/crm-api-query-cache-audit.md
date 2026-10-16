# Audit CRM API, Query và Cache

Ngày audit: 2026-07-28  
Task: `ERG-038`  
Phạm vi: `src/features/crm`, route/page/bundle entry liên quan

## Kết luận Senior

CRM hiện là prototype chạy hoàn toàn bằng fixture và React local state, chưa phải một client của backend. Tên file `seo-crm-api.ts` gây hiểu nhầm: file chỉ chứa bốn tập dữ liệu mẫu và các hàm tính P&L thuần, không gọi REST/GraphQL, không có tenant/auth boundary và không có cache production.

Không nên tách `SeoCrmWorkspace` trước khi dựng data boundary. Nếu split ngay, fixture/local mutation sẽ bị phân tán sang nhiều component và làm migration API khó hơn. Thứ tự bắt buộc:

1. contract/endpoint và transport client;
2. DTO parser/mapper và domain types;
3. query keys, query options, cache policy, cancellation;
4. mutation/invalidation/optimistic policy;
5. integration tests;
6. split workspace `ERG-039` mà không đổi UI.

## Inventory source và bundle

| File | Dòng | Trách nhiệm hiện tại | Nhận xét |
|---|---:|---|---|
| `components/crm-portal-shell.tsx` | 409 | Menu, route resolution, header, scope và DashboardContent | God shell; dùng `router-compat`, LMS mock IDs và header riêng |
| `seo/components/seo-crm-workspace.tsx` | 702 | Sáu màn CRM, search/filter, local mutations, presentation | God workspace; Lucide, legacy wrappers/Tailwind và local state |
| `seo/api/seo-crm-api.ts` | 229 | Fixtures và P&L helpers | Không phải API; nên tách fixture khỏi transport sau khi contract có |
| `seo/types/seo-crm-types.ts` | 102 | Domain-like types | Handwritten, chưa map từ generated DTO |
| `index.ts`, `seo/index.ts` | 10 | Export boundary | Nhỏ và chấp nhận được |

Entry page `src/app/pages/crm/crm-page.tsx` mỏng và chỉ compose `CrmPortalShell`. `SeoCrmWorkspace` được lazy-load trong `DashboardContent`, vì vậy bundle entry của workspace đã code-split. Tuy nhiên toàn bộ sáu surface cùng nằm trong chunk 702 dòng và import icon/legacy UI chung.

## Route inventory

| Route | Variant | Dữ liệu chính |
|---|---|---|
| `/` hoặc `/seo` | `seo-overview` | Leads, opportunities, P&L, follow-ups |
| `/seo/schools` | `seo-schools` | School leads |
| `/seo/opportunities` | `seo-opportunities` | Opportunities |
| `/seo/pnl` | `seo-pnl` | Revenue/cost/P&L |
| `/seo/follow-ups` | `seo-followups` | Follow-up actions |
| `/seo/handover` | `seo-handover` | Handover checklist/status |

Shell vẫn import `useLocation/useNavigate` từ `router-compat`; native TanStack Router migration thuộc `ERG-072`. Audit không sửa route để tránh trộn scope.

## API/query/cache matrix

| Data set | Nguồn hiện tại | Mutation hiện tại | Query key mục tiêu | Cache class | Scope/persist | Cancellation | Invalidation mục tiêu |
|---|---|---|---|---|---|---|---|
| School leads | `seoSchoolLeads` fixture | `setLeads` trong workspace | `crmKeys.leads({ tenantId, accountId, filters })` | transactional | tenant + account; không persist mặc định | `AbortSignal` tới REST/GraphQL client | entity/list đúng filter; không invalidate toàn cache |
| Opportunities | `seoOpportunities` fixture | Không có server mutation | `crmKeys.opportunities({ tenantId, leadId })` | transactional | tenant + account | bắt buộc | opportunity + lead summary |
| P&L | Tính từ fixture bằng helper | Local lead status | `crmKeys.pnl({ tenantId, opportunityId })` | transactional/sensitive-commercial | tenant; không offline persist nếu chưa có policy | bắt buộc | P&L entity + pipeline summary |
| Follow-ups | `seoFollowUps` fixture | Chỉ filter local | `crmKeys.followUps({ tenantId, ownerId, status })` | realtime/transactional | tenant + account; TTL ngắn | bắt buộc | exact follow-up/list prefix |
| Handover | `seoHandoverRequests` fixture | `setLeads` đổi status | `crmKeys.handovers({ tenantId, status })` | transactional | tenant + account | bắt buộc | handover + lead/opportunity summary |

Không có query key, `useQuery`, `useMutation`, `staleTime`, `gcTime`, `setQueryData`, `invalidateQueries` hoặc persisted-cache policy trong CRM hiện tại.

## Contract và DTO boundary

Hiện thiếu toàn bộ:

- endpoint CRM trong generated OpenAPI/GraphQL contract và `API_ENDPOINTS`;
- typed transport request/response;
- runtime validation cho response quan trọng;
- DTO-to-domain mapper;
- error normalization, request correlation và partial-error policy;
- authorization/permission và tenant-isolation test;
- pagination/filter/sort contract;
- idempotency/optimistic-locking behavior cho mutation quan trọng.

`seo-crm-types.ts` đang là domain-like model. Không thay thế trực tiếp bằng generated DTO; transport type phải dừng ở API boundary rồi map sang domain model để UI/P&L không phụ thuộc nullability/naming của backend.

## Cache và offline phản biện

CRM không nên mặc định dùng offline persistence như attendance/scores/homework. Lead contact, pricing, cost và margin là dữ liệu thương mại có scope nhạy cảm. Chỉ bật persistence khi có policy mã hóa/expiry/account eviction rõ ràng; auth logout, đổi tenant hoặc đổi account phải xóa scope cũ.

Đề xuất baseline:

- leads/opportunities/P&L: `staleTime` ngắn-trung bình, background refetch, không persist;
- follow-ups: stale ngắn hơn, refetch theo focus/explicit event;
- reference catalogs nếu có: stale dài và có thể persist theo tenant;
- mutation trả entity đầy đủ thì `setQueryData`; nếu không, invalidate prefix nhỏ nhất.

## Cancellation và stale response

Hiện không có request nên cũng không có cancellation. Khi triển khai API, query function phải nhận `signal` từ TanStack Query và truyền xuyên transport. Abort không được chuyển thành toast auth/network. Search/filter phải đưa dependency vào query key hoặc debounce trước query; response cũ không được ghi đè filter mới.

## Test coverage

Trước audit không có test CRM. Audit thêm characterization cho P&L seeded opportunity:

- gross revenue `4.096.400.000`;
- discount `319.200.000`;
- net revenue `3.777.200.000`;
- total cost `411.600.000`;
- gross profit `3.365.600.000`;
- break-even `699` students.

Các test còn thiếu phải thuộc implementation task:

1. response validation/mapper;
2. query-key tenant/account/filter isolation;
3. AbortSignal và stale-response race;
4. mutation success/error/rollback/invalidation;
5. auth/permission/tenant denial;
6. pagination/partial response;
7. route smoke cho sáu surface;
8. workspace UI regression trước/sau `ERG-039`.

## Vấn đề kiến trúc ngoài data boundary

- `crm-portal-shell.tsx` import `defaultSchoolId/defaultClassId` từ LMS mock: production CRM không được phụ thuộc LMS fixture.
- Workspace import trực tiếp `lucide-react`: xử lý trong `ERG-073`.
- Route compatibility: xử lý trong `ERG-072`.
- Workspace 702 dòng: xử lý trong `ERG-039` sau API boundary.
- Shell 409 dòng và header bespoke: cần đưa vào scope split sau khi route/data ổn định; không thay UI trong audit.
- Không có skeleton/error boundary riêng cho request vì hiện không có request; implementation phải dùng skeleton initial-load và non-blocking background refetch.

## Task correction

Audit tạo `ERG-081 — Triển khai CRM API/query/cache boundary`. `ERG-039` phải phụ thuộc cả `ERG-038` và `ERG-081`. Không coi `ERG-038` là đã triển khai backend connectivity; nó chỉ chứng minh baseline và khóa remediation order.

## Acceptance evidence

- Inventory source/route/data/bundle hoàn chỉnh.
- P&L characterization test xanh.
- `ERG-081` có scope và DoD đo được trong workbook.
- Dependency `ERG-039` ngăn split trước data boundary.
- Không thay đổi UI hoặc runtime CRM trong audit.
