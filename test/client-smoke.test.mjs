import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * 客户端 bundle 冒烟测试：在 Node 里用假 DOM + 假 ModuleLoader 装载
 * lib/client.js，用一个最小 mock ctx 执行 apply()，验证：
 * - 侧栏分栏注册（sidebar.workspaces 被接管）；
 * - shell.overlay 的三个条目（划选浮窗 / 笔记编辑器 / toast）；
 * - notes 远程经 ctx.remote.$mount 挂载并拉到列表；
 * - 划选追问（feature 1）与剪藏、@dsh 动作的调用链。
 */

const here = dirname(fileURLToPath(import.meta.url));
const bundlePath = join(here, "..", "lib", "client.js");

function loadBundle() {
  let entry = null;
  const windowStub = {
    __ModuleLoader__: {
      load: (e) => {
        entry = e;
      },
    },
    getSelection: () => null,
    addEventListener() {},
    removeEventListener() {},
    innerWidth: 1280,
    innerHeight: 800,
  };
  globalThis.window = windowStub;
  globalThis.document = {
    querySelector: () => null,
    createElement: () => ({
      dataset: {},
      set textContent(_) {},
      setAttribute() {},
    }),
    head: { appendChild() {} },
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.requestAnimationFrame = (fn) => {
    fn();
    return 0;
  };
  const code = readFileSync(bundlePath, "utf8");
  new Function("window", "document", "requestAnimationFrame", code)(
    windowStub,
    globalThis.document,
    globalThis.requestAnimationFrame,
  );
  assert.ok(entry !== null, "bundle 必须注册进 __ModuleLoader__");
  assert.equal(entry.id, "dsh-ui");
  return entry;
}

const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

function makeNote(overrides = {}) {
  return {
    id: "n1",
    title: "测试笔记",
    body: "",
    clips: [],
    version: "1",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function makeCtx() {
  const calls = {
    registrations: [], // {name, id, inject()}
    fork: null,
    opened: [],
    drafts: new Map(),
    startSession: 0,
    mounted: null,
    remoteUpdates: [],
    connected: [],
  };

  const textarea = {
    value: "",
    focused: false,
    focus() {
      this.focused = true;
    },
    setSelectionRange() {},
  };
  document.querySelector = () => textarea;

  const inputFor = (actx) => ({
    state: { getSnapshot: () => ({ draft: calls.drafts.get(actx.sessionId) ?? "" }) },
    setDraft: (text) => {
      calls.drafts.set(actx.sessionId, text);
    },
  });

  const sessions = {
    list: { getSnapshot: () => ({ current: "s1", byId: { s1: { displayTitle: "会话一" } } }) },
    scope: (id) => ({ sessionId: id }),
    binding: (id) => ({ sessionId: id, ctx: { sessionId: id } }),
    fork: async (opts) => {
      calls.fork = opts;
      return "s2";
    },
    open: (id) => {
      calls.opened.push(id);
    },
  };

  const workspaces = {
    startSession: () => {
      calls.startSession += 1;
    },
    connectWorkspace: async (id) => {
      calls.connected.push(id);
      return "s1";
    },
    pickDirectory: async () => null,
    create: async () => ({}),
  };

  // 业务信封（返回给拆信封后的 face）
  const business = {
    list: async () => ({ ok: true, value: { items: [makeNote()] } }),
    get: async ({ id }) =>
      id === "n1" ? { ok: true, value: { note: makeNote() } } : { ok: false, error: { code: "not-found", id } },
    create: async ({ title }) => ({ ok: true, value: { note: makeNote({ title: title || "未命名笔记" }) } }),
    update: async (req) => {
      calls.remoteUpdates.push(req);
      return { ok: true, value: { note: makeNote({ version: "2" }) } };
    },
    delete: async () => ({ ok: true, value: { ok: true } }),
  };
  // 传输信封包业务信封（wire 真身是两层）
  const notesFace = {
    list: async (req) => ({ ok: true, value: await business.list(req) }),
    get: async (req) => ({ ok: true, value: await business.get(req) }),
    create: async (req) => ({ ok: true, value: await business.create(req) }),
    update: async (req) => ({ ok: true, value: await business.update(req) }),
    delete: async (req) => ({ ok: true, value: await business.delete(req) }),
  };

  const remote = {
    $mount: async (contribution) => {
      calls.mounted = contribution;
      return async () => {};
    },
    notes: notesFace,
    $on: () => () => {},
  };

  const ctx = {
    get: (name) => (name === "remote.notes" ? notesFace : undefined),
    effect: (fn) => {
      const dispose = fn();
      return typeof dispose === "function" ? dispose : () => {};
    },
    locale: {
      register: (ns, dicts) => {
        calls.dictionaries = { ns, dicts };
      },
      bind: (ns) => (key) => `${ns}.${key}`,
    },
    slots: {
      register: (def, component) => {
        calls.registrations.push({ name: def.name, id: def.id ?? null, inject: def.inject ?? (() => ({})), component });
        return () => {};
      },
      inject: (name, callback) => {
        const disposers = callback();
        return () => {
          for (const d of [disposers].flat()) if (typeof d === "function") d();
        };
      },
    },
    sessions,
    workspaces,
    conversation: { input: { for: inputFor } },
    remote,
  };
  return { ctx, calls, textarea };
}

function loadAndApply() {
  const { factory } = loadBundle();
  const exportsOf = factory((spec) => {
    if (spec === "react" || spec === "react/jsx-runtime" || spec === "@deepseek-ai/dsh-client-ui-primitives") return {};
    if (spec === "@deepseek-ai/dsh-client-runtime/client") {
      return {
        defineStore: (store) => store,
        indexSubagentDescendants: () => new Map(),
      };
    }
    throw new Error(`unexpected require: ${spec}`);
  });
  const { ctx, calls } = makeCtx();
  exportsOf.apply(ctx);
  return { ctx, calls };
}

const byName = (calls, name) => calls.registrations.filter((r) => r.name === name);

test("apply 注册侧栏分栏与三个 overlay 条目", () => {
  const { calls } = loadAndApply();
  assert.equal(byName(calls, "sidebar.workspaces").length, 1, "应接管 sidebar.workspaces");
  const overlays = byName(calls, "shell.overlay");
  assert.equal(overlays.length, 3);
  assert.deepEqual(
    overlays.map((r) => r.id).sort(),
    ["dsh-ui.note-editor", "dsh-ui.selection-bar", "dsh-ui.toast"],
  );
});

test("notes 远程经 $mount 挂载并拉到列表", async () => {
  const { calls } = loadAndApply();
  await sleep(10);
  assert.ok(calls.mounted, "$mount 应被调用");
  assert.equal(calls.mounted.package, "dsh-ui");
  assert.equal(calls.mounted.descriptors.length, 5);
  const sidebar = byName(calls, "sidebar.workspaces")[0].inject();
  assert.ok(sidebar.notes, "侧栏注入应携带 notes 控制器");
  await sleep(10);
  const snapshot = sidebar.notes.getSnapshot();
  assert.equal(snapshot.phase, "ready");
  assert.equal(snapshot.items.length, 1);
});

test("feature 1：追问所选部分与新分支追问仍工作", async () => {
  const { calls } = loadAndApply();
  const bar = byName(calls, "shell.overlay").find((r) => r.id === "dsh-ui.selection-bar").inject();
  assert.equal(bar.hasSession(), true);
  bar.askHere("引用我");
  assert.equal(calls.drafts.get("s1"), "> 引用我\n\n");
  await bar.askInBranch("分支我");
  assert.deepEqual(calls.fork, { sessionId: "s1", increaseTitle: true });
  assert.deepEqual(calls.opened, ["s2"]);
  assert.equal(calls.drafts.get("s2"), "> 分支我\n\n");
});

test("feature 2：划线剪藏成为正文里的回链超链接", async () => {
  const { calls } = loadAndApply();
  await sleep(10);
  const bar = byName(calls, "shell.overlay").find((r) => r.id === "dsh-ui.selection-bar").inject();
  const ok = await bar.saveClip("n1", "剪藏文本");
  assert.equal(ok, true);
  const update = calls.remoteUpdates.find((u) => u.body !== undefined);
  assert.ok(update, "应发出带 body 的 update");
  assert.equal(update.body, "[剪藏文本](dshui://session/s1)\n");
});

test("feature 2：@dsh 动作（当前会话 / 新建会话）预填笔记内容", async () => {
  const { calls } = loadAndApply();
  await sleep(10);
  const editor = byName(calls, "shell.overlay").find((r) => r.id === "dsh-ui.note-editor").inject();
  editor.askInCurrent("笔记上下文内容");
  assert.equal(calls.drafts.get("s1"), "笔记上下文内容\n\n");
  // 预填是追加语义：后续动作接在既有草稿之后。
  editor.askInNewSession("新会话上下文");
  assert.equal(calls.startSession, 1);
  assert.equal(calls.drafts.get("s1"), "笔记上下文内容\n\n新会话上下文\n\n");
  editor.workInNote("工作模板");
  assert.equal(calls.startSession, 2);
  assert.equal(calls.drafts.get("s1"), "笔记上下文内容\n\n新会话上下文\n\n工作模板\n\n");
});

test("无当前会话时 askHere 抛错", () => {
  const { calls, ctx } = loadAndApply();
  ctx.sessions.list.getSnapshot = () => ({ current: undefined, byId: {} });
  const bar = byName(calls, "shell.overlay").find((r) => r.id === "dsh-ui.selection-bar").inject();
  assert.equal(bar.hasSession(), false);
  assert.throws(() => bar.askHere("x"), /no current session/);
});
