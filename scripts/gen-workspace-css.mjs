/**
 * 官方 ui-workspace 的 CSS Modules 生成器：
 * 把 src/client/workspace/**\/*.module.css 转成
 *  - <同名>.module.ts：默认导出 { 类名: 哈希类名 }（哈希前缀防全局冲突）；
 *  - _workspaceCss.ts：导出改写后的 CSS 文本（类名/关键帧名全部替换为哈希名）。
 *
 * 用法：node scripts/gen-workspace-css.mjs（产物提交进仓库）。
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "src", "client", "workspace");

const cssFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) walk(join(dir, entry.name));
    else if (entry.name.endsWith(".module.css")) cssFiles.push(join(dir, entry.name));
  }
})(root);

const combined = [];
let exportLines = [];

for (const file of cssFiles) {
  const css = readFileSync(file, "utf8");
  const rel = relative(root, file);
  const hash = createHash("md5").update(rel).digest("hex").slice(0, 6);

  // 收集类名与关键帧名
  const classNames = new Set();
  for (const m of css.matchAll(/\.([a-zA-Z_][\w-]*)/g)) classNames.add(m[1]);
  const keyframes = new Set();
  for (const m of css.matchAll(/@keyframes\s+([a-zA-Z_][\w-]*)/g)) keyframes.add(m[1]);

  const classMap = {};
  let out = css;
  for (const name of classNames) {
    const hashed = `dshuiw_${hash}_${name}`;
    classMap[name] = hashed;
    out = out.replace(new RegExp(`\\.${name}(?![\\w-])`, "g"), `.${hashed}`);
  }
  for (const name of keyframes) {
    const hashed = `dshuiw_${hash}_kf_${name}`;
    out = out.replace(new RegExp(`@keyframes\\s+${name}`, "g"), `@keyframes ${hashed}`);
    out = out.replace(new RegExp(`animation(-name)?\\s*:\\s*([^;]*\\b)${name}(\\b[^;]*)`, "g"), `animation$1: $2${hashed}$3`);
  }

  // 生成模块文件
  const modFile = file.replace(/\.module\.css$/, ".module.ts");
  const exportName = `__ws_styles_${basename(modFile).replace(/\.ts$/, "").replace(/[^a-zA-Z0-9_]/g, "_")}`;
  const lines = [`const ${exportName} = {`];
  for (const name of Object.keys(classMap).sort()) {
    lines.push(`  ${/^[a-zA-Z_][\w]*$/.test(name) ? name : JSON.stringify(name)}: ${JSON.stringify(classMap[name])},`);
  }
  lines.push("} as const;", `export default ${exportName};`);
  writeFileSync(modFile, lines.join("\n") + "\n");

  combined.push(`/* ${rel} */\n${out}`);
  exportLines.push(`export { default as ${exportName} } from ${JSON.stringify("./" + relative(root, modFile).replace(/\.ts$/, ""))};`);
}

const cssTs = `/** 由 scripts/gen-workspace-css.mjs 生成 —— 官方 ui-workspace 样式（类名已哈希）。 */\nexport const workspaceCss = ${JSON.stringify(combined.join("\n"))};\n`;
writeFileSync(join(root, "_workspaceCss.ts"), cssTs);
console.log(`generated ${cssFiles.length} module.ts + _workspaceCss.ts`);
