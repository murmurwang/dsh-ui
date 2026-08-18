var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : /* @__PURE__ */ Symbol.for("Symbol." + name);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name, decorators, target, extra) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name]() {
    return __privateGet(this, extra);
  }, set [name](x) {
    return __privateSet(this, extra, x);
  } }, name));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name) : __name(target, name);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name, desc), p ? k ^ 4 ? extra : desc : target;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/index.ts
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";

// src/notes/service.ts
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
var _delete_dec, _update_dec, _create_dec, _get_dec, _list_dec, _a, _init;
var NotesService = class extends (_a = TypertRemoteService, _list_dec = [Remote("list")], _get_dec = [Remote("get")], _create_dec = [Remote("create")], _update_dec = [Remote("update")], _delete_dec = [Remote("delete")], _a) {
  constructor(ctx, store) {
    super(ctx, "notes");
    __runInitializers(_init, 5, this);
    /** 存储实例由 apply 注入，与 agent 工具共享。 */
    __publicField(this, "store");
    this.store = store;
  }
  list(_request = {}) {
    return this.store.list();
  }
  get(request) {
    return this.store.get(request.id);
  }
  create(request) {
    return this.store.create(request);
  }
  update(request) {
    return this.store.update(request);
  }
  delete(request) {
    return this.store.remove(request.id);
  }
};
_init = __decoratorStart(_a);
__decorateElement(_init, 1, "list", _list_dec, NotesService);
__decorateElement(_init, 1, "get", _get_dec, NotesService);
__decorateElement(_init, 1, "create", _create_dec, NotesService);
__decorateElement(_init, 1, "update", _update_dec, NotesService);
__decorateElement(_init, 1, "delete", _delete_dec, NotesService);
__decoratorMetadata(_init, NotesService);

// src/notes/store.ts
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
var MAX_TITLE_CHARS = 200;
var MAX_BODY_CHARS = 2e5;
var MAX_CLIP_CHARS = 2e4;
function err(msg) {
  return { code: "invalid-argument", message: msg };
}
function notFound(id) {
  return { code: "not-found", id };
}
function versionConflict(current) {
  return { code: "version-conflict", current };
}
function sanitizeNote(parsed) {
  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed;
  if (typeof record.id !== "string" || record.id === "") return null;
  if (typeof record.title !== "string") return null;
  if (typeof record.body !== "string") return null;
  if (!Array.isArray(record.clips)) return null;
  const clips = [];
  for (const clip of record.clips) {
    if (typeof clip !== "object" || clip === null || typeof clip.id !== "string" || typeof clip.text !== "string" || typeof clip.sessionId !== "string") {
      return null;
    }
    const c = clip;
    clips.push({
      id: c.id,
      text: c.text,
      sessionId: c.sessionId,
      ...typeof c.sessionTitle === "string" ? { sessionTitle: c.sessionTitle } : {},
      createdAt: typeof c.createdAt === "number" ? c.createdAt : 0
    });
  }
  if (typeof record.version !== "string") return null;
  const createdAt = typeof record.createdAt === "number" ? record.createdAt : Date.now();
  const updatedAt = typeof record.updatedAt === "number" ? record.updatedAt : createdAt;
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    clips,
    version: record.version,
    createdAt,
    updatedAt
  };
}
var NotesStore = class {
  constructor(root) {
    this.root = root;
    this.file = join(root, "notes.jsonl");
  }
  root;
  notes = /* @__PURE__ */ new Map();
  tail = Promise.resolve();
  loaded = false;
  versionCounter = 0;
  file;
  /** 加载（幂等）；文件不存在时视为空库。 */
  async load() {
    if (this.loaded) return;
    this.loaded = true;
    await mkdir(this.root, { recursive: true });
    let raw;
    try {
      raw = await readFile(this.file, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (trimmed === "") continue;
      try {
        const parsed = JSON.parse(trimmed);
        const note = sanitizeNote(parsed);
        if (note === null) continue;
        this.notes.set(note.id, note);
        const counter = Number(note.version);
        if (Number.isFinite(counter) && counter > this.versionCounter) {
          this.versionCounter = counter;
        }
      } catch {
      }
    }
  }
  async enqueue(operation) {
    const run = this.tail.then(operation, operation);
    this.tail = run.then(
      () => void 0,
      () => void 0
    );
    return run;
  }
  nextVersion() {
    this.versionCounter += 1;
    return String(this.versionCounter);
  }
  async persist() {
    const lines = [...this.notes.values()].sort((a, b) => a.createdAt - b.createdAt).map((note) => JSON.stringify(note)).join("\n");
    const tmp = `${this.file}.tmp-${randomUUID()}`;
    await writeFile(tmp, lines === "" ? "" : `${lines}
`, "utf8");
    await rename(tmp, this.file);
  }
  require(id) {
    const note = this.notes.get(id);
    if (note === void 0) {
      return { error: { ok: false, error: notFound(id) } };
    }
    return { note };
  }
  /** 列表（按创建时间升序）。 */
  list() {
    return this.enqueue(async () => {
      await this.load();
      const items = [...this.notes.values()].sort((a, b) => a.createdAt - b.createdAt).map((note) => ({
        id: note.id,
        title: note.title,
        clipCount: note.clips.length,
        bodyLength: note.body.length,
        version: note.version,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }));
      return { ok: true, value: { items } };
    });
  }
  /** 读取整篇笔记（返回快照，后续内部变更不影响调用方持有的对象）。 */
  get(id) {
    return this.enqueue(async () => {
      await this.load();
      const found = this.require(id);
      if ("error" in found) return found.error;
      return { ok: true, value: { note: structuredClone(found.note) } };
    });
  }
  /** 新建笔记。 */
  create(input) {
    return this.enqueue(async () => {
      await this.load();
      const title = (input.title ?? "\u672A\u547D\u540D\u7B14\u8BB0").trim().slice(0, MAX_TITLE_CHARS) || "\u672A\u547D\u540D\u7B14\u8BB0";
      const now = Date.now();
      const note = {
        id: randomUUID(),
        title,
        body: "",
        clips: [],
        version: this.nextVersion(),
        createdAt: now,
        updatedAt: now
      };
      this.notes.set(note.id, note);
      await this.persist();
      return { ok: true, value: { note: structuredClone(note) } };
    });
  }
  /**
   * 更新一篇笔记：title/body 整值替换；addClip 追加剪藏；removeClipId 删除剪藏。
   * ifVersion 必须匹配当前版本。
   */
  update(input) {
    return this.enqueue(async () => {
      await this.load();
      const found = this.require(input.id);
      if ("error" in found) return found.error;
      const note = found.note;
      if (note.version !== input.ifVersion) {
        return { ok: false, error: versionConflict(note) };
      }
      if (input.title !== void 0) {
        const title = input.title.trim().slice(0, MAX_TITLE_CHARS);
        if (title === "") return { ok: false, error: err("title must not be blank") };
        note.title = title;
      }
      if (input.body !== void 0) {
        if (input.body.length > MAX_BODY_CHARS) return { ok: false, error: err(`body exceeds ${MAX_BODY_CHARS} chars`) };
        note.body = input.body;
      }
      if (input.addClip !== void 0) {
        const text = input.addClip.text.trim();
        if (text === "") return { ok: false, error: err("clip text must not be blank") };
        if (text.length > MAX_CLIP_CHARS) return { ok: false, error: err(`clip exceeds ${MAX_CLIP_CHARS} chars`) };
        note.clips.push({
          id: randomUUID(),
          text: text.slice(0, MAX_CLIP_CHARS),
          sessionId: input.addClip.sessionId,
          ...input.addClip.sessionTitle !== void 0 ? { sessionTitle: input.addClip.sessionTitle } : {},
          createdAt: Date.now()
        });
      }
      if (input.removeClipId !== void 0) {
        note.clips = note.clips.filter((clip) => clip.id !== input.removeClipId);
      }
      note.version = this.nextVersion();
      note.updatedAt = Date.now();
      await this.persist();
      return { ok: true, value: { note: structuredClone(note) } };
    });
  }
  /** 删除一篇笔记。 */
  remove(id) {
    return this.enqueue(async () => {
      await this.load();
      const existed = this.notes.delete(id);
      if (!existed) return { ok: true, value: { absent: true } };
      await this.persist();
      return { ok: true, value: { ok: true } };
    });
  }
};

// src/notes/tool.ts
import { defineTool } from "@deepseek-ai/dsh-tools";
function defineNotesTool(store) {
  return defineTool({
    name: "notes",
    description: "Work with the user's notes (the dsh-ui notes store). Notes are Markdown documents; each note also carries clips (quoted excerpts saved from conversations, each with a sessionId link). Operations: 'list' enumerates notes (id/title/version). 'read' returns the full note including its current version. 'create' makes a new note. 'write' replaces a note's Markdown body; 'append' adds text to the end of the body. write/append require ifVersion (the version from a previous read) so concurrent edits are never lost \u2014 on a version-conflict, read again and retry once. Use this tool whenever the user asks you to work inside a note (organize content into tables or lists, summarize, reword, extend) or to save something into a note; write the finished result back into the same note.",
    parameters: {
      operation: {
        type: "string",
        required: true,
        description: "One of: 'list' | 'read' | 'create' | 'write' | 'append'."
      },
      noteId: {
        type: "string",
        description: "Target note id (required for read/write/append)."
      },
      title: {
        type: "string",
        description: "Note title (used by 'create')."
      },
      content: {
        type: "string",
        description: "Markdown body. 'write': full replacement. 'append': appended to the end of the current body."
      },
      ifVersion: {
        type: "string",
        description: "Expected current note version for write/append; mismatches are rejected so concurrent edits are not lost."
      }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          ok: { type: "boolean", required: true }
        }
      },
      render: (_args, value) => [
        {
          type: "text",
          text: JSON.stringify(value, null, 2)
        }
      ]
    },
    // 返回值是 RpcResult 形状的普通 JSON 对象；schema 为宽松对象，
    // 其推断的规范值类型与领域类型无关，这里显式收窄。
    async execute(args) {
      const a = args;
      const operation = String(a.operation ?? "");
      switch (operation) {
        case "list":
          return store.list();
        case "read": {
          if (typeof a.noteId !== "string") {
            throw new Error("notes.read requires noteId");
          }
          return store.get(a.noteId);
        }
        case "create":
          return store.create({
            ...typeof a.title === "string" ? { title: a.title } : {}
          });
        case "write":
        case "append": {
          if (typeof a.noteId !== "string") {
            throw new Error(`notes.${operation} requires noteId`);
          }
          if (typeof a.ifVersion !== "string") {
            throw new Error(`notes.${operation} requires ifVersion from a prior read`);
          }
          if (typeof a.content !== "string") {
            throw new Error(`notes.${operation} requires content`);
          }
          if (operation === "write") {
            return store.update({
              id: a.noteId,
              ifVersion: a.ifVersion,
              body: a.content
            });
          }
          const current = await store.get(a.noteId);
          if (!current.ok) return current;
          const joined = current.value.note.body === "" ? a.content : `${current.value.note.body.replace(/\s+$/, "")}

${a.content}`;
          return store.update({
            id: a.noteId,
            ifVersion: a.ifVersion,
            body: joined
          });
        }
        default:
          throw new Error(
            `unknown notes operation "${operation}" (expected list/read/create/write/append)`
          );
      }
    }
  });
}

// src/index.ts
var inject = ["tools"];
function apply(ctx, config = {}) {
  const root = config.root ?? dshHomePath("notes");
  const store = new NotesStore(root);
  new NotesService(ctx, store);
  const notesTool = defineNotesTool(store);
  ctx.tools.register(notesTool);
}
export {
  NotesService,
  NotesStore,
  apply,
  inject
};
//# sourceMappingURL=index.js.map
