"""Static, accessible visual and navigation components for build.py."""
from pathlib import Path
import html, json, re

ROOT = Path(__file__).resolve().parent
BASE = 'https://auraofintelligence.github.io/sovereign-capacity-lab/'
VISUALS = json.loads((ROOT/'data/visuals.json').read_text(encoding='utf-8'))
E = html.escape

def image(key, hero=False):
    v = VISUALS[key]
    variants = v['variants']; big = variants[-1]
    srcset = ', '.join(f"{x['path']} {x['width']}w" for x in variants)
    return (f'<img class="{"hero-image" if hero else "inline-image"}" src="{big["path"]}" '
            f'srcset="{srcset}" sizes="{"100vw" if hero else "(max-width: 720px) 90vw, (max-width: 1200px) 75vw, 1000px"}" '
            f'width="{big["width"]}" height="{big["height"]}" alt="{E(v["alt"],quote=True)}" '
            f'loading="{"eager" if hero else "lazy"}" decoding="async"'+(' fetchpriority="high"' if hero else '')+'>')

def figure(key, after=None):
    v=VISUALS[key]; kind=v['type']
    label={'generated':'AI-generated concept image','photograph':'Photograph','figure':'Fixed worked example'}[kind]
    source=f' · <a href="{E(v["source_url"],quote=True)}">Source</a>' if v.get('source_url') else ''
    attr=f' data-after-section="{after}"' if after else ''
    return (f'<figure class="reading-figure {kind}"{attr}><picture>{image(key)}</picture><figcaption>'
            f'<span class="figure-label">{label}</span>{E(v["caption"])}'
            f'<span class="credit">{E(v["creator"])} · {E(v["date"])} · '
            f'<a href="{E(v["license_url"],quote=True)}">{E(v["license"])}</a>{source} · '
            f'<a href="visuals.html#{key}">Credits and details</a> · '
            f'<a href="{v["variants"][-1]["path"]}">Open full-size image</a></span></figcaption></figure>')

EXAMPLES = {
 'overview':[('photo-industrial-robots','scenario')],
 'power':[('photo-pleiades','power'),('photo-solar-farm','construction')],
 'machines':[('photo-optimus','manufacture'),('figure-production-fleet','materials'),('figure-repair-material','repairs')],
 'storage':[('photo-solar-farm','solar'),('figure-compound-elements','cathode'),('figure-day-storage','day')],
 'matter':[('photo-copper-mine','feedstock'),('figure-compound-elements','supply')],
 'ledger':[('figure-repair-material','ledger')],
 'space':[('photo-iss-arrays','orbital')],
 'australia':[('photo-brisbane','australia'),('photo-industrial-robots','exports')],
}

REPORT_INSERTS = {
 'The material in one robot': (1,'photo-optimus'),
 'Existing global and Australian production': (2,'photo-copper-mine'),
 'Five manufacturing horizons': (2,'figure-production-fleet'),
 'Put the metal volumes in familiar dimensions': (2,'photo-industrial-robots'),
 'Servicing keeps material productive': (6,'figure-repair-material'),
 'Ground computing needs a range of power expansion cases': (2,'photo-pleiades'),
 'Generation and storage also require materials': (3,'photo-solar-farm'),
 'Space computing carries its power supply': (2,'photo-iss-arrays'),
 'From manufactured material to source minerals': (2,'figure-compound-elements'),
 'Australian opportunities to meet domestic and export needs': (2,'photo-brisbane'),
}

def examples(key):
    return '<div class="visual-notes">'+''.join(figure(v,a) for v,a in EXAMPLES.get(key,[]))+'</div>' if key in EXAMPLES else ''

def credits():
    out=['<div class="prose"><p>Real photographs show dated equipment and places. The page heroes are AI-generated concepts created on 7 November 2026. Worked figures use the stated scenario inputs. Every photograph retains its own reuse licence.</p><p><a href="data/image-prompts.json">Download the exact generation prompts</a> · <a href="data/figure-data.json">Download the worked figure data</a> · <a href="data/visuals.json">Download all image credits</a></p></div>']
    for key,v in VISUALS.items():
        out.append(f'<section class="visual-credit-entry prose" id="{key}"><h2>{E(v["title"])}</h2>{image(key)}<p>{E(v["caption"])}</p><p>{E(v["creator"])} · {E(v["date"])}</p><p>Licence: <a href="{E(v["license_url"],quote=True)}">{E(v["license"])}</a>.'+ (f' <a href="{E(v["source_url"],quote=True)}">Original source or calculation data</a>.' if v.get('source_url') else '')+'</p>')
        if v.get('changes'):out.append('<p>File preparation: '+E(v['changes'])+'</p>')
        if v.get('prompt'):out.append('<details><summary>Exact image generation prompt</summary><blockquote>'+E(v['prompt'])+'</blockquote></details>')
        out.append('</section>')
    # The favicon is generated independently from the photographic hero set.
    out.append('<section class="visual-credit-entry prose" id="favicon"><h2>Generated site icon</h2><img src="icon-192.png" width="192" height="192" alt="Three interwoven bands around a glowing cube on deep green"><p>Generated on 7 November 2026 for Luke Nathan Hayes using built-in image generation. Used under the Strange But True Public Source Licence. The exact prompt is retained in the downloadable prompt record above.</p></section>')
    return ''.join(out)

def licence():
    lines=(ROOT/'LICENCE.md').read_text(encoding='utf-8').split('\n\n');out=[]
    for p in lines:
        p=p.strip()
        if not p or p.startswith('# '):continue
        if p.startswith('## '):out.append('<h2>'+E(p[3:])+'</h2>')
        elif p.startswith('- '):out.append('<ul>'+''.join('<li>'+E(x[2:])+'</li>' for x in p.splitlines())+'</ul>')
        else:
            t=E(p).replace('\n','<br>')
            t=re.sub(r'https://github.com/[a-zA-Z0-9_/-]+',lambda m:f'<a href="{m[0]}">{m[0]}</a>',t)
            out.append('<p>'+t+'</p>')
    return '<article class="prose licence-text"><p><a href="LICENCE.md">Download the licence text</a> · <a href="data/Extreme_Matter_Atlas_LICENCE.md">Original element dataset licence</a> · <a href="visuals.html">Photograph licences</a></p>'+''.join(out)+'</article>'

def navlinks(pages, filename):
    return ''.join(f'<a href="{f}"'+(' aria-current="page"' if f==filename else '')+'>'+E(n)+'</a>' for f,k,n,t,d in pages)

def render(filename,key,title,desc,content,pages,iscalc,docname):
    hero='hero-'+key
    hashero=hero in VISUALS
    share=BASE+VISUALS[hero]['variants'][-1]['path'] if hashero else BASE+'icon-512.png'
    navigation=navlinks(pages,filename)
    menu='<p class="menu-heading">Explore and calculate</p>'+navlinks(pages[:9],filename)+'<p class="menu-heading">Read and check</p>'+navlinks(pages[9:],filename)
    idx=next(i for i,p in enumerate(pages) if p[0]==filename)
    previous=(f'<a rel="prev" href="{pages[idx-1][0]}"><span class="sequence-direction">Previous</span><span class="sequence-title">{E(pages[idx-1][2])}</span></a>' if idx else '<span class="sequence-start">Start of the laboratory</span>')
    nxt=pages[idx+1] if idx+1<len(pages) else pages[0]
    sequence=previous+'<a class="sequence-index" href="site-map.html"><span class="sequence-direction">'+str(idx+1)+' of '+str(len(pages))+'</span><span class="sequence-title">All pages</span></a>'+f'<a rel="next" href="{nxt[0]}"><span class="sequence-direction">{"Next" if idx+1<len(pages) else "Back to start"}</span><span class="sequence-title">{E(nxt[2])}</span></a>'
    action='<a class="button" href="#calculator">Open the calculator</a>' if iscalc else '<a class="button" href="#paper-start">Start reading</a>' if key=='report' else ''
    if key in ('overview','report','opportunity'):action+=f'<a class="button secondary" href="documents/{docname}">Download Word paper</a>'
    herohtml=f'<section class="page-hero{ " metadata-hero" if not hashero else ""}" aria-label="Page introduction">'+(image(hero,True)+'<div class="hero-shade"></div>' if hashero else '')+f'<div class="hero-copy"><p class="eyebrow">A Fair Go in the Age of Superintelligence</p><h1>{E(title)}</h1><p class="lede">{E(desc)}</p>'+(f'<div class="hero-actions">{action}</div>' if action else '')+'</div></section>'
    if hashero:herohtml+=f'<p class="hero-credit">AI-generated concept image · 7 November 2026 · <a href="visuals.html#{hero}">Image credits and prompt</a></p>'
    scripts='<script src="assets/navigation.js" defer></script>'+('<script src="assets/elements.js" defer></script><script type="module" src="assets/app.mjs?v=3"></script>' if iscalc else '')
    return f'''<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="{E(desc,quote=True)}"><meta name="theme-color" content="#173e35"><title>{E(title)} | Sovereign Capacity Lab</title><link rel="canonical" href="{BASE+filename}"><link rel="icon" href="favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png"><link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="manifest" href="site.webmanifest"><meta property="og:type" content="website"><meta property="og:title" content="{E(title,quote=True)}"><meta property="og:description" content="{E(desc,quote=True)}"><meta property="og:url" content="{BASE+filename}"><meta property="og:image" content="{share}"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="assets/style.css"><link rel="stylesheet" href="assets/experience.css"><link rel="stylesheet" href="assets/explorer.css?v=3"></head><body id="top" data-page="{key}"><a class="skip" href="#main">Skip to content</a><header class="masthead"><a class="brand" href="index.html"><img src="icon-192.png" width="48" height="48" alt=""><span>Sovereign Capacity Lab<small>Atoms to useful capability</small></span></a><div class="header-links"><a href="index.html#calculator">Calculators</a><a href="report.html">Read the paper</a><details class="all-pages"><summary>All pages</summary><nav aria-label="All pages">{menu}</nav></details></div><div class="reading-progress" aria-hidden="true"><span></span></div></header>{herohtml}<div class="shell"><aside class="rail"><details class="primary-nav" open><summary>Explore the laboratory</summary><nav aria-label="Main navigation">{navigation}</nav></details><div class="section-nav" hidden><p class="nav-label">On this page</p><nav aria-label="On this page"></nav></div><p class="small">Joyful responsible abundance<br>Personal local and national sovereignty</p></aside><main id="main"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Laboratory</a><span aria-hidden="true">/</span><span>{E(next(p[2] for p in pages if p[0]==filename))}</span></nav><div class="chapter-meta"><p>Research and default assumptions dated <time datetime="2026-11-07">7 November 2026</time></p>{'<a class="jump-calculator" href="#calculator">Jump to calculator ↓</a>' if iscalc else ''}</div>{content}</main></div><footer class="site-footer"><nav class="page-sequence" aria-label="Previous and next pages">{sequence}</nav><div class="footer-inner"><div class="footer-grid"><section><h2>Useful capability, shared authority</h2><p>Luke Nathan Hayes · Aura of Intelligence · 2026</p><p>Independent scenario tools for useful machines, clean energy and distributed capability.</p><p>Calculations run locally in your browser. No account, analytics or model API.</p></section><section><h2>Read and check</h2><a href="report.html">Read the research paper</a><a href="documents/{docname}">Download the Word paper</a><a href="sources.html">Sources and methods</a><a href="visuals.html">Image credits and prompts</a><a href="licence.html">Strange But True licence</a><a href="https://github.com/auraofintelligence/sovereign-capacity-lab">Public repository</a></section><section><h2>Connected projects</h2><a href="https://auraofintelligence.github.io/joyful-responsible-abundance/index.html">Joyful Responsible Abundance</a><a href="https://auraofintelligence.github.io/extreme-matter-atlas/">Extreme Matter Atlas</a><a href="https://auraofintelligence.github.io/installing-the-missing-middle/">A Fair Go in the Age of Superintelligence</a><a href="https://auraofintelligence.github.io/gajra-earth-claude-build/">GAJRA Earth</a><a href="https://auraofintelligence.github.io/i-C-infinity-music-universe/albums/a-protopian-gambit/">A Protopian Gambit</a></section></div><div class="footer-bottom"><p>Public source. Commercial rights reserved. Third-party photographs retain their own licences.</p><a href="site-map.html">Site map</a></div><a class="back-top" href="#top"><span aria-hidden="true">↑</span>Back to top</a></div></footer>{scripts}</body></html>'''
