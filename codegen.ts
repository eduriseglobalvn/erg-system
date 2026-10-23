import type { CodegenConfig } from "@graphql-codegen/cli";

// Generates typed GraphQL documents/variables/responses from the vendored BE schema
// (contracts/backend/schema.graphqls, synced+locked by scripts/sync-graphql-contract.mjs).
// Types-only: no runtime client is emitted; feature APIs keep using graphQlRequest with the
// generated operation types applied as its <TData, TVariables> parameters.
const config: CodegenConfig = {
  schema: "contracts/backend/schema.graphqls",
  documents: ["src/**/*.graphql"],
  generates: {
    "src/lib/api/generated/graphql.ts": {
      plugins: ["typescript-operations"],
      config: {
        immutableTypes: true,
        avoidOptionals: false,
        enumsAsTypes: true,
        skipTypename: true,
        useTypeImports: true,
        preResolveTypes: true,
      },
    },
  },
};

export default config;
