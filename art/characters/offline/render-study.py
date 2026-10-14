"""Reproduce the rejected offline M1 study; never serves runtime assets.

Requires Blender 4.0.2 installed by the author. No Blender runtime dependency.
python art/characters/offline/render-study.py --blender /path/to/blender
"""
import argparse
import hashlib
import json
import pathlib
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--blender', default='blender')
args = parser.parse_args()
source = pathlib.Path(__file__).resolve().parent/'student.py'
out = source.parent/'proof'
out.mkdir(exist_ok=True)
looks = [
    dict(skin='deep',hair='crop',hairColour='black',top='lime',bottom='trousers',shoes='white',accessory='backpack'),
    dict(skin='brown',hair='braids',hairColour='brown',top='blue',bottom='skirt',shoes='dark',accessory='none'),
    dict(skin='warm',hair='covered',hairColour='black',top='clay',bottom='skirt',shoes='white',accessory='backpack'),
    dict(skin='light',hair='afro',hairColour='black',top='blue',bottom='trousers',shoes='dark',accessory='none'),
]
rows = []
for look_index, look in enumerate(looks):
    for direction in ['down','left','up','right']:
        poses = [('idle',0)]
        if look_index == 0:
            poses += [('walk',i) for i in range(6)]
        for state,frame in poses:
            name = f'{look_index}-{direction}-{state}-{frame}.png'
            target = out/name
            target.unlink(missing_ok=True)
            subprocess.run([args.blender,'-b','--threads','4','--python',str(source),
                            '--',str(target),direction,state,str(frame),
                            json.dumps(look),'128'],check=True)
            data = target.read_bytes()
            if data[:8] != b'\x89PNG\r\n\x1a\n':
                raise ValueError('Blender did not produce a PNG')
            rows.append(dict(file=name,appearance=look,direction=direction,
                             state=state,index=frame,bytes=len(data),
                             sha256=hashlib.sha256(data).hexdigest()))
subprocess.run([args.blender,'-b','--threads','4','--python',str(source),
                '--',str(out/'close-up.png')],check=True)
(out/'frames.json').write_text(json.dumps(dict(
    status='REJECTED STUDY; ART REVIEW BLOCKER',
    authoring='Original procedural Blender source; no imported assets',
    blender='4.0.2',sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
    frameWidth=128,frameHeight=160,projection='Elevated orthographic, fixed light',
    frames=rows),indent=2)+'\n')
