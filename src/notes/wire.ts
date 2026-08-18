import { z } from "zod";

/**
 * 笔记 wire 契约：host TYPERT 清单与 client 远程贡献共享的
 * zod v4 schema 与 invocation descriptor 列表。
 */

export const noteClipSchema = z.object({
  id: z.string(),
  text: z.string(),
  sessionId: z.string(),
  sessionTitle: z.string().optional(),
  createdAt: z.number(),
});

export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  clips: z.array(noteClipSchema),
  version: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const noteListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  clipCount: z.number(),
  bodyLength: z.number(),
  version: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const notFoundSchema = z.object({
  code: z.literal("not-found"),
  id: z.string(),
});
const versionConflictSchema = z.object({
  code: z.literal("version-conflict"),
  current: noteSchema.nullable(),
});
const invalidArgumentSchema = z.object({
  code: z.literal("invalid-argument"),
  message: z.string(),
});
const errorSchema = z.union([
  notFoundSchema,
  versionConflictSchema,
  invalidArgumentSchema,
]);

const result = <T extends z.ZodType>(value: T) =>
  z.union([
    z.object({ ok: z.literal(true), value }),
    z.object({ ok: z.literal(false), error: errorSchema }),
  ]);

// —— 请求与结果 schema ——
export const listRequestSchema = z.object({});
export const listResultSchema = result(
  z.object({ items: z.array(noteListItemSchema) }),
);

export const getRequestSchema = z.object({ id: z.string() });
export const getResultSchema = result(z.object({ note: noteSchema }));

export const createRequestSchema = z.object({ title: z.string().optional() });
export const createResultSchema = result(z.object({ note: noteSchema }));

export const addClipSchema = z.object({
  text: z.string(),
  sessionId: z.string(),
  sessionTitle: z.string().optional(),
});
export const updateRequestSchema = z.object({
  id: z.string(),
  ifVersion: z.string(),
  title: z.string().optional(),
  body: z.string().optional(),
  addClip: addClipSchema.optional(),
  removeClipId: z.string().optional(),
});
export const updateResultSchema = result(z.object({ note: noteSchema }));

export const deleteRequestSchema = z.object({ id: z.string() });
export const deleteResultSchema = result(
  z.object({
    ok: z.literal(true).optional(),
    absent: z.literal(true).optional(),
  }),
);

/** 严格 codec 包装。 */
const codec = (typeSymbol: string, schema: z.ZodType) => ({
  mode: "strict" as const,
  typeSymbol,
  schema,
});

const param = (schema: z.ZodType, typeSymbol: string) => [
  {
    name: "request",
    wire: "request",
    source: "json" as const,
    codec: codec(typeSymbol, schema),
  },
];

/** invocation descriptors（host 清单的 invocations / client 贡献的 descriptors 共用）。 */
export const NOTES_DESCRIPTORS = [
  {
    id: "dsh-ui#notes/list",
    service: "notes",
    namespace: "notes",
    method: "list",
    invocation: { kind: "direct" as const },
    parameters: param(listRequestSchema, "dsh-ui/types#NotesListRequest"),
    result: codec("dsh-ui/types#NotesListResult", listResultSchema),
    sourceLocation: { file: "src/notes/service.ts", line: 1, column: 1 },
  },
  {
    id: "dsh-ui#notes/get",
    service: "notes",
    namespace: "notes",
    method: "get",
    invocation: { kind: "direct" as const },
    parameters: param(getRequestSchema, "dsh-ui/types#NotesGetRequest"),
    result: codec("dsh-ui/types#NotesGetResult", getResultSchema),
    sourceLocation: { file: "src/notes/service.ts", line: 2, column: 1 },
  },
  {
    id: "dsh-ui#notes/create",
    service: "notes",
    namespace: "notes",
    method: "create",
    invocation: { kind: "direct" as const },
    parameters: param(createRequestSchema, "dsh-ui/types#NotesCreateRequest"),
    result: codec("dsh-ui/types#NotesCreateResult", createResultSchema),
    sourceLocation: { file: "src/notes/service.ts", line: 3, column: 1 },
  },
  {
    id: "dsh-ui#notes/update",
    service: "notes",
    namespace: "notes",
    method: "update",
    invocation: { kind: "direct" as const },
    parameters: param(updateRequestSchema, "dsh-ui/types#NotesUpdateRequest"),
    result: codec("dsh-ui/types#NotesUpdateResult", updateResultSchema),
    sourceLocation: { file: "src/notes/service.ts", line: 4, column: 1 },
  },
  {
    id: "dsh-ui#notes/delete",
    service: "notes",
    namespace: "notes",
    method: "delete",
    invocation: { kind: "direct" as const },
    parameters: param(deleteRequestSchema, "dsh-ui/types#NotesDeleteRequest"),
    result: codec("dsh-ui/types#NotesDeleteResult", deleteResultSchema),
    sourceLocation: { file: "src/notes/service.ts", line: 5, column: 1 },
  },
] as const;

// —— files 远程（二期：文件/PDF）——

export const fileMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  mime: z.string(),
  size: z.number(),
  uploadedAt: z.number(),
});

export const storedFileSchema = fileMetaSchema.extend({
  text: z.string().optional(),
});

export const filesListRequestSchema = z.object({});
export const filesListResultSchema = result(z.object({ items: z.array(fileMetaSchema) }));

export const filesUploadRequestSchema = z.object({
  name: z.string(),
  mime: z.string(),
  bytesBase64: z.string(),
});
export const filesUploadResultSchema = result(z.object({ file: storedFileSchema }));

export const filesGetRequestSchema = z.object({ id: z.string() });
export const filesGetResultSchema = result(z.object({ file: storedFileSchema }));

export const filesGetBytesRequestSchema = z.object({ id: z.string() });
export const filesGetBytesResultSchema = result(z.object({ bytesBase64: z.string() }));

export const filesDeleteRequestSchema = z.object({ id: z.string() });
export const filesDeleteResultSchema = result(
  z.object({ ok: z.literal(true).optional(), absent: z.literal(true).optional() }),
);

export const FILES_DESCRIPTORS = [
  {
    id: "dsh-ui#files/list",
    service: "files",
    namespace: "files",
    method: "list",
    invocation: { kind: "direct" as const },
    parameters: param(filesListRequestSchema, "dsh-ui/types#FilesListRequest"),
    result: codec("dsh-ui/types#FilesListResult", filesListResultSchema),
    sourceLocation: { file: "src/notes/files-service.ts", line: 1, column: 1 },
  },
  {
    id: "dsh-ui#files/upload",
    service: "files",
    namespace: "files",
    method: "upload",
    invocation: { kind: "direct" as const },
    parameters: param(filesUploadRequestSchema, "dsh-ui/types#FilesUploadRequest"),
    result: codec("dsh-ui/types#FilesUploadResult", filesUploadResultSchema),
    sourceLocation: { file: "src/notes/files-service.ts", line: 2, column: 1 },
  },
  {
    id: "dsh-ui#files/get",
    service: "files",
    namespace: "files",
    method: "get",
    invocation: { kind: "direct" as const },
    parameters: param(filesGetRequestSchema, "dsh-ui/types#FilesGetRequest"),
    result: codec("dsh-ui/types#FilesGetResult", filesGetResultSchema),
    sourceLocation: { file: "src/notes/files-service.ts", line: 3, column: 1 },
  },
  {
    id: "dsh-ui#files/getBytes",
    service: "files",
    namespace: "files",
    method: "getBytes",
    invocation: { kind: "direct" as const },
    parameters: param(filesGetBytesRequestSchema, "dsh-ui/types#FilesGetBytesRequest"),
    result: codec("dsh-ui/types#FilesGetBytesResult", filesGetBytesResultSchema),
    sourceLocation: { file: "src/notes/files-service.ts", line: 4, column: 1 },
  },
  {
    id: "dsh-ui#files/delete",
    service: "files",
    namespace: "files",
    method: "delete",
    invocation: { kind: "direct" as const },
    parameters: param(filesDeleteRequestSchema, "dsh-ui/types#FilesDeleteRequest"),
    result: codec("dsh-ui/types#FilesDeleteResult", filesDeleteResultSchema),
    sourceLocation: { file: "src/notes/files-service.ts", line: 5, column: 1 },
  },
] as const;
