const { ItemView, MarkdownView, Notice, Plugin, TFile, setIcon } = require("obsidian");

const VIEW_TYPE = "qingyan-homepage";
const PRODUCT_NAME = "Qingyan Vault";
const CONTENT_PREFIXES = [
  "Inbox/",
  "Sources/",
  "Notes/",
  "Projects/",
  "MOCs/",
  "Review/",
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

function formatClock(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function greetingFor(date) {
  const hour = date.getHours();
  if (hour < 6) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
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
    this.clockTimer = null;
    this.refreshTimer = null;
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return PRODUCT_NAME;
  }

  getIcon() {
    return "layout-dashboard";
  }

  async onOpen() {
    await this.render();
    this.clockTimer = window.setInterval(() => this.updateClock(), 30 * 1000);
  }

  async onClose() {
    if (this.clockTimer) window.clearInterval(this.clockTimer);
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
  }

  scheduleRefresh() {
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => this.render(), 180);
  }

  updateClock() {
    const now = new Date();
    this.contentEl.querySelectorAll("[data-qy-clock]").forEach((element) => {
      element.setText(formatClock(now));
    });
    this.contentEl.querySelectorAll("[data-qy-date]").forEach((element) => {
      element.setText(formatDate(now));
    });
  }

  async render() {
    const root = this.contentEl;
    root.empty();
    root.addClass("qy-dashboard");

    const files = this.app.vault.getMarkdownFiles().filter(isKnowledgeFile);
    const recent = [...files]
      .sort((a, b) => b.stat.mtime - a.stat.mtime)
      .slice(0, 6);
    const inboxFiles = files
      .filter((file) => file.path.startsWith("Inbox/"))
      .sort((a, b) => b.stat.mtime - a.stat.mtime)
      .slice(0, 5);
    const revisit = files
      .filter((file) => file.path.startsWith("Notes/") || file.path.startsWith("Sources/"))
      .sort((a, b) => a.stat.mtime - b.stat.mtime)
      .slice(0, 3);
    const projectTasks = await this.collectProjectTasks();

    this.renderHeader(root);
    this.renderHero(root, files, inboxFiles, projectTasks);
    this.renderKnowledgeCurrent(root, files, inboxFiles, projectTasks);

    const workbench = root.createDiv({ cls: "qy-dashboard-grid qy-dashboard-workbench" });
    const primary = workbench.createDiv({ cls: "qy-dashboard-column qy-dashboard-primary" });
    const secondary = workbench.createDiv({ cls: "qy-dashboard-column qy-dashboard-secondary" });

    this.renderTaskSection(primary, projectTasks);
    this.renderFileSection(secondary, "最近痕迹", "刚刚发生过的编辑", recent, "history");

    const library = root.createDiv({ cls: "qy-dashboard-grid qy-dashboard-library" });
    const inbox = library.createDiv({ cls: "qy-dashboard-column" });
    const resurfacing = library.createDiv({ cls: "qy-dashboard-column" });
    this.renderFileSection(inbox, "Inbox", "尚未决定去向", inboxFiles, "inbox");
    this.renderFileSection(resurfacing, "重新遇见", "让旧知识回到眼前", revisit, "sparkles");

    const footer = root.createDiv({ cls: "qy-dashboard-footer" });
    footer.createSpan({ text: "LOCAL MARKDOWN" });
    footer.createSpan({ text: "·" });
    footer.createSpan({ text: "NO NETWORK" });
    footer.createSpan({ text: "·" });
    footer.createSpan({ text: "HUMAN DECIDES" });
  }

  renderHeader(root) {
    const now = new Date();
    const header = root.createEl("header", { cls: "qy-dashboard-header qy-brand-row" });
    const brand = header.createDiv({ cls: "qy-brand" });
    brand.createSpan({ cls: "qy-brand-mark", text: "砚" });
    const brandText = brand.createDiv();
    brandText.createEl("strong", { text: PRODUCT_NAME });
    brandText.createSpan({ text: "Agent-native Obsidian Vault" });

    const time = header.createDiv({ cls: "qy-dashboard-time" });
    time.createEl("strong", { text: formatClock(now), attr: { "data-qy-clock": "" } });
    time.createSpan({ text: formatDate(now), attr: { "data-qy-date": "" } });
  }

  renderHero(root, files, inboxFiles, projectTasks) {
    const hero = root.createEl("section", { cls: "qy-dashboard-hero" });
    const copy = hero.createDiv({ cls: "qy-hero-copy" });
    const now = new Date();
    copy.createSpan({ cls: "qy-hero-greeting", text: greetingFor(now) });
    const title = copy.createEl("h1");
    title.createSpan({ text: "把一条线索，" });
    title.createSpan({ text: "推进到能再次使用。" });
    copy.createEl("p", {
      text: "先留下，再辨认，最后让它回到正在发生的事情里。",
    });

    const actions = copy.createDiv({ cls: "qy-quick-actions" });
    this.createAction(actions, "收", "捕捉线索", "写入 Inbox", () => this.plugin.captureNote());
    this.createAction(actions, "写", "写今天", "打开每日笔记", () => this.plugin.openDailyNote());
    this.createAction(actions, "看", "知识总览", "打开 Bases", () => this.plugin.openKnowledgeBase());
    this.createAction(actions, "找", "搜索", "查找全部笔记", () => this.plugin.openSearch());

    const manifesto = hero.createDiv({ cls: "qy-hero-manifesto" });
    manifesto.createSpan({ cls: "qy-manifesto-kicker", text: "QINGYAN METHOD" });
    manifesto.createEl("p", { text: "人决定什么值得留下。" });
    manifesto.createEl("p", { text: "Agent 帮你整理来路。" });
    const seal = manifesto.createDiv({ cls: "qy-manifesto-seal", text: "本地" });
    seal.setAttr("aria-label", "本地 Markdown");

    const pulse = manifesto.createDiv({ cls: "qy-manifesto-pulse" });
    pulse.createSpan({ text: `${files.length} 条知识` });
    pulse.createSpan({ text: `${inboxFiles.length} 条待整理` });
    pulse.createSpan({ text: `${projectTasks.length} 个下一步` });
  }

  createAction(parent, glyph, label, caption, handler) {
    const button = parent.createEl("button", {
      cls: "qy-quick-action",
      attr: { type: "button", "aria-label": `${label}：${caption}` },
    });
    button.createSpan({ cls: "qy-action-glyph", text: glyph });
    const copy = button.createDiv();
    copy.createEl("strong", { text: label });
    copy.createSpan({ text: caption });
    button.addEventListener("click", handler);
  }

  renderKnowledgeCurrent(root, files, inboxFiles, projectTasks) {
    const current = root.createDiv({ cls: "qy-knowledge-current" });
    current.createSpan({ cls: "qy-current-label", text: "知识水路" });
    this.createCurrentStep(current, "收进来", `${inboxFiles.length} 条待整理`);
    this.createCurrentStep(current, "想清楚", `${files.length} 条可用知识`);
    this.createCurrentStep(current, "用起来", `${projectTasks.length} 个下一步`);
  }

  createCurrentStep(parent, label, value) {
    const step = parent.createDiv({ cls: "qy-current-step" });
    step.createEl("strong", { text: label });
    step.createSpan({ text: value });
  }

  createSection(parent, title, caption, iconName) {
    const section = parent.createEl("section", { cls: "qy-dashboard-section" });
    const heading = section.createDiv({ cls: "qy-section-heading" });
    createIcon(heading, iconName);
    const copy = heading.createDiv();
    copy.createEl("h2", { text: title });
    copy.createEl("p", { text: caption });
    return section;
  }

  renderFileSection(parent, title, caption, files, iconName) {
    const section = this.createSection(parent, title, caption, iconName);
    const list = section.createDiv({ cls: "qy-file-list" });
    if (!files.length) {
      this.renderEmpty(list, title === "Inbox" ? "Inbox 现在是空的。" : "还没有可显示的内容。");
      return;
    }
    files.forEach((file) => {
      const button = list.createEl("button", {
        cls: "qy-file-row",
        attr: { type: "button", "aria-label": `打开 ${file.basename}` },
      });
      const copy = button.createDiv();
      copy.createEl("strong", { text: file.basename });
      copy.createSpan({ text: file.parent?.path || "Vault" });
      button.createSpan({ cls: "qy-file-time", text: relativeTime(file.stat.mtime) });
      createIcon(button, "arrow-up-right");
      button.addEventListener("click", () => {
        if (title === "Inbox") {
          this.plugin.openFileWithOptions(file, { mode: "source", atEnd: true });
        } else {
          this.plugin.openFileWithOptions(file);
        }
      });
    });
  }

  renderTaskSection(parent, tasks) {
    const section = this.createSection(parent, "项目下一步", "只显示尚未完成的动作", "circle-check-big");
    const list = section.createDiv({ cls: "qy-task-list" });
    if (!tasks.length) {
      this.renderEmpty(list, "当前项目没有未完成动作。");
      return;
    }
    tasks.slice(0, 5).forEach((task) => {
      const button = list.createEl("button", {
        cls: "qy-task-row",
        attr: { type: "button", "aria-label": `打开项目 ${task.file.basename}` },
      });
      button.createSpan({ cls: "qy-task-check", text: "○" });
      const copy = button.createDiv();
      copy.createEl("strong", { text: task.text });
      copy.createSpan({ text: task.file.basename });
      button.addEventListener("click", () => this.plugin.openFileWithOptions(task.file, {
        mode: "source",
        line: task.line,
        ch: task.ch,
      }));
    });
  }

  renderEmpty(parent, text) {
    const empty = parent.createDiv({ cls: "qy-dashboard-empty" });
    createIcon(empty, "circle-dashed");
    empty.createSpan({ text });
  }

  async collectProjectTasks() {
    const projects = this.app.vault.getMarkdownFiles()
      .filter((file) => file.path.startsWith("Projects/"))
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
    this.contentLeaf = null;
    this.registerView(VIEW_TYPE, (leaf) => new QingyanHomepageView(leaf, this));

    this.addRibbonIcon("layout-dashboard", `打开 ${PRODUCT_NAME}`, () => this.activateHomepage());
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
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
      return;
    }
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }

  async openFile(file) {
    return this.openFileWithOptions(file);
  }

  getContentLeaf() {
    if (!this.contentLeaf?.parent) {
      this.contentLeaf = this.app.workspace.getLeaf("tab");
    }
    return this.contentLeaf;
  }

  async openFileWithOptions(file, options = {}) {
    if (!(file instanceof TFile)) return;
    const leaf = this.getContentLeaf();
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

  async openKnowledgeBase() {
    const file = this.app.vault.getAbstractFileByPath("知识总览.base");
    if (file instanceof TFile) {
      await this.openFileWithOptions(file);
    } else {
      new Notice("没有找到知识总览.base");
    }
  }

  openSearch() {
    this.app.commands.executeCommandById("global-search:open");
  }

  async openDailyNote() {
    const leaf = this.getContentLeaf();
    await this.app.workspace.revealLeaf(leaf);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    const executed = this.app.commands.executeCommandById("daily-notes");
    if (!executed) new Notice("日记核心插件尚未启用");
    this.contentLeaf = this.app.workspace.activeLeaf || leaf;
  }

  async captureNote() {
    const folder = "Inbox";
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
    });
    new Notice("已新建线索，可以直接输入");
  }
}

module.exports = QingyanHomepagePlugin;
