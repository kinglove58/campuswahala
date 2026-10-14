"""Original CampusWahala offline character study. Blender 4.0.2, CPU Cycles.

This is an M1 source experiment, not accepted production art. No runtime 3D.
All meshes, materials and poses below are original procedural authoring.
Forward=-Y, Z=up, ground origin=(0,0,0); camera elevation is fixed.
Run: blender -b --python art/characters/offline/student.py -- /tmp/cw-study.png
"""
import bpy
import math
import sys
import json
from mathutils import Vector

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
output = args[0] if args else '/tmp/cw-study.png'
direction = args[1] if len(args)>1 else 'down'
state = args[2] if len(args)>2 else 'idle'
frame = int(args[3]) if len(args)>3 else 0
look = json.loads(args[4]) if len(args)>4 else dict(
    skin='deep', hair='crop', hairColour='black', top='lime',
    bottom='trousers', shoes='white', accessory='backpack')
phase = math.sin(frame*math.tau/6) if state=='walk' else 0

def material(name, rgb, roughness=.65):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*rgb, 1)
    p.inputs['Roughness'].default_value = roughness
    return m

skin = material('skin', {'deep':(.25,.105,.057), 'brown':(.43,.23,.13),
                       'warm':(.63,.38,.22), 'light':(.8,.58,.37)}[look['skin']], .55)
hair = material('hair', {'black':(.025,.022,.019), 'brown':(.10,.047,.022)}[look['hairColour']])
top = material('cotton', {'lime':(.48,.62,.18),'clay':(.64,.24,.13),
                        'blue':(.16,.37,.5)}[look['top']])
cloth_edge = material('cotton seam', (.30, .41, .09))
denim = material('indigo twill', (.048, .105, .15))
denim_edge = material('twill stitching', (.13, .22, .27))
shoe = material('canvas shoe', (.85,.82,.68) if look['shoes']=='white' else (.038,.062,.075))
sole = material('rubber sole', (.47, .49, .43))
bag = material('ochre woven backpack', (.39, .24, .09))
bag_edge = material('bag webbing', (.21, .13, .048))
white = material('eye ivory', (.92, .9, .8), .35)
iris = material('iris', (.045, .027, .015), .3)
lip = material('soft lip', (.21, .063, .04), .55)

def finish(obj, mat):
    obj.data.materials.append(mat)
    for f in obj.data.polygons:
        f.use_smooth = True
    return obj

def oval(name, pos, size, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    return finish(obj, mat)

def rings(name, rows, mat, segments=32):
    """Editable loft profiles: (height, half width, half depth, depth offset)."""
    vertices = []
    for z, w, d, y in rows:
        vertices.extend((w*math.cos(a*math.tau/segments),
                         y+d*math.sin(a*math.tau/segments), z)
                        for a in range(segments))
    faces = []
    for i in range(len(rows)-1):
        for j in range(segments):
            k = i*segments+j
            nj = i*segments+(j+1)%segments
            faces.append((k, nj, nj+segments, k+segments))
    faces.extend([tuple(reversed(range(segments))),
                  tuple((len(rows)-1)*segments+j for j in range(segments))])
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj, mat)
    sub = obj.modifiers.new('soft tailored surface', 'SUBSURF')
    sub.levels = 2
    return obj

def seam(name, points, mat, radius=.003):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    for p, value in zip(spline.bezier_points, points):
        p.co = value
        p.handle_left_type = p.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj

def limb(name, a, b, widths, mat):
    axis = Vector(b)-Vector(a)
    obj = rings(name, [(0,widths[0],widths[0]*.85,0),
                       (axis.length*.14,widths[1],widths[1]*.85,0),
                       (axis.length*.72,widths[2],widths[2]*.85,0),
                       (axis.length,widths[3],widths[3]*.85,0)], mat)
    obj.location = a
    obj.rotation_euler = axis.to_track_quat('Z','Y').to_euler()
    return obj

# Human student proportions: 1.87m silhouette, about 6.4 heads. Hand-shaped
# cheek/jaw/cranium loft instead of the previous huge circular cartoon head.
rings('head cheek jaw cranium', [
    (1.52,.048,.055,-.013),(1.55,.075,.071,-.015),
    (1.61,.11,.086,-.004),(1.67,.122,.096,.002),
    (1.72,.116,.103,.009),(1.79,.109,.095,.015),
    (1.84,.075,.068,.015),(1.855,.016,.012,.012)], skin)
oval('neck', (0,.018,1.48), (.052,.052,.095), skin)
for s in [-1,1]:
    oval('ear', (s*.12,.007,1.665), (.027,.018,.045), skin)
    # Eye has modest scale; an upper lid and brow create a focused expression.
    oval('eye', (s*.051,-.089,1.693), (.032,.014,.017), white)
    oval('iris', (s*.049,-.102,1.692), (.011,.006,.011), iris)
    oval('catchlight', (s*.049-.004,-.107,1.697), (.003,.002,.003), white)
    seam('upper lid', [(s*.079,-.095,1.696),(s*.05,-.107,1.708),
                       (s*.023,-.1,1.7)], skin,.004)
    seam('brow', [(s*.08,-.088,1.727),(s*.048,-.097,1.733),
                  (s*.023,-.095,1.727)], hair,.006)
oval('nose bridge', (0,-.099,1.663), (.016,.023,.042), skin)
oval('nose tip', (0,-.119,1.639), (.024,.022,.013), skin)
seam('upper lip', [(-.028,-.079,1.599),(0,-.092,1.602),
                   (.028,-.079,1.603)], lip,.006)
seam('lower lip', [(-.024,-.08,1.594),(0,-.089,1.588),
                   (.024,-.08,1.598)], skin,.007)

# Each saved hairstyle has its own original source geometry.
if look['hair'] in ['crop','braids']:
    rings('hair cap', [(1.74,.117,.104,.014),(1.79,.116,.104,.014),
                      (1.85,.083,.076,.014),(1.878,.022,.019,.014)],hair)
    for i in range(54):
        a = i*2.39996
        r = .1*math.sqrt((i+.5)/54)
        x,y = r*math.cos(a),r*math.sin(a)
        z = 1.88 - .055*(r/.11)**2
        oval('hair texture', (x,y+.014,z), (.008,.009,.006),hair)
if look['hair']=='braids':
    for s in [-1,1]:
        for n in range(3):
            x=s*(.112+n*.006)
            y=.003+n*.04
            seam('braid', [(x,y,1.79),(x+s*.007,y,1.62),
                           (x+s*.018,y,1.45)],hair,.012)
            for j in range(12):
                z=1.45+j*.025
                oval('braid weave',(x+s*.01+math.sin(j*math.pi)*.003,y,z),
                     (.013,.014,.013),hair)
if look['hair']=='afro':
    oval('natural crown',(0,.018,1.78),(.15,.14,.135),hair)
    for i in range(88):
        a=i*2.39996
        z=1-2*(i+.5)/88
        r=math.sqrt(1-z*z)
        oval('curl cluster',(.145*r*math.cos(a),.018+.135*r*math.sin(a),
                            1.78+.128*z),(.025,.025,.023),hair)
if look['hair']=='covered':
    scarf=material('warm woven head covering',(.61,.30,.14))
    rings('scarf crown',[(1.743,.121,.111,.019),(1.79,.127,.116,.017),
                         (1.86,.092,.09,.018),(1.883,.02,.024,.018)],scarf)
    # Back/side cloth drapes. Face opening is preserved, no inferred identity.
    for s in [-1,1]:
        obj=rings('scarf side',[(1.43,.035,.07,.016),(1.54,.03,.063,.017),
                                (1.68,.025,.066,.023),(1.78,.02,.049,.019)],scarf)
        obj.location.x=s*.124
        seam('scarf fold',[(s*.145,.005,1.72),(s*.154,-.019,1.54),
                            (s*.142,-.048,1.45)],bag,.003)
    oval('scarf back',(0,.091,1.57),(.12,.043,.155),scarf)

rings('cotton tee', [(1.0,.14,.086,.015),(1.02,.151,.093,.015),
                    (1.15,.153,.103,.015),(1.32,.192,.105,.006),
                    (1.4,.217,.092,.006),(1.44,.155,.071,.006),
                    (1.455,.064,.053,.005)],top)
seam('collar', [(.063,0,1.456),(.044,-.049,1.447),(0,-.059,1.442),
                (-.044,-.049,1.447),(-.063,0,1.456)],cloth_edge,.008)
seam('shirt hem', [(-.141,0,1.02),(-.1,-.073,1.02),(0,-.091,1.02),
                   (.1,-.073,1.02),(.141,0,1.02)],cloth_edge)
# Low-key original CampusWahala pocket accent, no borrowed costume or logo.
seam('chest pocket', [(.061,-.097,1.31),(.104,-.085,1.31),
                     (.103,-.094,1.267),(.063,-.103,1.268),
                     (.061,-.097,1.31)],cloth_edge,.0025)

if look['bottom']=='trousers':
    rings('trouser waist',[(.875,.137,.077,.011),(.95,.149,.094,.011),
                           (1.025,.138,.089,.011)],denim)
else:
    rings('pleated skirt',[(.59,.235,.142,.014),(.61,.235,.142,.014),
                           (.85,.19,.112,.014),(1.024,.138,.09,.014)],denim)
    for x in [-.12,-.065,.065,.12]:
        seam('skirt fold',[(x,-.074,1.0),(x*1.45,-.118,.77),
                           (x*1.66,-.135,.62)],denim_edge,.003)
for s in [-1,1]:
    hip = (s*.078,.009,.94)
    stride=s*phase*.21
    lift=max(0,s*phase)*.075
    knee = (s*.093,-.009+stride*.52,.54+lift*.4)
    ankle = (s*.096,.012+stride,.13+lift)
    leg_mat=denim if look['bottom']=='trousers' else skin
    limb('upper leg',hip,knee,[.077,.078,.057,.051],leg_mat)
    limb('lower leg',knee,ankle,[.053,.055,.043,.041],leg_mat)
    if look['bottom']=='trousers':
        seam('trouser crease', [(s*.082,-.068,.91),
                                (s*.093,knee[1]-.049,knee[2]),
                                (s*.096,ankle[1]-.044,ankle[2]+.04)],denim_edge,.002)
    foot = oval('canvas sneaker',(s*.096,-.044+stride,.064+lift),(.063,.12,.052),shoe)
    oval('shoe sole',(s*.096,-.05+stride,.033+lift),(.064,.122,.021),sole)
    for z in [.089,.095,.099]:
        seam('laces',[(s*.096-.024,-.084+stride,z+lift),
                      (s*.096+.024,-.084+stride,z+lift)],white,.0025)
    shoulder = (s*.19,.01,1.37)
    arm_swing=-s*phase*.16
    elbow = (s*.249,-.013+arm_swing*.45,1.108+abs(phase)*.013)
    wrist = (s*.257,-.059+arm_swing,.87+abs(phase)*.02)
    limb('sleeve',shoulder,(s*.23,-.002,1.22),[.065,.071,.063,.061],top)
    limb('upper arm',(s*.225,0,1.24),elbow,[.052,.051,.044,.041],skin)
    limb('forearm',elbow,wrist,[.043,.045,.032,.03],skin)
    oval('hand',(s*.257,-.061+arm_swing,.828+abs(phase)*.02),(.035,.029,.063),skin)
    oval('thumb',(s*.234,-.077+arm_swing,.837+abs(phase)*.02),(.017,.018,.038),skin)
    # Four subtle knuckle/finger divisions, visible primarily on the review sheet.
    for n in range(3):
        seam('finger crease',[(s*.257-.019+n*.013,-.086+arm_swing,.812),
                              (s*.257-.019+n*.013,-.084+arm_swing,.782)],skin,.001)
    if look['accessory']=='backpack':
        seam('bag strap',[(s*.13,.091,1.423),(s*.17,-.006,1.404),
                      (s*.16,-.091,1.29),(s*.141,-.086,1.11),
                      (s*.135,.069,1.075)],bag_edge,.014)
if look['accessory']=='backpack':
    oval('backpack body',(0,.132,1.225),(.146,.066,.2),bag)
    oval('backpack front pocket',(0,.189,1.147),(.113,.026,.083),bag)
    seam('zipper',[(-.1,.203,1.195),(0,.218,1.206),(.1,.203,1.195)],shoe,.003)
    seam('carry handle',[(-.034,.127,1.41),(-.03,.133,1.453),
                     (.03,.133,1.453),(.034,.127,1.41)],bag_edge,.009)

root=bpy.data.objects.new('student ground pivot',None)
bpy.context.collection.objects.link(root)
for obj in list(bpy.context.scene.objects):
    if obj is not root: obj.parent=root
root.rotation_euler.z={'down':0,'left':-math.pi/2,'up':math.pi,'right':math.pi/2}[direction]
if state=='idle': root.scale.z=1+frame*.002

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 96
scene.cycles.use_denoising = False
scene.render.resolution_x = int(args[5]) if len(args)>5 else 640
scene.render.resolution_y = scene.render.resolution_x*5//4
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'Medium High Contrast'
scene.world.color = (.3,.3,.3)
for name,pos,power,size in [('warm campus key',(-3,-4,6),650,4),
                           ('soft fill',(4,-2,3),220,4),
                           ('rim',(-2,3,4),350,3)]:
    data = bpy.data.lights.new(name,'AREA')
    data.energy, data.size = power,size
    obj = bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.location = pos
    obj.rotation_euler = (Vector((0,0,.95))-obj.location).to_track_quat('-Z','Y').to_euler()
cam = bpy.data.cameras.new('fixed elevated orthographic')
camera = bpy.data.objects.new('fixed elevated orthographic',cam)
bpy.context.collection.objects.link(camera)
camera.location = (0,-6,5)
camera.rotation_euler = (Vector((0,0,.94))-camera.location).to_track_quat('-Z','Y').to_euler()
cam.type, cam.ortho_scale = 'ORTHO',2.24
scene.camera = camera
scene.render.filepath = output
# The Python source is retained; an editable .blend may be explicitly requested.
# Do not duplicate multi-megabyte scene files for every contact-sheet frame.
if '--save-blend' in args:
    bpy.ops.wm.save_as_mainfile(filepath=output.replace('.png','.blend'))
bpy.ops.render.render(write_still=True)
