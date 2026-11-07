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
