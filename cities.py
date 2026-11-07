from pathlib import Path
import html

ROOT=Path(__file__).resolve().parent
def cities_content(prose_line):
    blocks=['<p class="lead-rule">Twenty million people in the Quandamooka design. An Australian scenario of 100 million-plus by 2045. Useful infrastructure starts the work before a confirmed emergency changes its pace.</p>',
    '<p><a class="button" href="#city-calculator">Explore the 2045 requirements</a> <a href="report.html">Read the integrated paper</a></p>']
    for t in (ROOT/'data/cities-2045.txt').read_text(encoding='utf-8').split('\n\n'):
        if t.startswith('## '):continue
        if t.startswith('### '):blocks.append('<h2>'+html.escape(t[4:])+'</h2>')
        elif t.strip():blocks.append('<p>'+prose_line(t.strip())+'</p>')
    blocks.append('''<section id="city-calculator"><h2>Explore the 2045 requirements</h2><p>Design tests dated 7 November 2026. Change an assumption from the dropdown. The year, population and engineering performance targets remain editable. The annual curve solves for the expansion required to reach the selected volume.</p><div id="city-planner"><p>The fixed city case requires six billion cubic metres over 19 years, averaging about 316 million cubic metres annually. JavaScript enables changed inputs, the annual graph and downloads.</p></div><p>Metal benchmarks: refined copper 433,500 tonnes in 2024; primary aluminium 1.57 million tonnes in 2025; crude steel 5.223 million tonnes in 2025. Ten per cent allocation is a design test. These are gross production stages; qualify the feed and enter uncommitted allocations before procurement. City structures and new power systems require their own inventories.</p><p>Food conversion and water recovery are selected performance targets. The calculator does not contain a validated crop, nutrition, oxygen or complete nutrient model. The graph counts excavation volume. Operating habitat delivery requires lining, fit-out and functioning services.</p></section><script type="module" src="assets/city2045-ui.mjs?v=4"></script>''')
    return '<article class="prose">'+''.join(blocks)+'</article>'
