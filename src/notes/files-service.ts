import type { Context } from "@deepseek-ai/cordis";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import type { FilesStore } from "./files-store";

/**
 * 文件 host 远程服务（`files`）：浏览器上传/浏览 PDF，
 * host 侧存原始字节并提取文字，供文字视图划选。
 */
export class FilesService extends TypertRemoteService {
  readonly store: FilesStore;

  constructor(ctx: Context, store: FilesStore) {
    super(ctx, "files");
    this.store = store;
  }

  @Remote("list")
  list(_request: Record<string, never> = {}): ReturnType<FilesStore["list"]> {
    return this.store.list();
  }

  @Remote("upload")
  upload(request: Parameters<FilesStore["upload"]>[0]): ReturnType<FilesStore["upload"]> {
    return this.store.upload(request);
  }

  @Remote("get")
  get(request: { id: string }): ReturnType<FilesStore["get"]> {
    return this.store.get(request.id);
  }

  @Remote("getBytes")
  getBytes(request: { id: string }): ReturnType<FilesStore["getBytes"]> {
    return this.store.getBytes(request.id);
  }

  @Remote("delete")
  delete(request: { id: string }): ReturnType<FilesStore["delete"]> {
    return this.store.delete(request.id);
  }
}
