import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import {
  Button,
  IconEditOutline16,
  IconEllipsisOutline16,
  IconTrashOutline16,
  Menu,
  Modal,
} from "@deepseek-ai/dsh-client-ui-primitives";
import type { NotesController } from "./notes";
import type { FilesController } from "./files";
import { NS } from "./locales";

export interface SidebarRegionProps {
  /** SidebarRoot 传入的 owner props。 */
  wide: boolean;
  expandSidebar: () => void;
  /** locale seat。 */
  t: TranslateNS<typeof NS>;
  /** 工作区浏览子座位（官方 WorkspaceBrowser 的宿主）。 */
  renderSlot: (name: "sidebar.workspaces.browser", owner: { wide: boolean; expandSidebar: () => void }) => React.ReactNode;
  /** inject 注入的业务面。 */
  notes: NotesController;
  files: FilesController;
  openSession: (sessionId: string) => void;
}

type Tab = "workspaces" | "notes" | "files";

const TAB_KEY = "dsh-ui.sidebar-tab";

function readTab(): Tab {
  try {
    const v = localStorage.getItem(TAB_KEY);
    return v === "notes" || v === "files" ? v : "workspaces";
  } catch {
    return "workspaces";
  }
}

function NotesTab({ t, notes, menuId, setMenuId }: Pick<SidebarRegionProps, "t" | "notes"> & {
  menuId: string | null;
  setMenuId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const state = React.useSyncExternalStore(notes.subscribe, notes.getSnapshot, notes.getSnapshot);
  const [renameTarget, setRenameTarget] = React.useState<{ id: string; currentTitle: string } | null>(null);
  const [renameDraft, setRenameDraft] = React.useState("");
  const [renaming, setRenaming] = React.useState(false);
  const [renameError, setRenameError] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const composingRef = React.useRef(false);

  const onCreate = () => {
    void notes.create(t("note.defaultTitle")).then((note) => {
      if (note !== null) void notes.open(note.id);
    });
  };

  const itemOf = (id: string) => state.items.find((i) => i.id === id);

  const handleSelect = (id: string, noteId: string) => {
    setMenuId(null);
    const item = itemOf(noteId);
    if (item === undefined) return;
    // 延迟一拍再开弹窗：菜单 portal 卸载时，WebKit 会把点击重定向到
    // 指针下方新出现的 Modal 遮罩（onClick=onClose），导致弹窗闪退。
    if (id === "rename") {
      setRenameDraft(item.title);
      window.setTimeout(() => setRenameTarget({ id: noteId, currentTitle: item.title }), 0);
    } else if (id === "delete") {
      window.setTimeout(() => setDeleteTarget({ id: noteId, title: item.title }), 0);
    }
  };

  const renameTrimmed = renameDraft.trim();
  const renameBlocked =
    renaming || renameTrimmed === "" || renameTarget === null || renameTrimmed === renameTarget.currentTitle;
  const closeRename = () => {
    if (renaming) return;
    setRenameTarget(null);
    setRenameError(null);
  };
  const confirmRename = () => {
    if (renameBlocked || renameTarget === null) return;
    setRenaming(true);
    setRenameError(null);
    void notes.renameNote(renameTarget.id, renameTrimmed).then(
      (ok) => {
        setRenaming(false);
        setRenameTarget(null);
        if (!ok) setRenameError(t("rename.conflict"));
      },
      () => {
        setRenaming(false);
        setRenameError(t("rename.network"));
      },
    );
  };

  const confirmDelete = () => {
    if (deleteTarget === null) return;
    setBusy(true);
    void notes.removeNote(deleteTarget.id).finally(() => {
      setBusy(false);
      setDeleteTarget(null);
    });
  };

  return (
    <div className="dshui-side-pane">
      <div className="dshui-side-add" role="button" tabIndex={0} onClick={onCreate}>
        <span className="dshui-side-add-plus">＋</span>
        <span>{t("notes.new")}</span>
      </div>
      {state.items.length === 0 ? (
        <div className="dshui-side-empty">{t("notes.empty")}</div>
      ) : null}
      {state.items.map((item) => (
        <div key={item.id} className="dshui-side-row-wrap">
          <button
            type="button"
            className={
              state.openId === item.id ? "dshui-side-row dshui-side-row-current" : "dshui-side-row"
            }
            onClick={() => void notes.open(item.id)}
          >
            <span className="dshui-side-row-title">{item.title}</span>
            {item.clipCount > 0 ? <span className="dshui-side-meta">{item.clipCount}</span> : null}
          </button>
          <span className="dshui-side-row-actions">
            <Menu
              open={menuId === item.id}
              onClose={() => setMenuId(null)}
              items={[
                { id: "rename", label: t("note.menu.rename"), icon: <IconEditOutline16 /> },
                { id: "delete", label: t("note.menu.delete"), icon: <IconTrashOutline16 />, danger: true },
              ]}
              onSelect={(id) => handleSelect(id, item.id)}
              portal
              closeOnPointerLeave
              anchor={(
                <button
                  type="button"
                  className="dshui-side-icon-btn"
                  aria-label={t("note.menu.aria", { name: item.title })}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setMenuId((v) => (v === item.id ? null : item.id));
                  }}
                >
                  <IconEllipsisOutline16 />
                </button>
              )}
            />
          </span>
        </div>
      ))}

      {/* 重命名弹窗（与官方工作区重命名同款交互） */}
      <Modal
        open={renameTarget !== null}
        onClose={closeRename}
        closeLabel={t("cancel")}
        title={t("note.rename.title")}
        footer={(
          <>
            <Button variant="outline" disabled={renaming} onClick={closeRename}>{t("cancel")}</Button>
            <Button variant="primary" disabled={renameBlocked} onClick={confirmRename}>{t("confirm")}</Button>
          </>
        )}
      >
        <input
          className="dshui-note-rename-input"
          value={renameDraft}
          aria-label={t("note.title.placeholder")}
          autoFocus
          disabled={renaming}
          onFocus={(e) => {
            e.target.select();
          }}
          onChange={(e) => {
            setRenameDraft(e.target.value);
            setRenameError(null);
          }}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !composingRef.current) {
              e.preventDefault();
              confirmRename();
            }
          }}
        />
        {renameError !== null ? (
          <div className="dshui-note-rename-error" role="alert">{renameError}</div>
        ) : null}
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        closeLabel={t("cancel")}
        title={t("note.delete.title")}
        footer={(
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button variant="primary" className="dshui-danger" onClick={confirmDelete} disabled={busy}>
              {busy ? t("note.delete.pending") : t("confirm")}
            </Button>
          </>
        )}
      >
        <div className="dshui-note-delete-desc" role="alert">
          {t("note.delete.desc", { name: deleteTarget?.title ?? "" })}
        </div>
      </Modal>
    </div>
  );
}

function FilesTab({ t, files, menuId, setMenuId }: Pick<SidebarRegionProps, "t" | "files"> & {
  menuId: string | null;
  setMenuId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const state = React.useSyncExternalStore(files.subscribe, files.getSnapshot, files.getSnapshot);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  return (
    <div className="dshui-side-pane">
      <div
        className="dshui-side-add"
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
      >
        <span className="dshui-side-add-plus">＋</span>
        <span>{t("files.add")}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={(ev) => {
          const file = ev.target.files?.[0];
          if (file !== undefined) void files.upload(file);
          ev.target.value = "";
        }}
      />
      {state.items.length === 0 ? (
        <div className="dshui-side-empty">{t("files.empty")}</div>
      ) : null}
      {state.items.map((item) => (
        <div key={item.id} className="dshui-side-row-wrap">
          <button
            type="button"
            className={
              state.openId === item.id ? "dshui-side-row dshui-side-row-current" : "dshui-side-row"
            }
            onClick={() => void files.open(item.id)}
          >
            <span className="dshui-side-row-title">{item.name}</span>
            <span className="dshui-side-meta">{Math.max(1, Math.round(item.size / 1024))}KB</span>
          </button>
          <span className="dshui-side-row-actions">
            <Menu
              open={menuId === `f:${item.id}`}
              onClose={() => setMenuId(null)}
              items={[
                { id: "delete", label: t("files.delete"), icon: <IconTrashOutline16 />, danger: true },
              ]}
              onSelect={(id) => {
                setMenuId(null);
                if (id === "delete") void files.remove(item.id);
              }}
              portal
              closeOnPointerLeave
              anchor={(
                <button
                  type="button"
                  className="dshui-side-icon-btn"
                  aria-label={t("files.menu.aria", { name: item.name })}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setMenuId((v) => (v === `f:${item.id}` ? null : `f:${item.id}`));
                  }}
                >
                  <IconEllipsisOutline16 />
                </button>
              )}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

/** 侧栏工作区座位的新占有者：工作区 / 笔记 / 文件 三分栏。
 *  工作区 tab 直接渲染官方 WorkspaceBrowser（经子座位，全套官方机制）。 */
export function SidebarRegion(props: SidebarRegionProps) {
  const { t, wide, renderSlot } = props;
  const [tab, setTab] = React.useState<Tab>(readTab);
  const [menuId, setMenuId] = React.useState<string | null>(null);

  const pick = (next: Tab) => {
    setTab(next);
    try {
      localStorage.setItem(TAB_KEY, next);
    } catch {
      /* ignore */
    }
    // 主区联动：tab 切换右边必须跟着切换。
    // 切到笔记 → 展示一篇笔记（优先上次打开的；它被删除/记录丢失则回退第一篇；
    // 没有任何笔记时保持官方页面）；切到其它 tab → 关闭编辑器回到官方页面。
    if (next === "notes") {
      const snapshot = props.notes.getSnapshot();
      if (snapshot.openNote === null && snapshot.items.length > 0) {
        const lastId = snapshot.lastOpenNoteId;
        const target =
          lastId !== null && snapshot.items.some((item) => item.id === lastId)
            ? lastId
            : snapshot.items[0].id;
        void props.notes.open(target);
      }
    } else if (next === "files") {
      const snapshot = props.files.getSnapshot();
      if (snapshot.openFile === null && snapshot.items.length > 0) {
        void props.files.open(snapshot.items[0].id);
      }
    } else {
      props.notes.close();
      props.files.close();
    }
  };

  // 初始就是笔记 tab（跨刷新记忆）时同样保证展示一篇笔记。
  React.useEffect(() => {
    if (tab !== "notes") return;
    const snapshot = props.notes.getSnapshot();
    if (snapshot.openNote === null && snapshot.items.length > 0) {
      const lastId = snapshot.lastOpenNoteId;
      const target =
        lastId !== null && snapshot.items.some((item) => item.id === lastId)
          ? lastId
          : snapshot.items[0].id;
      void props.notes.open(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={wide ? "dshui-side" : "dshui-side dshui-side-narrow"}>
      <div className="dshui-side-tabs" role="tablist" aria-label={t("tabs.aria")}>
        {(["workspaces", "notes", "files"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "dshui-side-tab dshui-side-tab-active" : "dshui-side-tab"}
            onClick={() => pick(key)}
          >
            {wide ? t(`tabs.${key}`) : t(`tabs.${key}.short`)}
          </button>
        ))}
      </div>
      {wide ? (
        tab === "workspaces" ? (
          renderSlot("sidebar.workspaces.browser", { wide, expandSidebar: props.expandSidebar })
        ) : tab === "notes" ? (
          <NotesTab t={t} notes={props.notes} menuId={menuId} setMenuId={setMenuId} />
        ) : (
          <FilesTab t={t} files={props.files} menuId={menuId} setMenuId={setMenuId} />
        )
      ) : null}
    </div>
  );
}
