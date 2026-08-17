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
  list(): Promise<RpcResult<{ items: NoteListItem[] }, never>>;
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

/** $mount 客户端远程贡献；返回卸载函数。 */
export function mountNotesRemote(ctx: ClientContext): Promise<() => void> {
  const contribution = {
    package: "dsh-ui",
    descriptors: NOTES_DESCRIPTORS,
  };
  return ctx.remote.$mount(contribution);
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
  /** 轻量 toast（底部提示）。 */
  toast: { text: string; seq: number } | null;
}

const LAST_NOTE_KEY = "dsh-ui.last-clip-note";

function readLastNoteId(): string | null {
  try {
    return localStorage.getItem(LAST_NOTE_KEY);
  } catch {
    return null;
  }
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
    const result = await remote.list();
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
    await this.loadOpen(id);
  }

  close(): void {
    this.stopPolling();
    this.publish({ openId: null, openNote: null, openError: null });
  }

  /** 读取打开中的笔记；有未保存草稿时不覆盖，避免打断用户输入。 */
  private async loadOpen(id: string): Promise<void> {
    const result = await this.face().get({ id });
    if (!result.ok) {
      this.publish({ openId: id, openNote: null, openError: result.error.code === "not-found" ? "笔记不存在" : "读取笔记失败" });
      return;
    }
    if (this.dirty) return; // 本地草稿优先，等保存后再同步。
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

  /** 把剪藏追加到指定笔记（若该笔记正打开，直接更新视图）。 */
  async addClipTo(noteId: string, clip: Omit<NoteClip, "id" | "createdAt">): Promise<boolean> {
    try {
      const target = await this.face().get({ id: noteId });
      if (!target.ok) {
        this.notifyToast("目标笔记不存在");
        return false;
      }
      const result = await this.face().update({
        id: noteId,
        ifVersion: target.value.note.version,
        addClip: clip,
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

  async removeClip(noteId: string, clipId: string): Promise<void> {
    const open = this.state.openNote;
    if (open === null || open.id !== noteId) return;
    const result = await this.face().update({
      id: noteId,
      ifVersion: open.version,
      removeClipId: clipId,
    });
    if (result.ok) this.publish({ openNote: result.value.note });
  }

  async removeNote(id: string): Promise<void> {
    await this.face().delete({ id });
    if (this.state.openId === id) this.close();
    await this.refresh();
  }

  /** 供剪藏选择器用：按最近更新排序的前若干条。 */
  recentItems(limit = 5): NoteListItem[] {
    return [...this.state.items].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
  }
}
