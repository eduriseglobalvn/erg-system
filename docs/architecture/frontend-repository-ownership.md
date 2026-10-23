# Quyền sở hữu source Frontend ERG

## Quyết định

Từ audit `ERG-066` ngày 2026-07-28:

- `erg-system` là source canonical cho các portal vận hành LMS, LCMS, CRM và ELEARNING.
- `erg-spring` là source canonical cho backend và hợp đồng REST/GraphQL.
- `erg` là source canonical cho public CMS, forum, editorial và marketing.
- `elearning` là secondary legacy snapshot. Không phát triển feature vận hành mới tại đây; chỉ sửa khi có task migration/removal rõ ràng và cập nhật baseline drift.

Quyết định này thay thế trạng thái “chờ ERG-066” trong các rule repository. Nó không cho phép xóa hàng loạt file trùng: mỗi consumer phải được kiểm chứng và migrate bằng task riêng trước khi xóa.

## Bằng chứng inventory

| So sánh | Đường dẫn tương đối trùng | Nội dung byte-identical | Đã diverge |
|---|---:|---:|---:|
| `erg-system/src` ↔ `elearning/src` | 281 | 67 | 214 |
| `erg-system/src` ↔ `erg/src` | 1 | 0 | 1 |
| `elearning/src` ↔ `erg/src` | 1 | 0 | 1 |

Số file hiện tại:

- `erg-system/src`: 656.
- `elearning/src`: 343.
- `erg/src`: 618.

Không có source import trực tiếp xuyên repository. Drift hiện là fork/copy độc lập, không phải dependency có owner rõ ràng.

### Phân bố overlap giữa `erg-system` và `elearning`

| Nhóm | Trùng path | Cùng hash | Diverged |
|---|---:|---:|---:|
| `features/lcms` | 80 | 15 | 65 |
| `features/lms` | 49 | 13 | 36 |
| `components` | 37 | 6 | 31 |
| `platform` | 34 | 4 | 30 |
| `features/elearning` | 19 | 10 | 9 |
| `lib` | 13 | 5 | 8 |
| `layouts` | 13 | 2 | 11 |
| `pages` | 8 | 2 | 6 |
| `features/crm` | 6 | 3 | 3 |

Các số này chứng minh hai tree đã diverge mạnh; đồng bộ bằng copy file sẽ làm mất thay đổi và tạo contract/cache/UI không nhất quán.

## Ownership theo domain

| Domain | Canonical owner | Secondary/consumer rule |
|---|---|---|
| LMS operational UI | `erg-system/src/features/lms` | Freeze `elearning/src/features/lms`; migrate rồi xóa theo task |
| LCMS/quiz authoring | `erg-system/src/features/lcms` | Freeze bản `elearning`; Matching UI vẫn chịu locked-UI rule |
| CRM operational UI | `erg-system/src/features/crm` | Không tạo CRM implementation mới ở repo khác |
| Student ELEARNING portal | `erg-system/src/features/elearning` | Offline/cache behavior chỉ thay đổi tại canonical owner |
| Auth/platform/query/cache | `erg-system/src/platform`, `src/lib` | Không fork identity/query/cache policy |
| Public CMS/forum/editorial | `erg/src` | Không chuyển operational portal code vào `erg` |
| REST/GraphQL behavior | `erg-spring` | Frontend chỉ consume snapshot/type generated đã pin |

## Drift gate

`scripts/frontend-repository-ownership.json` lưu count và SHA-256 của danh sách path đã sort, không hash/log nội dung source. `bun run repository-drift:check` thất bại khi:

- tập 281 đường dẫn overlap thay đổi mà chưa review baseline;
- bất kỳ frozen scope nào trong `elearning` tăng, giảm hoặc đổi path;
- public `erg` xuất hiện `features/lms`, `features/lcms`, `features/crm`, `features/elearning` hoặc `platform/auth`.

Workflow `.github/workflows/repository-drift.yml` chạy trên thay đổi liên quan của `erg-system`, chạy hằng ngày để bắt drift từ repo khác, và hỗ trợ manual dispatch. Repository private cần secret read-only `CROSS_REPO_READ_TOKEN`; repository public có thể dùng `github.token`.

## Quy trình thay đổi baseline

1. Tạo/cập nhật task trong `Tất cả Task` và ghi rõ file migrate/remove.
2. Chứng minh canonical consumer, route, API/query/cache và test đã chuyển xong.
3. Xóa hoặc di chuyển source legacy trong cùng task được review.
4. Chạy checker để lấy inventory mới.
5. Cập nhật manifest với count/digest mới và ghi delta trong evidence workbook.
6. Chạy full FE test và contract/governance gates.

Không cập nhật digest chỉ để làm CI xanh. Mọi thay đổi baseline phải giảm drift hoặc có lý do ownership mới được tài liệu hóa.
