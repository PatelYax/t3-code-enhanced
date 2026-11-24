"""Render reference-style atQor work anniversary cards."""
import argparse
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

ASSETS = Path(__file__).resolve().parent.parent / 'assets'

def centered(draw, text, y, width, maximum, minimum, spacing=0):
    for size in range(maximum, minimum-1, -1):
        font = ImageFont.truetype(str(ASSETS/'atQor-regular.ttf'), size)
        length = sum(draw.textlength(c, font=font) for c in text) + spacing*(len(text)-1)
        if length <= width:
            x = (1080-length)/2
            for c in text:
                draw.text((x,y), c, font=font, fill=(83,90,103))
                x += draw.textlength(c,font=font)+spacing
            return
    raise ValueError('Text does not fit; shorten the name.')

def render(config, output, base):
    name = str(config.get('name','')).strip()
    if not name: raise ValueError('name is required')
    years = config.get('years')
    if isinstance(years,bool) or not isinstance(years,int) or years<0:
        raise ValueError('years must be a supplied nonnegative integer')
    focus = config.get('photo_focus',[.5,.4]); zoom = float(config.get('photo_zoom',1))
    if len(focus)!=2 or any(not math.isfinite(float(v)) or not 0<=float(v)<=1 for v in focus):
        raise ValueError('photo_focus requires two values from 0 to 1')
    if not math.isfinite(zoom) or not 1<=zoom<=3: raise ValueError('photo_zoom must be from 1 to 3')
    if not config.get('photo'): raise ValueError('photo is required')
    path = Path(config['photo'])
    if not path.is_absolute(): path = base/path
    with Image.open(path) as raw: photo = ImageOps.exif_transpose(raw).convert('RGB')
    size=444
    scale=max(size/photo.width,size/photo.height)*zoom
    photo=photo.resize((math.ceil(photo.width*scale),math.ceil(photo.height*scale)),Image.Resampling.LANCZOS)
    x=round((photo.width-size)*float(focus[0])); y=round((photo.height-size)*float(focus[1]))
    photo=photo.crop((x,y,x+size,y+size))
    canvas=Image.open(ASSETS/'atQor-template.png').convert('RGBA')
    shadow=Image.new('RGBA',canvas.size)
    ImageDraw.Draw(shadow).ellipse((326,239,754,675),fill=(101,62,173,30))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(25)))
    ring=Image.new('RGB',(454,454)); rd=ImageDraw.Draw(ring)
    for y in range(454):
        t=y/453; rd.line((0,y,453,y),fill=(round(14+122*t),round(179-122*t),255))
    mask=Image.new('L',(454,454)); ImageDraw.Draw(mask).ellipse((0,0,453,453),fill=255)
    canvas.paste(ring,(313,200),mask)
    mask=Image.new('L',(size,size)); ImageDraw.Draw(mask).ellipse((0,0,size-1,size-1),fill=255)
    canvas.paste(photo,(318,205),mask)
    logo=Image.open(ASSETS/'atQor-logo.png').convert('RGBA')
    logo.thumbnail((210,65),Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo,((1080-logo.width)//2,75))
    canvas.alpha_composite(Image.open(ASSETS/'atQor-congratulations.png').convert('RGBA'),(215,680))
    draw=ImageDraw.Draw(canvas)
    centered(draw,name,870,920,56,25)
    centered(draw,f'{years} {"YEAR" if years==1 else "YEARS"} AT atQor',990,920,30,20,spacing=8)
    output.parent.mkdir(parents=True,exist_ok=True)
    canvas.convert('RGB').save(output,'PNG')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    config=json.loads(args.config.read_text(encoding='utf-8-sig'))
    if isinstance(config,list):
        for i,card in enumerate(config,1): render(card,args.output/f'atQor-anniversary-{i:03d}.png',args.config.parent)
    else: render(config,args.output,args.config.parent)

if __name__=='__main__': main()
