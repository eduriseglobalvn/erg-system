import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const BASELINE_PATH = "scripts/design-token-baseline.json";
const SKIP_PATH = /(^|\/)(test|themes|generated)\/|^src\/components\/ui\/|\.test\.|\.d\.ts$|\.generated\./;
// Comments are stripped first; the `//` rule skips "://" so URLs in strings survive.
const COMMENTS = /\/\*[\s\S]*?\*\/|(^|[^:\'"`])\/\/.*$/gm;
// Hex in code/strings; lookbehind skips entities (&#123;), URL fragments and words (a#abc).
const HEX = /(?<![\w&/#-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w-])/g;
const FONT = /\bfont(?:Size|Weight)\s*:\s*(?:\d+(?:\.\d+)?|["'`]\d+(?:\.\d+)?(?:px)?["'`])/g;

export function countDesignTokens(source) {
  const code = source.replace(COMMENTS, "$1");
  return { hex: code.match(HEX)?.length ?? 0, font: code.match(FONT)?.length ?? 0 };
}

export function isScanned(path) {
  return /\.tsx?$/.test(path) && !SKIP_PATH.test(path);
}

export function compareToBaseline(current, baseline) {
  const over = [];
  const under = [];
  for (const [file, c] of Object.entries(current)) {
    const b = baseline[file] ?? { hex: 0, font: 0 };
    if (c.hex > b.hex || c.font > b.font) over.push({ file, current: c, baseline: b });
    else if (c.hex < b.hex || c.font < b.font) under.push(file);
  }
  for (const file of Object.keys(baseline)) if (!(file in current)) under.push(file);
  return { over, under };
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name).replaceAll("\\", "/");
    if (e.isDirectory()) walk(p, out);
    else if (isScanned(p)) out.push(p);
  }
  return out;
}

export function scanTree(root = "src") {
  const result = {};
  for (const file of walk(root).sort()) {
    const c = countDesignTokens(readFileSync(file, "utf8"));
    if (c.hex || c.font) result[file] = c;
  }
  return result;
}

function runCli() {
  const current = scanTree();
  const total = (k) => Object.values(current).reduce((n, c) => n + c[k], 0);
  if (process.argv.includes("--update")) {
    writeFileSync(BASELINE_PATH, `${JSON.stringify(current, null, 2)}\n`);
    console.log(`Wrote ${BASELINE_PATH}: hex=${total("hex")}, fontSize/fontWeight=${total("font")}, files=${Object.keys(current).length}`);
    return;
  }
  const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, "utf8")) : {};
  const { over, under } = compareToBaseline(current, baseline);
  if (over.length) {
    for (const { file, current: c, baseline: b } of over) {
      console.error(`${file}: hex ${c.hex} (baseline ${b.hex}), fontSize/fontWeight ${c.font} (baseline ${b.font})`);
    }
    console.error(
      `Design token baseline failed: ${over.length} file(s) có thêm màu hex / fontSize / fontWeight viết tay. ` +
        `${over.length} file(s) add hard-coded hex colors or numeric fontSize/fontWeight. Dùng token theme (src/themes) thay vì giá trị cứng / Use theme tokens instead.`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(`Design token baseline holds (hex=${total("hex")}, fontSize/fontWeight=${total("font")}, files=${Object.keys(current).length}).`);
  if (under.length) {
    console.log(`Gợi ý / Hint: ${under.length} file(s) giảm so với baseline; chạy \`node scripts/check-design-token-baseline.mjs --update\` để hạ baseline / run with --update to lower it.`);
  }
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) runCli();
