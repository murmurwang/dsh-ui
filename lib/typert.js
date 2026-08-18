// src/notes/wire.ts
import { z } from "zod";
var noteClipSchema = z.object({
  id: z.string(),
  text: z.string(),
  sessionId: z.string(),
  sessionTitle: z.string().optional(),
  createdAt: z.number()
});
var noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  clips: z.array(noteClipSchema),
  version: z.string(),
  createdAt: z.number(),
  updatedAt: z.number()
});
var noteListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  clipCount: z.number(),
  bodyLength: z.number(),
  version: z.string(),
  createdAt: z.number(),
  updatedAt: z.number()
});
var notFoundSchema = z.object({
  code: z.literal("not-found"),
  id: z.string()
});
var versionConflictSchema = z.object({
  code: z.literal("version-conflict"),
  current: noteSchema.nullable()
});
var invalidArgumentSchema = z.object({
  code: z.literal("invalid-argument"),
  message: z.string()
});
var errorSchema = z.union([
  notFoundSchema,
  versionConflictSchema,
  invalidArgumentSchema
]);
var result = (value) => z.union([
  z.object({ ok: z.literal(true), value }),
  z.object({ ok: z.literal(false), error: errorSchema })
]);
var listRequestSchema = z.object({});
var listResultSchema = result(
  z.object({ items: z.array(noteListItemSchema) })
);
var getRequestSchema = z.object({ id: z.string() });
var getResultSchema = result(z.object({ note: noteSchema }));
var createRequestSchema = z.object({ title: z.string().optional() });
var createResultSchema = result(z.object({ note: noteSchema }));
var addClipSchema = z.object({
  text: z.string(),
  sessionId: z.string(),
  sessionTitle: z.string().optional()
});
var updateRequestSchema = z.object({
  id: z.string(),
  ifVersion: z.string(),
  title: z.string().optional(),
  body: z.string().optional(),
  addClip: addClipSchema.optional(),
  removeClipId: z.string().optional()
});
var updateResultSchema = result(z.object({ note: noteSchema }));
var deleteRequestSchema = z.object({ id: z.string() });
var deleteResultSchema = result(
  z.object({
    ok: z.literal(true).optional(),
    absent: z.literal(true).optional()
  })
);
var codec = (typeSymbol, schema) => ({
  mode: "strict",
  typeSymbol,
  schema
});
var param = (schema, typeSymbol) => [
  {
    name: "request",
    wire: "request",
    source: "json",
    codec: codec(typeSymbol, schema)
  }
];
var NOTES_DESCRIPTORS = [
  {
    id: "dsh-ui#notes/list",
    service: "notes",
    namespace: "notes",
    method: "list",
    invocation: { kind: "direct" },
    parameters: param(listRequestSchema, "dsh-ui/types#NotesListRequest"),
    result: codec("dsh-ui/types#NotesListResult", listResultSchema),
    sourceLocation: { file: "src/notes/service.ts", line: 1, column: 1 }
  },
  {
    id: "dsh-ui#notes/get",
    service: "notes",
    namespace: "notes",
    method: "get",
    invocation: { kind: "direct" },
    parameters: param(getRequestSchema, "dsh-ui/types#NotesGetRequest"),
    result: codec("dsh-ui/types#NotesGetResult", getResultSchema),
    sourceLocation: { file: "src/notes/service.ts", line: 2, column: 1 }
  },
  {
    id: "dsh-ui#notes/create",
    service: "notes",
    namespace: "notes",
    method: "create",
    invocation: { kind: "direct" },
    parameters: param(createRequestSchema, "dsh-ui/types#NotesCreateRequest"),
    result: codec("dsh-ui/types#NotesCreateResult", createResultSchema),
    sourceLocation: { file: "src/notes/service.ts", line: 3, column: 1 }
  },
  {
    id: "dsh-ui#notes/update",
    service: "notes",
    namespace: "notes",
    method: "update",
    invocation: { kind: "direct" },
    parameters: param(updateRequestSchema, "dsh-ui/types#NotesUpdateRequest"),
    result: codec("dsh-ui/types#NotesUpdateResult", updateResultSchema),
    sourceLocation: { file: "src/notes/service.ts", line: 4, column: 1 }
  },
  {
    id: "dsh-ui#notes/delete",
    service: "notes",
    namespace: "notes",
    method: "delete",
    invocation: { kind: "direct" },
    parameters: param(deleteRequestSchema, "dsh-ui/types#NotesDeleteRequest"),
    result: codec("dsh-ui/types#NotesDeleteResult", deleteResultSchema),
    sourceLocation: { file: "src/notes/service.ts", line: 5, column: 1 }
  }
];
var fileMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  mime: z.string(),
  size: z.number(),
  uploadedAt: z.number()
});
var storedFileSchema = fileMetaSchema.extend({
  text: z.string().optional()
});
var filesListRequestSchema = z.object({});
var filesListResultSchema = result(z.object({ items: z.array(fileMetaSchema) }));
var filesUploadRequestSchema = z.object({
  name: z.string(),
  mime: z.string(),
  bytesBase64: z.string()
});
var filesUploadResultSchema = result(z.object({ file: storedFileSchema }));
var filesGetRequestSchema = z.object({ id: z.string() });
var filesGetResultSchema = result(z.object({ file: storedFileSchema }));
var filesGetBytesRequestSchema = z.object({ id: z.string() });
var filesGetBytesResultSchema = result(z.object({ bytesBase64: z.string() }));
var filesDeleteRequestSchema = z.object({ id: z.string() });
var filesDeleteResultSchema = result(
  z.object({ ok: z.literal(true).optional(), absent: z.literal(true).optional() })
);
var FILES_DESCRIPTORS = [
  {
    id: "dsh-ui#files/list",
    service: "files",
    namespace: "files",
    method: "list",
    invocation: { kind: "direct" },
    parameters: param(filesListRequestSchema, "dsh-ui/types#FilesListRequest"),
    result: codec("dsh-ui/types#FilesListResult", filesListResultSchema),
    sourceLocation: { file: "src/notes/files-service.ts", line: 1, column: 1 }
  },
  {
    id: "dsh-ui#files/upload",
    service: "files",
    namespace: "files",
    method: "upload",
    invocation: { kind: "direct" },
    parameters: param(filesUploadRequestSchema, "dsh-ui/types#FilesUploadRequest"),
    result: codec("dsh-ui/types#FilesUploadResult", filesUploadResultSchema),
    sourceLocation: { file: "src/notes/files-service.ts", line: 2, column: 1 }
  },
  {
    id: "dsh-ui#files/get",
    service: "files",
    namespace: "files",
    method: "get",
    invocation: { kind: "direct" },
    parameters: param(filesGetRequestSchema, "dsh-ui/types#FilesGetRequest"),
    result: codec("dsh-ui/types#FilesGetResult", filesGetResultSchema),
    sourceLocation: { file: "src/notes/files-service.ts", line: 3, column: 1 }
  },
  {
    id: "dsh-ui#files/getBytes",
    service: "files",
    namespace: "files",
    method: "getBytes",
    invocation: { kind: "direct" },
    parameters: param(filesGetBytesRequestSchema, "dsh-ui/types#FilesGetBytesRequest"),
    result: codec("dsh-ui/types#FilesGetBytesResult", filesGetBytesResultSchema),
    sourceLocation: { file: "src/notes/files-service.ts", line: 4, column: 1 }
  },
  {
    id: "dsh-ui#files/delete",
    service: "files",
    namespace: "files",
    method: "delete",
    invocation: { kind: "direct" },
    parameters: param(filesDeleteRequestSchema, "dsh-ui/types#FilesDeleteRequest"),
    result: codec("dsh-ui/types#FilesDeleteResult", filesDeleteResultSchema),
    sourceLocation: { file: "src/notes/files-service.ts", line: 5, column: 1 }
  }
];

// src/typert.ts
var TYPERT = {
  package: "dsh-ui",
  face: "host",
  schemas: [],
  model: {
    services: [
      {
        description: "Notes sidecar service: persists dsh-ui notes (Markdown documents plus conversation clips) under the harness notes directory and serves the browser client and the notes agent tool.",
        summary: "Notes sidecar service.",
        tags: [],
        jsDoc: "/** Notes sidecar service for the dsh-ui plugin. */",
        key: "notes",
        exportName: "NotesService",
        members: [
          {
            kind: "method",
            name: "list",
            signature: "@Remote('list') list(): Promise<NotesListResult>",
            summary: "List all notes (metadata only).",
            jsDoc: "/** List all notes. */"
          },
          {
            kind: "method",
            name: "get",
            signature: "@Remote('get') get(request: NotesGetRequest): Promise<NotesGetResult>",
            summary: "Read one full note.",
            jsDoc: "/** Read one full note. */"
          },
          {
            kind: "method",
            name: "create",
            signature: "@Remote('create') create(request: NotesCreateRequest): Promise<NotesCreateResult>",
            summary: "Create a note.",
            jsDoc: "/** Create a note. */"
          },
          {
            kind: "method",
            name: "update",
            signature: "@Remote('update') update(request: NotesUpdateRequest): Promise<NotesUpdateResult>",
            summary: "Update title/body and add/remove clips.",
            jsDoc: "/** Update a note under optimistic concurrency. */"
          },
          {
            kind: "method",
            name: "delete",
            signature: "@Remote('delete') delete(request: NotesDeleteRequest): Promise<NotesDeleteResult>",
            summary: "Delete a note.",
            jsDoc: "/** Delete a note. */"
          }
        ],
        types: [
          {
            name: "NotesListRequest",
            declaration: "export interface NotesListRequest {}"
          },
          {
            name: "NotesListResult",
            declaration: "export type NotesListResult = NotesOk<{ items: NoteListItem[] }> | NotesErrorResult;"
          },
          {
            name: "NotesGetRequest",
            declaration: "export interface NotesGetRequest { readonly id: string; }"
          },
          {
            name: "NotesGetResult",
            declaration: "export type NotesGetResult = NotesOk<{ note: Note }> | NotesErrorResult;"
          },
          {
            name: "NotesCreateRequest",
            declaration: "export interface NotesCreateRequest { readonly title?: string; }"
          },
          {
            name: "NotesCreateResult",
            declaration: "export type NotesCreateResult = NotesOk<{ note: Note }> | NotesInvalidArgument;"
          },
          {
            name: "NotesUpdateRequest",
            declaration: "export interface NotesUpdateRequest { readonly id: string; readonly ifVersion: string; readonly title?: string; readonly body?: string; readonly addClip?: { readonly text: string; readonly sessionId: string; readonly sessionTitle?: string }; readonly removeClipId?: string; }"
          },
          {
            name: "NotesUpdateResult",
            declaration: "export type NotesUpdateResult = NotesOk<{ note: Note }> | NotesErrorResult;"
          },
          {
            name: "NotesDeleteRequest",
            declaration: "export interface NotesDeleteRequest { readonly id: string; }"
          },
          {
            name: "NotesDeleteResult",
            declaration: "export type NotesDeleteResult = NotesOk<{ ok?: true; absent?: true }> | NotesErrorResult;"
          },
          {
            name: "Note",
            declaration: "export interface Note { readonly id: string; readonly title: string; readonly body: string; readonly clips: readonly NoteClip[]; readonly version: string; readonly createdAt: number; readonly updatedAt: number; }"
          },
          {
            name: "NoteClip",
            declaration: "export interface NoteClip { readonly id: string; readonly text: string; readonly sessionId: string; readonly sessionTitle?: string; readonly createdAt: number; }"
          },
          {
            name: "NoteListItem",
            declaration: "export interface NoteListItem { readonly id: string; readonly title: string; readonly clipCount: number; readonly bodyLength: number; readonly version: string; readonly createdAt: number; readonly updatedAt: number; }"
          }
        ]
      },
      {
        description: "Files sidecar service: stores uploaded PDFs under the harness notes directory, extracts their text for the browser text view, and serves the raw bytes for the native preview.",
        summary: "Files sidecar service.",
        tags: [],
        jsDoc: "/** Files sidecar service for the dsh-ui plugin. */",
        key: "files",
        exportName: "FilesService",
        members: [
          { kind: "method", name: "list", signature: "@Remote('list') list(): Promise<FilesListResult>", summary: "List files.", jsDoc: "/** List files. */" },
          { kind: "method", name: "upload", signature: "@Remote('upload') upload(request: FilesUploadRequest): Promise<FilesUploadResult>", summary: "Upload a PDF.", jsDoc: "/** Upload a PDF. */" },
          { kind: "method", name: "get", signature: "@Remote('get') get(request: FilesGetRequest): Promise<FilesGetResult>", summary: "Read file meta + text.", jsDoc: "/** Read file meta + text. */" },
          { kind: "method", name: "getBytes", signature: "@Remote('getBytes') getBytes(request: FilesGetBytesRequest): Promise<FilesGetBytesResult>", summary: "Read raw bytes.", jsDoc: "/** Read raw bytes. */" },
          { kind: "method", name: "delete", signature: "@Remote('delete') delete(request: FilesDeleteRequest): Promise<FilesDeleteResult>", summary: "Delete a file.", jsDoc: "/** Delete a file. */" }
        ],
        types: [
          { name: "FilesListRequest", declaration: "export interface FilesListRequest {}" },
          { name: "FilesListResult", declaration: "export type FilesListResult = NotesOk<{ items: FileMeta[] }> | NotesErrorResult;" },
          { name: "FilesUploadRequest", declaration: "export interface FilesUploadRequest { readonly name: string; readonly mime: string; readonly bytesBase64: string; }" },
          { name: "FilesUploadResult", declaration: "export type FilesUploadResult = NotesOk<{ file: StoredFile }> | NotesInvalidArgument;" },
          { name: "FilesGetRequest", declaration: "export interface FilesGetRequest { readonly id: string; }" },
          { name: "FilesGetResult", declaration: "export type FilesGetResult = NotesOk<{ file: StoredFile }> | NotesErrorResult;" },
          { name: "FilesGetBytesRequest", declaration: "export interface FilesGetBytesRequest { readonly id: string; }" },
          { name: "FilesGetBytesResult", declaration: "export type FilesGetBytesResult = NotesOk<{ bytesBase64: string }> | NotesErrorResult;" },
          { name: "FilesDeleteRequest", declaration: "export interface FilesDeleteRequest { readonly id: string; }" },
          { name: "FilesDeleteResult", declaration: "export type FilesDeleteResult = NotesOk<{ ok?: true; absent?: true }> | NotesErrorResult;" },
          { name: "FileMeta", declaration: "export interface FileMeta { readonly id: string; readonly name: string; readonly mime: string; readonly size: number; readonly uploadedAt: number; }" },
          { name: "StoredFile", declaration: "export interface StoredFile extends FileMeta { readonly text?: string; }" }
        ]
      }
    ],
    events: [],
    objects: []
  },
  invocations: [...NOTES_DESCRIPTORS, ...FILES_DESCRIPTORS]
};
export {
  TYPERT
};
//# sourceMappingURL=typert.js.map
