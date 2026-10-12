#!/usr/bin/env python3
"""Stage the reviewed ChatGPT M1 asset study as NON-RUNTIME proof only.

Usage: python3 scripts/art/import-m1-candidate.py path/to/campuswahala-m1-inhouse-2d-prototype.zip
No third-party dependencies; does not import into public game assets.
"""
import hashlib
import json
import re
import sys
import tempfile
from pathlib import Path
from zipfile import ZipFile

ZIP_SHA256 = "54a95d22452eb84ee7b88ffaef6e4c346091d20cd351badcd0035d951bac164b"
NAME = "campuswahala-m1-inhouse-2d-prototype.zip"
PRESERVE = {
    "README.txt", "source-character-sheet.png", "split_sheet.py",
    "cw-student-m1-editable-frames.ora",
    "cw-student-m1-candidate-atlas.png",
    "cw-student-m1-candidate-atlas.json",
    "cw-student-m1-candidate-preview.jpg",
}
FRAME = re.compile(r"cw-student-(down|up|left|right)-walk-(\d{2})\.png\Z")
OUTPUT = Path("art/characters/inhouse-candidate/proof")
MAX_ARCHIVE_BYTES = 8 * 1024 * 1024

def digest(content):
    return hashlib.sha256(content).hexdigest()

def main():
    if len(sys.argv) != 2:
        raise SystemExit(f"Usage: python3 scripts/art/import-m1-candidate.py /path/to/{NAME}")
    archive = Path(sys.argv[1]).resolve()
    if archive.name != NAME or not archive.is_file():
        raise SystemExit(f"Expected archive named {NAME}")
    raw = archive.read_bytes()
    if len(raw) > MAX_ARCHIVE_BYTES or digest(raw) != ZIP_SHA256:
        raise SystemExit("Unexpected archive hash/size; refuse unknown or changed art")
    with ZipFile(archive) as z:
        entries = z.infolist()
        if len(entries) != 36 or sum(e.file_size for e in entries) > 14 * 1024 * 1024:
            raise SystemExit("Unexpected archive entries or decompressed size")
        names = [e.filename for e in entries]
        if len(set(names)) != len(names) or any("/" in n or "\\" in n or n.startswith(".") for n in names):
            raise SystemExit("Unsafe or duplicate file entry")
        frame_names = [n for n in names if FRAME.fullmatch(n)]
        counts = {d: sum(n.startswith(f"cw-student-{d}-") for n in frame_names)
                  for d in ("down", "up", "left", "right")}
        if counts != {"down": 8, "up": 6, "left": 7, "right": 7}:
            raise SystemExit(f"Unexpected frame counts: {counts}")
        if set(names) != PRESERVE | set(frame_names) | {"interaction-preview.html"}:
            raise SystemExit("Unknown or missing archive member")
        spec = json.loads(z.read("cw-student-m1-candidate-atlas.json"))
        if (spec.get("tile") != [80, 180] or spec.get("framesPerDirection") != 8 or
            spec.get("directions") != ["down", "up", "left", "right"] or
            len(spec.get("frames", {})) != 20):
            raise SystemExit("Unexpected source atlas metadata")
        from io import BytesIO
        with ZipFile(BytesIO(z.read("cw-student-m1-editable-frames.ora"))) as ora:
            layers = [n for n in ora.namelist() if n.startswith("data/layer") and n.endswith(".png")]
            if len(layers) != 32:
                raise SystemExit("Expected 32 editable per-frame OpenRaster layers")
        target = Path.cwd() / OUTPUT
        if target.exists():
            raise SystemExit(f"Refusing to overwrite existing candidate: {target}")
        target.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="m1-import-", dir=str(target.parent)) as tmp:
            stage = Path(tmp) / "proof"
            stage.mkdir()
            written = []
            for name in names:
                if name == "interaction-preview.html":
                    continue  # client-only HTML must not be imported into game routes
                data = z.read(name)
                (stage / name).write_bytes(data)
                written.append({"name": name, "bytes": len(data), "sha256": digest(data)})
            (stage / "IMPORT-MANIFEST.json").write_text(json.dumps({
                "status": "UNAPPROVED M1 CANDIDATE ONLY — NOT A RUNTIME ASSET",
                "sourceZipSha256": ZIP_SHA256,
                "archiveEntries": len(names),
                "distinctFrameFiles": len(frame_names),
                "atlasCells": 32,
                "openRasterFrameLayers": 32,
                "limitations": [
                    "AI-generated sprite-frame study, not modular anatomy/clothing/hair layers",
                    "Four directional atlas rows reuse frames and mirror right-facing source",
                    "No authored idle frames, two NPC variants or full saved Appearance mapping",
                    "No actual Phaser 360x800 proof; never promote into public runtime assets"
                ],
                "files": written,
            }, indent=2) + "\n")
            stage.rename(target)
        print(f"Staged {len(written)} files at {target} — REVIEW ONLY; M1 remains blocked")

if __name__ == "__main__":
    main()
