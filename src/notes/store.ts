import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import type {
  InvalidArgumentError,
  Note,
  NoteClip,
  NoteListItem,
  NotesError,
  NotFoundError,
  RpcResult,
  VersionConflictError,
} from "./contract";

const MAX_TITLE_CHARS = 200;
const MAX_BODY_CHARS = 200_000;
const MAX_CLIP_CHARS = 20_000;

function err(msg: string): InvalidArgumentError {
  return { code: "invalid-argument", message: msg };
}

function notFound(id: string): NotFoundError {
  return { code: "not-found", id };
}

function versionConflict(current: Note | null): VersionConflictError {
  return { code: "version-conflict", current };
}

/** 把解析出的任意对象收窄成合法 Note；形状不对或关键字段缺失返回 null。 */
function sanitizeNote(parsed: unknown): Note | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  if (typeof record.id !== "string" || record.id === "") return null;
  if (typeof record.title !== "string") return null;
  if (typeof record.body !== "string") return null;
  if (!Array.isArray(record.clips)) return null;
  const clips: NoteClip[] = [];
  for (const clip of record.clips) {
    if (
      typeof clip !== "object" ||
      clip === null ||
      typeof (clip as Record<string, unknown>).id !== "string" ||
      typeof (clip as Record<string, unknown>).text !== "string" ||
      typeof (clip as Record<string, unknown>).sessionId !== "string"
    ) {
      return null;
    }
    const c = clip as Record<string, unknown>;
    clips.push({
      id: c.id as string,
      text: c.text as string,
      sessionId: c.sessionId as string,
      ...(typeof c.sessionTitle === "string" ? { sessionTitle: c.sessionTitle } : {}),
      createdAt: typeof c.createdAt === "number" ? c.createdAt : 0,
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
    updatedAt,
  };
}

/**
 * 笔记存储：单一 JSONL 文件（root/notes.jsonl），整文件原子替换写入。
 * 所有变更经同一串行队列，version 为每次变更递增的单调字符串，
 * 客户端 / agent 工具用 ifVersion 做乐观并发。
 */
export class NotesStore {
  private notes = new Map<string, Note>();
  private tail = Promise.resolve();
  private loaded = false;
  private versionCounter = 0;
  readonly file: string;

  constructor(readonly root: string) {
    this.file = join(root, "notes.jsonl");
  }

  /** 加载（幂等）；文件不存在时视为空库。 */
  async load(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    await mkdir(this.root, { recursive: true });
    let raw: string;
    try {
      raw = await readFile(this.file, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (trimmed === "") continue;
      try {
        const parsed = JSON.parse(trimmed) as Partial<Note> & { id?: unknown };
        const note = sanitizeNote(parsed);
        if (note === null) continue;
        this.notes.set(note.id, note);
        const counter = Number(note.version);
        if (Number.isFinite(counter) && counter > this.versionCounter) {
          this.versionCounter = counter;
        }
      } catch {
        // 损坏行跳过，不阻断整个库。
      }
    }
  }

  private async enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.tail.then(operation, operation);
    this.tail = run.then(
      () => void 0,
      () => void 0,
    );
    return run;
  }

  private nextVersion(): string {
    this.versionCounter += 1;
    return String(this.versionCounter);
  }

  private async persist(): Promise<void> {
    const lines = [...this.notes.values()]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((note) => JSON.stringify(note))
      .join("\n");
    const tmp = `${this.file}.tmp-${randomUUID()}`;
    await writeFile(tmp, lines === "" ? "" : `${lines}\n`, "utf8");
    await rename(tmp, this.file);
  }

  private require(id: string): { note: Note } | { error: RpcResult<never, NotesError> } {
    const note = this.notes.get(id);
    if (note === undefined) {
      return { error: { ok: false, error: notFound(id) } };
    }
    return { note };
  }

  /** 列表（按创建时间升序）。 */
  list(): Promise<RpcResult<{ items: NoteListItem[] }, never>> {
    return this.enqueue(async () => {
      await this.load();
      const items = [...this.notes.values()]
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((note) => ({
          id: note.id,
          title: note.title,
          clipCount: note.clips.length,
          bodyLength: note.body.length,
          version: note.version,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        }));
      return { ok: true, value: { items } };
    });
  }

  /** 读取整篇笔记（返回快照，后续内部变更不影响调用方持有的对象）。 */
  get(id: string): Promise<RpcResult<{ note: Note }, NotesError>> {
    return this.enqueue(async () => {
      await this.load();
      const found = this.require(id);
      if ("error" in found) return found.error;
      return { ok: true, value: { note: structuredClone(found.note) } };
    });
  }

  /** 新建笔记。 */
  create(input: { title?: string }): Promise<RpcResult<{ note: Note }, InvalidArgumentError>> {
    return this.enqueue(async () => {
      await this.load();
      const title = (input.title ?? "未命名笔记").trim().slice(0, MAX_TITLE_CHARS) || "未命名笔记";
      const now = Date.now();
      const note: Note = {
        id: randomUUID(),
        title,
        body: "",
        clips: [],
        version: this.nextVersion(),
        createdAt: now,
        updatedAt: now,
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
  update(input: {
    id: string;
    ifVersion: string;
    title?: string;
    body?: string;
    addClip?: Omit<NoteClip, "id" | "createdAt">;
    removeClipId?: string;
  }): Promise<RpcResult<{ note: Note }, NotesError>> {
    return this.enqueue(async () => {
      await this.load();
      const found = this.require(input.id);
      if ("error" in found) return found.error;
      const note = found.note;
      if (note.version !== input.ifVersion) {
        return { ok: false, error: versionConflict(note) };
      }
      if (input.title !== undefined) {
        const title = input.title.trim().slice(0, MAX_TITLE_CHARS);
        if (title === "") return { ok: false, error: err("title must not be blank") };
        note.title = title;
      }
      if (input.body !== undefined) {
        if (input.body.length > MAX_BODY_CHARS) return { ok: false, error: err(`body exceeds ${MAX_BODY_CHARS} chars`) };
        note.body = input.body;
      }
      if (input.addClip !== undefined) {
        const text = input.addClip.text.trim();
        if (text === "") return { ok: false, error: err("clip text must not be blank") };
        if (text.length > MAX_CLIP_CHARS) return { ok: false, error: err(`clip exceeds ${MAX_CLIP_CHARS} chars`) };
        note.clips.push({
          id: randomUUID(),
          text: text.slice(0, MAX_CLIP_CHARS),
          sessionId: input.addClip.sessionId,
          ...(input.addClip.sessionTitle !== undefined ? { sessionTitle: input.addClip.sessionTitle } : {}),
          createdAt: Date.now(),
        });
      }
      if (input.removeClipId !== undefined) {
        note.clips = note.clips.filter((clip) => clip.id !== input.removeClipId);
      }
      note.version = this.nextVersion();
      note.updatedAt = Date.now();
      await this.persist();
      return { ok: true, value: { note: structuredClone(note) } };
    });
  }

  /** 删除一篇笔记。 */
  remove(id: string): Promise<RpcResult<{ ok: true } | { absent: true }, NotesError>> {
    return this.enqueue(async () => {
      await this.load();
      const existed = this.notes.delete(id);
      if (!existed) return { ok: true, value: { absent: true } };
      await this.persist();
      return { ok: true, value: { ok: true as const } };
    });
  }
}
