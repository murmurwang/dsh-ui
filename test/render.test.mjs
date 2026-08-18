import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildSync } from "esbuild";

/**
 * 组件渲染冒烟：用 react-dom/server 渲染四个 UI 组件，
 * 捕获会在真实页面里导致 slot 让位（“tab 消失”）的渲染期崩溃。
 * primitives 在 node 里无法直接导入（katex css），这里别名成一个
 * 图标 stub（组件渲染逻辑与图标实体无关）。
 */

const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "dsh-ui-render-test-"));
test.after(() => rmSync(dir, { recursive: true, force: true }));

const stub = join(dir, "primitives-stub.js");
writeFileSync(
  stub,
  `const React = require("react");
   const icon = (name) => (props) => React.createElement("span", { "data-icon": name, ...props });
   module.exports = {
     IconFolderOpen16: icon("folder-open"),
     IconFolderClose16: icon("folder-close"),
     IconPlusOutline16: icon("plus"),
     IconTriangleRightFill14: icon("chev"),
   };
  `,
);

const entry = join(dir, "entry.tsx");
writeFileSync(
  entry,
  `import { renderToString } from "react-dom/server";
   import * as React from "react";
   import { SidebarRegion } from ${JSON.stringify(join(here, "..", "src", "client", "SidebarRegion.tsx"))};
   import { NoteEditor } from ${JSON.stringify(join(here, "..", "src", "client", "NoteEditor.tsx"))};
   import { Toast } from ${JSON.stringify(join(here, "..", "src", "client", "Toast.tsx"))};
   import { SelectionBar } from ${JSON.stringify(join(here, "..", "src", "client", "SelectionBar.tsx"))};

   const t = (key) => key;
   const noop = () => {};
   const wsState = { items: [{ workspaceId: "w1", path: "/tmp/w", title: "w", sessionIds: [], createdAt: "", updatedAt: "" }], archivedSessionIds: [], state: "idle", phase: "pending", error: null, baselinesReady: false, recentWorkspaceId: undefined };
   const sState = { ids: [], byId: {}, current: undefined, phase: "empty-with-ready", subagentsByParent: {}, jobsBySession: {}, currentAddress: undefined };

   const notes = {
     subscribe: () => noop,
     getSnapshot: () => ({ phase: "boot", items: [], listError: null, openId: null, openNote: null, openError: null, saving: false, savedAt: null, saveError: null, lastClipNoteId: null, toast: null }),
     create: async () => null, open: async () => {}, close: noop, setDirty: noop, recentItems: () => [],
     save: async () => false, addClipTo: async () => false, removeClip: async () => {}, removeNote: async () => {}, notifyToast: noop,
   };

   export function renderAll() {
     const out = [];
     const renderSlot = () => React.createElement("div", null, "browser");
     out.push(renderToString(React.createElement(SidebarRegion, {
       wide: true, expandSidebar: noop, t, renderSlot, notes, openSession: noop,
     })));
     out.push(renderToString(React.createElement(SidebarRegion, {
       wide: false, expandSidebar: noop, t, renderSlot, notes, openSession: noop,
     })));
     out.push(renderToString(React.createElement(NoteEditor, {
       t, notes, openSession: noop, sessionExists: () => false,
       askInNewSession: noop, askInCurrent: noop, workInNote: noop,
     })));
     out.push(renderToString(React.createElement(Toast, { t, notes })));
     out.push(renderToString(React.createElement(SelectionBar, {
       t, hasSession: () => true, askHere: noop, askInBranch: async () => {}, notes, saveClip: async () => true,
     })));
     return out.join("\\n---\\n");
   }
  `,
);

const outFile = join(dir, "render-bundle.cjs");
buildSync({
  entryPoints: [entry],
  bundle: true,
  format: "cjs",
  platform: "node",
  outfile: outFile,
  jsx: "automatic",
  nodePaths: [join(here, "..", "node_modules")],
  alias: { "@deepseek-ai/dsh-client-ui-primitives": stub },
});

const { renderAll } = await import(outFile);

test("SidebarRegion（wide/narrow）、NoteEditor、Toast、SelectionBar 渲染不抛错", () => {
  const html = renderAll();
  assert.ok(html.includes("tabs.workspaces"), "侧栏应渲染出三个 tab");
  assert.ok(html.includes("tabs.notes"), "笔记 tab 应存在");
  assert.ok(html.includes("tabs.files"), "文件 tab 应存在");
  assert.ok(html.includes("tabs.files"), "文件 tab 应存在");
});

test("工作区 tab 渲染官方浏览器子座位", () => {
  const html = renderAll();
  assert.ok(html.includes("browser"), "工作区 tab 应渲染 browser 子座位");
});
