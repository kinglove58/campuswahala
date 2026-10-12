"""Package the generated semantic parts for editing in Krita/GIMP.
Original vector master remains student.mjs + named-layer source/*.svg.
Does not execute the imported ZIP's authoring script or promote runtime assets.
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_STORED, ZIP_DEFLATED
import xml.etree.ElementTree as ET
import hashlib
import json

root = Path("art/characters/m1")
names = ["ground-shadow", "back-accessory", "far-leg", "far-shoe", "near-leg", "near-shoe", "lower-clothing", "far-arm", "torso-and-hood", "head-and-face", "hair-or-covering", "near-arm", "backpack-or-straps"]
image = ET.Element("image", {"w": "128", "h": "192", "name": "CW M1 modular default look — unapproved", "version": "0.0.1"})
stack = ET.SubElement(image, "stack")
files = []
with ZipFile(root / "source/modular-master.ora", "w", compression=ZIP_DEFLATED) as archive:
    archive.writestr("mimetype", "image/openraster", compress_type=ZIP_STORED)
    for direction in ["down", "up", "left", "right"]:
        group = ET.SubElement(stack, "stack", {"name": direction, "visibility": "visible" if direction == "down" else "hidden", "opacity": "1.0", "composite-op": "svg:src-over"})
        for name in reversed(names):
            data = (root / f"source/{direction}-{name}.png").read_bytes()
            path = f"data/{direction}-{name}.png"
            archive.writestr(path, data)
            ET.SubElement(group, "layer", {"name": name, "src": path, "x": "0", "y": "0", "visibility": "visible", "opacity": "1.0", "composite-op": "svg:src-over"})
            files.append({"path": path, "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)})
    # Native-size merged image, independent from the scaled wardrobe preview.
    archive.writestr("mergedimage.png", (root / "source/down-merged.png").read_bytes())
    archive.writestr("stack.xml", ET.tostring(image, encoding="utf-8", xml_declaration=True))
(root / "source/openraster-manifest.json").write_text(json.dumps({"status": "UNAPPROVED M1 semantic-part source, default palette only; full Appearance options in vector master", "canvas": [128, 192], "directions": 4, "editablePartLayers": 52, "files": files}, indent=2) + "\n", encoding="utf-8")
print("Packed 52 semantic part layers in four direction groups; not 32 whole-frame layers.")
