---
name: AI项目学习台
description: 用课程实践工作台串联阅读、动手、自查与可核验成果。
colors:
  page: "#f5f5f7"
  surface: "#fff"
  ink: "#1d1d1f"
  muted: "#626267"
  line: "#d2d2d7"
  navy: "#142d43"
  blue: "#0071e3"
  blue-hover: "#0062c4"
  blue-soft: "#e8f1fb"
  success: "#247a69"
  success-bg: "#e8f4ef"
  danger: "#a13939"
  danger-bg: "#fff0ee"
  warning: "#785619"
  warning-bg: "#fff6df"
  focus: "#0071e3"
typography:
  headline:
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "48px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-.025em"
  title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "23px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  reading:
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.95
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  code:
    fontFamily: 'Consolas, "Cascadia Code", monospace'
    fontSize: "14px"
    lineHeight: 1.9
rounded:
  chip: "8px"
  control: "999px"
  field: "12px"
  navigation: "12px"
  choice: "14px"
  practice: "20px"
  inset: "16px"
  surface: "24px"
spacing:
  control-gap: "8px"
  label-gap: "12px"
  panel-gap: "18px"
  section-gap: "23px"
  reading-gap: "28px"
  card-padding: "28px"
  card-padding-mobile: "24px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "#0066cc"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  button-light:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  notes-textarea:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
    width: "100%"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
    width: "100%"
  navigation-item:
    backgroundColor: "transparent"
    rounded: "{rounded.navigation}"
    padding: "12px 15px"
    width: "100%"
  status-chip:
    backgroundColor: "{colors.success-bg}"
    rounded: "{rounded.chip}"
    padding: "5px 9px"
  course-list-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "13px 0"
    width: "100%"
  side-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
    padding: "28px"
---

# Design System: AI项目学习台

## Overview

**Creative North Star: "课程实践工作台"**

以持续的学习路径为骨架，以当次可执行任务为中心。第五轮明确将当前学习桌面的白色侧栏、浅灰页面、白色卡片、深色文字、系统字体和行动蓝推广为所有学习路由的共同基础。沿用已确认的视觉世界，不另起设计。

操作区紧凑，正文区舒展。完成、自查、知识题反馈和待核验状态始终配合文字；本地学习记录不暗示云同步、教师评分或能力认证。

**Key Characteristics:**
- 所有学习路由共用白色导航、浅灰底与白色内容面。
- 连续课程列表、清晰阅读层级与大圆角平面容器。
- 少量行动蓝、诚实语义状态色与可见键盘焦点。
- 系统字体、本机回退、阅读正文宽松行距。

## Colors

frontmatter 为当前规范性原色；sidecar 页面扩展继承这些原色。此前“仅 levels”“仅 home / lesson”“其余路由海军蓝”的限制均为历史，已由第五轮全站学习规则取代。

### Primary
- **行动蓝（blue）**：按钮、链接、输入光标、真实侧栏进度；hover 使用 blue-hover。
- **浅蓝反馈（blue-soft）**：当前导航、选择态和知识题汇总。

### Secondary
- **自查青绿（success / success-bg）**：真实自查、完成记录与知识题答对反馈；不是品牌大面积背景，也不表示能力已验收。
- **错误红（danger / danger-bg）**：错误选项与反馈。
- **保存警示赭色（warning / warning-bg）**：浏览器保存失败等真实警示。

### Neutral
- **浅灰纸底（page）与阅读白（surface）**：页面和白色内容面。
- **正文深灰（ink）与辅助深灰（muted）**：正文和次要信息。
- **轻分隔线（line）**：内容边界；面板细边界另用既有浅灰（#e5e5ea）。
- **品牌海军蓝（navy）**：保留原品牌标志和短暂 toast 等有限用途；不再是侧栏或推荐区底色。
- **焦点蓝（focus）**：学习交互的可见焦点。表单边线沿用（#bcbcc1）。

## Typography

全站使用 frontmatter 系统无衬线栈；SF Pro Display 仅为本机回退名称，不下载或分发字体。代码保留 Consolas / Cascadia Code。标题主要用600字重。

- **页面标题**：headline；桌面（48px / 1.2），900px及以下（40px），650px及以下（34px）。等级页旧52px已被第五轮48px覆盖。
- **页面说明**：（17px / 1.8），手机（16px）；一般页面最大（70ch），home沿用（65ch）。
- **面板标题**：title；内容特有的18、19、20、22、24、26、28px层级按组件使用，不将全部文字强行放大。
- **界面正文**：body；面板说明常用（15px / 1.85），辅助文本保留（11–14px）按原用途分层。
- **课程例外**：课名（32px / 600 / 1.4），手机（27px / 1.45）；reading（17px / 1.95），手机（16px / 1.95）；来源说明（13px / 1.85）；代码（14px / 1.9）。
- **欢迎例外**：品牌标题（clamp 30–48px / 600 / 1.15），手机（clamp 28–36px）；口号（26px / 500 / 1.55），手机（23px / 1.65）；辅助说明（15px），手机（14px）。账号预览卡片标题（22px），手机（20px）。

## Layout

学习路由共用 `body:not([data-view="welcome"])` 外壳：固定白侧栏（232px）；白顶栏桌面高（76px），900px及以下（68px），650px及以下（66px）。900px及以下隐藏桌面侧栏，启用原生dialog移动导航。八个入口、导入导出与保存状态均保留；子路由只映射一个当前主导航。

main最大宽（1280px），居中；桌面padding（48px 40px 80px），900px及以下（40px 28px 64px），650px及以下（32px 20px 52px）。lesson顶部单独（28px）；手机lesson main（24px 16px 48px）。CSS旧main 1392px/阅读780px规则为被覆盖历史，不是当前默认。

项目与小测主列（minmax(0,800px)）加辅助列（minmax(220px,260px)），间隔（28px）；1279px及以下转单主列，辅助区两列，手机单列。lesson阅读面最大（800px），桌面内容可用宽最大（720px），详细例外见组件。当前组合断点包含1500、1279、1190、1050、900、720、650px，不增加新的布局体系。

## Elevation & Depth

浅灰页面、白色面板与细边界建立层级，常规卡片无常驻阴影。保留移动菜单（10px 0 50px #00000025）与toast（0 8px 25px #00000020）中性浮层阴影。阶段悬停既有轻阴影只作短暂反馈，工具入口卡仅轻微位移和边线；不增加蓝色发光或持续动效。

沿用已有350ms首次路由入场、200ms卡片/按钮、250ms details、180ms导航和400ms真实进度反馈。概念details复用同一个250ms高度处理器；不叠加组件入场。减少动态效果时取消位移与过渡并保留即时原生操作。

## Shapes

主卡与容器（24px），字段与导航（12px），知识题选项（14px），示例/汇总内层（16px），独立任务与手机阅读面（20px），按钮胶囊（999px）。欢迎卡仍（24px），欢迎按钮（24px）圆角。主容器padding通常（28px），手机（24px）；项目、试卷、课程等明确例外按组件记录。

细边框（1px）和继承currentColor的线性SVG保持一致。普通按钮至少（44px），字段至少（48px），小测选项至少（56px）；原返回、复制和移动操作保留可触达高度。

## Components

### Buttons / Fields / Navigation

主按钮行动蓝底白字，hover加深；次按钮透明底、深字、字段灰边线，hover浅灰；ghost为蓝字，hover浅蓝；旧light按钮当前也为白底、深字、灰边线。按钮padding（10px 20px）、字体（14px / 400）、200ms状态反馈、按下下移（1px）。禁用为灰底灰字，禁止伪装可用。

文本框、textarea与select为白底、深字、（16px / 1.8）、padding（12px 14px），占位文字muted且不透明；笔记可垂直调整。键盘焦点（3px）行动蓝，offset（4px）；字段offset（3px）。字段标签保持文本，不能套输入边框。

白侧栏普通项（#515156），hover page，当前项blue-soft底与（#005dbb）字，并保留aria-current。等级图第一、学习桌面第二；游客目标仍为#levels，返回欢迎入口保留。进度反映真实记录，非虚构动画。

### Knowledge Quiz / Practice

原生fieldset/legend/radio，整行label可点；选择态浅蓝，已答数实时呈现。提交前只读当前DOM中checked数量，不写持久记录、不提前判分；“未提交”与“已提交知识题”明确区分。提交仍沿用固定选项原判分，逐题展示正确答案与解释，答对青绿、答错红且配文字。知识分数不代表实操或独立能力验收。

小测卡padding（32px），手机（24px 20px）；题目（17px），手机（16px）；选项padding（15px 16px），手机（14px 12px），文字（15px）。实操证据、自查、阶段反馈及重做沿用原流程。

### Notes / Concepts / Resources / Extensions

笔记空列表最大（620px）并居中；空卡padding（44px 36px），手机（32px 24px）。有笔记保留原文、课程关联与编辑入口，不制造时间。概念保留原搜索内容，以原生details按需展开，桌面双列/手机单列，主题（20px）、解释（15px / 1.9）。

DeepSeek与ChatGPT已有官方入口变为两列小卡，手机单列；卡片（20px）圆角、padding（24px），标题（22px），说明（15px / 1.85）。完整比较表及其他链接仍保留，表格最小（720px）并在容器内横向滚动。拓展沿用连续课程列表和原七关二十二课记录，选修不计入必修门槛。

### Levels / Welcome

等级页保留七阶段卡片的3/2/1列和六级能力图/详情结构；共享色彩、系统字体与外壳现为全站规范，页面标题为48/40/34px。六级为课程能力规划，不是平台官方认证；勾选、成绩与文字准备均不能授予能力。

欢迎仍是独立入口：隐藏侧栏/顶栏，main padding（64px 24px 48px），手机（32px 20px）；品牌与入口整体垂直平衡，白卡最大（360px），padding（24px），手机（20px 24px）。游客按钮前置；原禁用账号预览收在原生 details 内，默认折叠。字段高（48px），卡片按钮最小（48px）；品牌及返回文本入口至少（44px）。邮箱、密码、登录仍禁用，账号说明静态即将开放，不采集凭证、不创建身份偏好或云同步。游客唯一主要可用动作为进入#levels。

### Home + Lesson（第四轮内容结构沿用，第五轮共享外观优先）

- **首页首屏**：标题 `48px / 600 / 1.2`、字距 `-.025em`，900px及以下 `40px`、手机 `34px`；说明 `17px / 1.8`、最大 `65ch`，手机 `16px`。推荐区白底、`24px` 圆角、padding `26px 30px`、下间距 `36px`，手机 `24px` / `32px` 并转纵向。推荐标题 `24px / 600 / 1.5`、手机 `22px`，介绍 `15px / 1.8`，建议时间 `13px`。名称、介绍、时间取既有 `nextLesson()` 对象；首课区分首次动手约10分钟与完整课程20分钟，必修自查完转向原最终阶段挑战，不虚构新知识字段。
- **七阶段路线**：直接复用原生 `details.stage-item` 展示六必修加一选修，原课程和挑战入口保持可访问，选修不计入必修15课。白阶段面 `24px` 圆角、间隔 `16px`；当前建议边线 `#78afe5`，并保留“当前建议”文字。summary padding `22px 24px`、手机 `20px`，标题 `19px / 600 / 1.5`、手机 `18px`；课名 `15px`、辅助 `12–13px`。桌面主列加 `260px` 侧列 / gap `24px`，1279px及以下转单主列，辅助区再从3列、2列转手机1列。阶段原生 progress `64px × 4px`，只展示实际自查数值。
- **课程阅读**：layout 为 `minmax(0,800px) minmax(200px,240px)`、gap `28px`；1279px及以下单阅读列。article 宽度100%、最大 `800px`、padding `36px 40px`，所以桌面正文可用宽度最大 `720px`；900px及以下 padding `32px`，手机 `28px 20px`、圆角 `20px`。正文段落与列表 `17px / 1.95`、手机 `16px / 1.95`；课名 `32px / 600 / 1.4`、手机 `27px / 1.45`；节标题 `24px` / 手机 `22px`，知识小标题 `19px`。来源链接保留辅助字号 `13px / 1.85`，不是所有辅助文字都增到16px。
- **信息与操作**：阶段/课名、原介绍、时间/自查状态之后，先呈现原“学完这一课，你能做什么”；侧栏改为本课导航、阶段位置与原挑战/等级/资料入口。首课实践、理论 details、所有知识段落、跟做、反馈、独立换题内容继续保留。示例使用浅灰 `#f5f5f7`、`16px` 圆角，代码 `14px / 1.9`，原复制按钮至少 `44px`；独立任务区域 `1px` line 边框、`20px` 圆角、padding `24px`（手机 `20px 16px`）。笔记/选择框字体 `16px / 1.8`、`12px` 圆角、最小高 `48px`。自查、笔记自动保存、完成记录、前后课与返回路线使用原功能；自查不构成能力认证。
- **边界与反馈**：欢迎游客仍直接进入 `#levels`，桌面与手机学习导航均等级第一、桌面第二。原课程 ID、正文、数据键、评估、提交反馈和进度含义不变；无账号、云同步或字体下载。沿用下述已有 `350 / 200 / 250 / 180 / 400ms` 动效及减少动态效果处理，不追加第二套入场。


## Do's and Don'ts

### Do:
- **Do** 在所有学习路由复用白导航、浅灰底、白内容面、系统字体与行动蓝。
- **Do** 保留可见键盘焦点、原生语义、真实当前导航与本地保存/导出说明。
- **Do** 用文字区分已回答、已提交、知识答对、自查完成与待核验。
- **Do** 保留课程、实操、独立换题、反馈及选修/拓展的原记录边界。

### Don't:
- **Don't** 恢复海军蓝侧栏或将已撤销的路由限制作为当前默认。
- **Don't** 把知识题成绩、自查、字段完整或文字方案表示为实操认证。
- **Don't** 添加账号、云同步、模型评分、外部字体或额外动效体系。
- **Don't** 用装饰卡片、游戏奖励或常驻阴影替代阅读与实际任务。

## 2026-10-23 品牌视觉整合

采用用户提供的 A 形蓝色渐变图标与独立圆点，图形从品牌参考 PNG 实际轮廓提取为平滑 SVG，保持相对位置、比例与渐变方向。`dist/assets/brand/ai-project-studio-icon.svg` 是图标唯一源；构建时内嵌到 favicon 和共享品牌标记，继续支持单文件离线打开。`ai-project-studio-lockup.svg` 是独立组合资源，中英文用可编辑网页文字排版，不声称识别或分发参考图原字体。来源与描摹误差见同目录 SOURCE_NOTES.md。

欢迎采用居中品牌构图：图标、AI Project Studio（Studio 为 #075bde 纯色）、中文名称、统一品牌口号和一条产品辅助说明。图标桌面 88×80px、手机 76×68px，以 contain 保持比例；文字独立于图形，可随屏幕排版。口号仅出现在欢迎页及学习桌面现有说明位置；课程页不新增宣传文案。

白侧栏采用 40×36px 图标、中文名称与小号英文名；移动菜单 30×28px 图标与中文名称。沿用原 232px 侧栏、全部导航与当前状态。品牌配色仅用于标记及英文 Studio，不改变语义状态色或全局操作蓝。

沿用既有首次路由 350ms 短距离入场，不叠加 Logo 独立动画；账号预览箭头仅 180ms 状态过渡，减少动态效果设置时关闭。320px 口号按短句换行，英文名保持完整一行；原课程阅读宽度与组件布局不变。
