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
      }
    ],
    events: [],
    objects: []
  },
  invocations: NOTES_DESCRIPTORS
};
export {
  TYPERT
};
//# sourceMappingURL=typert.js.map
