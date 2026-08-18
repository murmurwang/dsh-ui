import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Typert 清单 + host 服务冒烟：
 * - lib/typert.js 的 TYPERT 清单满足 dsh-typert-loader 的关键校验规则；
 * - lib/index.js 的 NotesService 经 @Remote 装饰后，remoteMethods 返回 5 个标记；
 * - 服务方法能对同一存储执行 CRUD（与工具共享的路径）。
 */
const dir = mkdtempSync(join(tmpdir(), "dsh-ui-typert-test-"));
test.after(() => rmSync(dir, { recursive: true, force: true }));

test("TYPERT 清单形状与 codec 校验", async () => {
  const { TYPERT } = await import("../lib/typert.js");
  assert.equal(TYPERT.package, "dsh-ui");
  assert.equal(TYPERT.face, "host");
  assert.ok(Array.isArray(TYPERT.schemas));
  assert.ok(Array.isArray(TYPERT.invocations));
  assert.equal(TYPERT.invocations.length, 10);
  const model = TYPERT.model;
  assert.ok(model && Array.isArray(model.services) && Array.isArray(model.events) && Array.isArray(model.objects));
  const service = model.services.find((s) => s.key === "notes");
  assert.ok(service, "model.services 应包含 notes 服务");
  assert.equal(service.exportName, "NotesService");
  assert.ok(Array.isArray(service.members) && service.members.length === 5);
  assert.ok(service.members.every((m) => typeof m.name === "string" && typeof m.signature === "string" && m.kind === "method"));
  const filesService = model.services.find((s) => s.key === "files");
  assert.ok(filesService, "model.services 应包含 files 服务");
  assert.equal(filesService.exportName, "FilesService");
  assert.ok(Array.isArray(filesService.members) && filesService.members.length === 5);
  assert.ok(Array.isArray(service.types) && service.types.length > 0);
  assert.ok(service.types.every((t) => typeof t.name === "string" && typeof t.declaration === "string"));

  const methods = new Set();
  for (const inv of TYPERT.invocations) {
    assert.ok(inv.service === "notes" || inv.service === "files");
    assert.equal(inv.namespace, inv.service);
    assert.equal(inv.invocation.kind, "direct");
    assert.equal(inv.parameters.length, 1);
    const p = inv.parameters[0];
    assert.equal(p.wire, "request");
    assert.equal(p.source, "json");
    assert.equal(p.codec.mode, "strict");
    assert.ok("_zod" in p.codec.schema, "参数 codec 必须是 zod v4 实例");
    assert.equal(typeof p.codec.schema.parse, "function");
    assert.equal(inv.result.mode, "strict");
    assert.ok("_zod" in inv.result.schema);
    assert.equal(typeof inv.result.schema.parse, "function");
    methods.add(inv.method);
  }
  assert.deepEqual(
    [...methods].sort(),
    ["create", "delete", "get", "getBytes", "list", "update", "upload"],
  );
});

test("NotesService 装饰器标记与 CRUD 路径", async () => {
  const { NotesService, NotesStore } = await import("../lib/index.js");
  const { remoteMethods } = await import("@deepseek-ai/dsh-typert-protocol");

  const fakeCtx = {
    reflect: { provide: () => () => {} },
    effect: () => () => {},
  };
  const store = new NotesStore(join(dir, "svc"));
  const service = new NotesService(fakeCtx, store);
  assert.equal(service.name, "notes");
  const markers = remoteMethods(service);
  // exportName 与 method 同名时不重复存储（typert-protocol mark 的约定）。
  const names = markers.map((m) => m.method).sort();
  assert.deepEqual(names, ["create", "delete", "get", "list", "update"]);

  const created = await service.create({ title: "服务路径" });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const id = created.value.note.id;
  const updated = await service.update({
    id,
    ifVersion: created.value.note.version,
    body: "# 标题",
  });
  assert.equal(updated.ok, true);
  const got = await service.get({ id });
  assert.equal(got.ok, true);
  if (!got.ok) return;
  assert.equal(got.value.note.body, "# 标题");
  const listed = await service.list();
  assert.equal(listed.ok, true);
  if (!listed.ok) return;
  assert.equal(listed.value.items.length, 1);
});
