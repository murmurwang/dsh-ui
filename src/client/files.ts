import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type {} from "@deepseek-ai/dsh-api-gateway/client";
import type { NotesError, RpcResult } from "../notes/contract";
import { FILES_DESCRIPTORS, NOTES_DESCRIPTORS } from "../notes/wire";
import type { T } from "./locales";

/** 文件元数据（wire 形状）。 */
export interface FileMeta {
  id: string;
  name: string;
  mime: string;
  size: number;
  uploadedAt: number;
}

export interface StoredFile extends FileMeta {
  text?: string;
}

export interface FilesRemoteFace {
  list(request?: Record<string, never>): Promise<RpcResult<{ items: FileMeta[] }, never>>;
  upload(input: { name: string; mime: string; bytesBase64: string }): Promise<RpcResult<{ file: StoredFile }, NotesError>>;
  get(input: { id: string }): Promise<RpcResult<{ file: StoredFile }, NotesError>>;
  getBytes(input: { id: string }): Promise<RpcResult<{ bytesBase64: string }, NotesError>>;
  delete(input: { id: string }): Promise<RpcResult<{ ok?: true; absent?: true }, NotesError>>;
}

const TRANSPORT_ERROR: NotesError = {
  code: "invalid-argument",
  message: "files transport failure",
};

async function unwrap<R extends { ok: boolean }>(
  carried: Promise<RpcResult<R, never>>,
): Promise<R> {
  const rpc = await carried;
  return rpc.ok ? rpc.value : ({ ok: false, error: TRANSPORT_ERROR } as unknown as R);
}

export function filesFaceOf(ns: {
  list(request?: Record<string, never>): Promise<RpcResult<RpcResult<{ items: FileMeta[] }, never>, never>>;
  upload(input: unknown): Promise<RpcResult<RpcResult<{ file: StoredFile }, NotesError>, never>>;
  get(input: { id: string }): Promise<RpcResult<RpcResult<{ file: StoredFile }, NotesError>, never>>;
  getBytes(input: { id: string }): Promise<RpcResult<RpcResult<{ bytesBase64: string }, NotesError>, never>>;
  delete(input: { id: string }): Promise<RpcResult<RpcResult<{ ok?: true; absent?: true }, NotesError>, never>>;
}): FilesRemoteFace {
  return {
    list: (request) => unwrap(ns.list(request)),
    upload: (input) => unwrap(ns.upload(input)),
    get: (input) => unwrap(ns.get(input)),
    getBytes: (input) => unwrap(ns.getBytes(input)),
    delete: (input) => unwrap(ns.delete(input)),
  };
}

/** $mount 全部远程贡献（notes + files）；返回卸载函数。 */
export function mountDshUiRemotes(ctx: ClientContext): Promise<() => void> {
  return ctx.remote.$mount({
    package: "dsh-ui",
    descriptors: [...NOTES_DESCRIPTORS, ...FILES_DESCRIPTORS],
  });
}

export interface FilesSnapshot {
  phase: "boot" | "ready" | "error";
  items: FileMeta[];
  listError: string | null;
  /** 正在查看的文件。 */
  openId: string | null;
  openFile: StoredFile | null;
  openError: string | null;
  /** 预览原始字节（打开时加载一次）。 */
  previewUrl: string | null;
  toast: { text: string; seq: number } | null;
}

export class FilesController {
  constructor(private readonly t: T) {}

  private remote: FilesRemoteFace | null = null;
  private state: FilesSnapshot = {
    phase: "boot",
    items: [],
    listError: null,
    openId: null,
    openFile: null,
    openError: null,
    previewUrl: null,
    toast: null,
  };
  private listeners = new Set<() => void>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private toastSeq = 0;

  getSnapshot = (): FilesSnapshot => this.state;
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  private publish(patch: Partial<FilesSnapshot>): void {
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

  private face(): FilesRemoteFace {
    if (this.remote === null) throw new Error("dsh-ui: files remote is not mounted yet");
    return this.remote;
  }

  async attach(remote: FilesRemoteFace): Promise<void> {
    this.remote = remote;
    await this.refresh();
  }

  detach(): void {
    this.remote = null;
    this.revokePreview();
  }

  private revokePreview(): void {
    if (this.state.previewUrl !== null) {
      URL.revokeObjectURL(this.state.previewUrl);
      this.publish({ previewUrl: null });
    }
  }

  async refresh(): Promise<void> {
    const remote = this.remote;
    if (remote === null) return;
    const result = await remote.list({});
    if (result.ok) {
      this.publish({ phase: "ready", items: result.value.items, listError: null });
      if (this.state.openId !== null && !result.value.items.some((i) => i.id === this.state.openId)) {
        this.close();
      }
    } else {
      this.publish({ phase: "error", listError: "files.list failed" });
    }
  }

  /** 上传（浏览器 File → base64）。 */
  async upload(file: File): Promise<boolean> {
    try {
      const bytesBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result !== "string") {
            reject(new Error("read failed"));
            return;
          }
          resolve(result.slice(result.indexOf(",") + 1));
        };
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const result = await this.face().upload({
        name: file.name,
        mime: file.type || "application/pdf",
        bytesBase64,
      });
      if (!result.ok) {
        this.notifyToast(this.t("files.upload.failed", {
          detail: result.error.code === "invalid-argument" ? result.error.message : this.t("files.upload.unknown"),
        }));
        return false;
      }
      await this.refresh();
      this.notifyToast(this.t("files.upload.saved", { name: result.value.file.name }));
      return true;
    } catch {
      this.notifyToast(this.t("files.upload.network"));
      return false;
    }
  }

  async open(id: string): Promise<void> {
    const result = await this.face().get({ id });
    if (!result.ok) {
      this.publish({ openId: id, openFile: null, openError: this.t("files.notFound") });
      return;
    }
    this.revokePreview();
    this.publish({ openId: id, openFile: result.value.file, openError: null, previewUrl: null });
    // 后台加载预览字节
    const bytes = await this.face().getBytes({ id });
    if (bytes.ok && this.state.openId === id) {
      const blob = new Blob(
        [Uint8Array.from(atob(bytes.value.bytesBase64), (c) => c.charCodeAt(0))],
        { type: "application/pdf" },
      );
      this.publish({ previewUrl: URL.createObjectURL(blob) });
    }
  }

  close(): void {
    this.revokePreview();
    this.publish({ openId: null, openFile: null, openError: null });
  }

  async remove(id: string): Promise<void> {
    await this.face().delete({ id });
    if (this.state.openId === id) this.close();
    await this.refresh();
  }
}
