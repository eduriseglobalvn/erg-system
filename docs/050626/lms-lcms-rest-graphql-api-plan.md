# Ke Hoach Danh Gia REST/GraphQL Cho LMS, LCMS, Elearning

Ngay lap tuc khong nen chuyen toan bo he thong sang GraphQL. Huong dung la giu REST lam nen chinh, them GraphQL nhu mot lop read projection cho nhung man hinh doc du lieu tong hop that su phuc tap. LMS/LCMS co nhieu man hinh can nhieu du lieu, nhung neu dung GraphQL qua rong ma khong co gioi han depth, complexity, pagination, cache va read model thi query nang co the lam DB qua tai.

## 1. Hien Trang Source Da Quet

Frontend `D:\ERG\erg-system` dang co cac khu chinh:

- LMS giao vien: homework, score sheet, attendance, schedule, class log, resources, reports, account, login logs.
- LMS/LCMS admin dashboard: overview, centers/schools, import hoc sinh, members, permissions, question bank, quiz bank, quiz editor, learning resources, public disclosure.
- Elearning hoc sinh: dashboard assignment, score, announcement, quiz runtime.
- Hoc lieu: library tree, resource viewer, asset launch, slide viewer, progress.

Backend `D:\ERG\erg-spring` hien co:

- Spring Security voi Bearer token.
- Header `X-Portal`, `X-Tenant-ID`, `X-Request-ID`.
- `ErgAuthenticationFilter`, `ErgPrincipalService`, `ErgPolicyService`, `PermissionAuthorizationManager`.
- Permission theo module: `lms.*`, `hoclieu.*`, `rbac.*`, `users.manage`, `crm.*`, `seo.*`.
- Scope theo education unit/class trong `UserAccessContext`.
- REST controller chinh cho auth, users, sessions, LMS, hoclieu, authorization.
- Chua co Spring GraphQL dependency/resolver.

Van de can xu ly truoc GraphQL:

- Frontend dang goi tron `/api/lms/...`, `/api/hoclieu/...`, `/api/v1/lms/...`, `/api/v1/hoclieu/...`.
- Backend chuan hon o `/api/v1/...`.
- LMS admin endpoints con nhieu cho dang placeholder.
- Hinh dang du lieu frontend can cho dashboard/class/student/report chua duoc backend hoan thien thanh read model.

## 2. Nguyen Tac Chon REST Hay GraphQL

### Dung REST khi

- La command/mutation: create, update, delete, save, submit, publish, assign.
- Co file, binary, stream, redirect, download, export.
- Can idempotency va audit ro rang.
- Can rate limit theo endpoint.
- Response shape on dinh, it thay doi theo man hinh.
- Du lieu nhay cam: credential import, token, session revoke, permission write.

Vi du nen giu REST:

- Login, refresh, logout, OAuth.
- Save answer, sync attempt, submit attempt.
- Create assignment, publish quiz, import hoc sinh.
- Save attendance, save score adjustment.
- Upload asset, launch/download/stream file.
- Export report.
- Create/update/delete taxonomy, resource, user, role.

### Dung GraphQL khi

- Man hinh can gom nhieu khoi du lieu lien quan trong mot lan load.
- Neu dung REST se phai goi 5-10 endpoint nho hoac tao nhieu endpoint bootstrap gan giong nhau.
- La read-heavy/read-mostly.
- Can field selection theo role/scope.
- Co the gioi han depth, complexity, pagination ro rang.
- Co read model/cache de tranh join qua sau vao DB song.

Vi du that su dang can GraphQL:

- LMS dashboard tong quan.
- Class workspace.
- Student journey.
- Learning resource library tree + progress.
- LCMS studio bootstrap.
- Question bank workspace.
- Access management workspace phan doc.

## 3. Ma Tran Man Hinh, API Va Cache

| Man hinh | Nen dung | Cache | Ly do |
|---|---|---:|---|
| Login LMS/LCMS/Elearning | REST | Khong cache | Auth command, tra token/session |
| Refresh/logout | REST | Khong cache | Session command |
| Session current | REST | 1-5 phut client, invalidate khi logout/doi quyen | Duoc dung nhieu, nhung permission co the doi |
| LMS teacher shell bootstrap | REST aggregate hoac GraphQL nhe | 5 phut | Lay user, scope, schools, classes |
| Homework list | REST aggregate hoac GraphQL | 30-60 giay | List/filter, khong can realtime tuyet doi |
| Create/assign homework | REST | Khong cache | Command, audit, idempotency |
| Homework progress | GraphQL | 15-30 giay | Assignment + students + attempts + completion |
| Score sheet | GraphQL | 30-60 giay | Class + students + score + attempts |
| Save/chinh diem | REST | Khong cache | Mutation nhay cam |
| Attendance weekly grid | REST aggregate hoac GraphQL | 10-30 giay | Nhieu hoc sinh x nhieu buoi |
| Save attendance | REST | Khong cache | Command |
| Teaching schedule | REST | 1-5 phut | Query theo date range ro |
| Weekly class log | REST | 30-60 giay | Log/form theo buoi, mutation REST |
| LMS resources teacher | GraphQL | Taxonomy 5-15 phut, progress 30-60 giay | Tree + resource + progress |
| Asset launch/slide/download | REST | Browser/private cache 10-60 phut | File/redirect/stream |
| Reports overview | GraphQL | 1-5 phut | Tong hop nhieu bang |
| Reports export | REST async/job | Khong cache request | Export can job/audit |
| Elearning student dashboard | GraphQL | 30-60 giay | Assignments + scores + announcements |
| Quiz package/runtime load | REST | Theo `packageHash`/version | Can on dinh, offline/sync ro |
| Save answer/draft/submit | REST | Khong cache | Command lien tuc, conflict-sensitive |
| LCMS overview | GraphQL | 1-5 phut | Aggregate admin |
| Schools/centers list | REST | 1-5 phut | Danh muc quan tri |
| Import hoc sinh | REST | Khong cache | Bulk command |
| Members/users list | REST list hoac GraphQL workspace | 30-60 giay | Co filter/pagination |
| Permissions workspace | GraphQL doc, REST luu | 30-60 giay | Doc nhieu role/scope/permission |
| Question bank workspace | GraphQL | 1-5 phut | Subject + level/topic + questions + quizzes |
| Create/update question/quiz | REST | Khong cache | Authoring command |
| Quiz editor project load | REST hoac GraphQL theo project | 30-60 giay | Project shape tuong doi co dinh |
| Quiz editor autosave | REST | Khong cache | Mutation lien tuc |
| LCMS learning resources studio | GraphQL bootstrap, REST CRUD | 1-5 phut taxonomy/resources | Tree + resources + asset summary |
| Public disclosure admin | REST | List 1-5 phut | CRUD/file/document hop REST |

## 4. Cac Query GraphQL De Xuat

### `lmsDashboard(scope)`

Dung cho man hinh tong quan LMS.

Tra ve:

- Current user summary.
- Current scope.
- Manageable units/classes.
- Dashboard counters.
- Active assignments.
- Alerts/interventions.
- Recent activity.

Permission:

- `lms.dashboard.read`.
- Scope service phai verify user duoc xem education unit/class.

Cache:

- Client stale 1-5 phut.
- Server cache theo `tenantId + userId + scope`.
- Invalidate khi tao assignment, import hoc sinh, doi scope, doi permission.

### `classWorkspace(classId, range)`

Dung cho class management, score, attendance summary, reports.

Tra ve:

- Class info.
- Student list page.
- Assignment progress summary.
- Score summary.
- Attendance summary.
- Risk flags.

Permission:

- `lms.class.read`.
- `lms.student.read`.
- `lms.grade.read` neu lay diem.
- Bat buoc `canAccessClass(classId)`.

Cache:

- 30-60 giay cho score/report.
- 10-30 giay cho attendance neu dang diem danh.

Can tranh:

- Khong tra tat ca attempts/answers raw.
- Student list bat buoc pagination.

### `studentJourney(studentId)`

Dung cho ho so hoc sinh va hanh trinh hoc tap.

Tra ve:

- Profile.
- Assignments.
- Attempts summary.
- Scores.
- Attendance summary.
- Interventions/notes.

Permission:

- Teacher/admin: `lms.student.read`.
- Student: chi duoc xem chinh minh.

Cache:

- 30-60 giay.
- Invalidate khi submit attempt, save attendance, update score.

### `learningResourceLibrary(schoolId, academicYear)`

Dung cho LMS resources.

Tra ve:

- Subjects.
- Groups/lessons tree.
- Resources.
- Progress by lesson.
- Recent opened.

Permission:

- `hoclieu.resource.read`.
- Scope school phai nam trong managed units.

Cache:

- Taxonomy/tree 5-15 phut.
- Progress/recent 30-60 giay.
- Asset metadata cache theo version.

### `lcmsStudioBootstrap(filters)`

Dung cho LCMS resources/admin hoc lieu.

Tra ve:

- Taxonomy.
- Resource cards.
- Asset summaries.
- File types.
- Designer presets.

Permission:

- `hoclieu.manage`.

Cache:

- 1-5 phut.
- Invalidate khi CRUD taxonomy/resource/asset.

### `questionBankWorkspace(filters)`

Dung cho ngan hang cau hoi/quiz bank.

Tra ve:

- Subjects.
- Levels.
- Topics.
- Questions page.
- Quiz summaries.
- Usage metrics.

Permission:

- `lms.quiz.read` hoac `hoclieu.manage`, tuy ownership.

Cache:

- 1-5 phut cho taxonomy.
- 30-60 giay cho filtered question list.

### `accessManagementWorkspace(filters)`

Dung cho man hinh phan quyen.

Tra ve:

- Users page.
- Scope options.
- Role groups.
- Effective access summary.

Permission:

- `lms.scope.read`.
- `rbac.permission.read` cho effective permissions.
- `users.manage` cho user detail day du.

Cache:

- 30-60 giay.
- Invalidate ngay khi save role/policy/permission.

## 5. Cac API Nen La REST

Auth:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- OAuth routes

Quiz runtime:

- `GET /api/v1/lms/quizzes/{quizId}/package`
- `POST /api/v1/lms/attempts`
- `PUT /api/v1/lms/attempts/{attemptId}/answers/{questionId}`
- `POST /api/v1/lms/attempts/{attemptId}/sync`
- `POST /api/v1/lms/attempts/{attemptId}/submit`

LMS commands:

- Create/update assignment.
- Save attendance.
- Save score adjustment.
- Import student accounts.
- Export reports.

LCMS commands:

- Create/update/delete taxonomy.
- Create/update/delete resource.
- Create/update/delete asset.
- Upload files.
- Publish/unpublish resource.

User/RBAC:

- Create/update/delete users.
- Assign roles.
- Save user access policies.
- Revoke sessions.

File/asset:

- Asset launch.
- Stream.
- Download.
- Slide image.
- Thumbnail.

## 6. Query Nang Co Lam Sap DB Khong?

Co. LMS la loai he thong rat de bi query tong hop lam qua tai DB neu thiet ke sai.

Query nguy hiem nhat:

```graphql
query BadQuery {
  schools {
    classes {
      students {
        assignments {
          attempts {
            answers {
              question {
                choices
              }
            }
          }
        }
      }
    }
  }
}
```

Voi 10 truong, moi truong 20 lop, moi lop 40 hoc sinh, moi hoc sinh 20 assignment, moi assignment 3 attempt, moi attempt 30 answer, query co the cham toi hang trieu record neu khong chan.

Rui ro DB:

- N+1 repository calls.
- Full table scan do thieu index.
- Join sau tren attempts/answers.
- Query timeout giu connection qua lau.
- Lock/contention neu doc nang chay cung DB voi write.
- Memory tang cao khi serialize response lon.
- Network payload qua lon lam frontend cham.

Bien phap bat buoc:

- Max depth 6-8.
- Max complexity.
- Pagination bat buoc.
- Default limit nho, vi du 20-50.
- Hard max limit, vi du 200.
- DataLoader/batch load.
- Query timeout 3-5 giay.
- Rate limit theo user/tenant/operation.
- Persisted queries cho production neu co the.
- Khong cho nested unbounded list.
- Khong expose raw answers trong dashboard.
- Tach read model/materialized summary cho dashboard/report.

## 7. Van De Kinh Dien Cua GraphQL

N+1:

- Resolver cha lay list classes.
- Resolver con moi class lai query students.
- Moi student lai query attempts.
- Ket qua la hang tram/hang nghin SQL.

Over-fetch/under-control:

- Frontend co the viet query lay qua nhieu field.
- Backend kho biet query nao dang ton tai neu khong persisted query/operation registry.

Cache kho:

- REST cache theo URL de hon.
- GraphQL cung endpoint `/graphql`, cache phai dua vao operation + variables + user + tenant + scope.

Permission field-level kho:

- REST co path permission ro.
- GraphQL can guard root query, nested field, va service-layer scope.

Introspection/schema leak:

- Production khong nen mo rong cho moi user.
- It nhat chi admin/dev moi duoc introspect.

Partial error:

- GraphQL co the tra partial data + errors.
- Frontend phai xu ly ky, tranh hien du lieu thieu ma user tuong la day du.

Versioning:

- REST version bang path de hon.
- GraphQL phai dung deprecate field, migration schema, contract test.

File upload/download:

- Khong hop GraphQL.
- Dung REST tot hon.

Audit:

- REST audit theo method/path ro.
- GraphQL phai bat buoc operationName va log variables da mask.

## 8. Thiet Ke Security Cho GraphQL

Endpoint:

- `/api/v1/graphql`

Header:

- `Authorization: Bearer <token>`
- `X-Portal`
- `X-Tenant-ID`
- `X-Request-ID`

Request flow:

1. `ErgAuthenticationFilter` doc token.
2. `ErgPrincipalService` dung session/token hash tao principal.
3. Resolver lay principal tu `SecurityContext`.
4. Resolver goi `ErgPolicyService.isAllowed(...)`.
5. Service layer check tenant/scope/class/student.
6. Field nhay cam check permission rieng.

Khong duoc chi check o frontend. Frontend route gate chi de UX, khong bao ve data.

Field can guard:

- `permissions`.
- `deniedPermissions`.
- `effectiveAccess`.
- `studentCredentials`.
- `rawAnswers`.
- `auditEvents`.
- `loginSessions`.
- `privateNotes`.

## 9. Cache Strategy Cu The

### Client React Query

- Session: `staleTime: 5 * 60_000`, invalidate khi logout/role change.
- Dashboard: `staleTime: 60_000`, `refetchOnWindowFocus: false` voi man hinh tong quan.
- Attendance/score active: `staleTime: 10_000-30_000`.
- Taxonomy/resource tree: `staleTime: 5-15 phut`.
- Quiz package: cache theo `quizId + packageHash`.
- Mutations REST invalidate query keys lien quan.

### Backend Cache

- Principal cache theo token hash + tenant, TTL ngan hon token.
- Taxonomy cache theo tenant/status/version.
- Hoc lieu resource tree cache theo schoolId + academicYear + subjectId + version.
- Dashboard summary cache theo userId + scope + permission version.
- Read model counters cache 30-300 giay.

### Khong Cache

- Auth responses.
- Student credentials.
- Save answer/submit.
- Save attendance/score.
- Import commit.
- Permission write.
- Upload/download token dai han.

## 10. Read Model De Bao Ve DB

Khong nen de GraphQL tu tinh dashboard tu raw tables moi lan request.

Nen co read model cho:

- Class progress summary.
- Assignment progress summary.
- Student latest score.
- Attendance weekly summary.
- Resource lesson progress.
- Dashboard counters.
- Question/quiz usage metrics.

Index can co:

- `tenant_id`.
- `school_id`.
- `academic_class_id`.
- `student_id`.
- `assignment_id`.
- `quiz_id`.
- `subject_id`.
- `status`.
- `created_at`.
- `updated_at`.
- Composite index theo query thuc te, vi du `(tenant_id, academic_class_id, status)`.

Report lon:

- Khong chay truc tiep trong GraphQL.
- Dung REST async job.
- Luu output file.
- Tra job status/download link.

## 11. Thu Tu Trien Khai De An Toan

1. Lap inventory endpoint frontend dang goi va backend dang co.
2. Chuan hoa API path ve `/api/v1/...`.
3. Sua frontend adapter de khong con goi lung tung `/api/lms` neu backend khong co alias.
4. Hoan thien REST core cho LMS: classes, students, assignments, attendance, score, reports, question bank.
5. Them cache policy React Query theo man hinh.
6. Them DB indexes/read model cho dashboard/progress/report.
7. Them Spring GraphQL dependency.
8. Tao endpoint `/api/v1/graphql` protected.
9. Lam query GraphQL dau tien: `learningResourceLibrary`.
10. Do performance va N+1.
11. Lam tiep `classWorkspace` va `lmsDashboard`.
12. Lam `questionBankWorkspace`.
13. Lam `accessManagementWorkspace` sau cung vi field permission phuc tap.
14. Viet contract tests REST + GraphQL.
15. Viet runbook cache invalidation va permission audit.

## 12. Test Bat Buoc

Security:

- Khong token thi REST/GraphQL tra 401.
- Sai `X-Portal` tra 403.
- Token co role nhung bi deny override thi 403.
- Teacher truong A khong xem duoc lop truong B.
- Student chi xem assignment cua minh.
- User khong co `rbac.permission.read` khong xem effective permissions.

GraphQL:

- Query qua depth bi reject.
- Query complexity cao bi reject.
- List lon khong pagination bi reject hoac bi cap limit mac dinh.
- Resolver khong sinh N+1.
- Response khong co password/token/raw credential.
- Partial error duoc frontend xu ly dung.

Cache:

- Tao assignment xong invalidate homework/progress/dashboard.
- Save attendance xong invalidate attendance/classWorkspace.
- Submit attempt xong invalidate student dashboard/score/progress.
- Update permission xong invalidate session/access management.
- Update resource/taxonomy xong invalidate hoclieu tree/studio.

Performance:

- Dashboard query p95 < 500-800ms khi doc cache/read model.
- Class workspace p95 < 1s voi pagination.
- Report lon chay async, khong block GraphQL.
- DB query count duoc gioi han, khong tang theo nested list.

## 13. Ket Luan

GraphQL co ich cho LMS/LCMS, nhung chi nen dung o vai man hinh read-heavy can tong hop nhieu du lieu. REST van nen giu cho phan lon command, auth, file, import, export va quiz runtime.

Kien truc de xuat:

- REST-first.
- GraphQL-read-projection-only.
- Permission/scope check bat buoc o resolver va service layer.
- Cache/read model bat buoc truoc khi mo query dashboard/report nang.
- Khong cho frontend tu do query sau vao raw graph entity.

Neu lam theo huong nay, he thong lay du lieu linh hoat hon cho LMS/LCMS ma van giu duoc tinh an toan, audit, cache va kha nang bao ve DB.
