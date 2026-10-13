"""Original selection sources, 52 semantic layers each, deterministic OpenRaster.
SVG/module paths remain the editable authoring source. ORA is a raster-layer
companion, not an assertion of human painting or independent 3D geometry.
"""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_STORED, ZIP_DEFLATED
import xml.etree.ElementTree as ET
import hashlib
import json

root = Path("art/characters/m1/treatments")
names = ["ground-shadow", "back-accessory", "far-leg", "far-shoe", "near-leg", "near-shoe", "lower-clothing", "far-arm", "torso-and-hood", "head-and-face", "hair-or-covering", "near-arm", "backpack-or-straps"]
for option in ["a", "b"]:
    image = ET.Element("image", {"w": "128", "h": "192", "name": f"CampusWahala M1 {option.upper()} - UNAPPROVED", "version": "0.0.1"})
    stack = ET.SubElement(image, "stack")
    files = []
    with ZipFile(root / option / "source/master.ora", "w") as archive:
        def put(name, data, compression=ZIP_DEFLATED):
            info = ZipInfo(name, date_time=(2026, 10, 13, 0, 0, 0))
            info.compress_type = compression
            info.external_attr = 0o644 << 16
            archive.writestr(info, data)
        put("mimetype", b"image/openraster", ZIP_STORED)
        for direction in ["down", "up", "left", "right"]:
            group = ET.SubElement(stack, "stack", {"name": direction, "visibility": "visible" if direction == "down" else "hidden", "opacity": "1.0", "composite-op": "svg:src-over"})
            for name in reversed(names):
                data = (root / option / f"source/{direction}-{name}.png").read_bytes()
                path = f"data/{direction}-{name}.png"
                put(path, data)
                ET.SubElement(group, "layer", {"name": name, "src": path, "x": "0", "y": "0", "visibility": "visible", "opacity": "1.0", "composite-op": "svg:src-over"})
                files.append({"path": path, "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)})
        put("mergedimage.png", (root / option / "source/down-merged.png").read_bytes())
        put("stack.xml", ET.tostring(image, encoding="utf-8", xml_declaration=True))
    (root / option / "source/openraster-manifest.json").write_text(json.dumps({"status": "UNAPPROVED; single master only; SVG authored soft shading, not human painted", "canvas": [128, 192], "directions": 4, "editablePartLayers": 52, "files": files}, indent=2) + "\n", encoding="utf-8")
print("Packed A and B: 104 semantic layers. No Appearance permutations.")
