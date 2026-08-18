# 前端设计指南

本文档是 Sub-Store Cloudflare 管理端（`frontend/`）的**产品设计系统**说明。通用 Web 可访问性 / 表单 / 动效规则见 agent skill `.agents/skills/web-design-guidelines/SKILL.md`（会拉取 [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)）。改 UI 时两套都要遵守；**产品壳层与导航**以本文为准。

## 产品气质

- 安静、偏工具感：少装饰、少抬升阴影、少彩色大图标。
- 桌面与手机共用同一套 token 与控件语言，手机只做密度 / 触控 / 安全区优化。
- 短任务用轻量浮层（居中 Modal / 底部 Sheet），不要用全高右侧抽屉当默认交互。

## Token 与文件位置

| 类别 | 权威来源 | 说明 |
| --- | --- | --- |
| 半径 / 间距 / 字号 / 字体 / z-index | `frontend/src/hooks/useThemes.ts` → `designTokens` | 运行时写入 CSS 变量；预 JS 默认值在 `assets/styles/tokens-root.scss` |
| SCSS 别名 | `assets/styles/tokens.scss`、`mixins.scss` | 组件内用 `$radius-*`、`$space-*`、`$breakpoint-*` |
| 主题色 | `frontend/src/themes/*.ts` | 日间主色 `#0F172A`（slate）；暗色主题同步中性主色 |
| 全局基线 | `assets/styles/global.scss`、`overwritten_css_var.scss` | 表单表面、Nav 安全网、弹层类名 |

### 允许刻度（不要发明中间值）

- **半径**：6 / 8 / 12 / `9999`（full）；卡片用 `radius-lg`（12，`--item-card-radios` 为其别名）
- **间距**：4 / 8 / 12 / 16 / 24 / 32
- **字号**：12 / 13 / 14 / 16 / 20 / 24
- **内容列宽**：`max-width: 1024px`（`$content-max-width`），与顶栏内容区对齐
- **断点**：600（sm）/ 768（md，桌面分界）/ 900（lg）/ 1200（xl）

### 字体

- UI：`--font-sans`（Geist 优先，回退系统与中文黑体栈）
- 数据 / URL / 代码：`--font-mono`（JB）
- 中文标题避免英文负字距（见 `App.vue` `:lang(zh)`）

### 颜色角色（命名约定）

使用主题变量，不要硬编码业务色（危险色确认场景除外）：

- `--primary-color` / `--primary-color-end`：主操作、开关开态
- `--background-color`：页面底
- `--card-color` / `--popup-color`：卡片与浮层
- `--divider-color`：描边
- `--primary-text-color` / `--second-text-color` / `--comment-text-color` / `--lowest-text-color`：文字层级
- `--danger-color` / `--succeed-color`：危险 / 成功

暗色：`html[data-theme="dark"]` + `color-scheme: dark`。主题循环：跟随系统 → 浅色 → 深色。

## 应用壳层

```
NavBar（固定顶栏）
  └ page-body（内容列，max 1024）
```

- 顶栏高度内容区 **56px**，外加 `env(safe-area-inset-top)`。
- `AppLayout` 用同等 top inset 顶开内容；底边保留 `safe-area-inset-bottom`（无底部 TabBar）。
- **不要恢复底部 TabBar** 作为默认主导航；与顶部分段控件重复。

### 顶栏（`NavBar.vue`）

| 区域 | 首页 / 一级 | 二级（编辑等 `needNavBack`） |
| --- | --- | --- |
| 左 | Logo + 品牌名（窄屏可藏品牌名） | 返回 + 紧凑标题 |
| 中 | 分段控件：订阅 / 工具 / 设置 | **同一分段控件始终存在** |
| 右 | 刷新（可选）/ 语言 / 主题 | 语言 / 主题 |

- 编辑路由下「订阅」保持父级高亮。
- 窄屏（约 420px 以下）：分段可仅图标；触控目标约 40px。

## 页面结构模式

### 分区标题（首页 / 工具 / 设置共用）

- 标题约 **13px / semibold**，颜色 `--comment-text-color`（安静、次级）
- 可选一行 12px 说明（`--lowest-text-color`）
- 右侧放小圆形操作（28–40px），与首页「新建」同形

### 卡片与列表

- 单层卡片：`background: var(--card-color)` + `1px solid var(--divider-color)` + `border-radius: var(--radius-lg)`
- 默认阴影克制；**触摸设备禁止依赖 hover 抬升**（用 `@media (hover: hover) and (pointer: fine)`）
- 列表行最小触控高度约 40–44px；标题可截断（`min-width: 0` + ellipsis）
- 订阅卡片移动端：主操作「复制」常显；编辑 / 克隆 / 刷新 / 删除收入 **⋯ 菜单**，菜单须 **Teleport 到 `body` + `position: fixed`**，避免被后续卡片盖住

### 表单

- 控件高度约 **40px**；圆角 `radius-md`
- Focus：边框主色 + `box-shadow: 0 0 0 2px var(--focus-ring-color)`；禁止裸 `outline: none`
- 占位符用完整句子或示例，末尾可用 `…`
- 编辑页为**单页连续滚动**（不再用「显示 / 内容 / 操作」分段 tab）；标签在输入框内确认添加，不用右侧抽屉

## 浮层约定

| 场景 | 桌面（768px 及以上） | 手机（不足 768px） |
| --- | --- | --- |
| 拷贝订阅链接、模板编辑等短任务 | 居中 Modal（约 420–560px，圆角 16） | Bottom Sheet（顶拖条，最大约 70–88vh） |
| 确认危险操作 | Dialog / 二次确认 | 同左 |
| Toast / Notify | 顶部或现有 notify 通道 | 同左 |

- 弹层类名：`preview-modal-popup` / `preview-sheet-popup`、`template-modal-popup` / `template-sheet-popup`（见 `overwritten_css_var.scss`）
- Sheet 需尊重底部安全区；滚动容器设 `overscroll-behavior: contain`（尽量）
- **默认不要**用 `position="right"` 全高侧栏承载短任务

## 动效

- UI 动效一般 **≤300ms**，优先 `ease-out` / `cubic-bezier(0.23, 1, 0.32, 1)`
- 只过渡 `transform` / `opacity` / 明确列出的颜色属性；禁止 `transition: all`
- 按压缩放约 `scale(0.96–0.97)`
- 必须尊重 `prefers-reduced-motion`（见 `reduced-motion-fix.scss`）
- 高频操作（键盘切换、列表滑动）少动效或无动效

## 移动端专项

- 断点 **768**：桌面 / 手机分界（与 `SIDEBAR_BREAKPOINT` 一致）
- 触控主按钮 **40–44px**
- 安全区：`env(safe-area-inset-*)` 用于顶栏、底栏、Sheet
- `-webkit-tap-highlight-color: transparent`（已在 `body`）
- 避免粘滞 hover；hover 视觉仅限 fine pointer
- 页面水平内边距：手机约 14–16px，桌面 24px

## 无障碍（与通用指南对齐的最低要求）

- 仅图标的按钮必须有 `aria-label` / `title`
- 操作使用 `<button>`，导航使用 `<a>` / `router-link`
- 可见 `:focus-visible`；弹层打开时焦点不被顶栏永久挡住
- 装饰性图标可 `aria-hidden`

## 反模式（本仓库特有）

| 不要 | 要 |
| --- | --- |
| 底部 TabBar + 顶部分段双导航 | 仅顶部分段 |
| 右侧全高抽屉做「复制链接 / 加标签」 | Modal / Sheet / 行内输入 |
| 编辑页三分段 tab | 单页滚动 |
| 卡片内绝对定位菜单（易被下一项盖住） | Teleport + fixed |
| 大彩色区块图标堆砌 | 安静分区标题 + 扁列表 |
| 新造 token 刻度（如 10px 半径） | 使用既有 6/8/12 刻度 |
| `transition: all` / 无替代的 `outline: none` | 显式属性 / focus-visible |

## 改 UI 时的检查清单

1. 是否只用既有 token 刻度与主题变量？
2. 顶栏分段是否仍在二级页可见？
3. 短任务浮层是否为 Modal（桌面）/ Sheet（手机）？
4. 列表空态、长文本截断、触控高度是否处理？
5. 暗色主题与 `prefers-reduced-motion` 是否仍可用？
6. 用 `.agents/skills/web-design-guidelines` 对改动文件跑一遍审查。

## 相关代码入口

- `frontend/src/components/NavBar.vue` — 顶栏
- `frontend/src/components/SubListItem.vue` — 订阅卡片与 ⋯ 菜单
- `frontend/src/views/Sub.vue` / `Tools.vue` / `My.vue` / `SubEditor.vue` — 各页
- `frontend/src/hooks/useThemes.ts` — token 与主题注入
- `frontend/src/assets/styles/*` — 全局样式与弹层
