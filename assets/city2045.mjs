// Requirement tests dated 7 November 2026. Inputs are design hypotheses.
export const cityDefaults={people:20000000,start:2027,end:2045,dwellingM3:100,supportM3:200,firstM3:10000000,porosity:.35,grainT:2.65,waterT:1,waterL:200,waterRecovery:.995,otherW:1000,kcal:2500,foodEfficiency:.05,foodInternal:1,robotGoal:100000000,metalShare:.1,yield:.95,Cu:433500,Al:1570000,Fe:5223000,robotCu:6,robotAl:21,robotFe:20};
const nonnegative=(n,label)=>{if(!Number.isFinite(n)||n<0)throw Error(label+' must be zero or positive.');return n;};
function share(n,label){nonnegative(n,label);if(n>1)throw Error(label+' must be at most one.');return n;}
function sum(first,g,n){let total=0,amount=first;for(let i=0;i<n;i++){total+=amount;amount*=g;}return total;}
export function city2045(s){
 for(const [k,v] of Object.entries(s))nonnegative(v,k);
 const years=s.end-s.start+1;if(!Number.isInteger(s.start)||!Number.isInteger(s.end)||years<1||years>100)throw Error('Use whole calendar years and one to one hundred construction years.');
 if(!s.people||!(s.dwellingM3+s.supportM3)||!s.firstM3||!s.foodEfficiency||!s.yield)throw Error('Population, volume, first excavation, food efficiency and yield must be positive.');
 for(const k of ['porosity','waterRecovery','foodEfficiency','foodInternal','metalShare','yield'])share(s[k],k);
 const volume=s.people*(s.dwellingM3+s.supportM3);
 // Solve growth from the target rather than imposing a slow annual growth cap.
 const first=years===1?volume:Math.min(s.firstM3,volume);let lo=0,hi=2;
 if(years>1){while(sum(first,hi,years)<volume)hi*=2;
 for(let i=0;i<100;i++){const mid=(lo+hi)/2;if(sum(first,mid,years)<volume)lo=mid;else hi=mid;}}
 const growth=years===1?1:(lo+hi)/2,rows=[];let cumulative=0;
 for(let i=0;i<years;i++){const annual=first*growth**i;cumulative+=annual;rows.push({year:s.start+i,annual,cumulative,volumePlaces:cumulative/(s.dwellingM3+s.supportM3)});}
 const dryT=volume*(1-s.porosity)*s.grainT,wetT=dryT+volume*s.porosity*s.waterT;
 const waterGL=s.people*s.waterL*365/1e9,makeupGL=waterGL*(1-s.waterRecovery);
 const foodKWhPersonDay=s.kcal*4184/3600000*s.foodInternal/s.foodEfficiency;
 const foodGW=s.people*foodKWhPersonDay/24/1e6,otherGW=s.people*s.otherW/1e9;
 const powerGW=foodGW+otherGW;
 // Electricity converted to food is already inside the energy boundary.
 // Only food imported across that boundary adds chemical energy to total heat.
 const importedFoodGW=s.people*s.kcal*4184/86400*(1-s.foodInternal)/1e9;
 const metals=['Cu','Al','Fe'].map(e=>{
  const kg=s['robot'+e],allowance=s[e]*s.metalShare,need=s.robotGoal*kg/1000/s.yield;
  return {element:e,reference:s[e],allowance,need,robots:kg?allowance*s.yield*1000/kg:Infinity,requiredTotal:s.metalShare?need/s.metalShare:null,multiple:s.metalShare&&s[e]?need/s.metalShare/s[e]:null};
 });
 return {years,volume,firstAdjusted:first!==s.firstM3,first,growth,rows,dwellingVolume:s.people*s.dwellingM3,dryT,wetT,averageM3:volume/years,annualWetT:wetT/years,waterGL,makeupGL,foodKWhPersonDay,foodGW,otherGW,powerGW,energyTWh:powerGW*8.76,heatGW:powerGW+importedFoodGW,metals,metalOnlyRobots:Math.min(...metals.map(x=>x.robots))};
}
