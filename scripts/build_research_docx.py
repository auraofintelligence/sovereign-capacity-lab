import json,re,zipfile
from pathlib import Path
from datetime import datetime,timezone
from docx import Document
from docx.shared import Inches,Pt,RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from lxml import etree
W=Path(__file__).resolve().parent
ROOT=W.parent
OUT=ROOT/'documents/Mining_Materials_Power_and_Australian_Manufacturing_2026-11-07.docx'
S=json.loads((ROOT/'data/sources.json').read_text())
raw=(ROOT/'data/research-manuscript.txt').read_text(encoding='utf-8')
doc=Document();sec=doc.sections[0]
# Match the companion paper's A4 page format and reading typography.
sec.page_width=Inches(8.27);sec.page_height=Inches(11.69)
sec.top_margin=sec.bottom_margin=Inches(.8)
sec.left_margin=sec.right_margin=Inches(.85)
for name in ['Normal','Title','Subtitle','Heading 1','Heading 2']:
 s=doc.styles[name];s.font.name='Calibri';s.font.color.rgb=RGBColor(0,0,0)
 rpr=s.element.get_or_add_rPr();lang=OxmlElement('w:lang');lang.set(qn('w:val'),'en-AU');rpr.append(lang)
 for color in rpr.findall(qn('w:color')):
  for attr in ['themeColor','themeTint','themeShade']:color.attrib.pop(qn('w:'+attr),None)
 s.paragraph_format.widow_control=True
n=doc.styles['Normal'];n.font.size=Pt(12);n.paragraph_format.line_spacing=1.15;n.paragraph_format.space_after=Pt(8)
for name,size in [('Title',25),('Subtitle',12),('Heading 1',17),('Heading 2',14)]:
 s=doc.styles[name];s.font.size=Pt(size);s.paragraph_format.space_before=Pt(14 if name.startswith('Heading') else 0)
 s.paragraph_format.space_after=Pt(7);s.paragraph_format.keep_with_next=True;s.paragraph_format.page_break_before=False
for name in ['Heading 1','Heading 2']:doc.styles[name].font.bold=True
for s in doc.styles:
 for b in list(s.element.iter(qn('w:pBdr'))):b.getparent().remove(b)
rs=doc.styles.add_style('Reference entry',1);rs.base_style=n;rs.font.size=Pt(11)
rs.paragraph_format.line_spacing=1.1;rs.paragraph_format.space_after=Pt(5);rs.paragraph_format.keep_together=True
su=doc.styles.add_style('Summary body',1);su.base_style=n;su.paragraph_format.line_spacing=1.08;su.paragraph_format.space_after=Pt(6)
props=doc.core_properties;props.title='Mining materials and power for the Super Intelligence buildout'
props.subject='Growing industrial demand automation longevity and Australian domestic and export opportunities'
props.author='Prepared for Luke Nathan Hayes';props.language='en-AU'
props.created=props.modified=datetime(2026,11,7,tzinfo=timezone.utc)
links=[];used=[];texts=[]
def link(p,label,url):
 rel=p.part.relate_to(url,RT.HYPERLINK,is_external=True)
 el=OxmlElement('w:hyperlink');el.set(qn('r:id'),rel)
 run=OxmlElement('w:r');pr=OxmlElement('w:rPr');color=OxmlElement('w:color');color.set(qn('w:val'),'0563C1');pr.append(color)
 u=OxmlElement('w:u');u.set(qn('w:val'),'single');pr.append(u);run.append(pr)
 t=OxmlElement('w:t');t.text=label;t.set(qn('xml:space'),'preserve');run.append(t);el.append(run);p._p.append(el)
 links.append(dict(label=label,url=url))
def body(text,style=None):
 p=doc.add_paragraph(style=style);last=0
 for m in re.finditer(r'\{([a-z0-9-]+)\|([^{}]+)\}',text):
  p.add_run(text[last:m.start()]);key,label=m.groups();assert key in S,key
  link(p,label,S[key]['url']);last=m.end()
  if key not in used:used.append(key)
 p.add_run(text[last:]);
 if text.startswith(('14.4 per cent annual electricity growth:', '20 per cent annual electricity growth:', '30 per cent annual electricity growth:', '409.6 million robots ×')):p.paragraph_format.keep_together=True
 texts.append(re.sub(r'\{[a-z0-9-]+\|([^{}]+)\}',r'\1',text));return p
summary_pages=0
for i,block in enumerate(raw.strip().split('\n\n')):
 t=block.strip()
 if t=='[[PAGEBREAK]]':
  summary_pages+=1;doc.add_page_break();continue
 elif t.startswith('#'):
  mark,title=t.split(' ',1);assert re.fullmatch(r'[A-Za-z0-9 ]+',title),title
  doc.add_paragraph(title,{'#':'Title','##':'Heading 1','###':'Heading 2'}[mark]);texts.append(title)
 elif i in (1,2):body(t,'Subtitle')
 else:
  body(t,'Summary body' if summary_pages<2 else None)
  if t.startswith('Those quantities show the scale of the industrial race.'):
   p=doc.add_paragraph();p.paragraph_format.keep_with_next=True
   run=p.add_run();run.add_picture(str(ROOT/'assets/images/figure-factory-floor-word.png'),width=Inches(6.25))
   for element in run._r.iter(qn('wp:docPr')):
    element.set('descr','Floor areas across all levels: existing Giga Texas more than 929,000 square metres; new Optimus building reported above 650,000; planned Queensland Amazon centre 150,000; worked Australian module 20,000. Site land is separate.')
   caption=doc.add_paragraph('Factory floor space across all levels. Dates, status and source links are explained in the surrounding text. The Australian module is a worked design, dated 7 November 2026.')
   caption.paragraph_format.space_after=Pt(8)
   for run in caption.runs:run.font.size=Pt(11)

# Attach explicit section page breaks to the following paragraph, avoiding blank break-only pages.
for paragraph in list(doc.paragraphs):
 if paragraph._p.xpath('.//w:br[@w:type="page"]') and not paragraph.text.strip():
  following=paragraph._p.getnext()
  if following is not None and following.tag==qn('w:p'):
   ppr=following.find(qn('w:pPr'))
   if ppr is None:ppr=OxmlElement('w:pPr');following.insert(0,ppr)
   before=OxmlElement('w:pageBreakBefore');ppr.append(before)
   paragraph._p.getparent().remove(paragraph._p)
doc.add_heading('Reference register',1)
body('Inline links in the main text open the relevant public source. This register records publication dates or the date on which an undated page was checked. Company targets remain dated statements of intended capacity and timing. All model calculations and engineering assumptions were prepared on 7 November 2026.')
for idx,key in enumerate(used,1):
 s=S[key];p=doc.add_paragraph(style='Reference entry')
 p.add_run(f'{idx}. {s["org"]}. {s["date"]}. ')
 link(p,s['title'].replace('\u2014',', ').replace('\u2013',' to '),s['url']);p.add_run('.')
p=sec.footer.paragraphs[0];p.alignment=2;r=p.add_run();r.font.size=Pt(9)
field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');r._r.addnext(field)
OUT.parent.mkdir(parents=True,exist_ok=True);doc.save(OUT)
with zipfile.ZipFile(OUT) as z:
 x=etree.fromstring(z.read('word/document.xml'));alltext=' '.join(x.xpath('//w:t/text()',namespaces={'w':qn('w:t').split('}')[0][1:]}))
 assert '\u2014' not in alltext
 assert not re.search(r'\{[a-z0-9-]+\||\{\{|\brobyn?\b|\brobin\b',alltext,re.I)
 assert len(x.findall('.//'+qn('w:hyperlink')))==len(links)
audit=dict(path=str(OUT),body_words=len(' '.join(texts).split()),source_count=len(used),hyperlinks=len(links),em_dashes=alltext.count('\u2014'),used_sources=used,links=links)
(ROOT/'data/research-word-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in audit.items() if k not in ['links','used_sources']},indent=2))
