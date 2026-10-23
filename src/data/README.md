# FE data boundary

`src/data` owns transport-facing code: generated contract adapters, DTO mappers, query transport and persistence adapters. It must not contain page components or business policy.

Existing `src/lib/api`, GraphQL clients and feature-local `api/` folders remain compatibility surfaces until their owning feature migrates. New shared transport code belongs here; feature-specific API code stays beside its feature.
