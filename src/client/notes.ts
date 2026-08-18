import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type {} from "@deepseek-ai/dsh-api-gateway/client";
import type { Note, NoteClip, NoteListItem, NotesError, RpcResult } from "../notes/contract";
import { NOTES_DESCRIPTORS } from "../notes/wire";

/**
 * 客户端笔记面：把 host 的 `notes` Typert 远程挂进 `ctx.remote`，
 * 并用一个 React-free 的 NotesController 管理列表 / 打开笔记 / 保存 /
 * 剪藏 / 轮询（agent 写回后自动刷新）。
 */

export interface NotesRemoteFace {
  /** wire 契约：每个调用带恰好一个 request 参数对象（list 为 {}）。
   *  返回值已拆掉 RPC 传输信封（外层 {ok, value}），直接是业务结果。 */
  list(request?: Record<string, never>): Promise<RpcResult<{ items: NoteListItem[] }, never>>;
  get(input: { id: string }): Promise<RpcResult<{ note: Note }, NotesError>>;
  create(input: { title?: string }): Promise<RpcResult<{ note: Note }, NotesError>>;
  update(input: {
    id: string;
    ifVersion: string;
    title?: string;
    body?: string;
    addClip?: { text: string; sessionId: string; sessionTitle?: string };
    removeClipId?: string;
  }): Promise<RpcResult<{ note: Note }, NotesError>>;
  delete(input: { id: string }): Promise<RpcResult<{ ok?: true; absent?: true }, NotesError>>;
}

/** 传输失败映射为业务错误（外层 RPC 信封携带 error）。 */
const TRANSPORT_ERROR: NotesError = {
  code: "invalid-argument",
  message: "notes transport failure",
};

/**
 * 拆传输信封：wire 返回外层 RpcResult（transport），其 value 是
 * 业务 RpcResult（我们声明在 typert 清单里的结果 schema）。
 */
async function unwrap<R extends { ok: boolean }>(
  carried: Promise<RpcResult<R, never>>,
): Promise<R> {
  const rpc = await carried;
  return rpc.ok ? rpc.value : ({ ok: false, error: TRANSPORT_ERROR } as unknown as R);
}

/** $mount 客户端远程贡献；返回卸载函数。 */
export function mountNotesRemote(ctx: ClientContext): Promise<() => void> {
  const contribution = {
    package: "dsh-ui",
    descriptors: NOTES_DESCRIPTORS,
  };
  return ctx.remote.$mount(contribution);
}

/** 把 ctx.get 拿到的命名空间服务包装成拆信封后的业务面。 */
export function notesFaceOf(ns: {
  list(request?: Record<string, never>): Promise<RpcResult<RpcResult<{ items: NoteListItem[] }, never>, never>>;
  get(input: { id: string }): Promise<RpcResult<RpcResult<{ note: Note }, NotesError>, never>>;
  create(input: { title?: string }): Promise<RpcResult<RpcResult<{ note: Note }, NotesError>, never>>;
  update(input: unknown): Promise<RpcResult<RpcResult<{ note: Note }, NotesError>, never>>;
  delete(input: { id: string }): Promise<RpcResult<RpcResult<{ ok?: true; absent?: true }, NotesError>, never>>;
}): NotesRemoteFace {
  return {
    list: (request) => unwrap(ns.list(request)),
    get: (input) => unwrap(ns.get(input)),
    create: (input) => unwrap(ns.create(input)),
    update: (input) => unwrap(ns.update(input)),
    delete: (input) => unwrap(ns.delete(input)),
  };
}

export interface NotesSnapshot {
  phase: "boot" | "ready" | "error";
  items: NoteListItem[];
  listError: string | null;
  /** 正在编辑的笔记 id / 全量。 */
  openId: string | null;
  openNote: Note | null;
  openError: string | null;
  saving: boolean;
  savedAt: number | null;
  saveError: string | null;
  /** 剪藏落点记忆（最近一次保存剪藏的笔记 id）。 */
  lastClipNoteId: string | null;
  /** 上次打开的笔记 id（切到笔记 tab 时主区默认恢复它）。 */
  lastOpenNoteId: string | null;
  /** 轻量 toast（底部提示）。 */
  toast: { text: string; seq: number } | null;
}

const LAST_NOTE_KEY = "dsh-ui.last-clip-note";
const LAST_OPEN_KEY = "dsh-ui.last-open-note";

function readLastNoteId(): string | null {
  try {
    return localStorage.getItem(LAST_NOTE_KEY);
  } catch {
    return null;
  }
}

function readLastOpenId(): string | null {
  try {
    return localStorage.getItem(LAST_OPEN_KEY);
  } catch {
    return null;
  }
}

function persistLastOpenId(id: string): void {
  try {
    localStorage.setItem(LAST_OPEN_KEY, id);
  } catch {
    /* ignore */
  }
}

const CLIP_BACK_LINK = "↩ 原对话";

/**
 * 剪藏 → 正文追加内容：
 * - 单行文本：整段作为回链超链接文字（[原文](dshui://session/<id>)）；
 * - 多行/含块级结构：保留 Markdown 结构原样追加，尾部附一条回链行。
 */
function clipToBody(clip: { text: string; sessionId: string }): string {
  const link = `[${CLIP_BACK_LINK}](dshui://session/${clip.sessionId})`;
  const text = clip.text.trim();
  if (text === "") return link;
  if (text.includes("\n")) {
    return `${text}\n\n${link}`;
  }
  return `[${text}](dshui://session/${clip.sessionId})`;
}

const POLL_MS = 3000;

export class NotesController {
  private remote: NotesRemoteFace | null = null;
  private state: NotesSnapshot = {
    phase: "boot",
    items: [],
    listError: null,
    openId: null,
    openNote: null,
    openError: null,
    saving: false,
    savedAt: null,
    saveError: null,
    lastClipNoteId: readLastNoteId(),
    lastOpenNoteId: readLastOpenId(),
    toast: null,
  };
  private listeners = new Set<() => void>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private toastSeq = 0;
  /** 编辑器有未保存草稿时，轮询不覆盖打开中的笔记。 */
  private dirty = false;

  /** 编辑器告知是否有未保存改动。 */
  setDirty(value: boolean): void {
    this.dirty = value;
  }

  getSnapshot = (): NotesSnapshot => this.state;
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  private publish(patch: Partial<NotesSnapshot>): void {
    this.state = { ...this.state, ...patch };
    for (const fn of this.listeners) fn();
  }

  notifyToast(text: string): void {
    this.toastSeq += 1;
    this.publish({ toast: { text, seq: this.toastSeq } });
    if (this.toastTimer !== null) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastTimer = null;
      if (this.state.toast !== null) this.publish({ toast: null });
    }, 2600);
  }

  private face(): NotesRemoteFace {
    if (this.remote === null) {
      throw new Error("dsh-ui: notes remote is not mounted yet");
    }
    return this.remote;
  }

  /** $mount 完成后挂载 remote face 并拉取列表。 */
  async attach(remote: NotesRemoteFace): Promise<void> {
    this.remote = remote;
    await this.refresh();
  }

  detach(): void {
    this.remote = null;
    this.stopPolling();
  }

  async refresh(): Promise<void> {
    const remote = this.remote;
    if (remote === null) return;
    const result = await remote.list({});
    if (result.ok) {
      this.publish({ phase: "ready", items: result.value.items, listError: null });
      // 打开中的笔记若已被删除，关闭编辑。
      if (this.state.openId !== null && !result.value.items.some((i) => i.id === this.state.openId)) {
        this.stopPolling();
        this.publish({ openId: null, openNote: null });
      }
    } else {
      this.publish({ phase: "error", listError: "notes.list failed" });
    }
  }

  async create(title: string): Promise<Note | null> {
    const result = await this.face().create({ title });
    if (!result.ok) {
      this.notifyToast("新建笔记失败");
      return null;
    }
    await this.refresh();
    return result.value.note;
  }

  async open(id: string): Promise<void> {
    if (this.state.openId === id && this.state.openNote !== null) return;
    this.startPolling(id);
    await this.migrateLegacyClips(id);
    // 显式切换强制加载（dirty 保护只作用于同笔记的轮询，不挡切换）。
    await this.loadOpen(id, true);
    const current = this.state.openNote;
    if (current !== null && current.id === id) {
      this.publish({ lastOpenNoteId: id });
      persistLastOpenId(id);
    }
  }

  /** 旧版独立剪藏块 → 正文里的回链超链接（一次性迁移）。 */
  private async migrateLegacyClips(id: string): Promise<void> {
    const remote = this.remote;
    if (remote === null) return;
    const result = await remote.get({ id });
    if (!result.ok) return;
    const note = result.value.note;
    if (note.clips.length === 0) return;
    const lines = note.clips.map((clip) => clipToBody({ text: clip.text.replace(/\s+/g, " "), sessionId: clip.sessionId })).join("\n\n");
    const body =
      note.body.trim() === ""
        ? `${lines}\n`
        : `${note.body.replace(/\s+$/, "")}\n\n${lines}\n`;
    await remote.update({ id, ifVersion: note.version, body });
  }

  close(): void {
    this.stopPolling();
    this.publish({ openId: null, openNote: null, openError: null });
  }

  /**
   * 读取打开中的笔记。
   * @param id - 目标笔记。
   * @param force - true 为显式切换（忽略 dirty）；false 为轮询（有草稿时不覆盖）。
   */
  private async loadOpen(id: string, force = false): Promise<void> {
    const result = await this.face().get({ id });
    if (!result.ok) {
      this.publish({ openId: id, openNote: null, openError: result.error.code === "not-found" ? "笔记不存在" : "读取笔记失败" });
      return;
    }
    if (this.dirty && !force) return; // 轮询时本地草稿优先，等保存后再同步。
    this.publish({
      openId: id,
      openNote: result.value.note,
      openError: null,
      saveError: null,
    });
  }

  private startPolling(id: string): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      // 有未保存草稿时不覆盖，避免打断用户输入。
      void this.loadOpen(id);
    }, POLL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /** 保存标题 + 正文（乐观并发：冲突时重新载入并提示）。 */
  async save(input: { title?: string; body?: string }): Promise<boolean> {
    const open = this.state.openNote;
    if (open === null || this.remote === null) return false;
    this.publish({ saving: true, saveError: null });
    try {
      const result = await this.face().update({
        id: open.id,
        ifVersion: open.version,
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.body !== undefined ? { body: input.body } : {}),
      });
      if (!result.ok) {
        if (result.error.code === "version-conflict") {
          this.publish({ saving: false, saveError: "笔记已被其他来源修改，已载入最新内容" });
          await this.loadOpen(open.id);
        } else {
          this.publish({ saving: false, saveError: "保存失败" });
        }
        return false;
      }
      this.publish({
        saving: false,
        savedAt: Date.now(),
        openNote: result.value.note,
      });
      this.dirty = false;
      await this.refresh();
      return true;
    } catch {
      this.publish({ saving: false, saveError: "保存失败（网络）" });
      return false;
    }
  }

  /**
   * 把剪藏存进指定笔记：正文末尾追加一段“回链超链接文字”
   * （链接文字 = 引用原文，目标 = 原会话）。若该笔记正打开，直接更新视图。
   */
  async addClipTo(noteId: string, clip: Omit<NoteClip, "id" | "createdAt">): Promise<boolean> {
    try {
      const target = await this.face().get({ id: noteId });
      if (!target.ok) {
        this.notifyToast("目标笔记不存在");
        return false;
      }
      const note = target.value.note;
      const line = clipToBody(clip);
      const body =
        note.body.trim() === ""
          ? `${line}\n`
          : `${note.body.replace(/\s+$/, "")}\n\n${line}\n`;
      const result = await this.face().update({
        id: noteId,
        ifVersion: note.version,
        body,
      });
      if (!result.ok) {
        this.notifyToast("剪藏失败（笔记可能已被修改，请重试）");
        return false;
      }
      this.publish({ lastClipNoteId: noteId });
      try {
        localStorage.setItem(LAST_NOTE_KEY, noteId);
      } catch {
        /* 忽略存储不可用 */
      }
      if (this.state.openId === noteId) {
        this.publish({ openNote: result.value.note });
      }
      await this.refresh();
      this.notifyToast(`已保存到《${result.value.note.title}》`);
      return true;
    } catch {
      this.notifyToast("剪藏失败（网络）");
      return false;
    }
  }

  async removeNote(id: string): Promise<void> {
    await this.face().delete({ id });
    if (this.state.openId === id) this.close();
    if (this.state.lastOpenNoteId === id) {
      this.publish({ lastOpenNoteId: null });
      try {
        localStorage.removeItem(LAST_OPEN_KEY);
      } catch {
        /* ignore */
      }
    }
    await this.refresh();
  }

  /**
   * 以指定版本快照保存（切换笔记时兜底保存上一篇的草稿）：
   * 不依赖当前 openNote，也不会把草稿误写进新打开的笔记。
   */
  async saveAs(
    snapshot: { id: string; version: string },
    input: { title: string; body: string },
  ): Promise<boolean> {
    try {
      const result = await this.face().update({
        id: snapshot.id,
        ifVersion: snapshot.version,
        ...input,
      });
      if (result.ok) {
        if (this.state.openNote?.id === snapshot.id) {
          this.publish({ openNote: result.value.note });
        }
        await this.refresh();
      }
      return result.ok;
    } catch {
      return false;
    }
  }

  /** 重命名（乐观并发；打开的笔记同步视图）。 */
  async renameNote(id: string, title: string): Promise<boolean> {
    try {
      const target = await this.face().get({ id });
      if (!target.ok) {
        this.notifyToast("笔记不存在");
        return false;
      }
      const result = await this.face().update({
        id,
        ifVersion: target.value.note.version,
        title,
      });
      if (!result.ok) {
        this.notifyToast("重命名失败（笔记可能已被修改）");
        return false;
      }
      if (this.state.openId === id) {
        this.publish({ openNote: result.value.note });
      }
      await this.refresh();
      return true;
    } catch {
      this.notifyToast("重命名失败（网络）");
      return false;
    }
  }

  /** 供剪藏选择器用：按最近更新排序的前若干条。 */
  recentItems(limit = 5): NoteListItem[] {
    return [...this.state.items].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
  }
}
