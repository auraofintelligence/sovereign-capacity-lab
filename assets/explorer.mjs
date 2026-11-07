import * as M from './model.mjs?v=3';
import {australianManufacturing} from './australian-manufacturing.mjs?v=3';
import {saveScenario,readScenario} from './state.mjs?v=3';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>new Intl.NumberFormat('en-AU',{maximumSignificantDigits:4}).format(n);
const axisNumber=n=>n>=1e9?number(n/1e9)+'bn':n>=1e6?number(n/1e6)+'m':n>=1e3?number(n/1e3)+'k':number(n);
const quantity=(n,unit)=>unit.startsWith('million ')?Math.abs(n)<1?number(n*1e6)+' '+unit.slice(8):Math.abs(n)>=1000?number(n/1000)+' billion '+unit.slice(8):number(n)+' '+unit:number(n)+' '+unit;
const colours=['#245c46','#b14d25','#397e96','#895185'];
const chartGroups={
 machines:[
  {id:'annual',title:'New robots manufactured each year',unit:'million machines/year',series:[{label:'Annual manufacture',get:r=>r.f.units/1e6}]},
  {id:'fleet',title:'Manufactured equipment and surviving fleet',unit:'million machines',series:[{label:'Accumulated manufacture',get:r=>r.f.cumulative/1e6},{label:'Still in service',get:r=>r.f.live/1e6}]},
 ],
 power:[
  {id:'budget',title:'New clean electricity and the needs it must meet',unit:'TWh/year',series:[{label:'New clean electricity',get:r=>r.budget.supplyTWh},{label:'Protected needs plus new machines',get:r=>r.budget.protectedNeed+r.budget.projectTWh},{label:'Unmet total need',get:r=>r.budget.projectGap+r.budget.protectedGap}]},
  {id:'electricity',title:'Electricity used by computing and robots',unit:'TWh/year',series:[{label:'Ground computing, including existing base',get:r=>r.c.computeTWh},{label:'Robots in this manufacturing scenario',get:r=>r.c.robotTWh}]},
 ],
 materials:[
  {id:'primary',title:'Primary feed needed for new robots',unit:'million tonnes/year',series:[{label:'Copper',get:r=>r.inventory.Cu.primary/1e6},{label:'Aluminium',get:r=>r.inventory.Al.primary/1e6},{label:'Iron',get:r=>r.inventory.Fe.primary/1e6}]},
  {id:'market',title:'Global copper end-use demand',unit:'million tonnes/year',series:[{label:'Dated market path',get:r=>r.cuBase/1e6},{label:'With the additional robot batch',get:r=>r.cuMarket/1e6}]},
 ],
 australia:[
  {id:'people',title:'Population served by the civic plan',unit:'million people',series:[{label:'Population at the entered compound rate',get:r=>r.population/1e6}]},
  {id:'civic',title:'Civic robots needed at the selected service ratio',unit:'million machines',series:[{label:'Fleet requirement',get:r=>r.pop.fleet/1e6}]},
 ],
};
const labels={machines:'Robots and fleet',power:'Electricity',materials:'Material demand',australia:'Australian needs'};

function chart({id,title,unit,series},rows,selected,comparison=null,{xLabel='Year',selectable=true}={}){
 const mobile=innerWidth<=720;
 const W=mobile?360:620,H=mobile?270:300,L=mobile?68:77,R=mobile?12:18,T=24,B=48,w=W-L-R,h=H-T-B;
 const xs=rows.map(r=>r.year),minX=Math.min(...xs),maxX=Math.max(...xs);
 const vals=series.flatMap(s=>rows.map(s.get));
 if(comparison)vals.push(...series.flatMap(s=>comparison.map(s.get)));
 if(vals.some(v=>!Number.isFinite(v)))throw Error('A graph value exceeds the supported range.');
 const maxY=Math.max(1,...vals)*1.08;
 const x=v=>L+(v-minX)/(maxX-minX||1)*w,y=v=>T+h-v/maxY*h;
 const chosen=rows.find(r=>r.year===selected)||rows[0];
 const old=comparison?.find(r=>r.year===chosen.year);
 const line=(s,rs,i,dashed=false)=>'<path d="'+rs.map((r,j)=>(j?'L':'M')+x(r.year).toFixed(2)+','+y(s.get(r)).toFixed(2)).join(' ')+'" fill="none" stroke="'+colours[i%colours.length]+'" stroke-width="'+(dashed?2:3)+'"'+(dashed?' stroke-dasharray="7 6" opacity=".75"':'')+'/>';
 const grid=Array.from({length:5},(_,i)=>{const v=maxY*i/4;return `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="chart-gridline"/><text x="${L-10}" y="${y(v)+6}" text-anchor="end">${esc(axisNumber(v))}</text>`;}).join('');
 const tickCount=Math.min(mobile?3:6,rows.length),ticks=Array.from({length:tickCount},(_,i)=>rows[Math.round(i*(rows.length-1)/(tickCount-1||1))].year);
 const xTicks=[...new Set(ticks)].map(v=>`<text x="${x(v)}" y="${H-21}" text-anchor="middle">${esc(Number.isInteger(v)?v:number(v))}</text>`).join('');
 const detail=series.map((s,i)=>{
  const current=s.get(chosen),prior=old?s.get(old):null,difference=prior===null?null:current-prior;
  return `<div class="chart-reading"><span class="chart-swatch" style="--series:${colours[i%colours.length]}"></span><span>${esc(s.label)}<strong>${esc(quantity(current,unit))}</strong>${prior!==null?`<small>Pinned: ${esc(quantity(prior,unit))}; change ${difference>0?'+':''}${esc(quantity(difference,unit))}</small>`:''}</span></div>`;
 }).join('');
 const desc=series.map(s=>s.label+': '+number(s.get(chosen))+' '+unit).join('. ');
 const dataTable=selectable?'':`<details class="chart-data"><summary>Values behind this curve</summary><div class="table-scroll" tabindex="0" role="region" aria-label="${esc(title)} values"><table><caption>${esc(title)}</caption><thead><tr><th scope="col">${esc(xLabel)}</th>${series.map(v=>`<th scope="col">${esc(v.label)} (${esc(unit)})</th>`).join('')}</tr></thead><tbody>${rows.map(v=>`<tr><th scope="row">${number(v.year)}</th>${series.map(col=>`<td>${number(col.get(v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
 return `<figure class="live-chart" data-chart-id="${id}"><figcaption><h3>${esc(title)}</h3><p>${esc(unit)} · ${esc(xLabel)} ${esc(Number.isInteger(chosen.year)?chosen.year:number(chosen.year))}</p></figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="chart-title-${id} chart-desc-${id}"${selectable?` data-year-plot data-min-year="${minX}" data-max-year="${maxX}"`:''}><title id="chart-title-${id}">${esc(title)}</title><desc id="chart-desc-${id}">${esc(desc)}. The exact series is available in the table below.</desc>${grid}${xTicks}${comparison?series.map((s,i)=>line(s,comparison,i,true)).join(''):''}${series.map((s,i)=>line(s,rows,i)).join('')}<line x1="${x(chosen.year)}" x2="${x(chosen.year)}" y1="${T}" y2="${T+h}" class="chart-year-marker"/>${series.map((s,i)=>`<circle cx="${x(chosen.year)}" cy="${y(s.get(chosen))}" r="5" fill="${colours[i%colours.length]}" stroke="#fffefa" stroke-width="2"/>`).join('')}</svg><div class="chart-readings">${detail}</div>${dataTable}</figure>`;
}

const quickFields={
 opportunity:[['auFactoryGrowth','Annual Australian factory rollout multiplier','times',1],['auModuleM2','Australian factory module floor','m²',1],['auExportShare','Manufacture allocated to exports','%',100],['auBuildingAUDM2','Building contract rate','A$/m²',1]],
 overview:[['energyGrowth','Compute electricity growth','%/year',100],['early','Early robot manufacture multiplier','times',1],['late','Later manufacture multiplier','times',1],['robotW','Average robot power','W',1]],
 power:[['energyGrowth','Compute electricity growth','%/year',100],['solarGW','Solar at the power plan year','GW',1],['powerBuildGrowth','Annual construction multiplier','times',1],['transitionTWh','Fossil replacement at the plan year','TWh/year',1]],
 machines:[['first','First annual manufacture','machines',1],['early','Early manufacture multiplier','times',1],['late','Later manufacture multiplier','times',1],['secondary','Qualified secondary feed share','%',100]],
 matter:[['primaryT','Annual primary metal required','tonnes',1],['supplyGrowth','Annual output multiplier','times',1],['grade','Feedstock share of ore','%',100],['recovery','Recovery to the target metal','%',100]],
 storage:[['pvLoadGW','Solar design average load','GW',1],['bufferHours','Storage duration','hours',1],['pvCF','Solar capacity factor','%',100],['storedShare','Energy sent through storage','%',100]],
 space:[['orbitAddedGW','New orbital capacity per year','GW/year',1],['payloadT','Delivered payload per launch','tonnes',1],['orbitTonnesGW','Delivered system mass','tonnes/GW',1],['radiatorK','Radiator temperature','kelvin',1]],
 australia:[['popTarget','Population at the population plan year','people',1],['robotsPerPerson','Civic robots per resident','robots/person',1],['sites','Locally governed sites','sites',1]],
 ledger:[],
};

export function createExplorer(el,{page,weights,getState,series,onChange}){
 if(!el)return {render(){},pause(){}};
 const root=document.createElement('section');root.id='year-explorer';root.className='year-explorer compact-explorer';
 const hasDesign=['storage','matter','space','ledger','opportunity'].includes(page);
 let choice=hasDesign?'design:first':page==='australia'?'australia:people':page==='power'?'power:budget':'machines:annual';
 let pinned=null;try{const saved=sessionStorage.getItem('capacity-lab-comparison');if(saved)pinned=readScenario(saved);}catch{}
 const jumpYears=[2026,2027,2028,2029,2031,2032,2036];
 const sectionId={overview:'scenario',power:'power',machines:'manufacture',matter:'feedstock',storage:'solar',space:'orbital',australia:'australia',ledger:'ledger',opportunity:'au-manufacture'}[page];
 root.innerHTML=`<div class="explorer-title"><h2>Explore the years</h2><a href="#${sectionId}">All inputs ↓</a></div><div class="compact-controls"><div class="compact-row"><label for="year">Year <input id="year" data-key="year" type="number" min="2026" max="2040" step="1"></label><label for="year-jump">Horizon <select id="year-jump">${jumpYears.map(y=>`<option value="${y}">${y}${y===2026?' · now':y===2032?' · Brisbane':` · +${y-2026} years`}</option>`).join('')}</select></label><label for="chart-end">Plot to <select id="chart-end"><option>2031</option><option>2036</option><option>2040</option></select></label><label class="graph-picker" for="graph-choice">Graph <select id="graph-choice"></select></label></div><div class="compact-row variable-row"><label class="variable-picker" for="variable-key">Adjust <select id="variable-key"></select></label><div class="variable-editor"></div><details class="explorer-tools"><summary aria-label="Comparison downloads and methods" title="Comparison downloads and methods">More</summary><div class="explorer-tools-menu"><div class="compare-tools"><button type="button" data-explorer-action="pin">Pin current assumptions</button><button type="button" class="secondary" data-explorer-action="clear" hidden>Clear comparison</button><button type="button" class="secondary" data-explorer-action="csv">Download all years CSV</button></div><p class="comparison-note" role="status"></p><p class="trajectory-note"></p></div></details></div><label class="compact-slider" for="year-range"><span class="slider-year">2026</span><input id="year-range" data-key="year" type="range" min="2026" max="2036" step="1" aria-label="Year in view"><span class="slider-end">2036</span></label></div><div class="year-graphs"></div><details class="year-data"><summary>Read every year in a table</summary><div class="year-data-table"></div></details>`;
 const originalInputs=[...el.querySelectorAll('[data-key]')];
 const definitions=new Map();
 for(const [key,label,unit,scale]of quickFields[page]||[])definitions.set(key,{key,label,unit,scale,kind:'number'});
 for(const input of originalInputs){
  const key=input.dataset.key;if(key==='year')continue;
  const label=input.closest('label')?.querySelector('span')?.textContent||key;
  const unit=input.closest('label')?.querySelector('.input-unit>span')?.textContent||'';
  const def={key,label,unit,scale:+(input.dataset.scale||1),kind:input.tagName==='SELECT'?'select':input.type,options:input.tagName==='SELECT'?[...input.options].map(o=>[o.value,o.textContent]):null};
  if(!definitions.has(key))definitions.set(key,def);
 }
 let variable=definitions.keys().next().value||null;
 const variableControl=root.querySelector('#variable-key');variableControl.innerHTML=[...definitions.values()].map(d=>`<option value="${esc(d.key)}">${esc(d.label)}</option>`).join('');
 if(!variable)root.querySelector('.variable-row').hidden=true;
 const editor=root.querySelector('.variable-editor');
 function showVariable(){
  const d=definitions.get(variable);if(!d)return;variableControl.title=d.label;
  const value=getState()[variable];
  editor.innerHTML=`<label class="compact-value" for="explorer-value"><span class="sr-only">${esc(d.label)}</span>`+(d.kind==='select'?`<select id="explorer-value" data-key="${esc(variable)}">${d.options.map(([v,l])=>`<option value="${esc(v)}"${v===value?' selected':''}>${esc(l)}</option>`).join('')}</select>`:`<input id="explorer-value" data-key="${esc(variable)}" data-scale="${d.scale}" type="${d.kind==='text'?'text':'number'}"${d.kind==='text'?'':' min="0" step="any"'} value="${esc(typeof value==='number'?value*d.scale:value)}">`)+`<span class="compact-unit">${esc(d.unit)}</span></label>`;
 }
 showVariable();el.prepend(root);let cachedRows=[];
 const graphForVariable=key=>{
  if(page==='opportunity'){
   if(['auBuildingAUDM2','auServicesAUDM2','auEquipmentAUDM2','auLandAUDM2','auSiteworksAUDM2','auSiteCoverage','auContingency','auCostMultiplier','auEngineeringAUD','auUnitCostAUD','auWorkingMonths'].includes(key))return 'design:au-capital';
   if(['auSaleAUD','auLocalShare'].includes(key))return 'design:au-sales';
   if(['auExportShare','robotsPerPerson','popTarget','populationTargetYear'].includes(key))return 'design:au-domestic';
   if(['robotW','auFactoryKWh'].includes(key))return 'design:au-electricity';
   if(['auServiceShare','serviceKg','recondition'].includes(key))return 'design:au-service';
   if(key==='sites')return 'design:au-catchments';
   if(key.startsWith('au'))return 'design:au-output';
  }
  if(['orbitAddedGW','orbitTonnesGW','payloadT'].includes(key))return 'design:orbital-launches';
  if(['radiatorK','emissivity','orbitComputeGW','orbitOverhead'].includes(key))return 'design:radiator-temperature';
  if(['bufferHours','bufferLoadGW','dod','charge','discharge'].includes(key))return 'design:storage-duration';
  if(['pvLoadGW','pvCF','storedShare','cellEfficiency','silverMgW','siliconMicron','pvFormula','pvDensity'].includes(key))return 'design:daily-power';
  if(['grade','recovery','feedFormula','primaryT','material'].includes(key))return 'design:ore-grade';
  if(['supplyNow','supplyGrowth','supplyYears','supplyNeeded'].includes(key))return 'design:supply-expansion';
  if(['first','early','late','start','split'].includes(key))return 'machines:annual';
  if(['accident','automation','otherLoss'].includes(key))return 'machines:fleet';
  if(['energyGrowth','baseEnergy','robotW','util','pue'].includes(key))return 'power:electricity';
  if(['solarGW','windGW','nuclearGW','otherCleanGW','solarCF','windCF','nuclearCF','otherCleanCF','transitionTWh','essentialTWh','retiredCleanTWh','powerTargetYear','powerBuildGrowth'].includes(key))return 'power:budget';
  if(['popBase','popTarget','populationTargetYear'].includes(key))return 'australia:people';
  if(key==='robotsPerPerson')return 'australia:civic';
  return 'materials:primary';
 };
 const render=(state)=>{
  const end=Math.max(state.chartEndYear,state.year);cachedRows=series(state,weights,end);
  const designFigures=[...el.querySelectorAll('.design-graphs .live-chart')];designFigures.forEach((figure,i)=>{if(!figure.dataset.chartId)figure.dataset.chartId='design-'+i;});
  const graphOptions=Object.entries(chartGroups).map(([group,graphs])=>`<optgroup label="${labels[group]}">${graphs.map(g=>`<option value="${group}:${g.id}">${esc(g.title)}</option>`).join('')}</optgroup>`).join('')+(designFigures.length?`<optgroup label="This design">${designFigures.map(g=>`<option value="design:${g.dataset.chartId}">${esc(g.querySelector('h3').textContent)}</option>`).join('')}</optgroup>`:'');
  const picker=root.querySelector('#graph-choice');picker.innerHTML=graphOptions;
  if(choice==='design:first')choice=designFigures.length?'design:'+designFigures[0].dataset.chartId:'machines:annual';
  if(![...picker.options].some(o=>o.value===choice))choice='machines:annual';picker.value=choice;
  const [topic,graphId]=choice.split(':');
  const endControl=root.querySelector('#chart-end');if(![...endControl.options].some(o=>+o.value===end))endControl.add(new Option(String(end),String(end)));endControl.value=end;
  const jump=root.querySelector('#year-jump');if(![...jump.options].some(o=>+o.value===state.year))jump.add(new Option(String(state.year),String(state.year)));jump.value=state.year;
  root.querySelector('#year').value=state.year;root.querySelector('#year-range').value=state.year;root.querySelector('#year-range').max=end;root.querySelector('.slider-year').textContent=state.year;root.querySelector('.slider-end').textContent=end;
  root.querySelector('[data-explorer-action="clear"]').hidden=topic==='design'||!pinned;root.querySelector('[data-explorer-action="pin"]').hidden=topic==='design';
  root.querySelector('[data-explorer-action="pin"]').disabled=false;root.querySelector('[data-explorer-action="csv"]').disabled=false;
  root.querySelector('.comparison-note').textContent=topic==='design'?'Design curve from the current inputs.':'Pin a scenario, then edit an input. Solid lines show current assumptions; dashed lines show the pinned case.';
  root.querySelector('.trajectory-note').textContent=(topic==='power'?`Power capacity builds from the 2025 base to ${state.powerTargetYear}, with annual additions multiplied by ${number(state.powerBuildGrowth)}. Protected allocations grow linearly to that year. Both hold afterwards.`:topic==='machines'?`Manufacture begins in ${state.start}. The surviving fleet deducts final losses after repair.`:topic==='australia'?'Population follows the compound rate from June 2025 to the population plan year, then extends that rate. Civic fleets size a service requirement.':topic==='materials'?'Annual material follows manufacture, the entered design, yield and qualified secondary share.':'Current engineering inputs determine this curve.')+' Scenario method dated 7 November 2026.';
  if(topic==='design'){
   const figure=designFigures.find(f=>f.dataset.chartId===graphId);
   root.querySelector('.year-graphs').innerHTML=figure.outerHTML.replace(/chart-title-/g,'explorer-chart-title-').replace(/chart-desc-/g,'explorer-chart-desc-');root.querySelector('.year-data').hidden=true;
  }else{
   root.querySelector('.year-data').hidden=false;const g=chartGroups[topic].find(g=>g.id===graphId),prior=pinned?series(pinned,weights,end):null;
   root.querySelector('.year-graphs').innerHTML=chart(g,cachedRows,state.year,prior);
   root.querySelector('.year-data-table').innerHTML=`<div class="table-scroll" tabindex="0" role="region" aria-label="Year-by-year results"><table><caption>${esc(g.title)}</caption><thead><tr><th scope="col">Year</th>${g.series.map(c=>`<th scope="col">${esc(c.label)} (${esc(g.unit)})</th>`).join('')}</tr></thead><tbody>${cachedRows.map(r=>`<tr${r.year===state.year?' class="selected-year"':''}><th scope="row">${r.year}</th>${g.series.map(c=>`<td>${number(c.get(r))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
 };
 root.querySelector('#chart-end').addEventListener('change',e=>onChange({chartEndYear:+e.target.value,year:Math.min(getState().year,+e.target.value)}));
 root.querySelector('#year-jump').addEventListener('change',e=>onChange({year:+e.target.value,chartEndYear:Math.max(+e.target.value,getState().chartEndYear)}));
 root.querySelector('#graph-choice').addEventListener('change',e=>{choice=e.target.value;try{render(getState());}catch(err){pause(err.message);}});
 variableControl.addEventListener('change',()=>{variable=variableControl.value;showVariable();const next=graphForVariable(variable);if(next&&[...root.querySelector('#graph-choice').options].some(o=>o.value===next))choice=next;try{render(getState());}catch(err){pause(err.message);}});
 root.addEventListener('click',e=>{
  const action=e.target.closest('[data-explorer-action]')?.dataset.explorerAction;if(!action)return;
  try{
   if(action==='pin'){pinned=readScenario(saveScenario(getState()));try{sessionStorage.setItem('capacity-lab-comparison',saveScenario(pinned));}catch{}render(getState());}
   if(action==='clear'){pinned=null;try{sessionStorage.removeItem('capacity-lab-comparison');}catch{}render(getState());}
   if(action==='csv'){
    const header=['year','annual_robots','accumulated_robots','operating_robots','compute_twh','robot_twh','new_clean_twh','protected_need_twh','protected_gap_twh','new_machine_gap_twh','robot_copper_primary_t','robot_aluminium_primary_t','population','civic_fleet_requirement','australian_annual_manufacture','australian_annual_exports','australian_domestic_fleet','australian_factory_modules','australian_floor_m2','australian_capital_AUD2025','australian_working_capital_AUD2025'];
    const rows=cachedRows.map(r=>[r.year,r.f.units,r.f.cumulative,r.f.live,r.c.computeTWh,r.c.robotTWh,r.generation.twh,r.budget.protectedNeed,r.budget.protectedGap,r.budget.projectGap,r.inventory.Cu.primary,r.inventory.Al.primary,r.population,r.pop.fleet,r.au.produced,r.au.exported,r.au.domesticLive,r.au.factories,r.au.floorM2,r.au.capital,r.au.workingCapital]);
    const a=document.createElement('a'),url=URL.createObjectURL(new Blob([[header,...rows].map(r=>r.join(',')).join('\r\n')],{type:'text/csv'}));a.href=url;a.download='capacity-year-by-year.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   }
  }catch(err){pause(err.message);}
 });
 root.addEventListener('pointerdown',e=>{
  const svg=e.target.closest('svg[data-year-plot]');if(!svg)return;const width=svg.viewBox.baseVal.width,left=width===360?68:77,right=width===360?12:18;
  const box=svg.getBoundingClientRect(),x=(e.clientX-box.left)/box.width*width;if(x<left||x>width-right)return;
  onChange({year:Math.round(+svg.dataset.minYear+(x-left)/(width-left-right)*(svg.dataset.maxYear-svg.dataset.minYear))});
 });
 const pause=message=>{cachedRows=[];root.querySelector('[data-explorer-action="pin"]').disabled=true;root.querySelector('[data-explorer-action="csv"]').disabled=true;root.querySelector('.year-graphs').innerHTML=`<p class="shortfall" role="status">Graphs paused. ${esc(message)}</p>`;root.querySelector('.year-data-table').replaceChildren();document.querySelectorAll('.design-graphs').forEach(n=>{n.innerHTML=`<p class="shortfall">Graphs paused. ${esc(message)}</p>`;});};
 matchMedia('(max-width: 720px)').addEventListener('change',()=>onChange({}));
 return {render,pause};
}

function designSlot(sectionId,html){
 const section=document.getElementById(sectionId);if(!section)return;
 let node=section.querySelector(':scope > .design-graphs');if(!node){node=document.createElement('div');node.className='design-graphs';section.querySelector('.workbench').before(node);}node.innerHTML=html;
}
const sweep=(max,steps,fn,min=0)=>Array.from({length:steps},(_,i)=>{const year=min+(max-min)*i/(steps-1);return {year,...fn(year)};});
const includePoint=(rows,value,fn)=>[...rows.filter(r=>Math.abs(r.year-value)>1e-9),{year:value,...fn(value)}].sort((a,b)=>a.year-b.year);
export function renderDesignCharts(page,s,r,weights){
 try{
  if(page==='opportunity'){
   const rows=australianManufacturing({...s,year:Math.max(s.year,s.chartEndYear)},r.perRobot).rows;
   designSlot('au-manufacture',chart({id:'au-output',title:'Australian production ambition and factory-supported output',unit:'million robots/year',series:[{label:'Manufacturing ambition',get:v=>v.desired/1e6},{label:'Factory output ceiling',get:v=>v.capacity/1e6},{label:'Manufacture supported by the factories',get:v=>v.produced/1e6}]},rows,s.year,null,{selectable:false}));
   designSlot('au-factories',chart({id:'au-floor',title:'Australian enclosed factory floor',unit:'hectares of floor',series:[{label:'Commissioned factory modules',get:v=>v.floorM2/10000}]},rows,s.year,null,{selectable:false}));
   designSlot('au-domestic',chart({id:'au-domestic',title:'Domestic civic fleet and the service requirement',unit:'million robots',series:[{label:'Australian domestic fleet operating',get:v=>v.domesticLive/1e6},{label:'Fleet needed at the selected service ratio',get:v=>v.civicNeed/1e6}]},rows,s.year,null,{selectable:false})+chart({id:'au-exports',title:'Domestic manufacture and exports each year',unit:'million robots/year',series:[{label:'For Australian use',get:v=>v.domestic/1e6},{label:'For export',get:v=>v.exported/1e6}]},rows,s.year,null,{selectable:false})+chart({id:'au-electricity',title:'Australian robot operation and factory electricity',unit:'TWh/year',series:[{label:'Domestic robot operation',get:v=>v.domesticOperatingTWh},{label:'Assembly and testing',get:v=>v.assemblyTWh}]},rows,s.year,null,{selectable:false}));
   designSlot('au-funding',chart({id:'au-capital',title:'Factory capital and production cash required',unit:'A$ billion at late-2025 value',series:[{label:'Accumulated factory and shared engineering capital',get:v=>v.capital/1e9},{label:'Current working capital stock',get:v=>v.workingCapital/1e9}]},rows,s.year,null,{selectable:false})+chart({id:'au-sales',title:'Exports and Australian production spending',unit:'A$ billion/year at late-2025 value',series:[{label:'Gross export sales at the chosen price',get:v=>v.annualExportSales/1e9},{label:'Spend on Australian production inputs',get:v=>v.australianProductionSpend/1e9}]},rows,s.year,null,{selectable:false}));
   designSlot('au-domestic',document.querySelector('#au-domestic > .design-graphs').innerHTML+chart({id:'au-service',title:'New material for the domestic service programme',unit:'tonnes/year',series:[{label:'Newly supplied service modules',get:v=>v.serviceNewT}]},rows,s.year,null,{selectable:false})+chart({id:'au-catchments',title:'Operating civic robots per service catchment',unit:'robots/catchment',series:[{label:'Domestic operating fleet per catchment',get:v=>s.sites>0?v.domesticLive/s.sites:0}]},rows,s.year,null,{selectable:false}));
  }
  if(page==='storage'){
   const day=M.dailySolar({loadGW:s.pvLoadGW,peakGW:r.pv.peakGW,cf:s.pvCF,usableGWh:r.store.nominalGWh*s.dod,charge:s.charge,discharge:s.discharge});
   const hours=day.rows.map(v=>({year:v.hour,...v}));
   designSlot('day',chart({id:'daily-power',title:'Solar output and electricity load through the day',unit:'GW',series:[{label:'Solar output',get:v=>v.solarGW},{label:'Load',get:v=>v.loadGW}]},hours,12,null,{xLabel:'Hour',selectable:false})+chart({id:'daily-storage',title:'Energy remaining in storage',unit:'GWh',series:[{label:'Stored energy',get:v=>v.storedGWh},{label:'Unserved energy in that hour',get:v=>v.unservedGWh}]},hours,12,null,{xLabel:'Hour',selectable:false}));
   const storageValue=h=>({gwh:M.storage({loadGW:s.bufferLoadGW,hours:h,dod:s.dod,charge:s.charge,discharge:s.discharge}).nominalGWh});
   const values=includePoint(sweep(Math.max(24,s.bufferHours*2),13,storageValue),s.bufferHours,storageValue);
   designSlot('buffer',chart({id:'storage-duration',title:'More hours of service require more stored energy',unit:'GWh nominal',series:[{label:'Nominal storage',get:v=>v.gwh}]},values,s.bufferHours,null,{xLabel:'Storage hours',selectable:false}));
  }
  if(page==='matter'){
   const values=sweep(Math.max(1,s.supplyYears),Math.min(51,Math.ceil(s.supplyYears)+1),t=>({supply:s.supplyNow*s.supplyGrowth**t,need:s.supplyNeeded}));
   designSlot('supply',chart({id:'supply-expansion',title:'Output growth over the chosen build period',unit:'tonnes/year',series:[{label:'Output at the selected growth rate',get:v=>v.supply},{label:'Required annual output',get:v=>v.need}]},values,s.supplyYears,null,{xLabel:'Years of expansion',selectable:false}));
   const oreValue=g=>({ore:M.ore({primaryT:s.primaryT,grade:g/100,recovery:s.recovery,formula:s.feedFormula,element:s.material},weights).oreT/1e6});
   const grades=includePoint(sweep(Math.min(100,Math.max(s.grade*200,1)),13,oreValue,Math.max(.001,s.grade*25)),s.grade*100,oreValue);
   designSlot('feedstock',chart({id:'ore-grade',title:'Lower grade means more rock to process',unit:'million tonnes of ore/year',series:[{label:'Ore throughput for the entered metal requirement',get:v=>v.ore}]},grades,s.grade*100,null,{xLabel:'Feedstock share of ore, %',selectable:false}));
  }
  if(page==='space'){
   const loads=sweep(Math.max(1,s.orbitAddedGW*2),11,g=>({flights:Math.ceil(g*s.orbitTonnesGW/s.payloadT)}));
   const radiatorValue=k=>({area:M.orbit({addedGW:s.orbitAddedGW,tonnesPerGW:s.orbitTonnesGW,payloadPerFlight:s.payloadT,computeGW:s.orbitComputeGW,overhead:s.orbitOverhead,solarEfficiency:s.orbitEfficiency,sunFraction:s.sunFraction,emissivity:s.emissivity,temperatureK:k}).radiatorAreaM2/1e6});
   const temperatures=includePoint(sweep(Math.max(500,s.radiatorK*1.3),13,radiatorValue,Math.min(250,s.radiatorK*.8)),s.radiatorK,radiatorValue);
   designSlot('orbital',chart({id:'orbital-launches',title:'Launch demand follows the capacity built',unit:'successful payload launches/year',series:[{label:'Payload launches',get:v=>v.flights}]},loads,s.orbitAddedGW,null,{xLabel:'New orbital GW/year',selectable:false})+chart({id:'radiator-temperature',title:'Radiator temperature changes the emitting area',unit:'km² emitting area',series:[{label:'Radiator area',get:v=>v.area}]},temperatures,s.radiatorK,null,{xLabel:'Surface temperature, kelvin',selectable:false}));
  }
  if(page==='ledger'){
   const items=Object.entries(r.ledger.totals);const max=Math.max(1,...items.map(([,v])=>v.feed));
   designSlot('ledger','<figure class="live-chart"><figcaption><h3>Where the project feed comes from</h3><p>Tonnes by element in your entered components</p></figcaption>'+items.map(([e,v])=>`<div class="material-bar"><strong>${esc(e)}</strong><div class="material-track"><span style="width:${v.primary/max*100}%" aria-hidden="true"></span><span style="width:${v.secondary/max*100}%" aria-hidden="true"></span></div><p>${number(v.primary)} primary + ${number(v.secondary)} secondary tonnes</p></div>`).join('')+'</figure>');
  }
 }catch(err){const target={storage:'day',matter:'feedstock',space:'orbital',ledger:'ledger'}[page];if(target)designSlot(target,`<p class="shortfall">Design graph paused. ${esc(err.message)}</p>`);}
}
