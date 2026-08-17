# dsh-ui

DSH（DeepSeek Harness）的浏览器 UI 插件。第一个功能：**划选追问** —— 在对话里划选一段文字，即可就地追问；也可以一键把问题带进一个**携带原上下文的新分支对话**继续聊。

> 插件形态说明：`dsh-ui` 是一个纯客户端（UI 层）插件。Node 半边是空壳（只为进入 host 的 Loader），浏览器半边通过 `exports["./client"]` 与 package.json 的 `dsh.client` 声明被发现并注入前端。

## 功能：划选追问

在对话页面上用鼠标划选任意一段文字，选区上方会浮出两个按钮：

| 按钮 | 行为 |
| --- | --- |
| **追问所选部分** | 把所选内容折成 Markdown 引用块，预填进**当前对话**的输入框并聚焦，直接输入问题即可发送 |
| **在新分支中追问** | 调用 `session.fork` 新建一个**分支对话**（携带原对话的完整上下文与标题序号），自动切到新窗口，并把所选内容作为引用预填进新对话的输入框 |

细节：

- 引用块以 `> ` 逐行引用，多行/多段落选中内容不会在块中间断开；超长内容截断到 4000 字符。
- 预填采用追加语义：输入框里已有草稿时不会覆盖，引用块会追加在草稿之后。
- 浮窗跟随选区定位（上方停靠，空间不足时转下方），点击浮窗不折叠选区；点击别处、按 Esc、滚动页面或调整窗口都会收起。
- 浮窗仅在存在当前会话时出现；分支创建失败会在浮窗内就地提示。
- 文案支持中英双语，跟随 DSH 的 locale 设置；样式全部走 DSH 主题变量（自动适配深色模式）。

## 安装

要求 DSH ≥ `0.1.0-rc.6`（web profile）。

```sh
# 方式一：从 GitHub 安装（需要 pnpm，dsh plugin 会转发给 pnpm）
dsh plugin --profile web add github:murmurwang/dsh-ui

# 方式二：本地开发/试用 —— 直接安装到 profile 目录
cd "$DSH_HOME/profiles/web"
npm install /path/to/dsh-ui
```

然后在 `$DSH_HOME/profiles/web/cordis.patch.yml` 里插入插件行（`insert` 列表是 profile 补丁层添加新条目的方式）：

```yaml
- insert:
    - id: ui-selection-ask
      name: 'dsh-ui'
```

重启 `dsh web` 后生效（DSH 的插件配置在启动时解析，无热配置）。可以先用 `dsh --profile web --dump-config` 确认配置树里出现了 `ui-selection-ask → dsh-ui`。

## 使用

1. 打开任意一个对话；
2. 划选一段文字 → 浮窗出现；
3. 点 **追问所选部分** 就地追问，或点 **在新分支中追问** 到分支对话里继续。

## 开发

```sh
npm install
npm run build     # 产出 lib/index.js（host）+ lib/client.js（client bundle）+ d.ts
npm test          # 纯函数单测 + 客户端 bundle 冒烟测试（mock ctx + 假 DOM）
npm run typecheck
```

热更新：保持 `npm run watch` 运行并重启一次 `dsh web` 之后，每次重新构建 `lib/client.js`，DSH 的 client-plugin HMR 链路会把新 bundle 推送给已打开的页面，**无需刷新页面**即可看到改动（配置行本身的变化仍需重启）。

### 实现要点

- **入口形态**：构建脚本（`build.mjs`）用 esbuild 把 `src/client/index.tsx` 编成 IIFE，再包进 `window.__ModuleLoader__.load({ id, factory })` 工厂形式；`factory` 的 `require` 参数同时满足 esbuild 对 `react` / `react/jsx-runtime` 的外部引用（运行时仅依赖这两个 shell 提供的外部模块）。
- **挂载点**：注册进布局声明的根级浮层座位 `shell.overlay`（`ctx.slots.inject` 等待声明），不替换任何既有条目。
- **会话 API**：`ctx.sessions.fork({ sessionId, increaseTitle: true })` 建分支 → `sessions.open(child)` 切窗口 → `ctx.conversation.input.for(actx).setDraft(...)` 预填输入框（`actx` 来自 `sessions.scope(id)` / `binding(id).ctx`）。
- **类型**：devDependencies 引 `@deepseek-ai/dsh-*@0.1.0-rc.6` 仅用于类型合并（`ctx.sessions` / `ctx.conversation` / `SlotMap["shell.overlay"]` / `LocaleNamespaceMap`），构建产物零运行时依赖。

## 路线图

- [ ] 划选后追加更多动作：翻译、搜索、复制为引用等（同一浮窗扩展按钮）
- [ ] 追问模板（预设提示词：解释 / 翻译 / 找问题…）
- [ ] 划选后按快捷键（如 `Q`）直达分支追问
- [ ] 划选编辑器/交付物中的文字并引用定位信息

## License

MIT
