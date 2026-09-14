const { ItemView, MarkdownView, Notice, Plugin, TFile, setIcon } = require("obsidian");

const VIEW_TYPE = "qingyan-homepage";
const PRODUCT_NAME = "Qingyan Vault";
const CONTENT_PREFIXES = [
  "收件箱/",
  "来源/",
  "知识/",
  "项目/",
  "知识地图/",
  "回顾/",
];

function isKnowledgeFile(file) {
  return file instanceof TFile
    && file.extension === "md"
    && file.basename !== "README"
    && CONTENT_PREFIXES.some((prefix) => file.path.startsWith(prefix));
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function relativeTime(timestamp) {
  const elapsed = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (elapsed < minute) return "刚刚";
  if (elapsed < hour) return `${Math.floor(elapsed / minute)} 分钟前`;
  if (elapsed < day) return `${Math.floor(elapsed / hour)} 小时前`;
  if (elapsed < 7 * day) return `${Math.floor(elapsed / day)} 天前`;
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" })
    .format(new Date(timestamp));
}

function cleanTaskText(text) {
  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\*\*|__|`/g, "")
    .trim();
}

function createIcon(parent, iconName) {
  const icon = parent.createSpan({ cls: "qy-dashboard-icon" });
  setIcon(icon, iconName);
  return icon;
}

class QingyanHomepageView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.refreshTimer = null;
    this.hasRendered = false;
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return PRODUCT_NAME;
  }

  getIcon() {
    return "book-open";
  }

  async onOpen() {
    await this.render();
  }

  async onClose() {
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
  }

  scheduleRefresh() {
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => this.render(), 180);
  }

  async render() {
    const root = this.contentEl;
    const shouldResetScroll = !this.hasRendered;
    this.hasRendered = true;
    root.empty();
    root.addClass("qy-dashboard");

    const markdownFiles = this.app.vault.getMarkdownFiles();
    const files = markdownFiles.filter(isKnowledgeFile);
    const sourceFiles = markdownFiles
      .filter((file) => file.path.startsWith("来源/") && file.basename !== "README")
      .sort((a, b) => b.stat.mtime - a.stat.mtime);
    const draftFiles = markdownFiles
      .filter((file) => file.path.startsWith("Agent/草稿/") && file.basename !== "README")
      .sort((a, b) => b.stat.mtime - a.stat.mtime);
    const draftSummaries = await Promise.all(draftFiles.map((file) => this.summarizeDraft(file)));
    const recent = [...files]
      .sort((a, b) => b.stat.mtime - a.stat.mtime)
      .slice(0, 6);
    const inboxFiles = files
      .filter((file) => file.path.startsWith("收件箱/"))
      .sort((a, b) => b.stat.mtime - a.stat.mtime)
      .slice(0, 5);
    const projectTasks = await this.collectProjectTasks();

    this.renderHeader(root);

    const desk = root.createDiv({ cls: "qy-desk-grid" });
    const primary = desk.createDiv({ cls: "qy-desk-primary" });
    const secondary = desk.createEl("aside", { cls: "qy-desk-aside" });
    this.renderReviewDesk(primary, draftSummaries);
    this.renderResumeDesk(primary, recent, projectTasks);
    this.renderEvidenceDesk(secondary, sourceFiles, draftSummaries);
    this.renderKnowledgeCurrent(secondary, files, inboxFiles, sourceFiles, projectTasks);

    const footer = root.createDiv({ cls: "qy-dashboard-footer" });
    footer.createSpan({ text: "本地 Markdown" });
    footer.createSpan({ text: "·" });
    footer.createSpan({ text: "无网络调用" });
    footer.createSpan({ text: "·" });
    footer.createSpan({ text: "由人决定" });

    if (shouldResetScroll) {
      window.requestAnimationFrame(() => {
        root.scrollTop = 0;
      });
    }
  }

  renderHeader(root) {
    const header = root.createEl("header", { cls: "qy-dashboard-header qy-brand-row" });
    const brand = header.createDiv({ cls: "qy-brand" });
    const brandText = brand.createDiv();
    brandText.createEl("strong", { text: "Qingyan Vault" });
    brandText.createSpan({ text: "青砚 · Agent-native 知识案台" });

    const nav = header.createEl("nav", { cls: "qy-nav", attr: { "aria-label": "首页操作" } });
    this.createNavAction(nav, "搜索", "⌘ K", () => this.plugin.openSearch());
    this.createNavAction(nav, "收一条", "", () => this.plugin.captureNote(this.leaf));
    this.createNavAction(nav, "写今天", "", () => this.plugin.openDailyNote(this.leaf));
    this.createNavAction(nav, "知识总览", "", () => this.plugin.openKnowledgeBase(this.leaf));
  }

  createNavAction(parent, title, shortcut, handler) {
    const button = parent.createEl("button", {
      cls: "qy-nav-item",
      attr: { type: "button", "aria-label": shortcut ? `${title} ${shortcut}` : title },
    });
    button.createSpan({ text: title });
    if (shortcut) button.createEl("kbd", { text: shortcut });
    button.addEventListener("click", handler);
  }

  renderResumeDesk(parent, recent, tasks) {
    const panel = parent.createEl("section", { cls: "qy-resume-desk" });
    this.createEditorialHeading(panel, "继续工作", "Recent context");

    const list = panel.createDiv({ cls: "qy-resume-list" });
    tasks.slice(0, 2).forEach((task) => {
      this.createResumeRow(list, "下一步", task.text, task.file.basename, () => {
        this.plugin.openFileWithOptions(task.file, { mode: "source", line: task.line, ch: task.ch }, this.leaf);
      });
    });
    recent.slice(0, 3).forEach((file) => {
      this.createResumeRow(
        list,
        "最近修改",
        file.basename,
        `${file.parent?.path || "Vault"} · ${relativeTime(file.stat.mtime)}`,
        () => this.plugin.openFileWithOptions(file, {}, this.leaf),
      );
    });
    if (!tasks.length && !recent.length) {
      this.createResumeRow(list, "从这里开始", "写下今天要推进的一件事", "每日记录", () => {
        this.plugin.openDailyNote(this.leaf);
      });
    }
  }

  createResumeRow(parent, label, title, meta, handler) {
    const button = parent.createEl("button", {
      cls: "qy-resume-row",
      attr: { type: "button", "aria-label": `${label}：${title}` },
    });
    const copy = button.createDiv();
    copy.createSpan({ cls: "qy-resume-label", text: label });
    copy.createEl("strong", { text: title });
    copy.createSpan({ text: meta });
    createIcon(button, "arrow-up-right");
    button.addEventListener("click", handler);
  }

  renderReviewDesk(parent, draftSummaries) {
    if (!draftSummaries.length) return;
    const review = parent.createEl("section", { cls: "qy-review-desk" });
    const heading = this.createEditorialHeading(review, "案头草稿", "Agent drafts");
    heading.createSpan({ cls: "qy-count-badge", text: `${draftSummaries.length} 待审核` });

    draftSummaries.slice(0, 3).forEach((draft, index) => this.createDraftSheet(review, draft, index));
  }

  createDraftSheet(parent, draft, index) {
    const article = parent.createEl("article", { cls: "qy-draft-sheet" });
    article.createSpan({ cls: "qy-draft-index", text: String(index + 1).padStart(2, "0") });
    const copy = article.createDiv({ cls: "qy-draft-copy" });
    copy.createEl("h3", { text: draft.file.basename.replace(/\s*[—-]\s*AI 草稿$/, "") });
    copy.createEl("p", { text: draft.excerpt || "打开草稿，回读来源与建议改动后再决定是否接纳。" });
    const meta = copy.createDiv({ cls: "qy-draft-meta" });
    meta.createSpan({ text: draft.sourceLabel ? `来源 · ${draft.sourceLabel}` : `来源 · ${draft.sourceCount} 条引用` });
    meta.createSpan({ text: draft.changeCount ? `${draft.changeCount} 处建议改动` : "改动待查看" });
    const actions = copy.createDiv({ cls: "qy-draft-actions" });
    const review = actions.createEl("button", {
      cls: "qy-text-action is-primary",
      attr: { type: "button", "aria-label": `查看并决定 ${draft.file.basename}` },
    });
    review.createSpan({ text: "查看与接纳" });
    createIcon(review, "arrow-right");
    review.addEventListener("click", () => this.plugin.openFileWithOptions(draft.file, {}, this.leaf));
    const edit = actions.createEl("button", {
      cls: "qy-text-action",
      attr: { type: "button", "aria-label": `编辑草稿 ${draft.file.basename}` },
    });
    edit.createSpan({ text: "编辑草稿" });
    edit.addEventListener("click", () => this.plugin.openFileWithOptions(draft.file, { mode: "source" }, this.leaf));
  }

  renderEvidenceDesk(parent, sourceFiles, draftSummaries) {
    const section = parent.createEl("section", { cls: "qy-evidence-desk" });
    this.createEditorialHeading(section, "来源与边界", "Evidence ledger");
    const list = section.createDiv({ cls: "qy-evidence-list" });
    sourceFiles.slice(0, 3).forEach((file) => {
      const button = list.createEl("button", {
        cls: "qy-evidence-row",
        attr: { type: "button", "aria-label": `打开来源 ${file.basename}` },
      });
      const copy = button.createDiv();
      copy.createEl("strong", { text: file.basename });
      copy.createSpan({ text: relativeTime(file.stat.mtime) });
      createIcon(button, "arrow-up-right");
      button.addEventListener("click", () => this.plugin.openFileWithOptions(file, {}, this.leaf));
    });
    if (!sourceFiles.length) this.renderEmpty(list, "还没有可回读的来源。 ");

    const boundary = section.createEl("button", {
      cls: "qy-boundary-note",
      attr: { type: "button", "aria-label": "打开严格审核说明" },
    });
    boundary.createSpan({ cls: "qy-boundary-label", text: "接纳边界" });
    boundary.createSpan({ text: draftSummaries.length ? `${draftSummaries.length} 份草稿仍与正式知识隔离` : "正式知识未被 Agent 静默覆盖" });
    boundary.addEventListener("click", () => {
      const file = this.app.vault.getAbstractFileByPath("指南/严格审核.md");
      if (file instanceof TFile) this.plugin.openFileWithOptions(file, {}, this.leaf);
    });
  }

  createEditorialHeading(parent, title, eyebrow) {
    const heading = parent.createDiv({ cls: "qy-editorial-heading" });
    const copy = heading.createDiv();
    copy.createEl("h2", { text: title });
    copy.createSpan({ text: eyebrow });
    return heading;
  }

  renderKnowledgeCurrent(root, files, inboxFiles, sourceFiles, projectTasks) {
    const current = root.createDiv({ cls: "qy-knowledge-current" });
    current.createSpan({ cls: "qy-current-label", text: "从线索到接纳" });
    this.createCurrentStep(current, "01 捕捉", `${inboxFiles.length} 条待整理`);
    this.createCurrentStep(current, "02 来源", `${sourceFiles.length} 份来路`);
    this.createCurrentStep(current, "03 判断", `${files.length} 条可用内容`);
    this.createCurrentStep(current, "04 行动", `${projectTasks.length} 个下一步`);
  }

  createCurrentStep(parent, label, value) {
    const step = parent.createDiv({ cls: "qy-current-step" });
    step.createEl("strong", { text: label });
    step.createSpan({ text: value });
  }

  renderEmpty(parent, text) {
    const empty = parent.createDiv({ cls: "qy-dashboard-empty" });
    createIcon(empty, "circle-dashed");
    empty.createSpan({ text });
  }

  async summarizeDraft(file) {
    const content = await this.app.vault.cachedRead(file);
    const sourceLinks = [...content.matchAll(/\[\[(来源\/[^\]|]+)(?:\|([^\]]+))?\]\]/g)];
    const sourcePaths = new Set(sourceLinks.map((match) => match[1]));
    const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter || {};
    const parsedChanges = Number(frontmatter.suggested_changes || frontmatter.suggestedChanges || 0);
    const excerpt = content
      .replace(/^---[\s\S]*?---\s*/m, "")
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line
        && !line.startsWith("#")
        && !line.startsWith("-")
        && !line.startsWith(">")
        && !line.startsWith("[["));
    return {
      file,
      sourceCount: sourcePaths.size,
      sourceLabel: sourceLinks[0]?.[2] || sourceLinks[0]?.[1]?.replace(/^来源\//, "") || "",
      changeCount: Number.isFinite(parsedChanges) ? parsedChanges : 0,
      excerpt: excerpt ? cleanTaskText(excerpt).slice(0, 168) : "",
    };
  }

  async collectProjectTasks() {
    const projects = this.app.vault.getMarkdownFiles()
      .filter((file) => file.path.startsWith("项目/"))
      .sort((a, b) => b.stat.mtime - a.stat.mtime);
    const collected = [];
    for (const file of projects) {
      const content = await this.app.vault.cachedRead(file);
      const matcher = /^\s*-\s*\[ \]\s+(.+)$/gm;
      let match;
      while ((match = matcher.exec(content)) !== null) {
        collected.push({
          file,
          text: cleanTaskText(match[1]),
          line: content.slice(0, match.index).split("\n").length - 1,
          ch: Math.max(0, match[0].indexOf(match[1])),
        });
      }
    }
    return collected;
  }
}

class QingyanHomepagePlugin extends Plugin {
  async onload() {
    this.registerView(VIEW_TYPE, (leaf) => new QingyanHomepageView(leaf, this));

    this.addRibbonIcon("book-open", `打开 ${PRODUCT_NAME}`, () => this.activateHomepage());
    this.addCommand({
      id: "open-qingyan-vault-homepage",
      name: `打开 ${PRODUCT_NAME} 动态首页`,
      callback: () => this.activateHomepage(),
    });
    this.addCommand({
      id: "open-qingyan-vault-fallback-home",
      name: "打开静态 Home.md",
      callback: () => this.openStaticHome(),
    });

    ["create", "delete", "modify", "rename"].forEach((eventName) => {
      this.registerEvent(this.app.vault.on(eventName, () => this.refreshViews()));
    });

    this.app.workspace.onLayoutReady(() => {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile?.path === "Home.md") {
        window.setTimeout(() => this.activateHomepage(), 120);
      }
    });
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  refreshViews() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
      leaf.view?.scheduleRefresh?.();
    });
  }

  async activateHomepage() {
    const leaf = this.getContentLeaf();
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((candidate) => {
      if (candidate !== leaf) candidate.detach();
    });
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    await this.app.workspace.revealLeaf(leaf);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
  }

  async openFile(file) {
    return this.openFileWithOptions(file);
  }

  getContentLeaf() {
    const { workspace } = this.app;
    const recentLeaf = workspace.getMostRecentLeaf(workspace.rootSplit);
    if (recentLeaf?.view?.containerEl?.isShown?.()) return recentLeaf;
    let visibleLeaf = null;
    workspace.iterateRootLeaves((candidate) => {
      if (candidate.view?.containerEl?.isShown?.()) visibleLeaf = candidate;
    });
    if (visibleLeaf) return visibleLeaf;
    return recentLeaf || workspace.getLeaf(false);
  }

  async openFileWithOptions(file, options = {}, sourceLeaf = null) {
    if (!(file instanceof TFile)) return;
    const leaf = sourceLeaf || this.getContentLeaf();
    const mode = options.mode || "preview";

    if (file.extension === "md") {
      await leaf.setViewState({
        type: "markdown",
        state: { file: file.path, mode, source: false },
        active: true,
      });
    } else {
      await leaf.openFile(file, { active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });

    if (mode !== "source" || !(leaf.view instanceof MarkdownView)) return;
    const editor = leaf.view.editor;
    const lastLine = Math.max(0, editor.lineCount() - 1);
    const line = options.atEnd
      ? lastLine
      : Math.min(Math.max(0, options.line || 0), lastLine);
    const ch = options.atEnd
      ? editor.getLine(line).length
      : Math.min(Math.max(0, options.ch || 0), editor.getLine(line).length);
    const cursor = { line, ch };
    const focusEditor = () => {
      if (leaf.view instanceof MarkdownView && leaf.view.editor === editor) {
        editor.setCursor(cursor);
        editor.scrollIntoView({ from: cursor, to: cursor }, true);
        editor.focus();
      }
    };
    focusEditor();
    window.setTimeout(focusEditor, 120);
  }

  async openStaticHome() {
    const file = this.app.vault.getAbstractFileByPath("Home.md");
    if (file instanceof TFile) await this.openFile(file);
  }

  async openKnowledgeBase(sourceLeaf = null) {
    const file = this.app.vault.getAbstractFileByPath("知识总览.base");
    if (file instanceof TFile) {
      await this.openFileWithOptions(file, {}, sourceLeaf);
    } else {
      new Notice("没有找到知识总览.base");
    }
  }

  openSearch() {
    this.app.commands.executeCommandById("global-search:open");
  }

  async openDailyNote(sourceLeaf = null) {
    const folder = "回顾/每日";
    const date = localDateKey(new Date());
    if (!this.app.vault.getAbstractFileByPath(folder)) {
      await this.app.vault.createFolder(folder);
    }
    let file = this.app.vault.getAbstractFileByPath(`${folder}/${date}.md`);
    if (!(file instanceof TFile)) {
      const template = this.app.vault.getAbstractFileByPath("模板/每日笔记.md");
      const source = template instanceof TFile
        ? await this.app.vault.cachedRead(template)
        : `# ${date}\n\n## 今天\n\n- [ ] 今天只推进：\n`;
      file = await this.app.vault.create(`${folder}/${date}.md`, source.replaceAll("{{date}}", date));
    }
    await this.openFileWithOptions(file, { mode: "source" }, sourceLeaf);
  }

  async captureNote(sourceLeaf = null) {
    const folder = "收件箱";
    if (!this.app.vault.getAbstractFileByPath(folder)) {
      await this.app.vault.createFolder(folder);
    }
    const now = new Date();
    const date = localDateKey(now);
    const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    let path = `${folder}/${date} ${time} — 新线索.md`;
    let suffix = 2;
    while (this.app.vault.getAbstractFileByPath(path)) {
      path = `${folder}/${date} ${time} — 新线索 ${suffix}.md`;
      suffix += 1;
    }
    const content = `---\ntype: inbox\nstatus: raw\ncreated: ${date}\ntags:\n  - inbox\n---\n\n# 新线索\n\n`;
    const file = await this.app.vault.create(path, content);
    await this.openFileWithOptions(file, {
      mode: "source",
      line: content.split("\n").length - 2,
      ch: 0,
    }, sourceLeaf);
    new Notice("已新建线索，可以直接输入");
  }
}

module.exports = QingyanHomepagePlugin;
