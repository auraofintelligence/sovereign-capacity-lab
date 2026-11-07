/* Sovereign Capacity Lab. SI units at every boundary. 7 November 2026. */
export function positive(x, name, zero=true) {
  if (!Number.isFinite(+x) || +x < 0 || (!zero && +x === 0)) throw Error(`${name} must be ${zero?'zero or ':''}positive.`);
  return +x;
}
export function fraction(x,name,zero=true) {
  x=positive(x,name,zero); if(x>1) throw Error(`${name} must be at most 100 per cent.`); return x;
}
export function parseFormula(formula, weights) {
  const f=String(formula).replace(/[₀-₉]/g,c=>'₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).replace(/\s/g,'');
  if(!f || f.length>180) throw Error('Enter a chemical formula of up to 180 characters.');
  let i=0;
  function count(){let m=f.slice(i).match(/^(?:\d+(?:\.\d+)?|\.\d+)/);if(!m)return 1;i+=m[0].length;return positive(+m[0],'Atom count',false);}
  function group(depth=0){
    if(depth>10)throw Error('Formula nesting is too deep.');
    let out={}, seen=false;
    while(i<f.length && f[i]!==')') {
      let atoms={};
      if(f[i]==='('){i++;atoms=group(depth+1);if(f[i]!==')')throw Error('Missing closing bracket.');i++;}
      else {const m=f.slice(i).match(/^[A-Z][a-z]?/);if(!m)throw Error(`Check the formula near ${f.slice(i)}.`);i+=m[0].length;if(!weights[m[0]])throw Error(`Unknown element ${m[0]}.`);atoms[m[0]]=1;}
      let n=count();for(const [e,v] of Object.entries(atoms))out[e]=(out[e]||0)+v*n;seen=true;
    }if(!seen)throw Error('An empty formula group cannot be used.');return out;
  }
  const atoms=group();if(i!==f.length)throw Error('Unexpected closing bracket.');
  const molarMass=Object.entries(atoms).reduce((s,[e,n])=>s+n*weights[e],0);
  if(!Number.isFinite(molarMass)||molarMass<=0)throw Error('Formula mass exceeds the supported range.');
  return {formula:f,atoms,molarMass,fractions:Object.fromEntries(Object.entries(atoms).map(([e,n])=>[e,n*weights[e]/molarMass]))};
}
export function fleet(p) {
  const first=positive(p.first,'First production',false),g1=positive(p.growthEarly,'Early growth factor',false),g2=positive(p.growthLate,'Later growth factor',false);
  const accident=fraction(p.accident,'Accident loss'),reduction=fraction(p.automationReduction,'Automation improvement'),other=fraction(p.otherLoss,'Other permanent losses');
  const hazard=1-(1-accident*(1-reduction))*(1-other);
  const start=+p.start,end=+p.end,split=+p.split;
  if(![start,end,split].every(Number.isInteger)||Math.abs(end-start)>60||split<start)throw Error('Use whole years with a horizon of at most 60 years.');
  if(end<start)return {rows:[],hazard,year:end,units:0,cumulative:0,live:0,retired:0};
  let cumulative=0,rows=[];
  for(let year=start;year<=end;year++){
    const units=first*g1**Math.min(year-start,split-start)*g2**Math.max(0,year-split);
    if(!Number.isFinite(units)||units>1e15)throw Error('Production exceeds the supported scenario range.');
    cumulative+=units;const live=rows.reduce((s,r)=>s+r.units*(1-hazard)**(year-r.year),0)+units;
    rows.push({year,units,cumulative,live,retired:cumulative-live});
  }return {rows,hazard,...rows.at(-1)};
}
// New capacity is accumulated from annual construction, normalised to a dated plan.
export function buildProgress(year,targetYear,growth=1,baseYear=2025){
  if(![year,targetYear,baseYear].every(Number.isInteger)||targetYear<=baseYear||targetYear-baseYear>60)throw Error('Choose a build-plan year after the base year and within sixty years.');
  positive(growth,'Annual construction multiplier',false);
  const elapsed=Math.max(0,Math.min(year-baseYear,targetYear-baseYear)),total=targetYear-baseYear;
  const additions=Array.from({length:total},(_,i)=>growth**i);
  if(!additions.every(Number.isFinite))throw Error('Construction growth exceeds the supported range.');
  return {capacityShare:additions.slice(0,elapsed).reduce((a,b)=>a+b,0)/additions.reduce((a,b)=>a+b,0),allocationShare:elapsed/total};
}
export function populationAtYear(base,target,targetYear,year,baseYear=2025){
  positive(base,'Base population',false);positive(target,'Target population',false);
  if(![year,targetYear,baseYear].every(Number.isInteger)||targetYear<=baseYear)throw Error('Choose a population plan year after 2025.');
  return base*(target/base)**((year-baseYear)/(targetYear-baseYear));
}
export function procurement(finishedT,yieldRate,secondaryShare,allocatedSecondaryT=null) {
  const finished=positive(finishedT,'Finished material'),yield_=fraction(yieldRate,'Net yield',false),s=fraction(secondaryShare,'Secondary share');
  const feed=finished/yield_,requestedSecondary=feed*s;
  const secondary=allocatedSecondaryT===null?requestedSecondary:Math.min(requestedSecondary,positive(allocatedSecondaryT,'Allocated secondary supply'));
  return {finished,feed,secondary,requestedSecondary,secondaryShortfall:requestedSecondary-secondary,primary:feed-secondary};
}
export function ore(p,weights) {
  const primary=positive(p.primaryT,'Primary metal'),grade=fraction(p.grade,'Ore grade',false),recovery=fraction(p.recovery,'Recovery',false);
  const formula=parseFormula(p.formula,weights),elementFraction=formula.fractions[p.element]||0;
  if(!elementFraction)throw Error('The target element is absent from this feedstock.');
  const containedGrade=grade*elementFraction;
  return {formula,containedGrade,oreT:primary/(containedGrade*recovery),elementFraction};
}
export function compute(p) {
  const ratedGW=positive(p.ratedGW,'Rated compute'),util=fraction(p.util,'Average equipment load'),pue=positive(p.pue,'Facility power factor',false);
  if(pue<1)throw Error('Facility power factor cannot be below one.');
  const averageITGW=ratedGW*util,averageFacilityGW=averageITGW*pue;
  const robotGW=positive(p.robotFleet,'Robot fleet')*positive(p.robotW,'Average robot watts')/1e9;
  return {ratedGW,averageITGW,averageFacilityGW,computeTWh:averageFacilityGW*8.76,robotGW,robotTWh:robotGW*8.76,totalTWh:(averageFacilityGW+robotGW)*8.76};
}
export function energyToRated(energyTWh,util,pue){return positive(energyTWh,'Facility energy')/(8.76*fraction(util,'Load factor',false)*positive(pue,'Facility power factor',false));}
export function generation(rows) {
  const items=rows.map(r=>{const gw=positive(r.gw,`${r.name} capacity`),cf=fraction(r.cf,`${r.name} capacity factor`);return {...r,gw,cf,twh:gw*cf*8.76};});
  return {items,twh:items.reduce((s,r)=>s+r.twh,0)};
}
export function cleanBudget(supplyTWh,transitionTWh,essentialTWh,retirementTWh,projectTWh) {
  [supplyTWh,transitionTWh,essentialTWh,retirementTWh,projectTWh].forEach(x=>positive(x,'Electricity budget'));
  const protectedNeed=transitionTWh+essentialTWh+retirementTWh;
  const remaining=Math.max(0,supplyTWh-protectedNeed);
  return {supplyTWh,protectedNeed,protectedGap:Math.max(0,protectedNeed-supplyTWh),remaining,projectTWh,projectGap:Math.max(0,projectTWh-remaining),surplus:Math.max(0,remaining-projectTWh)};
}
export function storage(p) {
  const load=positive(p.loadGW,'Buffered facility load'),hours=positive(p.hours,'Buffer hours'),dod=fraction(p.dod,'Usable state-of-charge share',false),discharge=fraction(p.discharge,'Discharge efficiency',false),charge=fraction(p.charge,'Charge efficiency',false);
  const usableGWh=load*hours,nominalGWh=usableGWh/(dod*discharge);
  return {usableGWh,nominalGWh,rechargeGWh:usableGWh/(charge*discharge),roundTrip:charge*discharge};
}
export function battery(p,weights) {
  const formula=parseFormula(p.formula,weights),ah=positive(p.ahkg,'Active material ampere-hours per kilogram',false),v=positive(p.voltage,'Cell voltage',false),kwh=positive(p.kwh,'Nominal energy');
  const activeKg=kwh*1000/(ah*v);
  return {formula,activeKg,kgPerKWh:1000/(ah*v),elements:Object.fromEntries(Object.entries(formula.fractions).map(([e,f])=>[e,activeKg*f]))};
}
export function solar(p) {
  const load=positive(p.averageGW,'Average facility load'),cf=fraction(p.cf,'Solar capacity factor',false),stored=fraction(p.stored,'Energy share sent through storage'),roundTrip=fraction(p.roundTrip,'Storage round-trip efficiency',false);
  const generationGW=load*((1-stored)+stored/roundTrip),peakGW=generationGW/cf;
  const eff=fraction(p.cellEfficiency,'Cell efficiency',false),thickness=positive(p.thicknessMicron,'Active absorber thickness')*1e-6,density=positive(p.densityKgM3??2330,'Active absorber density',false);
  const areaM2=peakGW*1e9/(1000*eff),siliconT=areaM2*thickness*density/1000;
  return {peakGW,annualTWh:generationGW*8.76,areaM2,siliconT,silverT:peakGW*positive(p.silverMgW,'Silver intensity')};
}
export function orbit(p) {
  const addedGW=positive(p.addedGW,'Orbital annual addition'),payloadT=addedGW*positive(p.tonnesPerGW,'Orbital system mass'),payloadPerFlight=positive(p.payloadPerFlight,'Delivered launch payload',false);
  const loadGW=positive(p.computeGW,'Orbital compute'),factor=positive(p.overhead,'Orbital system power factor',false),eff=fraction(p.solarEfficiency,'Orbital panel efficiency',false),avail=fraction(p.sunFraction,'Sun and orientation factor',false);
  if(factor<1)throw Error('Orbital power factor must be at least one.');
  const electricGW=loadGW*factor,solarAreaM2=electricGW*1e9/(1363.4*eff*avail);
  const emissivity=fraction(p.emissivity,'Radiator emissivity',false),temperature=positive(p.temperatureK,'Radiator temperature',false);
  const heatGW=electricGW; // Conservative all-input-electricity-to-heat system boundary.
  const radiatorAreaM2=heatGW*1e9/(emissivity*5.670374419e-8*temperature**4);
  return {payloadT,flights:Math.ceil(payloadT/payloadPerFlight),electricGW,solarAreaM2,heatGW,radiatorAreaM2};
}
export function beaming(deliveredGW,efficiency) {const d=positive(deliveredGW,'Delivered power'),e=fraction(efficiency,'End-to-end beaming efficiency',false);return {sourceGW:d/e,lossGW:d/e-d};}
export function propellant(p,weights){
 const flights=positive(p.payloadFlights,'Payload flights')*positive(p.flightMultiplier,'Total flight multiplier',false);
 const totalT=flights*positive(p.tonnesPerFlight,'Propellant per flight');
 const ratio=positive(p.oxidiserRatio,'Oxidiser to fuel ratio');
 const fuelT=totalT/(1+ratio),oxygenT=totalT-fuelT,composition=parseFormula(p.formula,weights);
 const hydrogenT=fuelT*(composition.fractions.H||0),carbonT=fuelT*(composition.fractions.C||0);
 const water=parseFormula('H2O',weights),co2=parseFormula('CO2',weights);
 return {flights,totalT,fuelT,oxygenT,hydrogenT,carbonT,waterTForHydrogen:hydrogenT/water.fractions.H,co2TForCarbon:carbonT/co2.fractions.C,electrolysisTWh:hydrogenT*positive(p.kwhPerKgH,'Hydrogen production electricity')/1e6};
}
export function motor(p,weights) {
  const n=positive(p.units,'Motors served'),magnetKg=positive(p.magnetKg,'Magnet mass'),avoided=fraction(p.avoided,'Rare-earth magnet substitution'),ndpr=fraction(p.ndpr,'NdPr share'),ratio=positive(p.massRatio,'Alternative magnet mass ratio',false);
  const remainingT=n*magnetKg*(1-avoided)/1000,alternativeT=n*magnetKg*avoided*ratio/1000;
  const fn=parseFormula('Fe16N2',weights);
  return {remainingT,ndprT:remainingT*ndpr,alternativeT,alternativeFeT:alternativeT*fn.fractions.Fe};
}
export function maintenance(p) {
  const jobs=positive(p.jobs,'Service jobs'),kg=positive(p.kg,'New module allowance'),recondition=fraction(p.recondition,'Reconditioned share');
  return {suppliedT:jobs*kg/1000,newT:jobs*kg*(1-recondition)/1000,reconditionedT:jobs*kg*recondition/1000};
}
export function capacity(p) {
  const now=positive(p.current,'Current annual output',false),needed=positive(p.needed,'Required annual output'),years=positive(p.years,'Years to target',false),growth=positive(p.growthFactor,'Output growth factor',false);
  const projected=now*growth**years;
  return {requiredCagr:(needed/now)**(1/years)-1,projected,gap:Math.max(0,needed-projected),increase:needed-now};
}
export function population(p) {
  const base=positive(p.base,'Starting population'),target=positive(p.target,'Target population'),people=positive(p.peoplePerHome,'People per dwelling',false),ratio=positive(p.robotsPerPerson,'Robots per resident'),years=positive(p.buildYears,'Build years',false);
  const extra=Math.max(0,target-base),fleet=target*ratio;
  return {extra,homes:extra/people,fleet,annualRobots:fleet/years,robotTWh:fleet*positive(p.robotW,'Robot watts')*8760/1e12,stockT:fleet*positive(p.robotKg,'Robot mass')/1000};
}
export function supplyRamp(p) {
  const n=positive(p.nameplate,'Nameplate annual output'),r=fraction(p.ramp,'Commissioning fraction'),a=fraction(p.allocation,'Allocated share');return {output:n*r,available:n*r*a};
}
export function solidVolume(tonnes,densityTPerM3) {const m3=positive(tonnes,'Mass')/positive(densityTPerM3,'Density',false);return {m3,pools:m3/2500,trains:tonnes/28000};}
export function inventory(rows,weights){
 if(!Array.isArray(rows)||rows.length>100)throw Error('A project ledger supports at most 100 components.');
 const totals={};let massT=0;
 const items=rows.map(row=>{
  const qty=positive(row.qty,'Component quantity'),kg=positive(row.kg,'Component kilograms');
  const material=parseFormula(row.formula,weights),finishedT=qty*kg/1000;
  if(!Number.isFinite(finishedT)||finishedT>1e15)throw Error('Component mass exceeds the supported range.');
  massT+=finishedT;
  const elements={};
  for(const [e,f] of Object.entries(material.fractions)){
   const p=procurement(finishedT*f,row.yield,row.secondary);
   elements[e]=p;totals[e]??={finished:0,feed:0,primary:0,secondary:0};
   for(const k of ['finished','feed','primary','secondary'])totals[e][k]+=p[k];
  }return {...row,finishedT,elements};
 });return {items,totals,massT};
}
export function dailySolar(p) {
  const load=positive(p.loadGW,'Average load'),peak=positive(p.peakGW,'Solar peak'),cf=fraction(p.cf,'Solar capacity factor'),usable=positive(p.usableGWh,'Usable battery storage'),charge=fraction(p.charge,'Charge efficiency',false),discharge=fraction(p.discharge,'Discharge efficiency',false);
  const profile=Array.from({length:24},(_,h)=>Math.max(0,Math.sin(Math.PI*(h+.5-6)/12))*(h>=6&&h<18?1:0));
  const sum=profile.reduce((a,b)=>a+b,0);
  const pv=profile.map(x=>x/sum*24*cf*peak);
  if(Math.max(...pv)>peak+1e-9)throw Error('This daylight profile cannot deliver the selected capacity factor without exceeding panel rating.');
  let stored=usable/2,rows=[];
  for(let day=0;day<30;day++){
    rows=[];
    for(let h=0;h<24;h++){
      let net=pv[h]-load,unserved=0,curtailed=0;
      if(net>=0){const input=Math.min(net,(usable-stored)/charge);stored+=input*charge;curtailed=net-input;}
      else{const take=Math.min(-net/discharge,stored);stored-=take;unserved=-net-take*discharge;}
      rows.push({hour:h,solarGW:pv[h],loadGW:load,storedGWh:stored,unservedGWh:unserved,curtailedGWh:curtailed});
    }
  }
  return {rows,unservedGWh:rows.reduce((s,r)=>s+r.unservedGWh,0),curtailedGWh:rows.reduce((s,r)=>s+r.curtailedGWh,0)};
}
