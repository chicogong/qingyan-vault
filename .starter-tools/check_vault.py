#!/usr/bin/env python3
"""Portable, read-only validation for the synthetic Qingyan Vault."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Optional
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parent.parent

REQUIRED_DIRS = [
    "收件箱",
    "来源",
    "知识",
    "项目",
    "知识地图",
    "回顾",
    "归档",
    "模板",
    "白板",
    "附件",
    "指南",
    "Agent/草稿",
    "Agent/交接",
    "Agent/反馈",
    "docs",
    ".github/assets",
    ".obsidian/plugins/qingyan-homepage",
]

REQUIRED_FILES = [
    "Home.md",
    "开始使用.md",
    "README.md",
    "README.en.md",
    "AGENTS.md",
    "CLAUDE.md",
    "ROADMAP.md",
    "CHANGELOG.md",
    "VERSION",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md",
    "指南/用户使用手册.md",
    "指南/Agent 使用手册.md",
    "指南/严格审核.md",
    "指南/插件与主题.md",
    "指南/案例与设计取舍.md",
    "指南/把它变成你的.md",
    "Agent/README.md",
    "回顾/每日与每周节奏.md",
    "docs/PRODUCT.md",
    "docs/RESEARCH.md",
    "docs/OPEN_SOURCE_PLAN.md",
    "白板/夜航花园地图.canvas",
    "知识总览.base",
    ".obsidian/app.json",
    ".obsidian/appearance.json",
    ".obsidian/core-plugins.json",
    ".obsidian/community-plugins.json",
    ".obsidian/plugins/qingyan-homepage/manifest.json",
    ".obsidian/plugins/qingyan-homepage/main.js",
    ".obsidian/plugins/qingyan-homepage/styles.css",
    ".obsidian/plugins/qingyan-homepage/README.md",
    ".obsidian/plugins/qingyan-homepage/LICENSE",
    ".obsidian/snippets/qingyan-vault.css",
    ".obsidian/themes/Border/theme.css",
    ".obsidian/themes/Border/manifest.json",
    ".obsidian/themes/Border/LICENSE",
    "THIRD_PARTY_NOTICES.md",
    ".obsidian/workspace.json",
    ".github/assets/home-light.png",
    ".github/assets/home-dark.png",
    ".github/assets/home-narrow.png",
    ".github/assets/workspace-shelf.png",
    ".github/assets/capture-flow.png",
    ".github/assets/knowledge-base.png",
    ".github/assets/qingyan-vault-lockup.svg",
]

REQUIRED_CORE_PLUGINS = {
    "global-search",
    "backlink",
    "bases",
    "templates",
    "daily-notes",
    "canvas",
    "bookmarks",
    "file-recovery",
}

DISABLED_CORE_PLUGINS = {"sync", "publish", "webviewer"}

FORBIDDEN_MARKERS = [
    "/Users/",
    "/home/",
    "C:\\Users\\",
    "haorangong",
    "BEGIN PRIVATE KEY",
    "BEGIN OPENSSH PRIVATE KEY",
]

INTENTIONAL_UNRESOLVED_LINKS: set[str] = set()
TEXT_SUFFIXES = {".md", ".json", ".canvas", ".base", ".css", ".js"}
IGNORED_PARTS = {".git", "dist", "__pycache__"}
SECRET_PATTERN = re.compile(
    r"(?i)\b(api[_-]?key|access[_-]?token|client[_-]?secret|password)"
    r"\s*[:=]\s*[\"']?[A-Za-z0-9_./+\-]{12,}"
)


def fail(message: str, failures: list[str]) -> None:
    failures.append(message)
    print(f"FAIL  {message}")


def passed(message: str) -> None:
    print(f"PASS  {message}")


def content_files() -> list[Path]:
    return [
        path
        for path in ROOT.rglob("*")
        if path.is_file()
        and path.suffix in TEXT_SUFFIXES
        and ".starter-tools" not in path.parts
        and not IGNORED_PARTS.intersection(path.relative_to(ROOT).parts)
    ]


def resolve_wikilink(target: str, markdown_files: list[Path]) -> bool:
    # Markdown tables escape the wikilink label separator as `\|`, while
    # Obsidian still interprets it as the normal `|` separator.
    target = target.replace("\\|", "|").split("|", 1)[0].split("#", 1)[0].strip()
    if not target or target in INTENTIONAL_UNRESOLVED_LINKS:
        return True
    candidate = ROOT / target
    if candidate.suffix:
        return candidate.exists()
    if candidate.with_suffix(".md").exists() or candidate.with_suffix(".canvas").exists():
        return True
    return any(path.stem == Path(target).name for path in markdown_files)


def find_leaf(node: object, leaf_id: str) -> Optional[dict[str, object]]:
    """Find one leaf by id within a workspace subtree."""
    if not isinstance(node, dict):
        return None
    if node.get("type") == "leaf" and node.get("id") == leaf_id:
        return node
    children = node.get("children", [])
    if not isinstance(children, list):
        return None
    for child in children:
        leaf = find_leaf(child, leaf_id)
        if leaf is not None:
            return leaf
    return None


def opens_static_home_in_active_main_leaf(workspace: dict[str, object]) -> bool:
    """Require the active leaf in the main workspace to open Home.md in preview."""
    active_leaf_id = workspace.get("active")
    if not isinstance(active_leaf_id, str):
        return False
    active_leaf = find_leaf(workspace.get("main"), active_leaf_id)
    if active_leaf is None:
        return False
    view = active_leaf.get("state")
    if not isinstance(view, dict) or view.get("type") != "markdown":
        return False
    view_state = view.get("state")
    return (
        isinstance(view_state, dict)
        and view_state.get("file") == "Home.md"
        and view_state.get("mode") == "preview"
        and view_state.get("source") is False
    )


def main() -> int:
    failures: list[str] = []

    for relative in REQUIRED_DIRS:
        path = ROOT / relative
        if path.is_dir():
            passed(f"required directory: {relative}")
        else:
            fail(f"missing directory: {relative}", failures)

    for relative in REQUIRED_FILES:
        path = ROOT / relative
        if path.is_file() and path.stat().st_size > 0:
            passed(f"required file: {relative}")
        else:
            fail(f"missing or empty file: {relative}", failures)

    if (ROOT / ".git").exists():
        passed("source checkout Git metadata is ignored by release packaging")
    else:
        passed("no Git metadata in distributable Vault")

    plugins_dir = ROOT / ".obsidian" / "plugins"
    packaged_plugins = sorted(path.name for path in plugins_dir.iterdir() if path.is_dir()) if plugins_dir.exists() else []
    if packaged_plugins == ["qingyan-homepage"]:
        passed("only audited first-party plugin is packaged: qingyan-homepage")
    else:
        fail(f"unexpected packaged plugins: {packaged_plugins}", failures)

    community_plugins_path = ROOT / ".obsidian" / "community-plugins.json"
    community_plugins = json.loads(community_plugins_path.read_text(encoding="utf-8"))
    if community_plugins == ["qingyan-homepage"]:
        passed("first-party homepage plugin enabled")
    else:
        fail(f"community plugin allowlist mismatch: {community_plugins}", failures)

    homepage_manifest = json.loads(
        (ROOT / ".obsidian" / "plugins" / "qingyan-homepage" / "manifest.json").read_text(encoding="utf-8")
    )
    if homepage_manifest.get("id") == "qingyan-homepage" and homepage_manifest.get("name") == "Qingyan Vault Homepage":
        passed("Qingyan Vault Homepage identity")
    else:
        fail("Qingyan Vault Homepage manifest identity mismatch", failures)

    homepage_source = (
        ROOT / ".obsidian" / "plugins" / "qingyan-homepage" / "main.js"
    ).read_text(encoding="utf-8")
    network_markers = ("fetch(", "requestUrl(", "XMLHttpRequest", "WebSocket(")
    present_network_markers = [marker for marker in network_markers if marker in homepage_source]
    if not present_network_markers:
        passed("first-party homepage has no network API calls")
    else:
        fail(f"homepage contains network API calls: {present_network_markers}", failures)

    workflow_markers = {
        "visible homepage leaf": "this.plugin.captureNote(this.leaf)",
        "visible root leaf entry": "candidate.view?.containerEl?.isShown?.()",
        "single visible work surface": "const leaf = sourceLeaf || this.getContentLeaf();",
        "main workspace entry routing": "workspace.getMostRecentLeaf(workspace.rootSplit)",
        "official file navigation": "await leaf.openFile(file,",
        "same-surface daily note": 'const folder = "回顾/每日";',
        "active editor focus": "setActiveLeaf(leaf, { focus: true })",
        "source-mode capture": 'mode: "source"',
        "project task location": "line: task.line",
    }
    for label, marker in workflow_markers.items():
        if marker in homepage_source:
            passed(f"homepage workflow: {label}")
        else:
            fail(f"homepage workflow missing: {label}", failures)

    homepage_styles = (
        ROOT / ".obsidian" / "plugins" / "qingyan-homepage" / "styles.css"
    ).read_text(encoding="utf-8")
    review_source_markers = {
        "quiet text-only product identity": 'text: "Qingyan Vault"',
        "review queue is primary": "this.renderReviewDesk(primary, draftSummaries)",
        "empty draft area collapses": "if (!draftSummaries.length) return;",
        "source evidence is explicit": '"来源与边界"',
        "human decision state is explicit": '"接纳边界"',
        "search is a compact nav action": 'this.createNavAction(nav, "搜索", "⌘ K"',
        "project next step is in first fold": '"下一步", task.text',
    }
    for label, marker in review_source_markers.items():
        if marker in homepage_source:
            passed(f"homepage review surface: {label}")
        else:
            fail(f"homepage review surface missing: {label}", failures)

    review_style_markers = {
        "disciplined reading width": "width: min(100%, 1160px)",
        "local cross-platform font stack": '"PingFang SC", "Hiragino Sans GB"',
        "native theme variables": "--qy-bg: var(--background-primary",
        "compact action navigation": ".qy-dashboard .qy-nav-item",
        "resume surface is responsive": ".qy-dashboard .qy-resume-row",
        "draft emphasis is subtle": "--qy-draft-bg: color-mix",
        "long draft titles clamp to two lines": "-webkit-line-clamp: 2",
        "text actions keep accessible targets": "min-height: 44px",
        "narrow layout uses a single column": "@container (max-width: 600px)",
    }
    for label, marker in review_style_markers.items():
        if marker in homepage_styles:
            passed(f"homepage review surface: {label}")
        else:
            fail(f"homepage review surface missing: {label}", failures)

    stale_surface_markers = (
        "formatClock(",
        "qy-dashboard-hero",
        "qy-search-launch",
        "qy-logo-decision",
        "今天，只推进一件事",
        "今天，从哪里继续",
    )
    present_stale_markers = [
        marker for marker in stale_surface_markers if marker in homepage_source or marker in homepage_styles
    ]
    if not present_stale_markers:
        passed("homepage review surface has no retired hero or clock")
    else:
        fail(f"homepage still contains retired surface markers: {present_stale_markers}", failures)

    core_plugins_path = ROOT / ".obsidian" / "core-plugins.json"
    core_plugins = json.loads(core_plugins_path.read_text(encoding="utf-8"))
    for plugin in sorted(REQUIRED_CORE_PLUGINS):
        if core_plugins.get(plugin) is True:
            passed(f"required core plugin enabled: {plugin}")
        else:
            fail(f"required core plugin is not enabled: {plugin}", failures)
    for plugin in sorted(DISABLED_CORE_PLUGINS):
        if core_plugins.get(plugin) is False:
            passed(f"network or nonessential core plugin disabled: {plugin}")
        else:
            fail(f"core plugin must remain disabled: {plugin}", failures)

    app_config = json.loads((ROOT / ".obsidian" / "app.json").read_text(encoding="utf-8"))
    expected_app_config = {
        "defaultViewMode": "preview",
        "newFileLocation": "folder",
        "newFileFolderPath": "收件箱",
        "propertiesInDocument": "hidden",
        "attachmentFolderPath": "附件",
    }
    for key, expected in expected_app_config.items():
        if app_config.get(key) == expected:
            passed(f"app setting: {key}={expected}")
        else:
            fail(f"app setting mismatch: {key} must be {expected!r}", failures)

    expected_ignored_files = {
        ".github/",
        ".starter-tools/",
        "docs/",
        "dist/",
        "AGENTS.md",
        "CLAUDE.md",
        "CODE_OF_CONDUCT.md",
        "CONTRIBUTING.md",
        "LICENSE",
        "README.md",
        "README.en.md",
        "ROADMAP.md",
        "SECURITY.md",
        "CHANGELOG.md",
        "THIRD_PARTY_NOTICES.md",
        "VERSION",
    }
    ignored_files = set(app_config.get("userIgnoreFilters", []))
    if expected_ignored_files <= ignored_files:
        passed("repository governance excluded from the knowledge index")
    else:
        missing = sorted(expected_ignored_files - ignored_files)
        fail(f"repository governance missing from userIgnoreFilters: {missing}", failures)

    appearance = json.loads((ROOT / ".obsidian" / "appearance.json").read_text(encoding="utf-8"))
    if "qingyan-vault" in appearance.get("enabledCssSnippets", []):
        passed("Qingyan theme snippet enabled")
    else:
        fail("Qingyan theme snippet is not enabled", failures)

    if appearance.get("cssTheme") == "Border":
        passed("audited Border theme selected")
    else:
        fail("Border theme must be the selected visual base", failures)

    if app_config.get("showInlineTitle") is False:
        passed("inline title hidden to avoid duplicate headings")
    else:
        fail("app.json showInlineTitle must be false", failures)

    base_source = (ROOT / "知识总览.base").read_text(encoding="utf-8")
    knowledge_folders = ("收件箱", "来源", "知识", "项目", "知识地图")
    if all(f'file.inFolder("{folder}")' in base_source for folder in knowledge_folders):
        passed("knowledge base limited to production folders")
    else:
        fail("knowledge base folder scope is incomplete", failures)

    border_manifest_path = ROOT / ".obsidian" / "themes" / "Border" / "manifest.json"
    border_manifest = json.loads(border_manifest_path.read_text(encoding="utf-8"))
    if border_manifest.get("name") == "Border" and border_manifest.get("author") == "Akifyss":
        passed("Border theme manifest attribution")
    else:
        fail("Border theme manifest attribution is missing", failures)

    border_license = (ROOT / ".obsidian" / "themes" / "Border" / "LICENSE").read_text(
        encoding="utf-8"
    )
    if "MIT License" in border_license and "Copyright (c) 2022 Akifyss" in border_license:
        passed("Border theme MIT license retained")
    else:
        fail("Border theme MIT license or copyright notice is missing", failures)

    project_license = (ROOT / "LICENSE").read_text(encoding="utf-8")
    if "MIT License" in project_license and "Permission is hereby granted" in project_license:
        passed("Qingyan Vault MIT license")
    else:
        fail("Qingyan Vault root LICENSE must contain the full MIT grant", failures)

    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    for screenshot in (
        ".github/assets/home-light.png",
        ".github/assets/home-dark.png",
        ".github/assets/home-narrow.png",
        ".github/assets/workspace-shelf.png",
        ".github/assets/capture-flow.png",
        ".github/assets/knowledge-base.png",
    ):
        if screenshot in readme:
            passed(f"README references screenshot: {screenshot}")
        else:
            fail(f"README does not reference screenshot: {screenshot}", failures)
        screenshot_path = ROOT / screenshot
        if screenshot_path.is_file() and screenshot_path.read_bytes().startswith(b"\x89PNG\r\n\x1a\n"):
            passed(f"real PNG screenshot: {screenshot}")
        else:
            fail(f"screenshot is not a real PNG: {screenshot}", failures)

    lockup = ROOT / ".github" / "assets" / "qingyan-vault-lockup.svg"
    lockup_source = lockup.read_text(encoding="utf-8") if lockup.is_file() else ""
    if "<svg" in lockup_source and "Qingyan Vault" in lockup_source and "LOCAL MARKDOWN" in lockup_source:
        passed("repository brand lockup is portable SVG")
    else:
        fail("repository brand lockup is missing or invalid", failures)

    home = (ROOT / "Home.md").read_text(encoding="utf-8")
    for marker in (
        "obsidian://daily",
        'path:"项目/" task-todo:/./',
        'path:"收件箱/"',
        "待你确认",
        "指南/把它变成你的",
    ):
        if marker in home:
            passed(f"home cockpit marker: {marker}")
        else:
            fail(f"home cockpit marker missing: {marker}", failures)

    if "# Qingyan Vault" in home and "OBSIDIAN AGENT STARTER" not in home:
        passed("Qingyan Vault home branding")
    else:
        fail("Home.md contains stale or missing product branding", failures)

    workspace = json.loads((ROOT / ".obsidian" / "workspace.json").read_text(encoding="utf-8"))
    workspace_text = json.dumps(workspace, ensure_ascii=False)
    if opens_static_home_in_active_main_leaf(workspace):
        passed("active main workspace leaf opens static Home.md in preview")
    else:
        fail("active main workspace leaf must open static Home.md in preview", failures)

    wrong_main_view_fixture = {
        "main": {
            "type": "split",
            "children": [
                {
                    "type": "tabs",
                    "children": [
                        {
                            "id": "starter-home",
                            "type": "leaf",
                            "state": {"type": "qingyan-homepage", "state": {}},
                        }
                    ],
                }
            ],
        },
        "right": {
            "type": "split",
            "children": [
                {
                    "id": "starter-backlinks",
                    "type": "leaf",
                    "state": {"type": "backlink", "state": {"file": "Home.md"}},
                }
            ],
        },
        "active": "starter-home",
    }
    if not opens_static_home_in_active_main_leaf(wrong_main_view_fixture):
        passed("workspace negative fixture rejects Home.md found only in backlinks")
    else:
        fail("workspace negative fixture accepted the wrong main view", failures)
    for runtime_name in ("未命名.canvas", "未命名.base", "workspace-mobile.json"):
        if runtime_name in workspace_text:
            fail(f"workspace contains runtime scratch entry: {runtime_name}", failures)
    missing_recent_files = [
        recent for recent in workspace.get("lastOpenFiles", []) if not (ROOT / recent).exists()
    ]
    if missing_recent_files:
        fail(f"workspace contains missing recent files: {missing_recent_files}", failures)
    else:
        passed("workspace recent files all exist")
    for source_only in ('"dist', '"docs', '".github'):
        if source_only in workspace_text:
            fail(f"workspace contains source-only or missing release entry: {source_only}", failures)

    symlinks = [
        path
        for path in ROOT.rglob("*")
        if path.is_symlink() and not IGNORED_PARTS.intersection(path.relative_to(ROOT).parts)
    ]
    if symlinks:
        fail(f"symlinks reduce portability: {symlinks}", failures)
    else:
        passed("no symlinks")

    risky_files = [
        path.relative_to(ROOT)
        for path in ROOT.rglob("*")
        if path.is_file() and (path.name == ".env" or path.suffix.lower() in {".pem", ".key", ".p12"})
        and not IGNORED_PARTS.intersection(path.relative_to(ROOT).parts)
    ]
    if risky_files:
        fail(f"credential-like files are not allowed: {risky_files}", failures)
    else:
        passed("no credential-like files")

    files = content_files()
    markdown_files = [path for path in files if path.suffix == ".md"]

    for path in files:
        text = path.read_text(encoding="utf-8")
        relative = path.relative_to(ROOT)
        for marker in FORBIDDEN_MARKERS:
            if marker in text:
                fail(f"forbidden private or credential marker in {relative}: {marker}", failures)

        if SECRET_PATTERN.search(text):
            fail(f"credential-like assignment in {relative}", failures)

        if ".obsidian/snippets" in relative.as_posix() and path.suffix == ".css":
            css_without_urls = re.sub(r"url\s*\(\s*[^)]*?\s*\)", "", text, flags=re.I)
            if re.search(r"@import|https?://", css_without_urls, re.I):
                fail(f"local CSS snippet references an external asset: {relative}", failures)
            for match in re.findall(r"url\s*\(\s*([^)]*?)\s*\)", text, re.I):
                reference = match.strip(" \t\r\n\"'")
                decoded = unquote(reference).lower()
                allowed_svg = reference.lower().startswith("data:image/svg+xml,")
                active_svg = any(marker in decoded for marker in ("<script", "onload=", "<foreignobject"))
                if not allowed_svg or active_svg:
                    fail(f"local CSS snippet contains an unsafe asset reference: {relative}", failures)

        if path.suffix == ".md":
            for target in re.findall(r"\[\[([^\]]+)\]\]", text):
                if not resolve_wikilink(target, markdown_files):
                    fail(f"unresolved wikilink in {relative}: [[{target}]]", failures)

        if path.suffix == ".json":
            try:
                json.loads(text)
            except json.JSONDecodeError as error:
                fail(f"invalid JSON file {relative}: {error}", failures)

    source_files = list((ROOT / "来源").glob("*.md"))
    if source_files and all("synthetic: true" in path.read_text(encoding="utf-8") for path in source_files):
        passed("all example sources explicitly marked synthetic")
    else:
        fail("every example source must contain 'synthetic: true'", failures)

    for canvas_path in (ROOT / "白板").glob("*.canvas"):
        try:
            canvas = json.loads(canvas_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            fail(f"invalid JSON Canvas {canvas_path.name}: {error}", failures)
            continue
        if not canvas.get("nodes") or not canvas.get("edges"):
            fail(f"Canvas is an empty shell: {canvas_path.name}", failures)
        else:
            passed(f"non-empty JSON Canvas: {canvas_path.name}")
        for node in canvas.get("nodes", []):
            if node.get("type") == "file" and not (ROOT / node.get("file", "")).is_file():
                fail(f"Canvas file node is missing: {node.get('file')}", failures)

    if failures:
        print(f"\n{len(failures)} check(s) failed.")
        return 1

    print("\nAll checks passed for Qingyan Vault.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
