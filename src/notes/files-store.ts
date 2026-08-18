import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename, join } from "node:path";
import type { RpcResult } from "./contract";

/** 支持的文件类型（v1：PDF）。 */
export const FILE_MIME_WHITELIST = new Set(["application/pdf"]);

export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB

export interface StoredFileMeta {
  id: string;
  name: string;
  mime: string;
  size: number;
  uploadedAt: number;
}

export interface StoredFile extends StoredFileMeta {
  /** PDF 提取文本（缺失表示尚未提取）。 */
  text?: string;
}

function err(message: string): { code: "invalid-argument"; message: string } {
  return { code: "invalid-argument", message };
}

function notFound(id: string): { code: "not-found"; id: string } {
  return { code: "not-found", id };
}

/**
 * 文件存储：DSH_HOME/notes/files/ 下每文件一个目录
 *   <id>/blob（原始字节） + <id>/meta.json + <id>/text.txt（提取文本）
 */
export class FilesStore {
  private tail = Promise.resolve();
  constructor(readonly root: string) {}

  private enqueue<T>(op: () => Promise<T>): Promise<T> {
    const run = this.tail.then(op, op);
    this.tail = run.then(
      () => void 0,
      () => void 0,
    );
    return run;
  }

  private fileDir(id: string): string {
    return join(this.root, id);
  }

  private async loadMeta(id: string): Promise<StoredFile | null> {
    try {
      const raw = await readFile(join(this.fileDir(id), "meta.json"), "utf8");
      const meta = JSON.parse(raw) as StoredFileMeta;
      const text = await readFile(join(this.fileDir(id), "text.txt"), "utf8").catch(() => undefined);
      return { ...meta, ...(text !== undefined ? { text } : {}) };
    } catch {
      return null;
    }
  }

  async init(): Promise<void> {
    await mkdir(this.root, { recursive: true });
  }

  /** 列出所有文件（含提取文本；列表接口不吐正文，这里只做元数据）。 */
  list(): Promise<RpcResult<{ items: StoredFileMeta[] }, never>> {
    return this.enqueue(async () => {
      await this.init();
      const entries = await readdir(this.root, { withFileTypes: true });
      const items: StoredFileMeta[] = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const meta = await this.loadMeta(entry.name);
        if (meta !== null) items.push(meta);
      }
      items.sort((a, b) => a.uploadedAt - b.uploadedAt);
      return { ok: true, value: { items } };
    });
  }

  /**
   * 保存上传文件（base64 字节），PDF 同时提取文本。
   */
  upload(input: {
    name: string;
    mime: string;
    bytesBase64: string;
  }): Promise<RpcResult<{ file: StoredFile }, { code: "invalid-argument"; message: string }>> {
    return this.enqueue(async () => {
      await this.init();
      if (!FILE_MIME_WHITELIST.has(input.mime)) {
        return { ok: false, error: err(`unsupported mime "${input.mime}"（v1 仅支持 PDF）`) };
      }
      let bytes: Buffer;
      try {
        bytes = Buffer.from(input.bytesBase64, "base64");
      } catch {
        return { ok: false, error: err("invalid base64 payload") };
      }
      if (bytes.length === 0 || bytes.length > MAX_FILE_BYTES) {
        return { ok: false, error: err(`file size ${bytes.length} out of range`) };
      }
      const id = randomUUID();
      const dir = this.fileDir(id);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, "blob"), bytes);
      const name = basename(input.name) || `file-${id.slice(0, 8)}.pdf`;
      const meta: StoredFileMeta = {
        id,
        name,
        mime: input.mime,
        size: bytes.length,
        uploadedAt: Date.now(),
      };
      // PDF 文本提取（尽力而为：失败不阻断上传，文件仍可用预览）。
      let text: string | undefined;
      try {
        text = await extractPdfText(bytes);
        await writeFile(join(dir, "text.txt"), text, "utf8");
      } catch {
        text = undefined;
      }
      await writeFile(join(dir, "meta.json"), JSON.stringify(meta), "utf8");
      return { ok: true, value: { file: { ...meta, ...(text !== undefined ? { text } : {}) } } };
    });
  }

  /** 读取文件（元数据 + 提取文本；原始字节单独接口）。 */
  get(id: string): Promise<RpcResult<{ file: StoredFile }, { code: "not-found"; id: string }>> {
    return this.enqueue(async () => {
      await this.init();
      const meta = await this.loadMeta(id);
      if (meta === null) return { ok: false, error: notFound(id) };
      return { ok: true, value: { file: meta } };
    });
  }

  /** 原始字节（base64），用于浏览器原版式预览。 */
  getBytes(id: string): Promise<RpcResult<{ bytesBase64: string }, { code: "not-found"; id: string }>> {
    return this.enqueue(async () => {
      await this.init();
      const meta = await this.loadMeta(id);
      if (meta === null) return { ok: false, error: notFound(id) };
      const bytes = await readFile(join(this.fileDir(id), "blob"));
      return { ok: true, value: { bytesBase64: bytes.toString("base64") } };
    });
  }

  delete(id: string): Promise<RpcResult<{ ok?: true; absent?: true }, { code: "not-found"; id: string }>> {
    return this.enqueue(async () => {
      await this.init();
      const meta = await this.loadMeta(id);
      if (meta === null) return { ok: true, value: { absent: true } };
      await rm(this.fileDir(id), { recursive: true, force: true });
      return { ok: true, value: { ok: true } };
    });
  }
}

/** pdf-parse v2：Buffer → PDFParse → getText()。 */
async function extractPdfText(bytes: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  const result = await parser.getText();
  const text = typeof result.text === "string" ? result.text : "";
  if (text.trim() === "") {
    throw new Error("no extractable text (scanned pdf?)");
  }
  return text;
}

/** 临时导出供后续改名复用。 */
export function sanitizeFileName(name: string): string {
  return basename(name)
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 200);
}
