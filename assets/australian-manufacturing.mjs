import * as M from './model.mjs?v=3';

// Australian civilian manufacturing programme. Real costs use late-2025 AUD.
export function australianManufacturing(s,perRobot={Cu:6,Al:21}){
 const year=s.year,start=s.auStart;
 if(!Number.isInteger(start)||start<2026||start>2040||!Number.isInteger(s.auSplit)||s.auSplit<start)throw Error('Choose valid Australian production years.');
 const floor=M.positive(s.auModuleM2,'Factory floor area',false),support=M.positive(s.auSupportM2,'Fixed support space');
 if(support>=floor)throw Error('Factory support space must be smaller than total floor space.');
 const referenceRate=M.positive(s.auReferenceAnnual,'Reference annual target',false)/M.positive(s.auReferenceFloorM2,'Reference factory floor area',false);
 const ratedPerModule=(floor-support)*referenceRate*M.positive(s.auProductivityShare,'Relative factory throughput',false);
 const usablePerModule=ratedPerModule*M.fraction(s.auOperatingFraction,'Achieved output fraction');
 const exportShare=M.fraction(s.auExportShare,'Export share'),localShare=M.fraction(s.auLocalShare,'Australian production spend share');
 const firstFactories=M.positive(s.auFirstFactories,'First factory count');
 if(!Number.isInteger(firstFactories)||s.auFactoryGrowth<1)throw Error('Use a whole first factory count and a factory growth multiplier of at least one.');
 const landPerModule=floor/M.fraction(s.auSiteCoverage,'Single-level site coverage',false);
 const baseCost={building:floor*M.positive(s.auBuildingAUDM2,'Building rate'),services:floor*M.positive(s.auServicesAUDM2,'Factory services rate'),equipment:floor*M.positive(s.auEquipmentAUDM2,'Equipment rate'),land:landPerModule*M.positive(s.auLandAUDM2,'Land rate'),siteworks:landPerModule*M.positive(s.auSiteworksAUDM2,'Site works rate')};
 baseCost.feesContingency=(baseCost.building+baseCost.services+baseCost.equipment+baseCost.siteworks)*M.fraction(s.auContingency,'Design and contingency allowance');
 const moduleCost=Object.values(baseCost).reduce((a,b)=>a+b,0);
 const unitCost=M.positive(s.auUnitCostAUD,'Variable production cost'),salePrice=M.positive(s.auSaleAUD,'Factory sale price');
 const workingMonths=M.positive(s.auWorkingMonths,'Working capital months');if(workingMonths>24)throw Error('Use at most 24 months of working capital.');
 M.positive(s.auEngineeringAUD,'Shared engineering programme');M.positive(s.auCostMultiplier,'Real annual factory cost multiplier',false);M.fraction(s.auServiceShare,'Annual service share');M.positive(s.auFactoryKWh,'Factory electricity per robot');
 const programme=M.fleet({first:s.auFirst,growthEarly:s.auEarly,growthLate:s.auLate,start,end:Math.max(start,year),split:s.auSplit,accident:s.accident,automationReduction:s.automation,otherLoss:s.otherLoss});
 let domesticLive=0,exportLive=0,manufactured=0,cumulativeExport=0,capital=0,previousFactories=0;
 const rows=[];
 for(let y=2026;y<=year;y++){
  const desired=y<start?0:programme.rows.find(r=>r.year===y).units;
  const factories=y<start?0:Math.ceil(firstFactories*s.auFactoryGrowth**(y-start));
  if(!Number.isFinite(factories)||factories>1e6)throw Error('Australian factory count exceeds the supported range.');
  const capacity=factories*usablePerModule,produced=Math.min(desired,capacity),exported=produced*exportShare,domestic=produced-exported;
  const serviceJobs=domesticLive*s.auServiceShare;
  domesticLive=domesticLive*(1-programme.hazard)+domestic;exportLive=exportLive*(1-programme.hazard)+exported;
  manufactured+=produced;cumulativeExport+=exported;
  const realCostFactor=s.auCostMultiplier**Math.max(0,y-start);
  const addedFactories=factories-previousFactories;
  capital+=addedFactories*moduleCost*realCostFactor+(y===start?s.auEngineeringAUD:0);previousFactories=factories;
  const requiredFactories=desired===0?0:usablePerModule>0?Math.ceil(desired/usablePerModule):null;
  const population=M.populationAtYear(s.popBase,s.popTarget,s.populationTargetYear,y);
  const civicNeed=population*s.robotsPerPerson;
  const materials=Object.fromEntries(Object.entries(perRobot).map(([e,kg])=>[e,M.procurement(produced*kg/1000,s.yield,s.secondary)]));
  const workingCapital=produced*unitCost*workingMonths/12;
  rows.push({year:y,desired,capacity,produced,outputGap:Math.max(0,desired-produced),factories,requiredFactories,floorM2:factories*floor,landM2:factories*landPerModule,domestic,exported,domesticLive,exportLive,manufactured,cumulativeExport,civicNeed,domesticGap:Math.max(0,civicNeed-domesticLive),capital,workingCapital,totalFunding:capital+workingCapital,annualFactorySales:produced*salePrice,annualExportSales:exported*salePrice,australianProductionSpend:produced*unitCost*localShare,importedProductionSpend:produced*unitCost*(1-localShare),materials,serviceJobs,serviceNewT:serviceJobs*s.serviceKg*(1-s.recondition)/1000,assemblyTWh:produced*s.auFactoryKWh/1e9,domesticOperatingTWh:domesticLive*s.robotW*8760/1e12});
 }
 return {rows,...rows.at(-1),referenceRate,ratedPerModule,usablePerModule,moduleCost,baseCost,landPerModule};
}
