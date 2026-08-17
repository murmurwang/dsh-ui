window.__ModuleLoader__.load({
	id: "dsh-ui",
	factory: (require) => {
"use strict";
var __dshuiClientExports = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/client/index.tsx
  var index_exports = {};
  __export(index_exports, {
    apply: () => apply,
    inject: () => inject
  });

  // src/client/SelectionBar.tsx
  var React = __toESM(__require("react"), 1);

  // src/client/selection.ts
  var EDITABLE_SELECTOR = "textarea, input, [contenteditable='true'], [contenteditable='']";
  function isInsideEditable(node) {
    if (node === null) return false;
    const el = node instanceof Element ? node : node.parentElement;
    if (el === null) return false;
    return el.matches(EDITABLE_SELECTOR) || el.closest(EDITABLE_SELECTOR) !== null;
  }
  function readSelection(excluded) {
    const sel = window.getSelection();
    if (sel === null || sel.isCollapsed) return null;
    const text = sel.toString().trim();
    if (text === "") return null;
    const anchorNode = sel.anchorNode;
    const focusNode = sel.focusNode;
    if (isInsideEditable(anchorNode) || isInsideEditable(focusNode)) return null;
    if (excluded !== null && (excluded.contains(anchorNode) || excluded.contains(focusNode))) {
      return null;
    }
    if (sel.rangeCount === 0) return null;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return { text, rect, anchorNode, focusNode };
  }
  function watchSelection(handler, excluded) {
    const poll = () => handler(readSelection(excluded()));
    const onMouseUp = () => {
      setTimeout(poll, 0);
    };
    document.addEventListener("selectionchange", poll);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("keyup", poll);
    return () => {
      document.removeEventListener("selectionchange", poll);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("keyup", poll);
    };
  }

  // src/client/SelectionBar.tsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  var PAD = 8;
  function SelectionBar({
    t,
    hasSession,
    askHere,
    askInBranch
  }) {
    const popRef = React.useRef(null);
    const snapRef = React.useRef(null);
    const [snap, setSnap] = React.useState(null);
    const [pos, setPos] = React.useState(null);
    const [forking, setForking] = React.useState(false);
    const [error, setError] = React.useState(null);
    const update = React.useCallback((next) => {
      snapRef.current = next;
      setSnap(next);
      setError(null);
    }, []);
    const close = React.useCallback((clearSelection) => {
      update(null);
      setPos(null);
      setForking(false);
      if (clearSelection) window.getSelection()?.removeAllRanges();
    }, [update]);
    React.useEffect(() => {
      return watchSelection((next) => {
        if (next === null || !hasSession()) {
          update(null);
          setPos(null);
          return;
        }
        update(next);
      }, () => popRef.current);
    }, [hasSession, update]);
    React.useLayoutEffect(() => {
      const el = popRef.current;
      const current = snapRef.current;
      if (snap === null || current === null || el === null) {
        setPos(null);
        return;
      }
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const left = Math.min(
        Math.max(current.rect.left + current.rect.width / 2 - w / 2, PAD),
        window.innerWidth - w - PAD
      );
      let top = current.rect.top - h - PAD;
      if (top < PAD) top = current.rect.bottom + PAD;
      setPos({ left, top });
    }, [snap, forking, error]);
    React.useEffect(() => {
      if (snap === null) return;
      const onScrollOrResize = () => close(false);
      window.addEventListener("scroll", onScrollOrResize, true);
      window.addEventListener("resize", onScrollOrResize);
      return () => {
        window.removeEventListener("scroll", onScrollOrResize, true);
        window.removeEventListener("resize", onScrollOrResize);
      };
    }, [snap, close]);
    React.useEffect(() => {
      if (snap === null) return;
      const onPointerDown = (ev) => {
        if (popRef.current !== null && ev.target instanceof Node && popRef.current.contains(ev.target)) {
          return;
        }
        close(false);
      };
      const onKeyDown = (ev) => {
        if (ev.key === "Escape") close(true);
      };
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("keydown", onKeyDown, true);
      return () => {
        document.removeEventListener("pointerdown", onPointerDown, true);
        document.removeEventListener("keydown", onKeyDown, true);
      };
    }, [snap, close]);
    if (snap === null) return null;
    const onBranch = () => {
      setForking(true);
      askInBranch(snap.text).then(
        () => close(true),
        (err) => {
          setForking(false);
          setError(t("error.fork"));
          console.error("[dsh-ui] branch ask failed:", err);
        }
      );
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        ref: popRef,
        className: "dshui-pop",
        style: pos === null ? { visibility: "hidden", left: 0, top: 0 } : { left: pos.left, top: pos.top },
        role: "toolbar",
        "aria-label": t("bar.aria"),
        onPointerDown: (ev) => ev.preventDefault(),
        children: [
          error !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dshui-pop-error", role: "alert", children: error }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: "dshui-pop-btn",
              disabled: forking,
              title: t("action.here.title"),
              onClick: () => {
                askHere(snap.text);
                close(true);
              },
              children: t("action.here")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: "dshui-pop-btn dshui-pop-btn-primary",
              disabled: forking,
              title: t("action.branch.title"),
              onClick: onBranch,
              children: forking ? t("action.branch.busy") : t("action.branch")
            }
          )
        ]
      }
    );
  }

  // src/client/locales.ts
  var NS = "dsh-ui.selection";
  var zh = {
    "action.here": "\u8FFD\u95EE\u6240\u9009\u90E8\u5206",
    "action.here.title": "\u628A\u6240\u9009\u5185\u5BB9\u4F5C\u4E3A\u5F15\u7528\uFF0C\u9884\u586B\u5230\u5F53\u524D\u5BF9\u8BDD\u7684\u8F93\u5165\u6846",
    "action.branch": "\u5728\u65B0\u5206\u652F\u4E2D\u8FFD\u95EE",
    "action.branch.title": "\u65B0\u5EFA\u4E00\u4E2A\u643A\u5E26\u5F53\u524D\u4E0A\u4E0B\u6587\u7684\u5206\u652F\u5BF9\u8BDD\uFF0C\u5E76\u628A\u6240\u9009\u5185\u5BB9\u9884\u586B\u8FDB\u8F93\u5165\u6846",
    "action.branch.busy": "\u6B63\u5728\u521B\u5EFA\u5206\u652F\u2026",
    "bar.aria": "\u5212\u9009\u6587\u5B57\u8FFD\u95EE",
    "error.noSession": "\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u7684\u5BF9\u8BDD",
    "error.fork": "\u521B\u5EFA\u5206\u652F\u5BF9\u8BDD\u5931\u8D25",
    "error.input": "\u627E\u4E0D\u5230\u8BE5\u4F1A\u8BDD\u7684\u8F93\u5165\u6846"
  };
  var en = {
    "action.here": "Ask about this here",
    "action.here.title": "Quote the selection into the current composer",
    "action.branch": "Ask in a new branch",
    "action.branch.title": "Fork a branch carrying the current context and quote the selection into its composer",
    "action.branch.busy": "Creating branch\u2026",
    "bar.aria": "Selection actions",
    "error.noSession": "No active conversation",
    "error.fork": "Failed to create branch",
    "error.input": "Composer unavailable for this session"
  };

  // src/client/quote.ts
  var QUOTE_MAX_CHARS = 4e3;
  function quoteBlock(text) {
    const trimmed = text.trim().slice(0, QUOTE_MAX_CHARS);
    if (trimmed === "") return "";
    return trimmed.split("\n").map((line) => `> ${line}`).join("\n");
  }

  // src/client/index.tsx
  var BUNDLE_ID = "dsh-ui";
  var TRAILING_BLANK_LINES = 2;
  var css = `
.dshui-pop{position:fixed;z-index:1000;display:flex;align-items:center;gap:4px;padding:4px;border-radius:10px;background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l2,#e2e4e9);box-shadow:var(--dsw-shadow-lv2,0 6px 24px rgba(15,23,42,.14));font-family:var(--dsw-font-family,system-ui)}
.dshui-pop-btn{border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-primary,#1f2329);cursor:pointer;border-radius:7px;padding:4px 10px;font-size:12px;line-height:18px;white-space:nowrap}
.dshui-pop-btn:hover{background:var(--dsw-alias-interactive-bg-hover-solid,#eef0f3)}
.dshui-pop-btn:disabled{opacity:.55;cursor:default}
.dshui-pop-btn-primary{background:var(--dsw-static-deepseek-500,#4d6bfe);color:#fff}
.dshui-pop-btn-primary:hover{background:color-mix(in srgb,var(--dsw-static-deepseek-500,#4d6bfe) 88%,#000)}
.dshui-pop-error{color:var(--dsw-alias-state-error-primary,#d03050);font-size:11px;line-height:16px;padding:0 4px;max-width:220px}
`;
  function injectStyles() {
    if (typeof document === "undefined") return;
    const tagId = `${BUNDLE_ID}/selection-bar.css`;
    if (document.querySelector(`style[data-plugin-css=${JSON.stringify(tagId)}]`) !== null) {
      return;
    }
    const tag = document.createElement("style");
    tag.dataset.plugin = BUNDLE_ID;
    tag.dataset.pluginCss = tagId;
    tag.textContent = css;
    document.head.appendChild(tag);
  }
  var inject = ["slots", "sessions", "locale", "conversation"];
  function composedDraft(quote, existing) {
    const tail = "\n".repeat(TRAILING_BLANK_LINES);
    if (existing.trim() === "") return `${quote}${tail}`;
    return `${existing.replace(/\s+$/, "")}

${quote}${tail}`;
  }
  function focusComposer() {
    requestAnimationFrame(() => {
      const textarea = document.querySelector(
        "[data-conversation-scroll] textarea"
      );
      if (textarea === null) return;
      textarea.focus();
      const end = textarea.value.length;
      textarea.setSelectionRange(end, end);
    });
  }
  function apply(ctx) {
    injectStyles();
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-ui: dictionaries");
    const sessions = ctx.sessions;
    const conversation = ctx.conversation;
    const inputFor = (sessionId) => {
      const actx = sessions.scope(sessionId) ?? sessions.binding(sessionId)?.ctx;
      if (actx === void 0) {
        throw new Error(`dsh-ui: session "${String(sessionId)}" has no resolvable scope`);
      }
      return conversation.input.for(actx);
    };
    const prefill = (sessionId, quote) => {
      const input = inputFor(sessionId);
      const draft = input.state.getSnapshot().draft ?? "";
      input.setDraft(composedDraft(quote, draft));
      focusComposer();
    };
    const currentSessionId = () => sessions.list.getSnapshot().current;
    const askHere = (quote) => {
      const id = currentSessionId();
      if (id === void 0) throw new Error("dsh-ui: no current session");
      prefill(id, quoteBlock(quote));
    };
    const askInBranch = async (quote) => {
      const sourceId = currentSessionId();
      if (sourceId === void 0) throw new Error("dsh-ui: no current session");
      const childId = await sessions.fork({
        sessionId: sourceId,
        increaseTitle: true
      });
      sessions.open(childId);
      let lastError;
      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          prefill(childId, quoteBlock(quote));
          return;
        } catch (err) {
          lastError = err;
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
      throw lastError;
    };
    ctx.slots.inject(
      "shell.overlay",
      () => ctx.slots.register(
        {
          name: "shell.overlay",
          id: "dsh-ui.selection-bar",
          locale: NS,
          inject: () => ({
            hasSession: () => currentSessionId() !== void 0,
            askHere,
            askInBranch
          })
        },
        SelectionBar
      )
    );
  }
  return __toCommonJS(index_exports);
})();

return __dshuiClientExports;
	}
});
