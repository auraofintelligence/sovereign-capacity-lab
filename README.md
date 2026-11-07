# Sovereign Capacity Lab

A browser-based research and scenario laboratory for mining, materials, power, repairable robots and locally governed infrastructure. Created for Luke Nathan Hayes with Codex, 7 November 2026.

Public site: https://auraofintelligence.github.io/sovereign-capacity-lab/

This connects Joyful Responsible Abundance, Extreme Matter Atlas, the mining and infrastructure paper, Brisbane 2032, GAJRA Earth and A Fair Go in the Age of Superintelligence.

## Workbenches

- Power demand, additional generation and protected clean-energy transition and development allocations.
- Manufacturing growth, cohort survival, safer automation, repair modules and material inventories.
- Solar energy, storage losses, usable and nominal battery energy, alternative cathodes and photovoltaic absorbers.
- Elemental mass fractions, source minerals, ore grade, recovery, supply growth, commissioning and allocation.
- A project component ledger that converts selected chemical compositions to atomic material requirements.
- Orbital generation, thermal radiation, launch payloads and power beaming.
- Australian population, housing, civic robots, distributed compute, exports and a 2032 planning horizon.
- A complete reading edition and Word download, with dated references.

All calculators run locally in the browser. There are no accounts, analytics or model API calls. JSON imports and exports preserve scenario inputs. CSV exports retain quantities and units. Scenario links contain their inputs in the URL fragment.

## Run and test

Serve this directory using a static HTTP server, for example `python -m http.server 8765`.

Run `node --test scripts/model.test.mjs` for the physical and scenario tests. No dependencies are needed by the site or unit tests. `python build.py` regenerates the static HTML from the local research text and sources in `data`. The verified Word file in `documents` is retained separately.

The HTML reading edition, source register and navigation work without JavaScript. Interactive calculations need JavaScript. The repeated-day solar model illustrates timing and energy balance; it does not replace an hourly weather and network adequacy study.

## Images and reading navigation

Ten page-specific generated concepts, seven dated photographs and four worked explanatory figures are recorded in `data/visuals.json`. Responsive WebP assets live in `assets/images`. Exact generation prompts are in `data/image-prompts.json`. Image credits and individual photograph licences are published at `visuals.html`.

The worked figures are static examples with their own stated inputs. Interactive calculator results respond to scenario edits. Rebuild the figures with `python scripts/build_figures.py` after installing Matplotlib, NumPy and Pillow in a development environment. Figure data is also published in `data/figure-data.json`.

`experience.py` supplies image, navigation and footer components to `build.py`. Previous and next links, the all-pages menu, image credits, licence, site map and reading edition remain available without JavaScript. `navigation.js` adds the section index, reading progress, responsive menu behaviour and floating back-to-top link.

## Evidence and accounting

Default observations and assumptions are dated 7 November 2026. Market forecasts retain their original publication dates. The different boundaries of end use, external factory feed, primary metal, secondary metal, ore and installed capacity remain explicit.

Protected electricity allocations are never reassigned to compute or robots. Remaining deficits are displayed. The energy-demand curve does not imply that generation, transmission or dependable delivery is available.

Atomic data is adapted from Extreme Matter Atlas by Luke Nathan Hayes / Strange But True / Aura of Intelligence, an original Luke and Claude project. The licence and source attribution are retained. This is public source with commercial rights reserved, not a permissive open-source licence.

## Related public projects

- https://auraofintelligence.github.io/joyful-responsible-abundance/index.html
- https://auraofintelligence.github.io/extreme-matter-atlas/
- https://auraofintelligence.github.io/installing-the-missing-middle/
- https://auraofintelligence.github.io/gajra-earth-claude-build/
- https://auraofintelligence.github.io/i-C-infinity-music-universe/albums/a-protopian-gambit/

## Year explorer

The fresh view opens at 2026. `assets/scenario.mjs` is the shared pure calculation engine for both selected-year results and every plotted year. The visible chart window initially ends at 2036 and can extend to 2040. The selected year and the power or population plan year are separate inputs.

`assets/explorer.mjs` supplies live annual charts, pinned scenario comparison, exact readings, accessible data tables and a complete year-series CSV. Storage, ore, industrial output, orbital launch and radiator controls also have design-sensitivity curves. The project ledger has primary and secondary material bars. All graphics run locally without external chart libraries.

Additional power accumulates from the 2025 base to the separately entered plan year with a normalised annual construction multiplier. Protected annual allocations rise linearly over that interval. Both hold at their plan levels afterwards. Population uses a compound interpolation to its entered plan-year anchor, then extends that rate. These are explicit editable assumptions dated 7 November 2026, not measured annual production data.

Scenario format 2 retains these path inputs. Version 1 imports remain supported, using their original endpoint as their power and population plan year. Existing automatic tab settings migrate with their assumptions retained and the initial view moved to 2026. Subsequent chosen years persist between calculator pages.

## Australian manufacturing opportunity

`manufacture-australia.html` connects domestic civic robots, export orders, factory floor space, actual commissioning and finance. Its separate Australian programme is a component of the global industry, not an addition to the global total. `assets/australian-manufacturing.mjs` caps planned manufacture at the available factory output and preserves domestic and export cohorts separately.

The factory benchmark combines Tesla's April 2026 ten-million-unit long-term design ambition with Joe Tegtmeyer's 5 November 2026 observer report of more than seven million square feet for the Texas Optimus building. That reported area is editable and is not a Tesla-certified floor schedule. The Australian throughput factor is a hypothesis. Brisbane building rates come from the 2026 RLB Queensland digest, using fourth-quarter 2025 rates; land, equipment and other allowances remain explicit engineering inputs.

The worked case and every annual row are in `data/australian-opportunity-case.json`. Rebuild them with `node scripts/export_australian_case.mjs`. Text and dated evidence are in `data/australian-opportunity.txt` and `data/australian-opportunity-sources.json`. All cost accounts use constant late-2025 Australian dollars. Working capital is a current production-cash stock, separate from accumulated factory capital.

The compact explorer uses dropdowns for the graph and adjustable variable, with one active value beside the plot. Extended methods and comparison/export tools sit in a small expandable menu. The complete detailed inputs remain below.

The Australian opportunity is integrated into the research manuscript, its two-page executive summary and the current Word edition in `documents`. The 37-page Word edition has 87 cited sources and 202 hyperlinks. `scripts/build_research_docx.py` reproduces its document structure from the public manuscript and source register using python-docx and lxml; render and visually verify any rebuilt edition before publishing.
