# ERG Cross-Repository Contract Release Protocol

## Purpose

This document defines ownership and the release handshake between the ERG repositories. It prevents copied feature implementations, unversioned API changes, and frontend builds generated from an unpinned backend schema.

## Canonical ownership

| Repository | Canonical responsibility | Must not own |
|---|---|---|
| `D:/ERG/erg-spring` | Backend behavior, persistence, authorization, REST OpenAPI publication, GraphQL schema publication | Frontend feature implementations or generated frontend transport types |
| `D:/ERG/erg-system` | Operational LMS, LCMS, CRM and ELEARNING portals; vendored backend contracts; generated transport types; endpoint/query/cache policy | Backend contract source or public CMS pages |
| `D:/ERG/elearning` | Frozen secondary/legacy frontend after the `ERG-066` duplicate-source audit | New canonical copies of operational features from `erg-system` |
| `D:/ERG/erg` | Public CMS, forum, editorial and marketing application | Operational portal feature ownership or hand-copied backend DTOs |

The `ERG-066` inventory and `docs/architecture/frontend-repository-ownership.md` are the authority for frontend ownership. Do not copy modules between repositories. Fix a shared contract at its canonical publisher and consume it through a package or pinned artifact.

## Published and consumed artifacts

| Contract | Backend publication | Frontend vendored snapshot | Frontend generated output |
|---|---|---|---|
| REST | `erg-spring/contracts/openapi/erg-openapi.json` + `.sha256` | `erg-system/contracts/backend/erg-openapi.json` + `erg-openapi.lock.json` | `erg-system/src/lib/api/generated/erg-openapi.ts` |
| GraphQL | `erg-spring/src/main/resources/graphql/schema.graphqls` + `contracts/graphql/schema.graphqls.sha256` | `erg-system/contracts/backend/schema.graphqls` + `schema.graphqls.lock.json` | `erg-system/src/lib/api/generated/graphql.ts` |

Generated files and vendored snapshots are derived artifacts. Never edit them by hand.

## Contract change protocol

### Additive change

1. Change the backend implementation and contract source in `erg-spring`.
2. Add authorization, validation, tenant isolation and contract tests.
3. Publish the normalized OpenAPI snapshot and/or GraphQL schema with its checksum.
4. Run the backend compatibility/checksum gates.
5. In `erg-system`, run the matching `contract:*:sync` command.
6. Commit the vendored contract, lock and generated types together when the user authorizes a commit.
7. Map generated transport types to domain types at the API boundary; UI code must not import raw DTOs directly.
8. Run FE contract, type, focused API and build gates.

### Breaking or semantic change

Use this sequence only:

`add -> publish -> sync -> generate -> migrate consumers -> deprecate -> observe -> remove`

Renaming/removing fields, changing types, changing nullability, changing enum meaning, altering authorization, or moving an endpoint is breaking even when the HTTP status remains the same. Provide a compatibility field/route or versioned endpoint until all consumers migrate. Record the deprecation owner and removal condition in `Tất cả Task`.

### Emergency rollback

- Prefer reverting the backend behavior and republishing the previous compatible snapshot.
- Do not edit a checksum or generated type to make a failing gate pass.
- If a frontend release must roll back independently, keep the previously vendored contract and deploy the last compatible frontend artifact.
- Database migrations remain append-only; use a forward fix unless an approved operational runbook explicitly supports rollback.

## Required verification

From `D:/ERG/erg-spring`:

```powershell
node scripts/export-openapi-contract.cjs --file contracts/openapi/erg-openapi.json --check
node scripts/check-graphql-schema.cjs
node --test scripts/openapi-contract-lib.test.cjs scripts/graphql-schema-contract-lib.test.cjs
```

For a pull request, also run the OpenAPI/GraphQL compatibility gates against the target branch base contract. CI is the final authority for the exact base revision.

From `D:/ERG/erg-system`:

```powershell
bun run governance:check
bun run contract:check
bun run verify:api-contract
bun run endpoint:check
bun run typecheck
```

Sync commands mutate vendored/generated artifacts and must only be run when a published backend contract intentionally changed. Check commands are safe for ordinary verification.

## Release handoff evidence

The backend handoff must identify the contract type, source commit or change set, compatibility classification, changed operations/types, migration/deprecation window and passing backend gates. The frontend handoff must identify the vendored checksum, generated outputs, migrated consumers and passing FE gates.

Both sides update the same canonical task row in `D:/ERG/TASK/ERG_Task_Management_.xlsx`. `Tất cả Task` remains the only editable task source. A contract change is not complete when only one repository passes.

## Drift prevention

- Run `bun run governance:check` from `erg-system` to verify repository rule files and expected contract artifacts.
- Run `bun run repository-drift:check` to verify canonical frontend ownership and frozen legacy scopes.
- Keep backend checksum gates and compatibility checks required in CI.
- Keep FE vendored locks and generated-type checks required in CI.
- Never resolve drift by copying feature source between `erg-system`, `elearning`, and `erg`.
- Never let mocks become the implicit production contract; production fallbacks require an explicit task and environment gate.
