import { compile, optimize } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

const htmlPath = path.join(import.meta.dirname, "index.html");

const styleRegex = /(<style>)([\s\S]*?)(<\/style>)/g;

function getStyleContents(html: string) {
  const matches = [...html.matchAll(styleRegex)];
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one <style> block in ${htmlPath}, found ${matches.length}`,
    );
  }
  return matches[0][2];
}

async function generateCss(html: string) {
  // Scanning the inlined CSS too would pick up candidates from its own text
  // (e.g. "table", "small"), so every run would produce different output.
  const content = html.replace(styleRegex, "$1$3");
  const candidates = new Scanner({}).scanFiles([
    { content, extension: "html" },
  ]);
  const compiler = await compile('@import "tailwindcss";', {
    base: import.meta.dirname,
    onDependency() {},
  });
  return optimize(compiler.build(candidates), { minify: true }).code.trimEnd();
}

async function main() {
  const { values } = parseArgs({
    options: { check: { default: false, type: "boolean" } },
  });

  const html = await readFile(htmlPath, "utf8");
  const current = getStyleContents(html);
  const css = await generateCss(html);

  if (values.check) {
    if (css !== current) {
      console.error(
        "geo-block/index.html is out of date; run pnpm --filter @vetro-protocol/geo-block run build",
      );
      process.exitCode = 1;
    }
    return;
  }

  await writeFile(
    htmlPath,
    html.replace(styleRegex, (_, open, __, close) => `${open}${css}${close}`),
  );
}

await main();
