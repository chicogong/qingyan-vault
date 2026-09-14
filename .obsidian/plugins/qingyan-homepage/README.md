# Qingyan Vault Homepage

`Qingyan Vault` 的第一方动态首页插件。界面组合了开源 Obsidian 项目中已经成熟的启动页模式，但代码、文案和视觉均为本项目重新实现：

- 借鉴 [StartPage](https://github.com/kuzzh/obsidian-startpage) 的紧凑启动入口，但把搜索降为导航，把有来源的 Agent 待审草稿放到首屏主位。
- 借鉴 [Dashboard++](https://github.com/TfTHacker/DashboardPlusPlus) 的低依赖分组，只保留搜索、收一条、写今天和知识总览四个稳定入口。
- 借鉴 [Hearth](https://github.com/ondreu/Hearth) 的“继续工作”语义，但不引入自由拖拽、天气、统计或插件集成墙。
- 延续 [Border](https://github.com/Akifyss/obsidian-border) 的克制应用外壳，不再叠加一套高装饰主题。
- Qingyan 自己的核心是“案头草稿”：AI 草稿明确显示参考来源、建议改动和“尚未写入正式知识”。
- “依据”和“边界”是可点击状态，不把 LLM Wiki 的来源与人工接纳只写成口号。
- 右栏先说明来源和接纳边界，主栏随后露出项目下一步与最近上下文；600px 以下按同一阅读顺序收为单栏。

这些项目提供设计参照，不代表 Qingyan 复制了其源代码、品牌资产或整套布局。

首页与内容在同一个可见工作面轮换：每个首页动作都复用发起动作的当前工作面，不会把文件误开到其他窗口或不断堆积标签。捕捉后会直接进入正文编辑位置；收件箱与项目任务会打开到可继续写作的位置；知识总览只覆盖知识生产目录。

插件只读取当前 Vault 的本地文件元数据与 Markdown；草稿摘要只解析本地 WikiLink 和 `suggested_changes` 属性。只有用户点击“收一条”时才会在 `收件箱/` 新建文件。它不联网、不读取凭据、不调用模型、不建立向量索引，也不发送遥测；“查看并决定”只打开草稿，不在首页直接接纳。

关闭插件后，`Home.md`、WikiLinks、Bases、Canvas 和全部 Markdown 仍可继续使用。

首次打开包含本插件的 Vault 时，Obsidian 会显示标准插件信任提示。只有从 `chicogong/qingyan-vault` 官方 Release 获取时才启用；否则先用安全模式检查 Markdown 内容。
