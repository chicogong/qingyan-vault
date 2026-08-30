#!/usr/bin/env python3
"""Build and optionally verify a deterministic Qingyan Vault release archive."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
VERSION = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
DIST = ROOT / "dist"
ARCHIVE = DIST / f"qingyan-vault-{VERSION}.zip"
TOP = "qingyan-vault"
EXCLUDED_PARTS = {".git", "dist", "__pycache__"}
EXCLUDED_PATHS = {
    ".DS_Store",
    ".obsidian/graph.json",
    ".obsidian/sync.json",
    ".obsidian/workspace-mobile.json",
}


def included(path: Path) -> bool:
    relative = path.relative_to(ROOT)
    if EXCLUDED_PARTS.intersection(relative.parts):
        return False
    if relative.as_posix() in EXCLUDED_PATHS:
        return False
    if relative.parts and relative.parts[0] == ".github" and (
        len(relative.parts) < 2 or relative.parts[1] != "assets"
    ):
        return False
    if ".obsidian" in relative.parts and "plugins" in relative.parts:
        return False
    return path.is_file() and not path.is_symlink()


def build() -> Path:
    DIST.mkdir(exist_ok=True)
    with zipfile.ZipFile(ARCHIVE, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(ROOT.rglob("*"), key=lambda item: item.as_posix()):
            if not included(path):
                continue
            relative = path.relative_to(ROOT)
            info = zipfile.ZipInfo(f"{TOP}/{relative.as_posix()}", date_time=(2026, 8, 30, 0, 0, 0))
            mode = 0o755 if os.access(path, os.X_OK) else 0o644
            info.external_attr = (mode & 0xFFFF) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, path.read_bytes())
    return ARCHIVE


def verify(archive: Path) -> None:
    with tempfile.TemporaryDirectory(prefix="qingyan-vault-release-") as temp_dir:
        temp = Path(temp_dir)
        with zipfile.ZipFile(archive) as bundle:
            names = bundle.namelist()
            forbidden = [
                name
                for name in names
                if "/.git/" in name
                or "/dist/" in name
                or "/.obsidian/plugins/" in name
                or name.endswith("workspace-mobile.json")
            ]
            if forbidden:
                raise SystemExit(f"forbidden release entries: {forbidden}")
            bundle.extractall(temp)
        extracted = temp / TOP
        subprocess.run(["sh", str(extracted / ".starter-tools" / "self-check.sh")], cwd=extracted, check=True)
        if (extracted / ".git").exists():
            raise SystemExit("release archive unexpectedly contains Git metadata")
        if not (extracted / "Home.md").is_file():
            raise SystemExit("release archive is missing Home.md")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="extract and run the portable self-check")
    args = parser.parse_args()
    archive = build()
    print(f"Built {archive}")
    if args.check:
        verify(archive)
        print("Release archive verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
