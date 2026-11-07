from pathlib import Path
import html,json,re
from experience import figure
ROOT=Path(__file__).resolve().parent
def opportunity_intro():
 return '''<section class="prose"><p class="lead-rule">Build useful machines here, put them to work in Australian communities and export the capability.</p><p>A domestic robot industry can supply the physical missing middle: locally governed computing racks, power, workshops and civic robots. Owners retain operating authority, local data, repair access and the ability to disconnect. Individual Auras are software that can use this capability.</p><p><strong>Worked 2032 case:</strong> 312,500 robots manufactured during the year, eight factory modules, 109,375 exports and about 412,000 domestic robots operating. Factory and shared engineering capital: A$1.04 billion. Production working capital: A$2.73 billion.</p><p><strong>Worked 2036 case:</strong> 39 modules support about 1.687 million robots that year, including 590,000 exports. Meeting the full 2.048 million ambition needs 48 modules. About 3.059 million domestic machines remain operating. Factory and shared engineering capital: A$4.68 billion. Working capital: A$14.76 billion.</p><p>These are adjustable scenarios dated 7 November 2026, in constant late-2025 Australian dollars. <a href="data/australian-opportunity-case.json">Inspect all inputs and annual calculations</a>. <a href="#australian-evidence">Read the factory evidence and delivery path</a>.</p></section>'''
def opportunity_body(prose_line):
 text=(ROOT/'data/australian-opportunity.txt').read_text(encoding='utf-8');blocks=[];count=0
 for raw in text.split('\n\n'):
  raw=raw.strip()
  if not raw:continue
  if raw.startswith('## '):continue
  if raw.startswith('### '):
   count+=1;blocks.append('<h2 id="au-evidence-'+str(count)+'">'+html.escape(raw[4:])+'</h2>')
   if raw.startswith('### Domestic use'):blocks.append('<p><a href="#calculator">Adjust the manufacturing and export scenario ↑</a></p>')
  else:blocks.append('<p>'+prose_line(raw)+'</p>')
  if raw.startswith('Those quantities show'):blocks.append(figure('figure-factory-floor'))
  if raw.startswith('The worked Australian factory module'):blocks.append(figure('hero-opportunity'))
 return '<article id="australian-evidence" class="prose">'+''.join(blocks)+'</article>'
