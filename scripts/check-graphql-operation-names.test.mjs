import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { auditGraphqlOperationSources, scanGraphqlOperationNames } from "./check-graphql-operation-names.mjs";

test("accepts unique matching operation names with the feature domain prefix", () => {
  const violations = auditGraphqlOperationSources([
    {
      file: "src/features/lms/api/classes-api.ts",
      source: `
        const query = \`query LmsClassDirectory { lms { namespace } }\`;
        graphQlRequest({ operationName: "LmsClassDirectory", query });
      `,
    },
    {
      file: "src/features/lcms/api/quizzes-api.ts",
      source: `
        const query = \`query LcmsQuizDirectory { lcms { namespace } }\`;
        graphQlRequest({ operationName: "LcmsQuizDirectory", query });
      `,
    },
  ]);

  assert.deepEqual(violations, []);
});

test("ignores TypeScript comments and prose that mention query concepts", () => {
  const violations = auditGraphqlOperationSources([
    {
      file: "src/features/notifications/api/notification-api.ts",
      source: `
        // Query keys and react-query scope live in notification-query.ts.
        export const note = "keep query scope narrow";
      `,
    },
  ]);

  assert.deepEqual(violations, []);
});

test("rejects unnamed, mismatched, duplicate, and unprefixed operations", () => {
  const violations = auditGraphqlOperationSources([
    {
      file: "src/features/lms/api/classes-api.ts",
      source: `
        const unnamed = \`query { lms { namespace } }\`;
        const first = \`query ClassDirectory { lms { namespace } }\`;
        graphQlRequest({ operationName: "LmsWrongName", query: first });
      `,
    },
    {
      file: "src/features/lms/api/duplicate-api.ts",
      source: `
        const query = \`query ClassDirectory { lms { status } }\`;
        graphQlRequest({ operationName: "ClassDirectory", query });
      `,
    },
  ]);

  assert.deepEqual(
    new Set(violations.map(({ rule }) => rule)),
    new Set(["unnamed-operation", "wrong-domain-prefix", "operation-name-mismatch", "duplicate-operation-name"]),
  );
});

test("an empty CLI path list still scans the default feature tree", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "erg-graphql-operation-policy-"));
  const previousCwd = process.cwd();
  try {
    const apiDirectory = join(fixtureRoot, "src/features/lms/api");
    mkdirSync(apiDirectory, { recursive: true });
    writeFileSync(
      join(apiDirectory, "bad-api.ts"),
      `const query = \`query MissingPrefix { lms { namespace } }\`;\n` +
        `graphQlRequest({ operationName: "MissingPrefix", query });\n`,
    );
    process.chdir(fixtureRoot);

    assert.equal(scanGraphqlOperationNames([]).some(({ rule }) => rule === "wrong-domain-prefix"), true);
  } finally {
    process.chdir(previousCwd);
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("accepts operation metadata backed by an imported raw GraphQL document", () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "erg-graphql-raw-operation-policy-"));
  const previousCwd = process.cwd();
  try {
    const apiDirectory = join(fixtureRoot, "src/features/elearning/api");
    mkdirSync(apiDirectory, { recursive: true });
    writeFileSync(
      join(apiDirectory, "student-dashboard.graphql"),
      "query ElearningStudentDashboard { elearning { namespace } }\n",
    );
    writeFileSync(
      join(apiDirectory, "student-dashboard-api.ts"),
      `import document from "./student-dashboard.graphql?raw";\n` +
        `graphQlRequest({ operationName: "ElearningStudentDashboard", query: document });\n`,
    );
    process.chdir(fixtureRoot);

    assert.deepEqual(scanGraphqlOperationNames([]), []);
  } finally {
    process.chdir(previousCwd);
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
