import { defineTool } from "@deepseek-ai/dsh-tools";
import type { NotesStore } from "./store";

/**
 * 模型可见的 `notes` 工具：让 agent 可以在用户的笔记里工作。
 *
 * - list 枚举笔记；read 读取整篇（含剪藏与版本号）；
 * - create 新建；write 整体替换正文；append 在正文后追加；
 * - write/append 用 ifVersion 做乐观并发，冲突时模型应重新 read 后重试。
 */
export function defineNotesTool(store: NotesStore) {
  return defineTool({
    name: "notes",
    description:
      "Work with the user's notes (the dsh-ui notes store). Notes are Markdown documents; each note also carries clips (quoted excerpts saved from conversations, each with a sessionId link). " +
      "Operations: 'list' enumerates notes (id/title/version). 'read' returns the full note including its current version. 'create' makes a new note. 'write' replaces a note's Markdown body; 'append' adds text to the end of the body. " +
      "write/append require ifVersion (the version from a previous read) so concurrent edits are never lost — on a version-conflict, read again and retry once. " +
      "Use this tool whenever the user asks you to work inside a note (organize content into tables or lists, summarize, reword, extend) or to save something into a note; write the finished result back into the same note.",
    parameters: {
      operation: {
        type: "string",
        required: true,
        description:
          "One of: 'list' | 'read' | 'create' | 'write' | 'append'.",
      },
      noteId: {
        type: "string",
        description: "Target note id (required for read/write/append).",
      },
      title: {
        type: "string",
        description: "Note title (used by 'create').",
      },
      content: {
        type: "string",
        description:
          "Markdown body. 'write': full replacement. 'append': appended to the end of the current body.",
      },
      ifVersion: {
        type: "string",
        description:
          "Expected current note version for write/append; mismatches are rejected so concurrent edits are not lost.",
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: true,
        properties: {
          ok: { type: "boolean", required: true },
        },
      },
      render: (_args, value) => [
        {
          type: "text",
          text: JSON.stringify(value, null, 2),
        },
      ],
    },
    // 返回值是 RpcResult 形状的普通 JSON 对象；schema 为宽松对象，
    // 其推断的规范值类型与领域类型无关，这里显式收窄。
    async execute(args: unknown): Promise<never> {
      const a = args as {
        operation?: unknown;
        noteId?: unknown;
        title?: unknown;
        content?: unknown;
        ifVersion?: unknown;
      };
      const operation = String(a.operation ?? "");
      switch (operation) {
        case "list":
          return store.list() as never;
        case "read": {
          if (typeof a.noteId !== "string") {
            throw new Error("notes.read requires noteId");
          }
          return store.get(a.noteId) as never;
        }
        case "create":
          return store.create({
            ...(typeof a.title === "string" ? { title: a.title } : {}),
          }) as never;
        case "write":
        case "append": {
          if (typeof a.noteId !== "string") {
            throw new Error(`notes.${operation} requires noteId`);
          }
          if (typeof a.ifVersion !== "string") {
            throw new Error(`notes.${operation} requires ifVersion from a prior read`);
          }
          if (typeof a.content !== "string") {
            throw new Error(`notes.${operation} requires content`);
          }
          if (operation === "write") {
            return store.update({
              id: a.noteId,
              ifVersion: a.ifVersion,
              body: a.content,
            }) as never;
          }
          // append：先读当前正文，再把内容追加到末尾。
          const current = await store.get(a.noteId);
          if (!current.ok) return current as never;
          const joined =
            current.value.note.body === ""
              ? a.content
              : `${current.value.note.body.replace(/\s+$/, "")}\n\n${a.content}`;
          return store.update({
            id: a.noteId,
            ifVersion: a.ifVersion,
            body: joined,
          }) as never;
        }
        default:
          throw new Error(
            `unknown notes operation "${operation}" (expected list/read/create/write/append)`,
          );
      }
    },
  });
}
