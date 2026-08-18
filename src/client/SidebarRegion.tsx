import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import type { NotesController } from "./notes";
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

function NotesTab({ t, notes }: Pick<SidebarRegionProps, "t" | "notes">) {
  const state = React.useSyncExternalStore(notes.subscribe, notes.getSnapshot, notes.getSnapshot);
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
            state.openId === item.id ? "dshui-side-row dshui-side-row-current" : "dshui-side-row"
          }
          onClick={() => void notes.open(item.id)}
        >
          <span className="dshui-side-row-title">{item.title}</span>
          {item.clipCount > 0 ? <span className="dshui-side-meta">{item.clipCount}</span> : null}
        </button>
      ))}
    </div>
  );
}

function FilesTab({ t }: Pick<SidebarRegionProps, "t">) {
  return <div className="dshui-side-empty">{t("files.placeholder")}</div>;
}

/** 侧栏工作区座位的新占有者：工作区 / 笔记 / 文件 三分栏。
 *  工作区 tab 直接渲染官方 WorkspaceBrowser（经子座位，全套官方机制）。 */
export function SidebarRegion(props: SidebarRegionProps) {
  const { t, wide, renderSlot } = props;
  const [tab, setTab] = React.useState<Tab>(readTab);

  const pick = (next: Tab) => {
    setTab(next);
    try {
      localStorage.setItem(TAB_KEY, next);
    } catch {
      /* ignore */
    }
    // 主区联动：切到笔记 → 恢复上次打开的笔记（没有则保持官方页面）；
    // 切到其它 tab → 关闭编辑器，主区回到官方页面。
    if (next === "notes") {
      const snapshot = props.notes.getSnapshot();
      const lastId = snapshot.lastOpenNoteId;
      if (
        lastId !== null &&
        snapshot.items.some((item) => item.id === lastId) &&
        snapshot.openNote === null
      ) {
        void props.notes.open(lastId);
      }
    } else {
      props.notes.close();
    }
  };

  // 初始就是笔记 tab（跨刷新记忆）时同样恢复上次笔记。
  React.useEffect(() => {
    if (tab !== "notes") return;
    const snapshot = props.notes.getSnapshot();
    const lastId = snapshot.lastOpenNoteId;
    if (
      lastId !== null &&
      snapshot.items.some((item) => item.id === lastId) &&
      snapshot.openNote === null
    ) {
      void props.notes.open(lastId);
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
          <NotesTab t={t} notes={props.notes} />
        ) : (
          <FilesTab t={t} />
        )
      ) : null}
    </div>
  );
}
