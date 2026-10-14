from PIL import Image,ImageDraw,ImageFont
import numpy as np,cv2, json,zipfile,io,xml.etree.ElementTree as ET
from pathlib import Path
src=Image.open(Path(__file__).resolve().parent/'source-character-sheet.png').convert('RGB')
arr=np.array(src,dtype=np.float32)
centers={
 'down':[39,95,151,207,259,314,370,425],
 'up':[503,562,620,679,736,793],
 'right':[880,946,1009,1073,1137,1199],
 'left':[],
}
out=Path(__file__).resolve().parent;out.mkdir(exist_ok=True)
frames={};frameinfo={}
for dir,xx in centers.items():
 frames[dir]=[]
 for i,cx in enumerate(xx):
  w=54 if dir=='down' else 58 if dir=='up' else 65
  x0=int(cx-w/2);x1=int(cx+w/2);y0,y1=710,885
  x0=max(0,x0);x1=min(src.width,x1)
  b=np.array(src.crop((x0,y0,x1,y1)).convert('RGB'))
  # determine soft alpha from local near-white background, contrast; keep every character pixel including light cream hoodie
  color=b.astype(np.float32)
  bg=np.median(np.array([b[:,0],b[:,-1],b[0],b[-1]]),axis=(0,1)).astype(np.float32) if False else np.array([246,246,247],np.float32)
  lumin=color.mean(axis=-1)
  # channel difference from true sheet background; at x original gradient bg ~247 246 247
  contrast=np.sqrt(np.sum((color-bg)**2,axis=-1))
  # white/cream hoodie hue is yellowish, so still high diff
  alpha=np.clip((contrast-14)/34,0,1)
  # avoid faded sprite because cream whites; nearby dark foreground and its internal regions must remain solid
  m=np.uint8(alpha>0.38)
  count,lab,stats,cents=cv2.connectedComponentsWithStats(m)
  # keep large connected character body including head and feet, plus connected nearby pieces
  allowed=np.zeros_like(m)
  for idx in range(1,count):
   (xx0,yy0,ww,hh,area)=stats[idx]
   if area>=18 and (xx0<=w*0.72 and xx0+ww>=w*.25):allowed[lab==idx]=1
  # join anti-aliased edges gently with blur
  allowed=cv2.dilate(allowed,np.ones((2,2),np.uint8),iterations=1)
  a=np.maximum(0,np.minimum(255,(alpha*255))).astype('uint8')
  a=(a*allowed).astype('uint8')
  # clip unwanted decorative divider lines at group breaks (outside character footprint)
  outimg=Image.fromarray(np.dstack((b,a)),'RGBA')
  file=f'cw-student-{dir}-walk-{i:02d}.png'
  outimg.save(out/file)
  frames[dir].append(outimg)
  frameinfo[file]={'direction':dir,'frame':i,'sourceBox':[x0,y0,x1,y1],'size':[outimg.width,outimg.height]}
# Mirror a clean profile pose for genuine opposite-facing sprites.
frames['left']=[im.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for im in frames['right']]
# Individual frames on 72x180 transparent canvas, align shoe ground at row 170
canvas_w,canvas_h=80,180
atlas=Image.new('RGBA',(canvas_w*8,canvas_h*4),(0,0,0,0))
preview=Image.new('RGB',(canvas_w*8,canvas_h*4),'#d9eee9')
for row,dir in enumerate(['down','up','left','right']):
 for j in range(8):
  im=frames[dir][j%len(frames[dir])]
  x=canvas_w*j+int((canvas_w-im.width)/2);y=canvas_h*row
  atlas.alpha_composite(im,(x,y));preview.paste(im,(x,y),im)
atlas.save(out/'cw-student-m1-candidate-atlas.png',optimize=True)
preview.save(out/'cw-student-m1-candidate-preview.jpg',quality=93)
(out/'cw-student-m1-candidate-atlas.json').write_text(json.dumps({'status':'UNAPPROVED 2D GAMEPLAY SPRITE CANDIDATE','source':'AI-generated original character turnaround/reference, manual deterministic slicing with local alpha matting','tile':[80,180],'directions':['down','up','left','right'],'framesPerDirection':8,'warning':'AI poses may be visually inconsistent. This candidate is not M1 approval and is not in Phaser yet.','frames':frameinfo},indent=2))
# Editable OpenRaster file with a separate named layer for each frame, user can edit in Krita/GIMP
ns='';xml=ET.Element('image',{'w':str(canvas_w),'h':str(canvas_h),'name':'CampusWahala student original 2D sprite frames (editable master)','version':'0.0.1'})
stack=ET.SubElement(xml,'stack');ora=out/'cw-student-m1-editable-frames.ora'
with zipfile.ZipFile(ora,'w') as z:
 z.writestr('mimetype','image/openraster',compress_type=zipfile.ZIP_STORED)
 n=0
 for dir in ['down','up','left','right']:
  for j in range(8):
   im=frames[dir][j%len(frames[dir])]
   canvas=Image.new('RGBA',(canvas_w,canvas_h));canvas.alpha_composite(im,(int((canvas_w-im.width)/2),0))
   bio=io.BytesIO();canvas.save(bio,format='PNG')
   name=f'data/layer{n:04}.png';z.writestr(name,bio.getvalue())
   ET.SubElement(stack,'layer',{'name':f'{dir} / walk / {j:02d}','src':name,'x':'0','y':'0','opacity':'1.0','visibility':'visible' if n==0 else 'hidden','composite-op':'svg:src-over'})
   n+=1
 b=io.BytesIO();preview.crop((0,0,canvas_w,canvas_h)).save(b,format='PNG');z.writestr('mergedimage.png',b.getvalue())
 z.writestr('stack.xml',ET.tostring(xml,encoding='utf-8',xml_declaration=True))
print('wrote',ora,'with 32 editable frame layers; actual motion to be reviewed')
