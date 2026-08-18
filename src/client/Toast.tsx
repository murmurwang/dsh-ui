import * as React from "react";
import type { TranslateNS } from "@deepseek-ai/dsh-client-ui-slots";
import type { NotesController } from "./notes";
import { NS } from "./locales";

export interface ToastProps {
  t: TranslateNS<typeof NS>;
  notes: NotesController;
}

/** 底部轻提示：订阅控制器 toast 状态，自动淡出。 */
export function Toast({ notes }: ToastProps) {
  const state = React.useSyncExternalStore(notes.subscribe, notes.getSnapshot, notes.getSnapshot);
  const toast = state.toast;
  if (toast === null) return null;
  return (
    <div className="dshui-toast" role="status" key={toast.seq}>
      {toast.text}
    </div>
  );
}
