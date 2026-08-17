import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import type { SessionId } from "@deepseek-ai/dsh-api-remotes/client";
import type {
  SessionListState,
  WorkspaceListState,
} from "@deepseek-ai/dsh-client-runtime/client";
import type { NotesController } from "./notes";
import { NS } from "./locales";

export type SnapshotSelectorHook<S> = <R>(selector: (s: S) => R) => R;

export interface SidebarRegionProps {
  /** SidebarRoot 传入的 owner props。 */
  wide: boolean;
  expandSidebar: () => void;
  /** locale seat。 */
  t: TranslateNS<typeof NS>;
  /** 标准全局 kit。 */
  useWorkspaces: SnapshotSelectorHook<WorkspaceListState>;
  useSessions: SnapshotSelectorHook<SessionListState>;
  /** inject 注入的业务面。 */
  notes: NotesController;
  openSession: (sessionId: string) => void;
  openWorkspace: (workspaceId: string) => void;
  addWorkspace: () => void;
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

function WorkspacesTab({
  t,
  useWorkspaces,
  useSessions,
  openSession,
  openWorkspace,
  addWorkspace,
}: Pick<SidebarRegionProps, "t" | "useWorkspaces" | "useSessions" | "openSession" | "openWorkspace" | "addWorkspace">) {
  const ws = useWorkspaces((s) => s);
  const sessions = useSessions((s) => s);
  const archived = React.useMemo(() => new Set(ws.archivedSessionIds), [ws.archivedSessionIds]);
  const byId = sessions.byId;

  const visibleOf = React.useCallback(
    (id: SessionId) => {
      const s = byId[id];
      if (s === undefined) return false;
      if (archived.has(id)) return false;
      // 空会话只在它是当前会话时显示（与内建列表的 blank 复用语义一致）。
      if (s.blank && sessions.current !== id) return false;
      return true;
    },
    [byId, archived, sessions.current],
  );

  // 未归组会话：不属于任何工作区。
  const accounted = React.useMemo(() => {
    const set = new Set<string>();
    for (const w of ws.items) for (const id of w.sessionIds) set.add(id);
    return set;
  }, [ws.items]);

  const ungrouped = sessions.ids.filter((id) => !accounted.has(id) && visibleOf(id));

  return (
    <div className="dshui-side-pane">
      <div className="dshui-side-add" role="button" tabIndex={0} onClick={addWorkspace}>
        <span className="dshui-side-add-plus">＋</span>
        <span>{t("ws.add")}</span>
      </div>
      {ws.items.map((w) => (
        <div key={w.workspaceId} className="dshui-side-group">
          <button
            type="button"
            className="dshui-side-group-title"
            title={w.path}
            onClick={() => openWorkspace(w.workspaceId)}
          >
            {w.title}
          </button>
          {w.sessionIds.filter(visibleOf).map((id) => (
            <button
              key={id}
              type="button"
              className={
                sessions.current === id
                  ? "dshui-side-row dshui-side-row-current"
                  : "dshui-side-row"
              }
              onClick={() => openSession(id)}
            >
              <span className="dshui-side-row-title">{byId[id]?.displayTitle ?? id}</span>
              {byId[id]?.running ? <span className="dshui-side-dot dshui-side-dot-running" /> : null}
              {byId[id]?.pendingInteraction !== undefined ? (
                <span className="dshui-side-dot dshui-side-dot-ask" />
              ) : null}
              {byId[id]?.completed === true && !byId[id]?.running ? (
                <span className="dshui-side-dot dshui-side-dot-done" />
              ) : null}
            </button>
          ))}
        </div>
      ))}
      {ungrouped.length > 0 ? (
        <div className="dshui-side-group">
          <div className="dshui-side-group-title dshui-side-group-title-plain">{t("ws.ungrouped")}</div>
          {ungrouped.map((id) => (
            <button
              key={id}
              type="button"
              className={
                sessions.current === id
                  ? "dshui-side-row dshui-side-row-current"
                  : "dshui-side-row"
              }
              onClick={() => openSession(id)}
            >
              <span className="dshui-side-row-title">{byId[id]?.displayTitle ?? id}</span>
              {byId[id]?.running ? <span className="dshui-side-dot dshui-side-dot-running" /> : null}
            </button>
          ))}
        </div>
      ) : null}
      {ws.items.length === 0 && ungrouped.length === 0 ? (
        <div className="dshui-side-empty">{t("ws.empty")}</div>
      ) : null}
    </div>
  );
}

function NotesTab({
  t,
  notes,
}: Pick<SidebarRegionProps, "t" | "notes">) {
  const state = React.useSyncExternalStore(notes.subscribe, notes.getSnapshot);
  const onCreate = () => {
    void notes.create("").then((note) => {
      if (note !== null) void notes.open(note.id);
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
        <button
          key={item.id}
          type="button"
          className={
            state.openId === item.id
              ? "dshui-side-row dshui-side-row-current"
              : "dshui-side-row"
          }
          onClick={() => void notes.open(item.id)}
        >
          <span className="dshui-side-row-title">{item.title}</span>
          {item.clipCount > 0 ? (
            <span className="dshui-side-meta">{item.clipCount}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function FilesTab({ t }: Pick<SidebarRegionProps, "t">) {
  return <div className="dshui-side-empty">{t("files.placeholder")}</div>;
}

/** 侧栏工作区座位的新占有者：工作区 / 笔记 / 文件 三分栏。 */
export function SidebarRegion(props: SidebarRegionProps) {
  const { t, wide } = props;
  const [tab, setTab] = React.useState<Tab>(readTab);

  const pick = (next: Tab) => {
    setTab(next);
    try {
      localStorage.setItem(TAB_KEY, next);
    } catch {
      /* ignore */
    }
  };

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
          <WorkspacesTab {...props} />
        ) : tab === "notes" ? (
          <NotesTab t={t} notes={props.notes} />
        ) : (
          <FilesTab t={t} />
        )
      ) : null}
    </div>
  );
}
