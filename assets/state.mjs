export const version=2;
export const defaults={
 year:2026,chartEndYear:2036,powerTargetYear:2036,powerBuildGrowth:1.15,populationTargetYear:2036,
 start:2027,split:2031,first:1000000,early:2.5,late:1.6,
 robotKg:60,robotW:250,accident:.005,automation:.99,otherLoss:.0025,
 yield:.95,secondary:.5,cuKg:6,alKg:21,feKg:20,robotBatteryKWh:.5,
 serviceJobs:1000000,serviceKg:18,recondition:.1111111111,
 magnetKg:2.5,ndprShare:.3,substitution:.9,magnetRatio:2,
 baseEnergy:485,energyGrowth:.2,util:.8,pue:1.2,rackKg:1471.90724065,rackKW:120,
 solarGW:3000,solarCF:.25,windGW:1000,windCF:.35,nuclearGW:100,nuclearCF:.9,
 otherCleanGW:0,otherCleanCF:.8,
 transitionTWh:5000,essentialTWh:3000,retiredCleanTWh:500,
 pvLoadGW:96,pvCF:.25,storedShare:.65,cellEfficiency:.23,siliconMicron:120,silverMgW:10,pvFormula:'Si',pvDensity:2330,
 bufferLoadGW:120,bufferHours:16,dod:.9,charge:.95,discharge:.95,
 chemistry:'LiFePO4',ahkg:150,voltage:3.2,packWhKg:180,
 material:'Cu',feedFormula:'Cu',grade:.005,recovery:.85,primaryT:1000000,
 supplyNow:730000,supplyNeeded:1000000,supplyGrowth:1.05,supplyYears:10,
 refineryNameplate:5500,refineryRamp:.5,refineryAllocated:.25,
 orbitAddedGW:300,orbitComputeGW:1,orbitTonnesGW:10000,payloadT:100,
 orbitOverhead:1.2,orbitEfficiency:.23,sunFraction:.9,radiatorK:320,emissivity:.8,
 beamDeliveredGW:1,beamEfficiency:.4,
 propellantFormula:'CH4',propellantTonnes:4000,oxidiserRatio:3.6,flightMultiplier:1,hydrogenKWhKg:52,
 popBase:27600000,popTarget:31500000,peopleHome:2.5,robotsPerPerson:.1,buildYears:10,
 sites:3000,siteRatedKW:120,siteCostAUD:6000000,
 marketCu2025:28000000,marketCu2030:33000000,marketCu2035:38000000,marketCu2040:42000000,
 marketAl2025:106000000,marketAl2035:130000000,embeddedRobotCuT:0,embeddedRobotAlT:0,
 solarBuildGW:511.2,solarBuildGrowth:1.15,solarBuildYears:10,
 customMaterialKg:0,customMaterial:'Mg',materialEfficiency:1,
 exportShare:.01,beamingForGroundGW:0,
 components:'[{"name":"Example copper cable metal","qty":1000,"kg":1000,"formula":"Cu","yield":0.95,"secondary":0.5}]',
};
export const chemistries={
 lfp:{name:'Lithium iron phosphate',formula:'LiFePO4',ahkg:150,voltage:3.2},
 nmc811:{name:'Nickel manganese cobalt 811',formula:'LiNi0.8Mn0.1Co0.1O2',ahkg:180,voltage:3.7},
 sodium:{name:'Sodium vanadium phosphate',formula:'Na3V2(PO4)3',ahkg:110,voltage:3.4},
};
export const feedstocks={
 copper:{name:'Copper ore with elemental grade',element:'Cu',formula:'Cu',grade:.005,recovery:.85},
 chalcopyrite:{name:'Chalcopyrite mineral in ore',element:'Cu',formula:'CuFeS2',grade:.015,recovery:.85},
 bauxite:{name:'Bauxite expressed as alumina grade',element:'Al',formula:'Al2O3',grade:.5,recovery:.9},
 spodumene:{name:'Spodumene-bearing ore',element:'Li',formula:'LiAlSi2O6',grade:.15,recovery:.8},
 lithiumoxide:{name:'Lithium concentrate with Li2O grade',element:'Li',formula:'Li2O',grade:.06,recovery:.85},
 hematite:{name:'Hematite-bearing ore',element:'Fe',formula:'Fe2O3',grade:.85,recovery:.9},
 monazite:{name:'Illustrative NdPO4-bearing feed',element:'Nd',formula:'NdPO4',grade:.02,recovery:.75},
};
export function validateState(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('A scenario must be a JSON object.');
 const out={...defaults};
 for(const key of Object.keys(defaults))if(Object.hasOwn(data,key)){
   const v=data[key];
   if(typeof defaults[key]==='number'){
     if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1e15)throw Error(`Invalid value for ${key}.`);
   }else if(typeof v!=='string'||v.length>(key==='components'?50000:180))throw Error(`Invalid text for ${key}.`);
   if(key==='components'){
    let rows=JSON.parse(v);if(!Array.isArray(rows)||rows.length>100)throw Error('A ledger supports at most 100 components.');
    rows=rows.map(r=>{if(!r||typeof r.name!=='string'||r.name.length>100||typeof r.formula!=='string'||r.formula.length>180)throw Error('Invalid component name or formula.');for(const k of ['qty','kg','yield','secondary'])if(typeof r[k]!=='number'||!Number.isFinite(r[k])||r[k]<0||r[k]>1e15)throw Error('Invalid component quantity.');return {name:r.name,qty:r.qty,kg:r.kg,formula:r.formula,yield:r.yield,secondary:r.secondary};});
    out[key]=JSON.stringify(rows);continue;
   }
   out[key]=v;
 }
 return out;
}
export function readScenario(text){
 if(text.length>200000)throw Error('This scenario file is too large.');
 const parsed=JSON.parse(text);
 if(![1,version].includes(parsed.version))throw Error('This scenario version is not supported.');
 if(!parsed.inputs||typeof parsed.inputs!=='object'||Array.isArray(parsed.inputs))throw Error('A scenario must contain an inputs object.');
 const inputs={...parsed.inputs};
 if(parsed.version===1){inputs.powerTargetYear=inputs.year||2036;inputs.populationTargetYear=inputs.year||2036;}
 return validateState(inputs);
}
export function saveScenario(inputs){return JSON.stringify({version,date:'2026-11-07',inputs:validateState(inputs)},null,2);}
