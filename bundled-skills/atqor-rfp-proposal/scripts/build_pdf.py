"""Build a branded, selectable-text PDF from a task-local JSON specification."""
from pathlib import Path
import argparse, json, sys
from xml.sax.saxutils import escape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, PageBreak, Spacer,
    Table, TableStyle, Image, KeepTogether,
)
from reportlab.platypus.tableofcontents import TableOfContents

PAGE_W, PAGE_H = 595.32, 841.92
LEFT, WIDTH = 50.8, 503.7
BLUE = colors.HexColor('#2F5496')
BRAND = Path(__file__).resolve().parents[1] / 'assets' / 'brand'


def load_fonts(font_dir=None):
    folder = Path(font_dir) if font_dir else Path('C:/Windows/Fonts')
    fonts = {}
    for role, filename, fallback in [
        ('Body', 'calibri.ttf', 'Helvetica'),
        ('BodyBold', 'calibrib.ttf', 'Helvetica-Bold'),
        ('BodyItalic', 'calibrii.ttf', 'Helvetica-Oblique'),
        ('Heading', 'segoeuib.ttf', 'Helvetica-Bold'),
        ('Footer', 'trebuc.ttf', 'Helvetica'),
    ]:
        path = folder / filename
        if path.exists():
            pdfmetrics.registerFont(TTFont(role, str(path)))
            fonts[role] = role
        else:
            fonts[role] = fallback
            print(f'Font unavailable: {filename}; using {fallback}. Check fidelity.', file=sys.stderr)
    pdfmetrics.registerFontFamily(fonts['Body'], normal=fonts['Body'], bold=fonts['BodyBold'], italic=fonts['BodyItalic'], boldItalic=fonts['BodyBold'])
    return fonts


def resolve_file(value, base):
    path = Path(value)
    if not path.is_absolute():
        path = base / path
    if not path.is_file():
        raise FileNotFoundError(path)
    return path


def draw_image(c, path, x, top, width, max_height=None):
    reader = ImageReader(str(path))
    w, h = reader.getSize()
    height = width * h / w
    if max_height and height > max_height:
        width *= max_height / height
        height = max_height
    c.drawImage(reader, x, PAGE_H - top - height, width=width, height=height, mask='auto')


def ptext(value, html=False):
    value = str(value)
    return value if html else escape(value).replace('\n', '<br/>')


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, spec, fonts, **kwargs):
        super().__init__(*args, **kwargs)
        self.states = []
        self.spec, self.fonts = spec, fonts

    def showPage(self):
        self.states.append(dict(self.__dict__))
        self._startPage()

    def bookmarkPage(self, key, *args, **kwargs):
        # Pages are emitted only in save(). Bind destinations to their future
        # page references now, rather than the still-unemitted first page.
        page_counter = self._doc.pageCounter
        self._doc.pageCounter = self._pageNumber
        try:
            return super().bookmarkPage(key, *args, **kwargs)
        finally:
            self._doc.pageCounter = page_counter

    def save(self):
        total = len(self.states)
        for state in self.states:
            self.__dict__.update(state)
            if self._pageNumber > 1:
                self.setStrokeColor(colors.HexColor('#333333'))
                self.setLineWidth(0.7)
                self.line(LEFT, 54.5, LEFT + WIDTH, 54.5)
                self.setFillColor(colors.black)
                self.setFont(self.fonts['Footer'], 10)
                issuer = self.spec.get('issuer', 'atQor')
                self.drawString(LEFT, 40, self.spec.get('confidentiality', f'Confidential to {issuer}'))
                self.drawRightString(LEFT + WIDTH, 40, f'Page {self._pageNumber} of {total}')
            super().showPage()
        super().save()


class BrandedDoc(BaseDocTemplate):
    def __init__(self, output, spec, fonts, base):
        super().__init__(str(output), pagesize=(PAGE_W, PAGE_H), leftMargin=LEFT,
                         rightMargin=PAGE_W-LEFT-WIDTH, topMargin=98, bottomMargin=60,
                         title=spec['title'], author=spec.get('issuer', 'atQor'))
        self.spec, self.fonts, self.base = spec, fonts, base
        self.heading_index = 0
        self.logo = resolve_file(spec['logo_path'], base) if spec.get('logo_path') else BRAND/'atqor-logo.png'
        if spec.get('issuer', 'atQor') != 'atQor' and not spec.get('logo_path'):
            raise ValueError('For another issuer supply logo_path; do not transfer atQor branding.')
        frame = Frame(LEFT, 60, WIDTH, PAGE_H-98-60, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([
            PageTemplate(id='Cover', frames=[frame], onPage=self.cover, autoNextPageTemplate='Body'),
            PageTemplate(id='Body', frames=[frame], onPage=self.header),
        ])

    def beforeDocument(self):
        self.heading_index = 0

    def header(self, c, doc):
        draw_image(c, self.logo, LEFT, 35.4, 98.95, 31.1)

    def cover(self, c, doc):
        draw_image(c, BRAND/'cover-ribbon.png', 17.55, 20.4, PAGE_W-17.55)
        center = ParagraphStyle('CoverCenter', fontName=self.fonts['BodyBold'], fontSize=16, leading=21, alignment=TA_CENTER)
        title = Paragraph(ptext(self.spec['title']), center)
        _, height = title.wrap(WIDTH, 100)
        title.drawOn(c, LEFT, PAGE_H-260-height)
        client = Paragraph(ptext(self.spec['client']), center)
        _, ch = client.wrap(WIDTH, 60)
        client_top = max(282, 260+height+5)
        client.drawOn(c, LEFT, PAGE_H-client_top-ch)
        date_style = ParagraphStyle('Date', fontName=self.fonts['Body'], fontSize=12, leading=16, alignment=TA_CENTER)
        date = Paragraph(ptext(self.spec['date_display']), date_style)
        _, dh = date.wrap(WIDTH, 50)
        date.drawOn(c, LEFT, PAGE_H-max(323,client_top+ch+22)-dh)
        logo_reader = ImageReader(str(self.logo))
        lw, lh = logo_reader.getSize()
        logo_width = min(134.05, 42*lw/lh)
        draw_image(c, self.logo, (PAGE_W-logo_width)/2, 444.5, logo_width, 42)
        contact = self.spec.get('contact', 'E: info@atqor.com' if self.spec.get('issuer','atQor')=='atQor' else '')
        if contact:
            contact_style = ParagraphStyle('Contact', fontName=self.fonts['Body'], fontSize=10, leading=13, alignment=TA_CENTER)
            p = Paragraph(ptext(contact), contact_style)
            _, h = p.wrap(WIDTH, 25)
            p.drawOn(c, LEFT, PAGE_H-490-h)
        include_credentials = self.spec.get('include_credentials', self.spec.get('issuer','atQor')=='atQor')
        if include_credentials:
            badge = resolve_file(self.spec['credentials_path'],self.base) if self.spec.get('credentials_path') else BRAND/'cover-credentials.png'
            draw_image(c, badge, LEFT, 552.72, WIDTH, 130)
            caption = self.spec.get('credentials_caption', 'An ISO 9001, ISO 27001 certified company* Microsoft - Managed Gold Competency Partner\n2017, 2015, 2014 and 2013 Microsoft Worldwide Partner Award Winner for Cloud Productivity, Data Platform and Business Intelligence')
            style = ParagraphStyle('Caption', fontName=self.fonts['BodyItalic'], fontSize=10, leading=13, textColor=colors.grey)
            p = Paragraph(ptext(caption), style)
            _, h = p.wrap(WIDTH, 90)
            p.drawOn(c, LEFT, PAGE_H-714-h)

    def afterFlowable(self, flowable):
        if getattr(flowable, 'toc_entry', False):
            self.heading_index += 1
            key = f'section-{self.heading_index}'
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(flowable.getPlainText(), key, 0)
            self.notify('TOCEntry', (0, flowable.getPlainText(), self.page, key))


def build(spec_path, output, font_dir=None):
    spec_path = Path(spec_path).resolve()
    spec = json.loads(spec_path.read_text(encoding='utf-8-sig'))
    for key in ('title','client','date_display','sections'):
        if not spec.get(key):
            raise ValueError(f'Required current-project field: {key}')
    fonts = load_fonts(font_dir)
    body = ParagraphStyle('Body', fontName=fonts['Body'], fontSize=12, leading=17, spaceAfter=7)
    h1 = ParagraphStyle('H1', fontName=fonts['Heading'], fontSize=16, leading=21, textColor=BLUE, spaceAfter=11, keepWithNext=True, borderWidth=1.4, borderColor=BLUE, borderPadding=5)
    # Source uses an underline, not a boxed heading; attach a rule flowable below it.
    h1.borderWidth = 0
    h2 = ParagraphStyle('H2', parent=body, fontName=fonts['BodyBold'], textColor=BLUE, spaceBefore=9, keepWithNext=True)
    cell = ParagraphStyle('Cell', fontName=fonts['Body'], fontSize=10.5, leading=14)
    story = [Spacer(1, 1), PageBreak()]
    if spec.get('toc', True):
        toc_title = ParagraphStyle('ContentsTitle', parent=h1, alignment=TA_CENTER)
        story.append(Paragraph('Table of Contents', toc_title))
        toc = TableOfContents()
        toc.levelStyles = [ParagraphStyle('TOC', parent=body, leading=22)]
        toc.dotsMinLevel = 0
        story.extend([toc, PageBreak()])
    for index, section in enumerate(spec['sections']):
        if index and section.get('page_break_before', True):
            story.append(PageBreak())
        heading = Paragraph(ptext(section['heading']), h1)
        heading.toc_entry = section.get('toc', True)
        story.append(heading)
        rule = Table([['']], colWidths=[WIDTH], rowHeights=[2])
        rule.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),BLUE),('BOTTOMPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),0)]))
        story.extend([rule,Spacer(1,9)])
        for block in section.get('blocks', []):
            kind = block['type']
            if kind in ('paragraph','h2'):
                story.append(Paragraph(ptext(block['text'],block.get('html',False)), h2 if kind=='h2' else body))
            elif kind == 'bullets':
                level = int(block.get('level',0))
                style = ParagraphStyle(f'Bullet{level}', parent=body, leftIndent=16+18*level, bulletIndent=3+18*level, spaceAfter=5)
                for item in block['items']:
                    story.append(Paragraph(ptext(item,block.get('html',False)),style,bulletText='\u2022' if not level else 'o'))
            elif kind == 'table':
                headers, rows = block['headers'], block['rows']
                if any(len(row)!=len(headers) for row in rows):
                    raise ValueError('Table rows must match header column count')
                weights = block.get('widths',[1]*len(headers))
                if len(weights)!=len(headers) or any(w<=0 for w in weights):
                    raise ValueError('Table widths must be positive, one per column')
                widths=[WIDTH*w/sum(weights) for w in weights]
                dark=block.get('style','pale')=='control'
                header_style=ParagraphStyle('TableHeader',parent=cell,fontName=fonts['BodyBold'],textColor=colors.white if dark else colors.black)
                values=[[Paragraph(ptext(v),header_style) for v in headers]]+[[Paragraph(ptext(v),cell) for v in row] for row in rows]
                table=Table(values,colWidths=widths,repeatRows=1,hAlign='LEFT')
                fill = colors.HexColor('#305496') if dark else colors.white if block.get('style')=='plain' else colors.HexColor('#D9E2F3')
                table.setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.6,colors.black),('BACKGROUND',(0,0),(-1,0),fill),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
                story.extend([table,Spacer(1,10)])
            elif kind == 'image':
                path=resolve_file(block['path'],spec_path.parent)
                reader=ImageReader(str(path)); w,h=reader.getSize()
                width=min(float(block.get('width_pt',WIDTH)),WIDTH)
                height=width*h/w
                max_h=float(block.get('max_height_pt',500))
                if height>max_h: width*=max_h/height; height=max_h
                story.extend([Image(str(path),width=width,height=height,hAlign='CENTER'),Spacer(1,10)])
            elif kind == 'signatures':
                parties=block.get('parties',[spec.get('issuer','atQor'),spec['client']])
                if len(parties)!=2: raise ValueError('Signature block expects two current parties')
                values=[[Paragraph('Signed for and on behalf of:',body)]*2,
                        [Paragraph(ptext(p),body) for p in parties]]
                for label in ['Signed','Name','Title','Date']:
                    values.append([Paragraph(f'{label}: ........................................',body) for _ in parties])
                table=Table(values,colWidths=[WIDTH/2]*2)
                table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
                story.append(KeepTogether([Spacer(1,25),table]))
            elif kind == 'page_break':
                story.append(PageBreak())
            else:
                raise ValueError(f'Unsupported block type: {kind}')
    output=Path(output).resolve()
    if output==spec_path: raise ValueError('Output must not overwrite the specification')
    if output.exists(): raise FileExistsError(f'Choose a new output path: {output}')
    output.parent.mkdir(parents=True,exist_ok=True)
    doc=BrandedDoc(output,spec,fonts,spec_path.parent)
    doc.multiBuild(story,canvasmaker=lambda *a,**kw:NumberedCanvas(*a,spec=spec,fonts=fonts,**kw))
    print(output)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--spec',required=True)
    parser.add_argument('--output',required=True)
    parser.add_argument('--font-dir')
    args=parser.parse_args()
    build(args.spec,args.output,args.font_dir)
