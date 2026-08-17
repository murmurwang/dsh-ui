import { NOTES_DESCRIPTORS } from "./notes/wire";

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
    ],
    events: [],
    objects: [],
  },
  invocations: NOTES_DESCRIPTORS,
};

export type TypertManifest = typeof TYPERT;
