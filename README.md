# ORAN SIM 前端原型

本项目按目录中的 ORAN HUB / GEN / MED 与 gen1–4 截图还原公共网站外观，实现 ORAN SIM 的 Simulation Setup、Creator Matching、Simulation Running 与 Simulation Result。React + Vite，无后端、数据库、模型或外部 API。

## 本地运行

在已激活 `peileme` 的终端中：

```powershell
cd D:\oranai\sim\sim_frontend
npm.cmd install
npm.cmd run dev
```

浏览器打开终端显示的地址，默认 http://127.0.0.1:5173/#sim 。依赖已安装时无需再次 install。

如果编辑器选择了 peileme，但终端无法识别 node/npm，可仅为当前终端设置路径：

```powershell
$env:Path = 'D:\Anaconda\envs\peileme;' + $env:Path
npm.cmd run dev
```

`npm.cmd run build` 生成 dist；`npm.cmd run preview` 预览构建产物；`npm.cmd test` 构建后运行数据校验与 DOM 交互测试。

## 已实现

- 四个同级产品导航，SIM 为完整页面；HUB / GEN / MED 仅为明确标记的占位。
- 首屏只显示 Hub 导入、上传营销方案、直接粘贴/描述营销方案三个入口。点击描述入口才展开自然语言输入。
- 三个来源均经过可取消的 mock AI 解析动画，再在同页面展示结果确认态。
- 确认态以内容阅读为主，点击单项即可编辑；未知信息显示“待补充”，不展示整套空表单。
- Platform 支持多选，已选平台以标签展示；自然语言可同时识别多个平台，至少选择一个才能继续。
- Brief 明确区分“内容标题”和“素材内容概述”，空态提供具体填写指引，编辑时显示示例与说明。
- 自然语言采用简单关键词规则识别平台/市场及标记的品牌，保留原文作为背景，并生成两个明确标注的模拟 Brief 建议。
- Hub 项目弹窗、搜索、选择、导入；每个项目包含不同的平台、市场、产品和 Brief。
- PDF / DOCX / TXT 文件选择，类型/空文件/20 MB 校验，模拟上传与解析状态，可取消。
- 文件内容不会读取或传输；模拟解析使用“新婚家居”预设数据，界面明确说明。
- 导入后直接修改所有字段；已有内容会先弹窗确认替换。
- 多 Brief 添加、删除，至少保留一个；所有标题、描述及产品背景填写完整后 CTA 启用。
- CTA 进入 Creator Matching 双栏工作台，左侧约 25% 为 Brief 列表，右侧为当前 Brief 的达人候选。
- 自动模拟推荐加载，继承 Campaign 多平台并显示 tabs；Creator Type、Creator Tier、Vertical 三个独立筛选，默认按 Brief Match 排序。
- 达人卡片包含本地示意头像、账号、主页链接、粉丝数、分类、垂类、互动率、匹配度与适配原因。示例账号及指标均为虚构，主页未验证，链接可能不存在。
- 多选/取消选择无数量上限，跨 Brief 可重复选择；显示其他 Brief 使用提示。已选列表汇总当前 Brief 的所有平台。
- 手动添加支持完整主页 URL 或账号 ID，模拟解析并加入当前 Brief。校验 URL 格式、账号一致性及 Campaign 平台范围；重复账号不重复计数。
- 至少选择一位达人后可完成当前 Brief 并跳到下一未完成项。取消最后一位会撤回完成状态。
- 所有 Brief 均至少选择一位达人后，最终 CTA 进入同一双栏工作台中的 Simulation。Header、Sidebar 与左侧 Brief 区延续匹配阶段。
- 按 Simulation Context → 每个 Case 的 Natural Performance → Content × Creator Comparison → Audience Coverage → Expert Diagnosis → Simulation Summary → Report 顺序，每个任务使用 1.1 秒模拟异步生成。
- 左侧模块只在开始时出现，橙色为生成中，check 为已完成；点击模块跳转右侧。运行时默认跟随当前 Case，可暂停自动跟随以浏览其他结果。
- 漏斗显示触达/有效观看/互动/深度互动的区间及中位示意，附达人基线比较。支持左右箭头、方向键、横向滑动、底部 indicator 与左侧 Brief 过滤。
- 组合比较可切换触达、互动率、深度互动和相对基线，只生成实际选中的组合；点击表格或总结中的组合返回该 Case。
- 受众图谱按 Creator 去重，展示受众相似度、重叠和模拟增量覆盖；不是实际用户社交传播网络。
- 专家判断默认使用结构化结论，Agent 过程折叠。报告含全部 Case 与模块摘要；下载按钮仅显示生成成功提示，不创建 PDF。
- 返回编辑或切换页面时保留内容。刷新浏览器会重置，未实现持久化。
- 弹窗 Escape 关闭、焦点约束、键盘焦点样式及窄屏布局。

## 文件与组件

- `src/main.jsx`：Header、Sidebar、导航与占位页。
- `src/SimulationSetup.jsx`：渐进输入、模拟解析、结果确认、EditableValue 单项编辑。
- `src/HubImportModal.jsx`：Hub 搜索、选择与导入弹窗。
- `src/simulation.css`：仅作用于 SIM 中央卡片的渐进流程样式。
- `src/CreatorMatching.jsx`：CreatorMatching 工作台、BriefNavigator、CreatorCard、ManualCreatorModal。
- `src/creatorModel.js`：候选生成、账号校验、选择状态更新、Campaign 变更协调。
- `src/matching.css`：双栏工作台、达人卡片与响应式样式；复用现有基础控件与全局外观。
- `src/SimulationWorkspace.jsx`：SimulationWorkspace、SimulationProgress、ModuleCard、SimulationContext、NaturalPerformance、CombinationComparison、AudienceCoverage、ExpertDiagnosis、SimulationSummary、SimulationReport。
- `src/simulationModel.js`：选中组合、确定性模拟指标、任务顺序、进度状态和去重受众计算。
- `src/simulationWorkspace.css`：白色模拟工作区、橙色进度、漏斗、比较表、受众图谱和报告样式。
- `src/components.jsx`：Icon、Button、Field、Select、Modal 公共组件。
- `src/model.js`：mock 项目、导入转换与表单/文件校验。
- `src/styles.css`：全局视觉、布局、控件和响应式样式。
- `tests/model.test.js`：CTA 校验、导入数据隔离与上传文件限制测试。
- `tests/interaction.test.js`：导入、编辑、增删 Brief、导航保留、二次导入确认、模拟解析和取消上传测试。
- `tests/creatorModel.test.js`：推荐平台/排序、独立选择、跨 Brief 复用、Campaign 变更与手动添加校验。
- `tests/simulationModel.test.js`：Case 构建、区间/漏斗一致性、模块顺序、受众去重及会话标识。

## Creator Matching 状态

`App` 保存已确认的 `matchingCampaign` 快照及以 Brief ID 为键的 `matching` 状态。每项包含 `candidateCreators[]`、`selectedCreatorIds[]`、`completed`、`recommended` 和输入上下文标识。Creator ID 由平台与标准化账号组合，同一账号可被不同 Brief 引用，但选择数组相互独立。

返回 Setup 后再次确认时保留未变 Brief 的完整状态；如品牌/市场/平台/内容变化，重新推荐并撤回完成标记，保留仍属于 Campaign 平台的有效选择。被删除的 Brief 和被移除平台上的选择会移除。加载定时器在切换 Brief 或离开工作台时清理，避免将旧推荐写入另一 Brief。

匹配进度统计显式“完成当前 Brief”的数量；最终 CTA 根据每个 Brief 是否至少选择一位达人启用。

## Simulation 状态与数据

`SimulationWorkspace` 保存确定的 Campaign/已选 Creator 快照。任务列表为一个 Context 任务、每个已选 Case 一个 Performance 任务，以及后续五个整体模块任务。Reducer 中的 `cursor` 指向当前任务：之前为 Completed，当前为 Generating，之后不显示。Comparison 必须等待所有 Case 完成。

每个 Case 使用 `${briefId}::${creatorId}` 标识，包含 Brief 标题/描述/编号、Creator、reach/views/engagements/deep 的 `{ low, mid, high }` 区间、深度互动拆分、基线差值与专家判断。所有模块引用同一份确定性 mock 数据，避免比较表、漏斗与总结数值不一致。

`focusId` 管理正在查看的 Case，`filter` 管理左侧 Brief 筛选，`follow` 控制是否跟随生成任务。左侧导航与右侧模块都从同一 reducer 状态派生，已开始的模块通过 `simulation-{moduleId}` 定位、滚动并聚焦。自动跟随时同步滚动左侧焦点。

分析层级：Simulation Context 属于 Campaign 环境；仅 Natural Performance 按每个 Brief × Creator 单独预测。Content × Creator Comparison、Audience Coverage、Expert Diagnosis、Simulation Summary 和 Report 均为整个 Campaign 的联合分析，只生成一次，不随当前 Case 或 Brief 过滤改变。左侧单独列出“Campaign 整体分析”，不将这些模块挂在某个 Creator 下。

离开 Simulation 时清理当前计时器，返回后从原任务恢复；完成结果仍保存在内存中。Campaign/已选 Creator 改变会生成新会话标识并重置模拟；仅保存选择的完成标记不会触发重置。浏览器刷新后不保留会话。

目录原先没有 ORAN 源码，因此未复用原产品代码；以上公共组件均为参考截图新建。顶部账户功能、工具箱为视觉展示，未接入原网站服务。Logo 为 CSS 近似示意，正式接入时应替换为原品牌资产。

## 人工验收

1. 初始仅三个入口，没有结构化字段或匹配 CTA；提交描述后显示解析动画和结果。
2. 增加 Brief 后 CTA 再次禁用，补齐或删除该 Brief 后恢复。
3. Hub 弹窗支持搜索/选择；导入 Pentavite 后展示 4 个可编辑 Brief。
4. 当前有内容时再次导入，取消替换应保留原内容。
5. 上传有效文件，观察上传→解析→预设内容；取消上传不会导入。
6. 删除最后一个 Brief 的按钮禁用；无效文件显示错误。
7. CTA 进入匹配工作台，返回后内容保留；切换 HUB/GEN/MED 再返回 SIM 内容保留。
8. 在手机窄屏查看导航、卡片和弹窗，在键盘下使用 Tab / Escape。
9. 输入未指定平台/市场/品牌的描述，结果显示“待补充”；点击逐项补充后 CTA 启用。
10. 导入 Bluetti，确认内容后观察推荐加载、独立筛选、选择/取消和完成后的自动切换。
11. 在 Setup 选择 TikTok + YouTube，确认工作台只出现这两个平台，切换 tabs 保留已选。
12. 在不同 Brief 选择同一账号，确认有复用提示但不受限制；查看已选列表并取消最后一位，完成状态应撤回。
13. 手动输入 `https://www.tiktok.com/@demo_creator`，解析后加入当前 Brief；同账号再次添加不重复计数。
14. 所有 Brief 都有选择后，点击最终 CTA：初始只能看到 Context 生成态；每个 Case 依次完成后才开始比较，后续模块逐个出现。
15. 使用箭头、触摸滑动、indicator 切换 Case，验证漏斗与 baseline 更新；点击左侧 Brief 验证过滤，点击已完成模块验证跳转。
16. 切换比较指标，点击一个单元格返回对应 Case；查看受众选择器、单 Creator 场景、折叠 Agent 过程及报告摘要。
17. 点击下载显示“Simulation Report 已生成”提示；返回匹配再进入时保留进度，改变达人选择后重新生成。
