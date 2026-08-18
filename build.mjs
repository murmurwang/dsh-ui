/**
 * dsh-ui 构建脚本。
 *
 * - host 半边（src/index.ts）→ lib/index.js：普通 ESM。
 * - client 半边（src/client/index.tsx）→ lib/client.js：经典脚本，
 *   把 esbuild 的 IIFE 产物包进 `window.__ModuleLoader__.load({ id, factory })`
 *   工厂形式 —— factory 的 `require` 参数同时满足 esbuild 对
 *   react / react/jsx-runtime 的外部引用。
 *
 * 用法：node build.mjs [--watch]
 */
import * as esbuild from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const BUNDLE_ID = "dsh-ui";
const watch = process.argv.includes("--watch");

/** 产出 .d.ts（host / client 两个面各自的 tsconfig）。 */
function emitTypes() {
  execFileSync("./node_modules/.bin/tsc", ["-p", "tsconfig.host.json"], {
    stdio: "inherit",
  });
  execFileSync("./node_modules/.bin/tsc", ["-p", "tsconfig.client.json"], {
    stdio: "inherit",
  });
}

/** 把 esbuild 的 IIFE 产物包成 client 模块工厂形式。 */
const clientWrap = {
  name: "dsh-client-wrap",
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length > 0) return;
      const body = await readFile("lib/client.js", "utf8");
      const wrapped =
        `window.__ModuleLoader__.load({\n` +
        `\tid: ${JSON.stringify(BUNDLE_ID)},\n` +
        `\tfactory: (require) => {\n${body}\nreturn __dshuiClientExports;\n\t}\n});\n`;
      await writeFile("lib/client.js", wrapped);
    });
  },
};

const shared = {
  bundle: true,
  target: "es2022",
  logLevel: "info",
};

const hostBuild = {
  ...shared,
  entryPoints: ["src/index.ts"],
  outfile: "lib/index.js",
  format: "esm",
  platform: "node",
  external: ["@deepseek-ai/*", "zod"],
  sourcemap: true,
};

/** Typert host 清单：由 dsh-typert-loader 动态导入，必须是 Node ESM。 */
const typertBuild = {
  ...shared,
  entryPoints: ["src/typert.ts"],
  outfile: "lib/typert.js",
  format: "esm",
  platform: "node",
  external: ["@deepseek-ai/*", "zod"],
  sourcemap: true,
};

const clientBuild = {
  ...shared,
  entryPoints: ["src/client/index.tsx"],
  outfile: "lib/client.js",
  format: "iife",
  globalName: "__dshuiClientExports",
  platform: "browser",
  jsx: "automatic",
  minify: true,
  external: ["react", "react/jsx-runtime", "@deepseek-ai/dsh-client-ui-primitives", "@deepseek-ai/dsh-client-runtime/client"],
  plugins: [clientWrap],
};

if (watch) {
  const ctxs = await Promise.all([
    esbuild.context(hostBuild),
    esbuild.context(typertBuild),
    esbuild.context(clientBuild),
  ]);
  emitTypes();
  await Promise.all(ctxs.map((ctx) => ctx.watch()));
  console.log("[dsh-ui] watching src/ for changes…");
} else {
  await Promise.all([
    esbuild.build(hostBuild),
    esbuild.build(typertBuild),
    esbuild.build(clientBuild),
  ]);
  emitTypes();
}
