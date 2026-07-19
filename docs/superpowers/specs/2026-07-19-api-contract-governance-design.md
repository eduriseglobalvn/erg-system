# ERG API Contract Governance Design

**Goal:** Make REST and GraphQL contract changes in `erg-spring` explicit, reproducible, and easy to consume in `erg-system`, while blocking breaking changes in CI before they reach runtime.

## Scope

- `D:/ERG/erg-spring` is the source of truth for REST OpenAPI and GraphQL schemas.
- `D:/ERG/erg-system` consumes generated contract types but keeps feature-local API adapters and domain models.
- The first implementation slice establishes deterministic contract export, breaking-change detection, frontend generation, and one migrated vertical slice.
- Existing endpoint behavior, authentication semantics, and matching-question UI are not changed by this work.

## Current State and Risks

- Springdoc is available at `/v3/api-docs`, but the previously committed `src/main/resources/api-export/erg-openapi.json` is currently deleted in the backend working tree.
- The last backend snapshot contains 424 REST paths, 515 operations, and 113 component schemas.
- Controllers contain 329 mapping annotations but no explicit `@Operation` annotations. Springdoc therefore derives operation IDs from Java method names and adds suffixes such as `_1`; harmless Java refactors can churn generated operation names.
- Ninety-one object schemas in the last snapshot have no `required` list. Generated TypeScript would therefore treat many contract fields as optional and would miss meaningful backend drift.
- Thirty-nine schemas are `ApiResponse...` wrappers. Some payloads still expose `Object` or `Map<String, Object>`, which weakens useful generation.
- REST uses both `/api/v1/...` and unversioned `/api/...` surfaces. The frontend has 151 production endpoint occurrences across 24 files.
- The frontend `apiRequest<T>` asserts `T` after JSON parsing; it does not prove that the response matches the backend contract.
- Frontend auth/portal selection is partly inferred from endpoint strings. An endpoint move can therefore change both routing and authentication behavior.
- GraphQL has a committed server schema, but frontend operation result and variable types are handwritten.
- Offline/mock fallback catches broad errors in several paths and can hide backend contract or authorization failures.

## Chosen Approach

Use a strict contract-first workflow:

1. Springdoc's deterministic OpenAPI document and the committed GraphQL schema are the backend contract sources.
2. CI rejects REST or GraphQL breaking changes unless the API is versioned or a compatibility window is explicitly introduced.
3. The frontend generates path/method-based REST types rather than generated functions based on unstable operation IDs.
4. Generated DTO types stop at the feature API boundary. Components and business logic consume stable domain models through explicit mappers.
5. Runtime boundary validation is added first to high-risk operations; compile-time generation remains the universal baseline.

This avoids a global handwritten endpoint registry and avoids coupling application code directly to generated transport DTOs.

## Contract Change Policy

| Backend change | CI result | Required rollout |
| --- | --- | --- |
| Add optional response field | Pass | Regenerate; no feature change unless the field is used |
| Add optional request field | Pass | Regenerate; adopt when needed |
| Remove or rename response field | Fail | Add replacement field, keep old field during compatibility window, migrate FE, then remove in next API version |
| Change response field type or nullability incompatibly | Fail | Add a new field or versioned schema and migrate mapper |
| Add required request field | Fail | Make it optional/defaulted first or introduce a versioned operation |
| Remove/change HTTP method or endpoint path | Fail | Add new endpoint, keep old alias deprecated, migrate FE, then remove in next version |
| Add enum member | Warning for exhaustive FE mappings | Regenerate and require an `unknown`/default domain mapping |
| Remove enum member | Fail when referenced | Compatibility or versioned migration |
| Change auth/security requirement | Fail | Security review and coordinated rollout |

An endpoint is not moved atomically. The safe sequence is **add new → deprecate old → migrate consumer → observe → remove in next version**.

## Backend Design (`erg-spring`)

### Deterministic OpenAPI snapshot

- Export a normalized OpenAPI JSON document to a repository-level contract directory rather than bundling a generated runtime artifact in `src/main/resources`.
- Sort object keys and remove environment-specific server URLs before comparison so identical contracts produce identical files.
- Add one command that starts or tests the Spring application, fetches `/v3/api-docs`, normalizes it, and writes the snapshot.
- Add a verification command that regenerates in memory and fails if the committed snapshot is stale.

### Breaking-change gate

- Compare the generated candidate against the merge-base contract.
- Fail on removed paths/methods, incompatible parameter/request changes, incompatible response/schema changes, and security changes.
- Additive optional fields remain compatible.
- The gate must report exact path, method, schema, and field so a developer knows which frontend adapter will be affected.

### Schema quality

- Requests use concrete records plus Bean Validation so requiredness is emitted correctly.
- Responses declare nullability and required fields explicitly; avoid returning persistence entities.
- Replace `Object`/`Map<String, Object>` with named DTOs where the structure is stable. Truly open metadata remains an explicitly documented free-form object.
- Keep the common response envelope stable and document `statusCode`, `message`, `data`, `errors`, `timestamp`, `path`, and `request_id` in OpenAPI.
- Do not require explicit `@Operation(operationId=...)` for every controller in the first slice. Generated FE usage is path/method-based. Add stable explicit IDs only to consumed endpoints when named operation artifacts become valuable.

### REST versioning

- No new unversioned `/api/...` endpoint is allowed.
- New REST work uses `/api/v1/{bounded-context}/{resource}`.
- Existing unversioned curriculum/content endpoints receive a documented migration map and compatibility deadline; they are not mass-renamed in the foundation slice.

## Frontend Design (`erg-system`)

### Generated contract layer

Create a generated, read-only contract layer under `src/lib/api/generated/`. It contains path, operation, request, response, parameter, and schema types derived from the pinned backend OpenAPI snapshot.

- Generated files carry a header that forbids manual edits.
- A sync command regenerates them from an explicit OpenAPI input path.
- A check command regenerates to a temporary location and fails if committed output differs.
- The backend contract version/checksum is pinned so builds are reproducible and do not depend on a live development server.

### Typed transport and feature adapters

The transport is split by responsibility:

```text
src/lib/api/
├── transport.ts
├── api-error.ts
├── response-envelope.ts
├── auth-middleware.ts
├── create-api-client.ts
└── generated/
```

Domain clients make portal and auth policy explicit:

```ts
const lcmsApi = createApiClient({ portal: "lcms", auth: "required" });
const publicAuthApi = createApiClient({ auth: "public" });
```

Feature adapters remain local:

```text
src/features/<feature>/api/
├── <feature>-routes.ts
├── <feature>-api.ts
├── <feature>-mapper.ts
├── <feature>-query.ts
└── <feature>-api.test.ts
```

- Routes are derived from typed OpenAPI paths or feature-local builders; there is no global `endpoints.ts` junk drawer.
- Every path segment goes through one shared encoder.
- Query parameters use one shared serializer.
- Adapters accept `AbortSignal` and TanStack Query forwards its signal.
- Generated DTOs never flow into React components or stores. A mapper converts them to feature domain models.

### Field-change isolation

If the backend adds a field, generation changes but existing mappers continue to compile. The feature only changes when it chooses to use the new field.

If the backend removes, renames, or changes a used field, regeneration makes the mapper fail compilation at the exact access site. Components remain unaffected because their domain model did not change.

For temporary aliases, compatibility logic lives in one mapper:

```ts
const fullName = dto.fullName ?? dto.full_name;
```

The alias must have a removal issue/date; compatibility aliases must not spread through UI code.

### Response envelope and errors

- Parse the backend's actual `ApiResponse<T>` shape, including `errors` and `request_id`.
- Preserve structured backend error code/details in `ApiClientError`.
- Do not convert an external abort into `NETWORK_ERROR`.
- Mock/offline fallback runs only in an explicit mock mode or on a classified offline/network failure. It never hides 4xx/5xx, schema failures, or authorization errors.

### Runtime validation

Runtime validation is initially enabled for auth session, authorization/permission mutations, employee administration, quiz publish, and import operations. Validation accepts unknown additive fields but rejects missing required fields and incompatible types. Other endpoints rely on generated compile-time types until migrated.

## GraphQL Design

- `erg-spring/src/main/resources/graphql/schema.graphqls` remains the GraphQL source of truth.
- Frontend query documents remain feature-local.
- Generate operation-specific result and variable types from the committed schema and frontend documents.
- CI validates every document against the schema and fails on removed/renamed fields, changed arguments, or incompatible nullability.
- Production introspection may remain disabled because generation uses the committed schema file.

## CI Flow

### Backend PR

1. Generate normalized REST OpenAPI and validate GraphQL schema.
2. Compare both contracts with the merge base.
3. Fail on undocumented breaking changes.
4. Publish the normalized contract artifacts and checksums for downstream consumption.

### Frontend PR

1. Verify the pinned contract snapshot/checksum.
2. Regenerate REST and GraphQL types and fail if the worktree would change.
3. Typecheck feature mappers and query operations.
4. Run contract, adapter, transport, and existing application tests.
5. Reject new raw `fetch` calls outside transport and new raw endpoint literals outside approved API/PWA policy locations.

## Testing Strategy

- Backend snapshot determinism test.
- Backend breaking-change fixture tests for removed path, required request field, removed response field, type/nullability change, security change, and allowed optional additions.
- Backend envelope schema test ensuring all fields are represented consistently.
- Frontend generated-contract freshness test.
- Frontend transport tests for envelope parsing, structured errors, timeout, external abort, auth refresh, and explicit portal policy.
- Feature adapter tests proving DTO-to-domain mapping and compatibility aliases.
- GraphQL document validation and generated-type freshness tests.
- One end-to-end contract smoke test against a backend test instance for the first migrated vertical slice.

## Rollout

1. **Foundation:** deterministic backend snapshots, compatibility gate, frontend generators, checksum pinning, and CI scripts.
2. **First vertical slice:** auth plus employee/access management because these are security-sensitive and already have focused API tests.
3. **Quiz authoring/runtime:** introduce runtime validation for publish, attempts, and draft operations.
4. **Remaining domains:** migrate by feature; remove handwritten DTOs only after each mapper is covered.
5. **Legacy retirement:** migrate unversioned endpoints and delete compatibility aliases only after usage telemetry and contract checks confirm no consumers remain.

## Success Criteria

- A removed endpoint or incompatible field change fails before merge with an actionable diff.
- An additive optional field requires only regeneration unless a feature intentionally adopts it.
- A used field rename fails in exactly one feature mapper rather than producing runtime `undefined` across components.
- Frontend builds are reproducible without a live backend.
- Portal/auth policy no longer depends on parsing endpoint strings for migrated operations.
- TanStack Query cancellation reaches `fetch` for migrated queries.
- REST and GraphQL generated artifacts are always synchronized with pinned backend contracts.

## Non-Goals

- Migrating all 424 REST paths in one release.
- Rewriting all frontend API modules at once.
- Removing legitimate free-form metadata fields.
- Exposing production OpenAPI or GraphQL introspection publicly.
- Changing current business behavior or UI layouts.
