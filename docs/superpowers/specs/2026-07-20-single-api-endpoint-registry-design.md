# Thiết kế một registry endpoint REST duy nhất cho ERG

## Mục tiêu

Toàn bộ endpoint REST mà `erg-system` gọi tới `erg-spring` được định nghĩa tại đúng một file `src/lib/api/api-endpoints.ts`. Không còn chuỗi `"/api/..."` hoặc template literal `` `/api/...` `` nằm rải rác trong API module, component, transport hoặc auth code. Khi BE đổi endpoint, FE có một vị trí rõ ràng để cập nhật và TypeScript/OpenAPI phát hiện các chỗ không còn tương thích.

Đợt triển khai này migrate toàn bộ REST endpoint trong một lần tích hợp. Các commit kỹ thuật vẫn chia theo domain để dễ kiểm tra và phục hồi, nhưng cổng xác minh cuối chỉ cho phép hoàn tất khi không còn endpoint literal ngoài registry.

## Quyết định kiến trúc

Không dùng TypeScript `enum` thật vì enum không biểu diễn được endpoint động. Dùng một object immutable duy nhất:

```ts
export const API_ENDPOINTS = {
  auth: {
    login: "/api/v1/auth/login",
  },
  adminUsers: {
    root: "/api/v1/admin/users",
    detail: (userId: string) =>
      `/api/v1/admin/users/${encodeApiPathSegment(userId)}`,
  },
} as const;
```

Registry được nhóm theo domain để vẫn đọc được khi số endpoint lớn: `auth`, `accounts`, `adminUsers`, `access`, `notifications`, `calendar`, `schools`, `lms`, `lcms`, `quiz`, `curriculum`, `content`, `graphql` và các domain thực tế được phát hiện trong quá trình migrate. Đây vẫn là một object export và một file nguồn duy nhất, không tạo thêm route file theo feature.

Hai route file hiện tại của employee/access sẽ được hợp nhất vào registry rồi xóa:

- `src/features/employee-management/api/employee-management-routes.ts`
- `src/features/access-management/api/access-management-routes.ts`

## Quy tắc type và endpoint động

Mọi endpoint tĩnh dùng `satisfies ContractPath`. Endpoint động gọi chung `encodeApiPathSegment` cho từng path segment và trả về `ContractPath`. Không nối raw ID trong caller.

Query string không nằm trong enum: API module tiếp tục dùng `URLSearchParams`, sau đó nối vào base path lấy từ registry. Lý do là query là dữ liệu request, không phải danh tính endpoint; giữ query tại domain API giúp tránh biến registry thành nơi chứa business logic.

Nếu một endpoint đang được FE gọi nhưng không tồn tại trong OpenAPI, migration phải dừng và phân loại một trong hai trường hợp:

1. Endpoint BE hợp lệ nhưng thiếu contract: bổ sung/điều chỉnh Springdoc rồi xuất lại snapshot.
2. Endpoint FE legacy: chuyển sang endpoint canonical trước khi đưa vào registry.

Không thêm cast `string`, `any` hoặc nhánh `legacyEndpoints` để né contract.

## Phạm vi migrate

Quét toàn bộ `src/` và thay mọi REST path tới BE, bao gồm:

- transport: `api-client.ts`, `graphql-client.ts`, `lib/api.ts`;
- auth/account/security;
- employee/access management;
- LCMS admin operations;
- school management, curriculum và content;
- LMS dashboard, assignment và calendar;
- quiz editor, question bank và quiz runtime;
- notification APIs;
- các component hiện đang gọi `fetch`/`apiRequest` trực tiếp.

Không thay đổi business payload, query key, UI, auth behavior hoặc matching-question. URL bên thứ ba, blob URL, asset URL và browser-local URL không thuộc registry này.

## Luồng khi BE thay đổi

1. BE thay controller/DTO và xuất lại `contracts/openapi/erg-openapi.json`.
2. `oasdiff` chặn rename/xóa/type change không tương thích.
3. FE chạy `bun run contract:rest:sync` để cập nhật snapshot, checksum và generated type.
4. Nếu endpoint đổi, sửa đúng entry trong `API_ENDPOINTS` và các mapper chịu ảnh hưởng.
5. Chạy `bun run verify:api-contract`; typecheck và endpoint-literal guard phải xanh.

Thêm field optional thường chỉ cần sync/generate. Field bắt buộc, rename, xóa hoặc đổi kiểu phải sửa mapper/domain type; không sửa generated file thủ công.

## Cổng chống tái phát

Thêm test Node quét source và thất bại nếu phát hiện endpoint literal ngoài `src/lib/api/api-endpoints.ts` và file generated. Test phải bỏ qua test fixture, tài liệu, external URL và output sinh tự động.

Test registry xác minh:

- endpoint động encode `/`, khoảng trắng và ký tự đặc biệt;
- endpoint tĩnh quan trọng khớp OpenAPI;
- không còn import hai route file cũ;
- không có `"/api/` hoặc `` `/api/`` trong production source ngoài registry.

Guard được đưa vào `contract:check` và `verify:api-contract` để local và CI dùng cùng một tiêu chuẩn.

## Chiến lược triển khai và kiểm thử

Thực hiện TDD theo từng nhóm domain: viết test/guard thất bại, migrate tối thiểu, chạy test domain và typecheck, sau đó commit. Sau khi tất cả nhóm hoàn tất, chạy:

```powershell
bun run verify:api-contract
bun run lint
bun run build
git diff --check
```

Backend chạy contract tests, compile và breaking gate theo runbook hiện có. Không tuyên bố hoàn tất nếu guard vẫn tìm thấy một REST endpoint literal trong production source.

## Rủi ro và kiểm soát

- **File registry lớn:** giảm bằng object nhóm theo domain và thứ tự bảng chữ cái; không đặt DTO/business logic vào file này.
- **Working tree đang có thay đổi:** stage/commit bằng danh sách file chính xác; không reset hoặc ghi đè thay đổi ngoài endpoint migration.
- **Endpoint trùng/legacy:** ưu tiên path canonical trong OpenAPI; không giữ alias âm thầm.
- **Big-bang regression:** giữ nguyên function signature của từng API module và chạy test domain sau mỗi nhóm, rồi chạy full integration gate cuối.

## Tiêu chí hoàn tất

- Một file `src/lib/api/api-endpoints.ts` là nơi duy nhất định nghĩa REST path BE.
- Hai route file cũ bị xóa và không còn import.
- Production source không còn endpoint literal ngoài registry.
- Mọi endpoint registry hợp lệ theo OpenAPI hoặc được BE bổ sung contract rõ ràng.
- Contract sync, endpoint guard, typecheck, targeted tests, lint và build đều pass.
- Runbook mô tả đúng quy trình sửa endpoint/field mới.
