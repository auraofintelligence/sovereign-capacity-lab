import fs from 'node:fs';
import {defaults} from '../assets/state.mjs';
import {australianManufacturing} from '../assets/australian-manufacturing.mjs';
const base=australianManufacturing({...defaults,year:2036});
const faster=australianManufacturing({...defaults,year:2036,auFactoryGrowth:1.54});
const pilot=australianManufacturing({...defaults,year:2027,auModuleM2:4500,auSupportM2:1500});
const large=australianManufacturing({...defaults,year:2027,auModuleM2:50000,auSupportM2:10000});
fs.writeFileSync(new URL('../data/australian-opportunity-case.json',import.meta.url),JSON.stringify({date:'7 November 2026',dollar_basis:'Constant fourth-quarter 2025 Australian dollars',inputs:defaults,base,faster,pilot,large},null,2));
console.log(JSON.stringify({moduleCost:base.moduleCost,capacity:base.usablePerModule,output2036:base.produced,domestic2036:base.domesticLive,fasterFactories:faster.factories,fasterOutput:faster.produced,fasterDomestic:faster.domesticLive,pilotCost:pilot.moduleCost,largeCost:large.moduleCost}));
