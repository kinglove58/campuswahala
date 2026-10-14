CampusWahala — original 2D/2.5D character asset and interaction candidate

STATUS: UNAPPROVED M1 STUDY, NOT PRODUCTION-INTEGRATED.

The source illustrations and sprite frames were generated for this project, not copied from LagosLife. The OpenRaster (.ora) file contains editable independent RGBA sprite layers in an open format supported by GIMP and Krita. It is not a Blender model, and it is not a full skeletal rig; movement is frame animation.

CONTENTS
- cw-student-m1-editable-frames.ora: editable per-frame sprite layers.
- cw-student-m1-candidate-atlas.png / .json: 4 directional rows x 8 walk frames.
- cw-student-m1-candidate-preview.jpg: contact sheet.
- interaction-preview.html: isolated local playable demonstration of tap → confirm → auto-walk to bed, desk and wardrobe.
- cw-student-*-walk-*.png: individual transparent directional sprites.
- source-character-sheet.png: original generated turnaround reference used by the exporter.
- split_sheet.py: reproducible extraction/export proof (requires numpy, Pillow, opencv-python; rerun from this folder).

LIMITATIONS / GATE
Not yet an acceptable M1 original master character production pipeline: directional poses and repeat frames need manual cleanup for stable animation and correct foot anchors. Does not provide all Appearance combinations, NPC rig/variants, real Phaser 360x800 evidence, real authoritative server actions or compatibility tests. The standalone interaction demo is client-only mock gameplay, never a substitute for CampusWahala API authority. Do not merge/promote art yet.

The proper next step is quality QA, manually correcting animation poses and splitting/repainting character body/clothing/face parts for modular Appearance source, then minimal Phaser integration and visual review. Existing PR #17 remains draft and Phase 5 blocked.
