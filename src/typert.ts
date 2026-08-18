import { NOTES_DESCRIPTORS, FILES_DESCRIPTORS } from "./notes/wire";

/**
 * Typert host 清单：dsh-typert-loader 自动发现本包 exports["./typert"]，
 * 校验后注册进 `ctx.typert`，把 `notes` 远程的 schema 与调用描述
 * 交给 Typert Gateway（客户端据此获得 `remote.notes` 命名空间）。
 */
export const TYPERT = {
  package: "dsh-ui",
  face: "host" as const,
  schemas: [],
  model: {
    services: [
      {
        description:
          "Notes sidecar service: persists dsh-ui notes (Markdown documents plus conversation clips) under the harness notes directory and serves the browser client and the notes agent tool.",
        summary: "Notes sidecar service.",
        tags: [],
        jsDoc: "/** Notes sidecar service for the dsh-ui plugin. */",
        key: "notes",
        exportName: "NotesService",
        members: [
          {
            kind: "method",
            name: "list",
            signature:
              "@Remote('list') list(): Promise<NotesListResult>",
            summary: "List all notes (metadata only).",
            jsDoc: "/** List all notes. */",
          },
          {
            kind: "method",
            name: "get",
            signature:
              "@Remote('get') get(request: NotesGetRequest): Promise<NotesGetResult>",
            summary: "Read one full note.",
            jsDoc: "/** Read one full note. */",
          },
          {
            kind: "method",
            name: "create",
            signature:
              "@Remote('create') create(request: NotesCreateRequest): Promise<NotesCreateResult>",
            summary: "Create a note.",
            jsDoc: "/** Create a note. */",
          },
          {
            kind: "method",
            name: "update",
            signature:
              "@Remote('update') update(request: NotesUpdateRequest): Promise<NotesUpdateResult>",
            summary: "Update title/body and add/remove clips.",
            jsDoc: "/** Update a note under optimistic concurrency. */",
          },
          {
            kind: "method",
            name: "delete",
            signature:
              "@Remote('delete') delete(request: NotesDeleteRequest): Promise<NotesDeleteResult>",
            summary: "Delete a note.",
            jsDoc: "/** Delete a note. */",
          },
        ],
        types: [
          {
            name: "NotesListRequest",
            declaration: "export interface NotesListRequest {}",
          },
          {
            name: "NotesListResult",
            declaration:
              "export type NotesListResult = NotesOk<{ items: NoteListItem[] }> | NotesErrorResult;",
          },
          {
            name: "NotesGetRequest",
            declaration: "export interface NotesGetRequest { readonly id: string; }",
          },
          {
            name: "NotesGetResult",
            declaration:
              "export type NotesGetResult = NotesOk<{ note: Note }> | NotesErrorResult;",
          },
          {
            name: "NotesCreateRequest",
            declaration:
              "export interface NotesCreateRequest { readonly title?: string; }",
          },
          {
            name: "NotesCreateResult",
            declaration:
              "export type NotesCreateResult = NotesOk<{ note: Note }> | NotesInvalidArgument;",
          },
          {
            name: "NotesUpdateRequest",
            declaration:
              "export interface NotesUpdateRequest { readonly id: string; readonly ifVersion: string; readonly title?: string; readonly body?: string; readonly addClip?: { readonly text: string; readonly sessionId: string; readonly sessionTitle?: string }; readonly removeClipId?: string; }",
          },
          {
            name: "NotesUpdateResult",
            declaration:
              "export type NotesUpdateResult = NotesOk<{ note: Note }> | NotesErrorResult;",
          },
          {
            name: "NotesDeleteRequest",
            declaration: "export interface NotesDeleteRequest { readonly id: string; }",
          },
          {
            name: "NotesDeleteResult",
            declaration:
              "export type NotesDeleteResult = NotesOk<{ ok?: true; absent?: true }> | NotesErrorResult;",
          },
          {
            name: "Note",
            declaration:
              "export interface Note { readonly id: string; readonly title: string; readonly body: string; readonly clips: readonly NoteClip[]; readonly version: string; readonly createdAt: number; readonly updatedAt: number; }",
          },
          {
            name: "NoteClip",
            declaration:
              "export interface NoteClip { readonly id: string; readonly text: string; readonly sessionId: string; readonly sessionTitle?: string; readonly createdAt: number; }",
          },
          {
            name: "NoteListItem",
            declaration:
              "export interface NoteListItem { readonly id: string; readonly title: string; readonly clipCount: number; readonly bodyLength: number; readonly version: string; readonly createdAt: number; readonly updatedAt: number; }",
          },
        ],
      },
      {
        description:
          "Files sidecar service: stores uploaded PDFs under the harness notes directory, extracts their text for the browser text view, and serves the raw bytes for the native preview.",
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
          { kind: "method", name: "delete", signature: "@Remote('delete') delete(request: FilesDeleteRequest): Promise<FilesDeleteResult>", summary: "Delete a file.", jsDoc: "/** Delete a file. */" },
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
          { name: "StoredFile", declaration: "export interface StoredFile extends FileMeta { readonly text?: string; }" },
        ],
      },
    ],
    events: [],
    objects: [],
  },
  invocations: [...NOTES_DESCRIPTORS, ...FILES_DESCRIPTORS],
};

export type TypertManifest = typeof TYPERT;
