# Kế hoạch triển khai nền tảng hợp đồng API ERG

> **Dành cho agent thực thi:** BẮT BUỘC dùng `superpowers:executing-plans` để thực hiện tuần tự từng task. Mỗi bước sử dụng checkbox (`- [ ]`) để theo dõi.

**Mục tiêu:** Thiết lập nguồn OpenAPI có tính quyết định tại `erg-spring`, chặn breaking change, sinh REST type tái lập tại `erg-system`, sửa transport boundary và chuyển auth/employee-access sang path được kiểm tra bằng contract.

**Kiến trúc:** Backend sinh và chuẩn hóa một snapshot OpenAPI đã commit; `oasdiff` so sánh base/revision và fail khi có breaking change. Frontend pin snapshot/checksum, dùng `openapi-typescript` sinh type theo path/method, giữ DTO sinh tự động phía sau feature mapper và tiếp tục dùng transport hiện có qua domain client có portal/auth policy tường minh.

**Tech stack:** Spring Boot 4, Springdoc OpenAPI 3, Node.js test runner, oasdiff Docker v1.15.1, Bun, TypeScript 6, openapi-typescript 7, Vitest, TanStack Query 5.

---

## Ranh giới của kế hoạch này

Kế hoạch chỉ triển khai REST foundation và lát cắt auth/employee-access. GraphQL schema/document generation, quiz runtime validation và chuyển toàn bộ endpoint legacy được tách thành kế hoạch tiếp theo để mỗi đợt tạo ra phần mềm chạy được và kiểm chứng được.

Không sửa matching question, giao diện, business rule hoặc dữ liệu migration. Không ghi đè các thay đổi chưa commit đang tồn tại trong hai repo; mỗi commit chỉ stage đúng file của task.

## Cấu trúc file sau triển khai

### `D:/ERG/erg-spring`

```text
contracts/openapi/
├── erg-openapi.json            # Snapshot chuẩn hóa, nguồn REST contract
└── erg-openapi.sha256          # Checksum của snapshot
scripts/
├── openapi-contract-lib.cjs    # Normalize, stable stringify, checksum
├── openapi-contract-lib.test.cjs
├── export-openapi-contract.cjs # Đọc URL/file và xuất snapshot
├── check-openapi-breaking.cjs  # Wrapper oasdiff được pin version
└── check-openapi-breaking.test.cjs
```

### `D:/ERG/erg-system`

```text
contracts/backend/
├── erg-openapi.json
└── erg-openapi.lock.json
scripts/
├── api-contract-lib.mjs
├── api-contract-lib.test.mjs
└── sync-api-contract.mjs
src/lib/api/
├── contract-types.ts
├── create-api-client.ts
├── create-api-client.test.ts
└── generated/erg-openapi.ts
src/features/employee-management/api/
├── employee-management-routes.ts
└── employee-management-api.ts
src/features/access-management/api/
├── access-management-routes.ts
└── access-management-api.ts
```

---

### Task 1: Backend OpenAPI normalizer có tính quyết định

**Files:**
- Create: `D:/ERG/erg-spring/scripts/openapi-contract-lib.test.cjs`
- Create: `D:/ERG/erg-spring/scripts/openapi-contract-lib.cjs`

- [ ] **Bước 1: Viết test thất bại cho normalize và checksum**

```js
const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

const { normalizeOpenApi, stableJson, sha256 } = require("./openapi-contract-lib.cjs");

describe("OpenAPI contract normalization", () => {
  test("removes environment servers and sorts object keys recursively", () => {
    const normalized = normalizeOpenApi({
      servers: [{ url: "http://localhost:1606" }],
      paths: { "/z": { get: { responses: {} } }, "/a": { get: { responses: {} } } },
      openapi: "3.1.0",
      info: { version: "v1", title: "ERG" },
    });

    assert.deepEqual(Object.keys(normalized), ["info", "openapi", "paths", "servers"]);
    assert.deepEqual(normalized.servers, [{ url: "/", description: "Contract-relative server" }]);
    assert.deepEqual(Object.keys(normalized.paths), ["/a", "/z"]);
  });

  test("produces identical JSON and checksum for semantically identical key order", () => {
    const left = stableJson({ b: 2, a: { d: 4, c: 3 } });
    const right = stableJson({ a: { c: 3, d: 4 }, b: 2 });
    assert.equal(left, right);
    assert.equal(sha256(left), sha256(right));
  });
});
```

- [ ] **Bước 2: Chạy test để xác nhận RED**

Run: `node --test scripts/openapi-contract-lib.test.cjs`

Expected: FAIL với `Cannot find module './openapi-contract-lib.cjs'`.

- [ ] **Bước 3: Viết implementation tối thiểu**

```js
const crypto = require("node:crypto");

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, sortValue(value[key])]),
  );
}

function normalizeOpenApi(document) {
  if (!document || typeof document !== "object" || !document.openapi || !document.paths) {
    throw new Error("Input is not an OpenAPI document");
  }
  return sortValue({
    ...document,
    servers: [{ url: "/", description: "Contract-relative server" }],
  });
}

function stableJson(value) {
  return `${JSON.stringify(sortValue(value), null, 2)}\n`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

module.exports = { normalizeOpenApi, sha256, stableJson };
```

- [ ] **Bước 4: Chạy test để xác nhận GREEN**

Run: `node --test scripts/openapi-contract-lib.test.cjs`

Expected: 2 tests PASS.

- [ ] **Bước 5: Commit đúng hai file**

```powershell
git add -- scripts/openapi-contract-lib.cjs scripts/openapi-contract-lib.test.cjs
git commit -m "build: add deterministic OpenAPI normalization"
```

---

### Task 2: Backend exporter và breaking-change gate

**Files:**
- Create: `D:/ERG/erg-spring/scripts/check-openapi-breaking.test.cjs`
- Create: `D:/ERG/erg-spring/scripts/check-openapi-breaking.cjs`
- Create: `D:/ERG/erg-spring/scripts/export-openapi-contract.cjs`

- [ ] **Bước 1: Viết test thất bại cho CLI parsing và lệnh oasdiff**

```js
const { test } = require("node:test");
const assert = require("node:assert/strict");

const { buildOasdiffInvocation, parseArgs } = require("./check-openapi-breaking.cjs");

test("requires explicit base and revision contracts", () => {
  assert.throws(() => parseArgs([]), /--base and --revision are required/);
});

test("builds a pinned Docker oasdiff breaking command", () => {
  const invocation = buildOasdiffInvocation("C:/repo/base.json", "C:/repo/revision.json");
  assert.equal(invocation.command, "docker");
  assert.ok(invocation.args.includes("tufin/oasdiff:v1.15.1"));
  assert.ok(invocation.args.includes("breaking"));
  assert.ok(invocation.args.includes("--fail-on"));
  assert.ok(invocation.args.includes("WARN"));
});
```

- [ ] **Bước 2: Chạy test để xác nhận RED**

Run: `node --test scripts/check-openapi-breaking.test.cjs`

Expected: FAIL do module chưa tồn tại.

- [ ] **Bước 3: Viết wrapper oasdiff tối thiểu**

`check-openapi-breaking.cjs` phải export `parseArgs` và `buildOasdiffInvocation`, chuẩn hóa path Windows thành mount `/work`, rồi chỉ gọi `spawnSync` trong `main()` khi file được chạy trực tiếp. Lệnh thực tế:

```text
docker run --rm -v D:/ERG/erg-spring:/work tufin/oasdiff:v1.15.1 breaking --fail-on WARN --format text /work/tmp/erg-openapi-base.json /work/contracts/openapi/erg-openapi.json
```

Nếu Docker/oasdiff trả exit code khác 0, wrapper phải giữ nguyên exit code để CI thất bại.

- [ ] **Bước 4: Viết exporter tối thiểu**

`export-openapi-contract.cjs` hỗ trợ đúng hai input:

```text
node scripts/export-openapi-contract.cjs --url http://localhost:1606/v3/api-docs
node scripts/export-openapi-contract.cjs --file path/to/openapi.json
```

Script dùng `normalizeOpenApi`, ghi `contracts/openapi/erg-openapi.json`, ghi checksum cộng newline vào `contracts/openapi/erg-openapi.sha256`, và hỗ trợ `--check` để thất bại nếu output đã commit không đồng bộ.

- [ ] **Bước 5: Chạy test và syntax check để xác nhận GREEN**

```powershell
node --test scripts/openapi-contract-lib.test.cjs scripts/check-openapi-breaking.test.cjs
node --check scripts/export-openapi-contract.cjs
node --check scripts/check-openapi-breaking.cjs
```

Expected: tất cả test PASS và syntax check exit 0.

- [ ] **Bước 6: Commit đúng các script**

```powershell
git add -- scripts/export-openapi-contract.cjs scripts/check-openapi-breaking.cjs scripts/check-openapi-breaking.test.cjs
git commit -m "build: gate OpenAPI breaking changes"
```

---

### Task 3: Sinh snapshot OpenAPI backend hiện tại

**Files:**
- Create: `D:/ERG/erg-spring/contracts/openapi/erg-openapi.json`
- Create: `D:/ERG/erg-spring/contracts/openapi/erg-openapi.sha256`
- Modify: `D:/ERG/erg-spring/scripts/export-postman.cjs`

- [ ] **Bước 1: Khởi động backend bằng test profile trong session riêng**

Run: `.\mvnw.cmd "-Dspring-boot.run.profiles=test" spring-boot:run`

Expected: ứng dụng lắng nghe tại `http://localhost:1606` và `/v3/api-docs` trả HTTP 200.

- [ ] **Bước 2: Xuất snapshot chuẩn hóa**

Run: `node scripts/export-openapi-contract.cjs --url http://localhost:1606/v3/api-docs`

Expected: tạo JSON và SHA-256 trong `contracts/openapi/`.

- [ ] **Bước 3: Kiểm tra exporter có tính quyết định**

Run: `node scripts/export-openapi-contract.cjs --url http://localhost:1606/v3/api-docs --check`

Expected: exit 0 và thông báo contract đã đồng bộ.

- [ ] **Bước 4: Chuyển Postman exporter sang contract path mới**

Thay duy nhất:

```js
const openApiPath = path.join(root, "contracts/openapi/erg-openapi.json");
```

và bỏ output vào `src/main/resources/api-export`; Postman exporter chỉ ghi các file dưới `postman/`.

- [ ] **Bước 5: Chạy Postman exporter và backend contract tests**

```powershell
node scripts/export-postman.cjs
.\mvnw.cmd -DskipTests compile
```

Expected: exporter exit 0, Maven BUILD SUCCESS.

- [ ] **Bước 6: Commit snapshot và thay đổi exporter**

```powershell
git add -- contracts/openapi/erg-openapi.json contracts/openapi/erg-openapi.sha256 scripts/export-postman.cjs
git commit -m "build: publish canonical OpenAPI contract"
```

---

### Task 4: Frontend pin và sinh REST types

**Files:**
- Create: `D:/ERG/erg-system/scripts/api-contract-lib.test.mjs`
- Create: `D:/ERG/erg-system/scripts/api-contract-lib.mjs`
- Create: `D:/ERG/erg-system/scripts/sync-api-contract.mjs`
- Create: `D:/ERG/erg-system/contracts/backend/erg-openapi.json`
- Create: `D:/ERG/erg-system/contracts/backend/erg-openapi.lock.json`
- Generate: `D:/ERG/erg-system/src/lib/api/generated/erg-openapi.ts`
- Modify: `D:/ERG/erg-system/package.json`
- Modify: `D:/ERG/erg-system/bun.lock`

- [ ] **Bước 1: Viết test thất bại cho checksum pinning**

```js
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { createContractLock, verifyContractLock } from "./api-contract-lib.mjs";

describe("frontend API contract lock", () => {
  test("pins source repository and sha256", () => {
    const lock = createContractLock("{\"openapi\":\"3.1.0\"}\n", "erg-spring");
    assert.equal(lock.source, "erg-spring");
    assert.match(lock.sha256, /^[a-f0-9]{64}$/);
    assert.doesNotThrow(() => verifyContractLock("{\"openapi\":\"3.1.0\"}\n", lock));
  });

  test("rejects stale contract content", () => {
    const lock = createContractLock("old", "erg-spring");
    assert.throws(() => verifyContractLock("new", lock), /checksum mismatch/);
  });
});
```

- [ ] **Bước 2: Chạy test để xác nhận RED**

Run: `node --test scripts/api-contract-lib.test.mjs`

Expected: FAIL vì module chưa tồn tại.

- [ ] **Bước 3: Cài generator và viết implementation tối thiểu**

Run: `bun add --dev openapi-typescript@^7`

`api-contract-lib.mjs` dùng `node:crypto` để tạo/kiểm tra SHA-256. `sync-api-contract.mjs` nhận `--source`, mặc định `../erg-spring/contracts/openapi/erg-openapi.json`, copy nguyên snapshot vào `contracts/backend/`, ghi lock JSON chỉ có `source`, `sha256` (không có timestamp để output có tính quyết định), rồi chạy generator bằng `spawnSync`.

Thêm scripts:

```json
{
  "contract:rest:sync": "node scripts/sync-api-contract.mjs",
  "contract:rest:generate": "openapi-typescript contracts/backend/erg-openapi.json -o src/lib/api/generated/erg-openapi.ts --alphabetize --immutable",
  "contract:rest:check": "openapi-typescript contracts/backend/erg-openapi.json -o src/lib/api/generated/erg-openapi.ts --alphabetize --immutable --check",
  "contract:check": "node --test scripts/api-contract-lib.test.mjs && bun run contract:rest:check"
}
```

- [ ] **Bước 4: Chạy test để xác nhận GREEN rồi sync contract**

```powershell
node --test scripts/api-contract-lib.test.mjs
bun run contract:rest:sync
bun run contract:rest:check
```

Expected: test PASS; snapshot, lock và generated TypeScript được tạo; check exit 0.

- [ ] **Bước 5: Commit dependency, scripts và generated artifacts**

```powershell
git add -- package.json bun.lock scripts/api-contract-lib.mjs scripts/api-contract-lib.test.mjs scripts/sync-api-contract.mjs contracts/backend/erg-openapi.json contracts/backend/erg-openapi.lock.json src/lib/api/generated/erg-openapi.ts
git commit -m "build: generate frontend types from OpenAPI"
```

---

### Task 5: Typed contract helpers và domain client tường minh

**Files:**
- Create: `D:/ERG/erg-system/src/lib/api/contract-types.ts`
- Create: `D:/ERG/erg-system/src/lib/api/contract-typecheck.ts`
- Create: `D:/ERG/erg-system/src/lib/api/create-api-client.test.ts`
- Create: `D:/ERG/erg-system/src/lib/api/create-api-client.ts`
- Modify: `D:/ERG/erg-system/src/lib/api-client.ts`

- [ ] **Bước 1: Viết typecheck thất bại cho path/method và response data**

```ts
import type { ApiResponseData, ContractPath } from "@/lib/api/contract-types";

const usersPath = "/api/v1/admin/users" satisfies ContractPath;
type UsersResponse = ApiResponseData<typeof usersPath, "get">;
const response: UsersResponse | undefined = undefined;
void response;

// @ts-expect-error endpoint không có trong OpenAPI
const invalidPath = "/api/v1/not-real" satisfies ContractPath;
void invalidPath;
```

- [ ] **Bước 2: Viết runtime test thất bại cho explicit portal/auth policy**

```ts
import { expect, test, vi } from "vitest";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiRequest }));

test("domain client forwards explicit portal and auth policy", async () => {
  const { createApiClient } = await import("@/lib/api/create-api-client");
  apiRequest.mockResolvedValue({ ok: true });
  const client = createApiClient({ portal: "lcms", auth: "required" });

  await client.request("/api/v1/admin/users", { method: "GET" });

  expect(apiRequest).toHaveBeenCalledWith("/api/v1/admin/users", {
    method: "GET",
    portal: "lcms",
    auth: "required",
  });
});
```

- [ ] **Bước 3: Chạy RED**

```powershell
bun run typecheck
bun run test -- src/lib/api/create-api-client.test.ts
```

Expected: typecheck/test FAIL vì module và `auth` option chưa tồn tại.

- [ ] **Bước 4: Viết implementation tối thiểu**

`contract-types.ts` trích `ContractPath = keyof paths`, operation theo method và response JSON `data` từ generated `paths`. `create-api-client.ts` giữ config immutable và merge `portal`/`auth` vào `apiRequest`.

Mở rộng `ApiRequestOptions`:

```ts
auth?: "public" | "required";
```

Thay `requiresAuth(path)` bằng `requiresAuth(path, init)`; nếu `init.auth` có giá trị thì dùng policy tường minh, nếu không mới dùng legacy path inference để không phá endpoint chưa migrate.

- [ ] **Bước 5: Chạy GREEN và regression tests**

```powershell
bun run typecheck
bun run test -- src/lib/api/create-api-client.test.ts src/lib/api-client.test.ts
```

Expected: typecheck PASS và toàn bộ test PASS.

- [ ] **Bước 6: Commit đúng foundation client files**

```powershell
git add -- src/lib/api/contract-types.ts src/lib/api/contract-typecheck.ts src/lib/api/create-api-client.ts src/lib/api/create-api-client.test.ts src/lib/api-client.ts
git commit -m "feat: add contract-aware API clients"
```

---

### Task 6: Sửa envelope error và bảo toàn external abort

**Files:**
- Modify: `D:/ERG/erg-system/src/lib/api-client.test.ts`
- Modify: `D:/ERG/erg-system/src/lib/api-client.ts`

- [ ] **Bước 1: Viết test RED cho backend error envelope**

Thêm test gọi endpoint trả HTTP 422 với body:

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "data": null,
  "errors": { "code": "VALIDATION_FAILED", "fields": { "email": "invalid" } },
  "request_id": "req-contract-1"
}
```

Assert `ApiClientError` có `code === "VALIDATION_FAILED"`, `status === 422`, `details.fields.email === "invalid"` và `requestId === "req-contract-1"`.

- [ ] **Bước 2: Viết test RED cho external abort**

Tạo `AbortController`, mock fetch reject bằng `signal.reason`, gọi `apiRequest` với signal rồi assert promise reject đúng cùng reason, không phải `ApiClientError` code `NETWORK_ERROR`.

- [ ] **Bước 3: Chạy RED**

Run: `bun run test -- src/lib/api-client.test.ts`

Expected: hai test mới FAIL vì error metadata bị mất và abort bị đổi thành network error.

- [ ] **Bước 4: Implement tối thiểu**

- Mở rộng `ApiEnvelope<T>` với `statusCode`, `errors`, `request_id`.
- Mở rộng `ApiClientError` bằng optional `details` và `requestId` mà không phá constructor call hiện tại.
- `getErrorBody` đọc cả `error` legacy và `errors` backend; nếu `errors` là string dùng nó làm code, nếu là object đọc `code` rồi giữ toàn bộ object trong `details`.
- Trong `fetchApi`, nếu `sourceSignal?.aborted`, throw nguyên `sourceSignal.reason` trước khi bọc lỗi mạng.

- [ ] **Bước 5: Chạy GREEN**

```powershell
bun run test -- src/lib/api-client.test.ts src/lib/graphql-client.test.ts
bun run typecheck
```

Expected: test và typecheck PASS.

- [ ] **Bước 6: Commit transport boundary fix**

```powershell
git add -- src/lib/api-client.ts src/lib/api-client.test.ts
git commit -m "fix: preserve backend API error contracts"
```

---

### Task 7: Migrate employee/access endpoint paths sang OpenAPI contract

**Files:**
- Create: `D:/ERG/erg-system/src/features/employee-management/api/employee-management-routes.ts`
- Create: `D:/ERG/erg-system/src/features/access-management/api/access-management-routes.ts`
- Modify: `D:/ERG/erg-system/src/features/employee-management/api/employee-management-api.test.ts`
- Modify: `D:/ERG/erg-system/src/features/employee-management/api/employee-management-api.ts`
- Modify: `D:/ERG/erg-system/src/features/access-management/api/access-management-api.test.ts`
- Modify: `D:/ERG/erg-system/src/features/access-management/api/access-management-api.ts`

- [ ] **Bước 1: Viết test RED cho route builders**

Trong test hiện có, import route object và assert:

```ts
expect(employeeManagementRoutes.user("user/1")).toBe("/api/v1/admin/users/user%2F1");
expect(accessManagementRoutes.role("role/1")).toBe("/api/v1/roles/role%2F1");
```

Thêm type-level `satisfies ContractPath` cho mọi static route trong hai route file dự kiến.

- [ ] **Bước 2: Chạy RED**

```powershell
bun run test -- src/features/employee-management/api/employee-management-api.test.ts src/features/access-management/api/access-management-api.test.ts
bun run typecheck
```

Expected: FAIL vì route modules chưa tồn tại.

- [ ] **Bước 3: Implement route builders và explicit clients**

- Static paths dùng `satisfies ContractPath`.
- Dynamic builders chỉ encode path segment bằng một helper `encodeApiPathSegment` đặt trong `contract-types.ts`.
- Tạo client back-office qua `createApiClient({ portal: getBackOfficePortal(), auth: "required" })` tại thời điểm gọi, không cache portal toàn cục.
- Thay raw endpoint literals trong hai API module bằng route builders.
- Giữ nguyên exported function signature, payload và query key để không làm vỡ component.

- [ ] **Bước 4: Chạy GREEN và regression suite của lát cắt**

```powershell
bun run test -- src/features/employee-management/api/employee-management-api.test.ts src/features/access-management/api/access-management-api.test.ts src/lib/api/create-api-client.test.ts src/lib/api-client.test.ts
bun run typecheck
```

Expected: toàn bộ test và typecheck PASS.

- [ ] **Bước 5: Commit lát cắt đầu tiên**

```powershell
git add -- src/features/employee-management/api/employee-management-routes.ts src/features/employee-management/api/employee-management-api.ts src/features/employee-management/api/employee-management-api.test.ts src/features/access-management/api/access-management-routes.ts src/features/access-management/api/access-management-api.ts src/features/access-management/api/access-management-api.test.ts src/lib/api/contract-types.ts
git commit -m "refactor: bind access APIs to OpenAPI paths"
```

---

### Task 8: Cổng kiểm chứng tích hợp và tài liệu vận hành

**Files:**
- Create: `D:/ERG/erg-spring/docs/api-contract-workflow.md`
- Create: `D:/ERG/erg-system/docs/api-contract-workflow.md`
- Modify: `D:/ERG/erg-system/package.json`

- [ ] **Bước 1: Thêm command kiểm chứng tổng hợp phía frontend**

Thêm script:

```json
"verify:api-contract": "bun run contract:check && bun run typecheck && vitest run src/lib/api-client.test.ts src/lib/api/create-api-client.test.ts src/features/employee-management/api/employee-management-api.test.ts src/features/access-management/api/access-management-api.test.ts"
```

- [ ] **Bước 2: Viết runbook backend bằng tiếng Việt**

Runbook phải chứa chính xác các luồng:

```text
Xuất: node scripts/export-openapi-contract.cjs --url http://localhost:1606/v3/api-docs
Kiểm tra freshness: node scripts/export-openapi-contract.cjs --url http://localhost:1606/v3/api-docs --check
Kiểm tra breaking: node scripts/check-openapi-breaking.cjs --base tmp/erg-openapi-base.json --revision contracts/openapi/erg-openapi.json
```

Mô tả chính sách add → deprecate → migrate → observe → remove.

- [ ] **Bước 3: Viết runbook frontend bằng tiếng Việt**

Runbook phải chứa:

```text
bun run contract:rest:sync
bun run contract:rest:check
bun run verify:api-contract
```

Giải thích: thêm field optional chỉ sync; rename/xóa/type change phải sửa mapper; không chỉnh generated file thủ công.

- [ ] **Bước 4: Chạy toàn bộ verification**

Backend:

```powershell
node --test scripts/openapi-contract-lib.test.cjs scripts/check-openapi-breaking.test.cjs
.\mvnw.cmd -DskipTests compile
```

Frontend:

```powershell
bun run verify:api-contract
bun run lint
git diff --check
```

Expected: mọi command PASS. Nếu lint có lỗi tồn tại ngoài file đã chạm, ghi nhận riêng và chạy ESLint giới hạn trên file đã thay đổi để xác minh phần triển khai sạch.

- [ ] **Bước 5: Commit runbook và verification command**

```powershell
git add -- docs/api-contract-workflow.md package.json
git commit -m "docs: document frontend API contract workflow"
```

```powershell
Set-Location D:/ERG/erg-spring
git add -- docs/api-contract-workflow.md
git commit -m "docs: document backend API contract workflow"
```

---

## Tự rà kế hoạch

- REST snapshot determinism: Task 1–3.
- Breaking-change fail CI: Task 2 và Task 8.
- Frontend reproducible generation/checksum: Task 4.
- Path/method compile-time safety: Task 5 và Task 7.
- Explicit portal/auth policy: Task 5 và Task 7.
- Backend envelope/error/abort: Task 6.
- Lát cắt auth/employee-access: transport auth ở Task 5–6, employee/access ở Task 7.
- TDD RED → GREEN: Task 1, 2, 4, 5, 6, 7.
- GraphQL, runtime schema validation cho quiz/import và legacy retirement được giữ đúng ngoài phạm vi đợt foundation, không bị bỏ quên mà sẽ có plan độc lập tiếp theo.
