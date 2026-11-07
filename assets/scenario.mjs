import * as M from './model.mjs?v=2';
export function calculateScenario(s,weights){
 if(!Number.isInteger(s.year)||s.year<2026||s.year>2040)throw Error("Choose a whole year from 2026 to 2040.");
 M.positive(s.energyGrowth,'Annual compute electricity growth');
 if(!Number.isInteger(s.solarBuildYears)||s.solarBuildYears<1||s.solarBuildYears>50)throw Error('Choose one to fifty whole years for generation construction.');
 M.positive(s.rackKW,'Rack rating',false);M.positive(s.packWhKg,'Complete pack energy density',false);
 const f=M.fleet({first:s.first,growthEarly:s.early,growthLate:s.late,start:s.start,end:s.year,split:s.split,accident:s.accident,automationReduction:s.automation,otherLoss:s.otherLoss});
 const energy=s.baseEnergy*(1+s.energyGrowth)**(s.year-2025),rated=M.energyToRated(energy,s.util,s.pue);
 const c=M.compute({ratedGW:rated,util:s.util,pue:s.pue,robotFleet:f.live,robotW:s.robotW});
 const progress=M.buildProgress(s.year,s.powerTargetYear,s.powerBuildGrowth);
 const generationPlan=M.generation([{name:'Solar',gw:s.solarGW,cf:s.solarCF},{name:'Wind',gw:s.windGW,cf:s.windCF},{name:'Nuclear',gw:s.nuclearGW,cf:s.nuclearCF},{name:'Other new clean generation',gw:s.otherCleanGW,cf:s.otherCleanCF}]);
 const generation=M.generation(generationPlan.items.map(r=>({...r,gw:r.gw*progress.capacityShare})));
 const allocations={transition:s.transitionTWh*progress.allocationShare,essential:s.essentialTWh*progress.allocationShare,retirement:s.retiredCleanTWh*progress.allocationShare};
 const groundProject=Math.max(0,c.computeTWh-s.baseEnergy)+c.robotTWh;
 const budget=M.cleanBudget(generation.twh,allocations.transition,allocations.essential,allocations.retirement,groundProject);
 const batteryRobot=M.battery({formula:s.chemistry,ahkg:s.ahkg,voltage:s.voltage,kwh:s.robotBatteryKWh},weights);
 const perMachineMotor=M.motor({units:1,magnetKg:s.magnetKg,avoided:s.substitution,ndpr:s.ndprShare,massRatio:s.magnetRatio},weights);
 const motors=Object.fromEntries(Object.entries(perMachineMotor).map(([k,v])=>[k,v*f.units]));
 const perRobot={Cu:s.cuKg*s.materialEfficiency,Al:s.alKg*s.materialEfficiency,Fe:s.feKg*s.materialEfficiency};
 for(const [e,kg] of Object.entries(batteryRobot.elements))perRobot[e]=(perRobot[e]||0)+kg;
 perRobot.Fe+=perMachineMotor.alternativeFeT*1000;
 perRobot.NdPr=perMachineMotor.ndprT*1000;
 if(s.customMaterialKg){if(!weights[s.customMaterial])throw Error('Choose a known additional element.');perRobot[s.customMaterial]=(perRobot[s.customMaterial]||0)+s.customMaterialKg;}
 const inventory=Object.fromEntries(Object.entries(perRobot).map(([e,kg])=>[e,{kg,...M.procurement(f.units*kg/1000,s.yield,s.secondary)}]));
 const store=M.storage({loadGW:s.bufferLoadGW,hours:s.bufferHours,dod:s.dod,charge:s.charge,discharge:s.discharge});
 const pv=M.solar({averageGW:s.pvLoadGW,cf:s.pvCF,stored:s.storedShare,roundTrip:store.roundTrip,cellEfficiency:s.cellEfficiency,thicknessMicron:s.siliconMicron,silverMgW:s.silverMgW,densityKgM3:s.pvDensity});
 pv.chemistry=M.parseFormula(s.pvFormula,weights);
 const gridBattery=M.battery({formula:s.chemistry,ahkg:s.ahkg,voltage:s.voltage,kwh:store.nominalGWh*1e6},weights);
 const ore=M.ore({primaryT:s.primaryT,grade:s.grade,recovery:s.recovery,formula:s.feedFormula,element:s.material},weights);
 const cap=M.capacity({current:s.supplyNow,needed:s.supplyNeeded,years:s.supplyYears,growthFactor:s.supplyGrowth});
 const orbit=M.orbit({addedGW:s.orbitAddedGW,tonnesPerGW:s.orbitTonnesGW,payloadPerFlight:s.payloadT,computeGW:s.orbitComputeGW,overhead:s.orbitOverhead,solarEfficiency:s.orbitEfficiency,sunFraction:s.sunFraction,emissivity:s.emissivity,temperatureK:s.radiatorK});
 const beam=M.beaming(s.beamDeliveredGW,s.beamEfficiency);
 const propellant=M.propellant({payloadFlights:orbit.flights,flightMultiplier:s.flightMultiplier,tonnesPerFlight:s.propellantTonnes,oxidiserRatio:s.oxidiserRatio,formula:s.propellantFormula,kwhPerKgH:s.hydrogenKWhKg},weights);
 const population=M.populationAtYear(s.popBase,s.popTarget,s.populationTargetYear,s.year);
 const pop=M.population({base:s.popBase,target:population,peoplePerHome:s.peopleHome,robotsPerPerson:s.robotsPerPerson,buildYears:s.buildYears,robotW:s.robotW,robotKg:s.robotKg});
 const service=M.maintenance({jobs:s.serviceJobs,kg:s.serviceKg,recondition:s.recondition});
 const refinery=M.supplyRamp({nameplate:s.refineryNameplate,ramp:s.refineryRamp,allocation:s.refineryAllocated});
 const rackT=c.ratedGW*1e6/s.rackKW*s.rackKg/1000;
 const solarBuilds=Array.from({length:s.solarBuildYears},(_,i)=>s.solarBuildGW*s.solarBuildGrowth**i);
 const solarBuildTotal=solarBuilds.reduce((a,b)=>a+b,0);
 function interpolate(y){const points=[[2025,s.marketCu2025],[2030,s.marketCu2030],[2035,s.marketCu2035],[2040,s.marketCu2040]];if(y<2025||y>2040)throw Error('Market comparison supports 2025 to 2040.');for(let i=1;i<points.length;i++){const [a,va]=points[i-1],[b,vb]=points[i];if(y<=b)return va+(vb-va)*(y-a)/(b-a);}}
 const cuBase=interpolate(s.year),alBase=s.marketAl2025*(s.marketAl2035/s.marketAl2025)**((s.year-2025)/10);
 const cuMarket=cuBase+Math.max(0,inventory.Cu.finished-s.embeddedRobotCuT),alMarket=alBase+Math.max(0,inventory.Al.finished-s.embeddedRobotAlT);
 const ledger=M.inventory(JSON.parse(s.components),weights);
 return {f,c,generation,generationPlan,progress,allocations,population,budget,batteryRobot,motors,perRobot,inventory,store,pv,gridBattery,ore,cap,orbit,beam,propellant,pop,service,refinery,rackT,solarBuildTotal,solarBuilds,cuBase,alBase,cuMarket,alMarket,ledger};
}

export function yearSeries(s,weights,end=s.chartEndYear){
 if(!Number.isInteger(end)||end<2026||end>2040)throw Error("Choose a chart end year from 2026 to 2040.");
 return Array.from({length:end-2026+1},(_,i)=>{const year=2026+i;return {year,...calculateScenario({...s,year},weights)};});
}
