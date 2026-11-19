"""Assemble one consistent factory yard background from the approved v2 sprites.
Run after extracting public/world/v2, before Vite build.
"""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path("public/world/v2")
OUT=ROOT/"factory_grounds_composite.png"
W,H=1024,768
def load(path):
    p=ROOT/path
    return Image.open(p).convert("RGBA") if p.exists() else None
def draw_img(canvas,path,box):
    im=load(path)
    if im is None:return
    x,y,w,h=box
    scale=min(w/im.width,h/im.height)
    size=(max(1,round(im.width*scale)),max(1,round(im.height*scale)))
    im=im.resize(size,Image.Resampling.NEAREST)
    canvas.alpha_composite(im,(int(x+(w-size[0])/2),int(y+(h-size[1])/2)))
def tile(canvas,path,box):
    im=load(path)
    if im is None:return
    x,y,w,h=box
    # Tile inside a clipped region without resizing or seams.
    for py in range(y,y+h,im.height):
        for px in range(x,x+w,im.width):
            part=im.crop((0,0,min(im.width,x+w-px),min(im.height,y+h-py)))
            canvas.alpha_composite(part,(px,py))
im=Image.new("RGBA",(W,H),(111,151,79,255))
tile(im,"terrain/grass.png",(0,0,W,H))
tile(im,"terrain/gravel.png",(714,92,274,297))
tile(im,"terrain/parking.png",(148,502,554,183))
tile(im,"terrain/road.png",(0,686,1024,82))
tile(im,"terrain/road.png",(366,468,80,35))
d=ImageDraw.Draw(im)
d.line([(148,502),(702,502)],fill="#c6c3a5",width=4)
for i in range(7):
    x=160+i*77
    d.line([(x,538),(x,645)],fill="#f2e9c3",width=3)
    d.line([(x,538),(x+54,538)],fill="#f2e9c3",width=3)
d.line([(148,686),(702,686)],fill="#c6c3a5",width=4)
for x in range(0,W,68):
    d.line([(x,725),(x+37,725)],fill="#dcb765",width=4)
draw_img(im,"sprites/factory_exterior.png",(100,88,570,385))
draw_img(im,"buildings/mine_plot_empty.png",(735,140,240,200))
draw_img(im,"buildings/mine_blueprint_overlay.png",(740,135,238,210))
draw_img(im,"sprites/tree_broadleaf.png",(20,65,140,125))
draw_img(im,"sprites/tree_pine.png",(665,28,80,115))
draw_img(im,"sprites/wooden_crate.png",(927,399,60,66))
draw_img(im,"sprites/forklift.png",(735,402,160,115))
draw_img(im,"sprites/bench.png",(38,475,86,64))
draw_img(im,"sprites/factory_gate.png",(334,670,150,87))
OUT.parent.mkdir(parents=True,exist_ok=True)
im.save(OUT,optimize=True)
print(f"Generated {OUT}: {im.size}")
