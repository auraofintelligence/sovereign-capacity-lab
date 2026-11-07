import * as M from './model.mjs?v=2';
import {saveScenario,readScenario} from './state.mjs?v=2';
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
 const root=document.createElement('section');root.id='year-explorer';root.className='year-explorer';
 const s=getState();
 const hasDesign=['storage','matter','space','ledger'].includes(page);
 let topic=hasDesign?'design':page==='australia'?'australia':page==='power'?'power':'machines';
 let pinned=null;try{const saved=sessionStorage.getItem('capacity-lab-comparison');if(saved)pinned=readScenario(saved);}catch{}
 const fields=(quickFields[page]||[]).map(([key,label,unit,scale])=>`<label class="field" for="quick-${key}"><span>${label}</span><span class="input-unit"><input id="quick-${key}" data-key="${key}" data-scale="${scale}" type="number" min="0" step="any" value="${s[key]*scale}"><span>${unit}</span></span></label>`).join('');
 root.innerHTML=`<div class="explorer-title"><div><p class="eyebrow">See the whole path</p><h2>Explore the years</h2></div><a href="#${{overview:'scenario',power:'power',machines:'manufacture',matter:'feedstock',storage:'solar',space:'orbital',australia:'australia',ledger:'ledger'}[page]}">All ${page==='ledger'?'project':'design and scenario'} inputs ↓</a></div><div class="year-controls"><label for="year">Year in view <input id="year" data-key="year" type="number" min="2026" max="2040" step="1" value="${s.year}"></label><label for="chart-end">Chart ends in <select id="chart-end"><option>2031</option><option selected>2036</option><option>2040</option></select></label><label class="year-slider-label" for="year-range">Move through time<input id="year-range" data-key="year" type="range" min="2026" max="${s.chartEndYear}" step="1" value="${s.year}"></label><div class="year-jumps" aria-label="Planning horizons">${[2026,2027,2028,2029,2031,2032,2036].map(y=>`<button type="button" data-pick-year="${y}" ${y===s.year?'aria-pressed="true"':'aria-pressed="false"'}>${y}${y===2026?' · now':y===2032?' · Brisbane':` · +${y-2026}y`}</button>`).join('')}</div></div><div class="explorer-layout">${fields?`<aside class="quick-assumptions"><h3>Change an assumption</h3><p>The graphs and detailed inputs update together.</p>${fields}</aside>`:''}<div class="explorer-main"><div class="graph-topics" role="group" aria-label="Graph topic">${Object.entries(labels).map(([k,label])=>`<button type="button" data-topic="${k}" aria-pressed="${k===topic}">${label}</button>`).join('')}</div><div class="compare-tools"><button type="button" data-explorer-action="pin">Pin current assumptions</button><button type="button" class="secondary" data-explorer-action="clear" hidden>Clear comparison</button><button type="button" class="secondary" data-explorer-action="csv">Download all years CSV</button></div><p class="comparison-note" role="status"></p><p class="trajectory-note"></p><div class="year-graphs"></div><details class="year-data"><summary>Read every year in a table</summary><div class="year-data-table"></div></details></div></div>`;
 if(hasDesign){const button=document.createElement('button');button.type='button';button.dataset.topic='design';button.textContent='This design';root.querySelector('.graph-topics').prepend(button);}
 const quick=root.querySelector('.quick-assumptions');
 if(quick){
  const heading=quick.querySelector('h3');heading.remove();
  const details=document.createElement('details');details.className='quick-details';details.innerHTML='<summary>Change an assumption</summary><div class="quick-fields"></div>';
  const content=details.querySelector('.quick-fields');while(quick.firstChild)content.append(quick.firstChild);quick.append(details);
  const narrow=matchMedia('(max-width: 720px)');const sizeQuick=()=>{details.open=!narrow.matches;};sizeQuick();narrow.addEventListener('change',sizeQuick);
 }
 el.prepend(root);let cachedRows=[];
 const render=(state)=>{
  const end=Math.max(state.chartEndYear,state.year);cachedRows=series(state,weights,end);
  const prior=pinned?series(pinned,weights,end):null;
  const endControl=root.querySelector('#chart-end');if(![...endControl.options].some(o=>+o.value===end))endControl.add(new Option(String(end),String(end)));endControl.value=end;root.querySelector('#year-range').max=end;
  root.querySelectorAll('[data-pick-year]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.pickYear===state.year)));
  root.querySelectorAll('[data-topic]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.topic===topic)));
  root.querySelector('[data-explorer-action="clear"]').hidden=!pinned;
  root.querySelector('[data-explorer-action="pin"]').hidden=topic==='design';
  root.querySelector('[data-explorer-action="clear"]').hidden=topic==='design'||!pinned;
  root.querySelector('[data-explorer-action="pin"]').disabled=false;root.querySelector('[data-explorer-action="csv"]').disabled=false;
  root.querySelector('.comparison-note').textContent=topic==='design'?'These curves use your current design inputs. Choose an annual topic to explore the years.':pinned?'Solid lines: current assumptions. Dashed lines: your pinned assumptions.':'Pin a scenario, then change an input to compare both paths.';
  const note=topic==='power'?`Power plan: additional capacity builds from 2025 to ${state.powerTargetYear}, with each annual addition multiplied by ${number(state.powerBuildGrowth)}. Protected allocations grow linearly to the same plan year. Both hold after it. Annual energy balance only.`:topic==='machines'?`Modelled manufacture begins in ${state.start}. Earlier years contain no units from this programme. Accumulated manufacture includes retired units; the surviving fleet deducts final losses after repair options.`:topic==='materials'?'Robot material follows annual manufacture, the selected design, factory yield and secondary share. Copper market anchors retain their source dates in Sources and methods.':'Population is interpolated at a constant compound rate from June 2025 to the entered plan year, then extrapolated at that rate. Fleet figures show the civic service requirement.';
  root.querySelector('.trajectory-note').textContent=topic==='design'?'Design sensitivities calculated from the entered specifications. Methods dated 7 November 2026.':note+' Scenario method dated 7 November 2026.';
  if(topic==='design'){
   const figures=[...document.querySelectorAll('#calculator .design-graphs')].map(n=>n.innerHTML).join('');
   root.querySelector('.year-graphs').innerHTML=figures.replace(/chart-title-/g,'explorer-chart-title-').replace(/chart-desc-/g,'explorer-chart-desc-');
   root.querySelector('.year-data').hidden=true;return;
  }
  root.querySelector('.year-data').hidden=false;
  root.querySelector('.year-graphs').innerHTML=chartGroups[topic].map(g=>chart(g,cachedRows,state.year,prior)).join('');
  const columns=chartGroups[topic].flatMap(g=>g.series.map(v=>({...v,unit:g.unit})));
  root.querySelector('.year-data-table').innerHTML=`<div class="table-scroll" tabindex="0" role="region" aria-label="Year-by-year results"><table><caption>Current assumptions, all displayed years</caption><thead><tr><th scope="col">Year</th>${columns.map(c=>`<th scope="col">${esc(c.label)} (${esc(c.unit)})</th>`).join('')}</tr></thead><tbody>${cachedRows.map(r=>`<tr${r.year===state.year?' class="selected-year"':''}><th scope="row">${r.year}</th>${columns.map(c=>`<td>${number(c.get(r))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 };
 root.addEventListener('click',e=>{
  const year=e.target.closest('[data-pick-year]')?.dataset.pickYear;
  if(year){onChange({year:+year,chartEndYear:Math.max(+year,getState().chartEndYear)});return;}
  const tab=e.target.closest('[data-topic]')?.dataset.topic;if(tab){topic=tab;try{render(getState());}catch(err){pause(err.message);}return;}
  const action=e.target.closest('[data-explorer-action]')?.dataset.explorerAction;
  if(action==='pin'){try{pinned=readScenario(saveScenario(getState()));try{sessionStorage.setItem('capacity-lab-comparison',saveScenario(pinned));}catch{}render(getState());}catch(err){pause(err.message);}}
  if(action==='clear'){pinned=null;try{sessionStorage.removeItem('capacity-lab-comparison');}catch{}try{render(getState());}catch(err){pause(err.message);}}
  if(action==='csv'){
   const header=['year','annual_robots','accumulated_robots','operating_robots','compute_twh','robot_twh','new_clean_twh','protected_need_twh','protected_gap_twh','new_machine_gap_twh','robot_copper_primary_t','robot_aluminium_primary_t','population','civic_fleet_requirement'];
   const rows=cachedRows.map(r=>[r.year,r.f.units,r.f.cumulative,r.f.live,r.c.computeTWh,r.c.robotTWh,r.generation.twh,r.budget.protectedNeed,r.budget.protectedGap,r.budget.projectGap,r.inventory.Cu.primary,r.inventory.Al.primary,r.population,r.pop.fleet]);
   const a=document.createElement('a'),url=URL.createObjectURL(new Blob([[header,...rows].map(r=>r.join(',')).join('\r\n')],{type:'text/csv'}));a.href=url;a.download='capacity-year-by-year.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
 });
 root.querySelector('#chart-end').addEventListener('change',e=>onChange({chartEndYear:+e.target.value,year:Math.min(getState().year,+e.target.value)}));
 root.addEventListener('pointerdown',e=>{
  const svg=e.target.closest('svg[data-year-plot]');if(!svg)return;
  const width=svg.viewBox.baseVal.width,left=width===360?68:77,right=width===360?12:18;
  const box=svg.getBoundingClientRect(),x=(e.clientX-box.left)/box.width*width;if(x<left||x>width-right)return;
  const year=Math.round(+svg.dataset.minYear+(x-left)/(width-left-right)*(svg.dataset.maxYear-svg.dataset.minYear));onChange({year});
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
