import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * 客户端 bundle 冒烟测试：在 Node 里用假 DOM + 假 ModuleLoader 装载
 * lib/client.js，用一个最小 mock ctx 执行 apply()，验证：
 * - 插件注册进 shell.overlay，且带正确 id / locale；
 * - “追问所选部分”把引用块预填进当前会话输入框；
 * - “在新分支中追问”调用 sessions.fork → open 子分支 → 预填引用块。
 */

const here = dirname(fileURLToPath(import.meta.url));
const bundlePath = join(here, "..", "lib", "client.js");

/** 加载 bundle，返回 { id, factory }。 */
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
  // 包进一个函数作用域执行，避免污染全局。
  new Function("window", "document", "requestAnimationFrame", code)(
    windowStub,
    globalThis.document,
    globalThis.requestAnimationFrame,
  );
  assert.ok(entry !== null, "bundle 必须注册进 __ModuleLoader__");
  assert.equal(entry.id, "dsh-ui");
  return entry;
}

/** 构造最小 mock ctx。 */
function makeCtx() {
  const calls = {
    registerDef: null,
    fork: null,
    opened: [],
    drafts: new Map(), // sessionId -> 最终草稿
    dictionaries: null,
  };

  const textarea = { value: "", focused: false, focus() { this.focused = true; }, setSelectionRange() {} };
  document.querySelector = () => textarea;

  // 会话输入面。
  const inputFor = (actx) => ({
    state: { getSnapshot: () => ({ draft: calls.drafts.get(actx.sessionId) ?? "" }) },
    setDraft: (text) => {
      calls.drafts.set(actx.sessionId, text);
    },
  });

  const sessions = {
    list: { getSnapshot: () => ({ current: "s1" }) },
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

  const ctx = {
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
        calls.registerDef = { def, component };
        return () => {};
      },
      inject: (name, callback) => callback(),
    },
    sessions,
    conversation: { input: { for: inputFor } },
  };
  return { ctx, calls, textarea };
}

test("apply 注册 shell.overlay 条目", () => {
  const { factory } = loadBundle();
  const exportsOf = factory((spec) => {
    if (spec === "react" || spec === "react/jsx-runtime") return {};
    throw new Error(`unexpected require: ${spec}`);
  });
  assert.equal(typeof exportsOf.apply, "function");
  assert.deepEqual(exportsOf.inject, ["slots", "sessions", "locale", "conversation"]);

  const { ctx, calls } = makeCtx();
  exportsOf.apply(ctx);
  assert.ok(calls.registerDef, "应注册 slot 条目");
  assert.equal(calls.registerDef.def.name, "shell.overlay");
  assert.equal(calls.registerDef.def.id, "dsh-ui.selection-bar");
  assert.equal(calls.registerDef.def.locale, "dsh-ui.selection");
  assert.ok(calls.dictionaries, "应注册词典");
  assert.equal(calls.dictionaries.ns, "dsh-ui.selection");
});

test("追问所选部分：引用块预填进当前会话输入框", () => {
  const { factory } = loadBundle();
  const exportsOf = factory(() => ({}));
  const { ctx, calls, textarea } = makeCtx();
  exportsOf.apply(ctx);
  const { askHere, askInBranch, hasSession } = calls.registerDef.def.inject();
  assert.equal(hasSession(), true);

  askHere("第一行\n第二行");
  assert.equal(calls.drafts.get("s1"), "> 第一行\n> 第二行\n\n");
  assert.equal(textarea.focused, true);

  // 既有草稿不覆盖：追加到草稿之后。
  calls.drafts.set("s1", "已有内容");
  askHere("补充");
  assert.equal(calls.drafts.get("s1"), "已有内容\n\n> 补充\n\n");
  assert.equal(typeof askInBranch, "function");
});

test("在新分支中追问：fork → open 子分支 → 预填", async () => {
  const { factory } = loadBundle();
  const exportsOf = factory(() => ({}));
  const { ctx, calls } = makeCtx();
  exportsOf.apply(ctx);
  const { askInBranch } = calls.registerDef.def.inject();

  await askInBranch("选中的文字");
  assert.deepEqual(calls.fork, { sessionId: "s1", increaseTitle: true });
  assert.deepEqual(calls.opened, ["s2"]);
  assert.equal(calls.drafts.get("s2"), "> 选中的文字\n\n");
});

test("无当前会话时 askHere 抛错", () => {
  const { factory } = loadBundle();
  const exportsOf = factory(() => ({}));
  const { ctx, calls } = makeCtx();
  ctx.sessions.list.getSnapshot = () => ({ current: undefined });
  exportsOf.apply(ctx);
  const { askHere } = calls.registerDef.def.inject();
  assert.throws(() => askHere("x"), /no current session/);
});
