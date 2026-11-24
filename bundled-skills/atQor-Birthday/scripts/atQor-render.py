"""Render atQor wish cards: python atQor-render.py --config card.json --output card.png."""
import argparse, json, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ASSETS = Path(__file__).resolve().parent.parent / 'assets'
MESSAGES = {
    'birthday': ('Wish you a very happy birthday\nand a wonderful year ahead!', 'Happy\nBirthday'),
    'anniversary': ('Thank you for your dedication.\nWishing you a happy work anniversary!', 'Work\nAnniversary'),
    'welcome': ('Welcome to atQor!\nWishing you a wonderful journey ahead.', 'Welcome'),
    'custom': ('Wishing you a wonderful day ahead!', 'Best Wishes'),
}

def font(size, bold=False):
    return ImageFont.truetype(str(ASSETS/('atQor-bold.ttf' if bold else 'atQor-regular.ttf')),size)

def fitted_text(draw, text, box, max_size, min_size=18, bold=False, fill='white'):
    x,y,w,h=box
    for size in range(max_size,min_size-1,-1):
        f=font(size,bold); lines=[]
        for paragraph in text.split('\n'):
            line=''
            for word in paragraph.split():
                if draw.textlength(word,font=f)>w:
                    raise ValueError('A word is too long to fit; shorten the text.')
                candidate=(line+' '+word).strip()
                if line and draw.textlength(candidate,font=f)>w:
                    lines.append(line); line=word
                else: line=candidate
            lines.append(line)
        content='\n'.join(lines)
        bounds=draw.multiline_textbbox((0,0),content,font=f,spacing=5)
        if bounds[3]-bounds[1]<=h:
            draw.multiline_text((x,y-bounds[1]),content,font=f,fill=fill,spacing=5)
            return
    raise ValueError('Text does not fit; shorten the message or name.')

def render(config, output, base):
    name=str(config.get('name','')).strip()
    if not name: raise ValueError('name is required')
    occasion=config.get('occasion','birthday')
    if occasion != 'birthday': raise ValueError('Use this renderer for birthdays; use atQor-Work-Anniversary for anniversaries')
    focus=config.get('photo_focus',[0.5,0.4]); zoom=float(config.get('photo_zoom',1))
    if len(focus)!=2 or any(not math.isfinite(float(v)) or not 0<=float(v)<=1 for v in focus):
        raise ValueError('photo_focus must contain two numbers between 0 and 1')
    if not math.isfinite(zoom) or not 1<=zoom<=3: raise ValueError('photo_zoom must be between 1 and 3')
    canvas=Image.open(ASSETS/'atQor-background.png').convert('RGBA')
    mask=Image.open(ASSETS/'atQor-photo-mask.png').convert('L')
    photo_name=config.get('photo')
    if not photo_name: raise ValueError('photo is required')
    photo_path=Path(photo_name)
    if not photo_path.is_absolute(): photo_path=base/photo_path
    with Image.open(photo_path) as raw:
        photo=ImageOps.exif_transpose(raw).convert('RGB')
    # Cover the frame, then choose crop position in remaining overflow.
    width,height=637,460
    scale=max(width/photo.width,height/photo.height)*zoom
    photo=photo.resize((math.ceil(photo.width*scale),math.ceil(photo.height*scale)),Image.Resampling.LANCZOS)
    left=round((photo.width-width)*float(focus[0])); top=round((photo.height-height)*float(focus[1]))
    layer=Image.new('RGBA',canvas.size)
    layer.paste(photo.crop((left,top,left+width,top+height)),(235,235))
    band=Image.new('RGBA',(637,80)); bd=ImageDraw.Draw(band)
    for x in range(637):
        t=x/636; bd.line((x,0,x,80),fill=(int(121-46*t),int(53+106*t),239,255))
    layer.alpha_composite(band,(235,695))
    canvas.paste(layer,(0,0),mask)
    canvas.alpha_composite(Image.open(ASSETS/'atQor-overlay.png').convert('RGBA'))
    draw=ImageDraw.Draw(canvas)
    fitted_text(draw,name,(259,714,360,43),34,min_size=18)
    message=str(config.get('message',MESSAGES[occasion][0]))
    greeting=str(config.get('greeting',MESSAGES[occasion][1]))
    if occasion=='birthday' and message==MESSAGES['birthday'][0]:
        # Keep the reference's mixed weight and shared baseline.
        x=259
        for text,bold in [('Wish',True),(' you a very ',False),('happy birthday',True)]:
            f=font(29,bold)
            draw.text((x,817),text,font=f,fill='white')
            x+=draw.textlength(text,font=f)
        draw.text((259,849),'and a wonderful year ahead!',font=font(29),fill='white')
    else:
        fitted_text(draw,message,(259,817,715,85),29,min_size=20)
    if occasion=='birthday' and greeting.replace('\n',' ').strip()=='Happy Birthday':
        # The source lettering is artwork; preserve it rather than substituting a font.
        canvas.alpha_composite(Image.open(ASSETS/'atQor-birthday-lettering.png').convert('RGBA'),(645,878))
    else:
        fitted_text(draw,greeting,(650,925,390,115),49,min_size=24,bold=True,fill=(153,135,231,255))
    output.parent.mkdir(parents=True,exist_ok=True)
    canvas.convert('RGB').save(output,format='PNG')

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--config',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True)
    args=p.parse_args()
    cfg=json.loads(args.config.read_text(encoding='utf-8-sig'))
    if isinstance(cfg,list):
        for index,card in enumerate(cfg,1):
            render(card,args.output/f'atQor-{card.get("occasion","birthday")}-{index:03d}.png',args.config.parent)
    else: render(cfg,args.output,args.config.parent)

if __name__=='__main__': main()
