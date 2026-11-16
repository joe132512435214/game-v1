import { useEffect, useState } from 'react';
import {
  Factory, Cog, Pause, Play, RotateCcw, Wrench, Store, Truck, Users, AlertTriangle,
  CheckCircle2, ArrowUpRight, Zap, Boxes, CircleDollarSign, FlaskConical, ShieldCheck, TrendingUp, Cpu
} from 'lucide-react';

type MachineId = 'miner' | 'smelter' | 'press' | 'assembler' | 'copperMiner' | 'copperSmelter' | 'wiremill' | 'circuitpress' | 'beamMill' | 'coilWinder';
type StockId = 'ore' | 'ingot' | 'plate' | 'parts' | 'copperOre' | 'copperIngot' | 'wire' | 'circuits' | 'beams' | 'coils';
type Page = 'factory' | 'staff' | 'warehouse' | 'research' | 'store';
type BoostId = 'production' | 'dispatch' | 'protection';
type GameState = {
  cash:number; gears:number; gearShipmentProgress:number; ore:number; beams:number; coils:number; ingot:number; plate:number; parts:number; copperOre:number; copperIngot:number; wire:number; circuits:number;
  miner:number; smelter:number; press:number; assembler:number; copperMiner:number; copperSmelter:number; wiremill:number; circuitpress:number; beamMill:number; coilWinder:number;
  tier_miner:number; tier_smelter:number; tier_press:number; tier_assembler:number; tier_copperMiner:number; tier_copperSmelter:number; tier_wiremill:number; tier_circuitpress:number; tier_beamMill:number; tier_coilWinder:number;
  level:number; experience:number; sold:number; xpMigrationVersion:number; salesXpProgress:number; autoSalesXpProgress:number; mechanics:number; salespeople:number; reputation:number; acceptedContracts:string[]; contractsCompleted:string[]; repeatContractRounds:number[]; contractClock:number; repeatNextAt:number[]; repeatDeadline:number[];
  broken:Record<MachineId,number>; unitFaults:Record<MachineId,number[]>; mechanicAssignments:Record<MachineId,number>; breakdownEvent:MachineId|null; powerCutEvent:boolean; powerCutSeen:boolean; cyberAttackEvent:boolean; cyberAttackSeen:boolean; cybersecuritySpecialists:number;
  salesTarget:StockId; autoSell:boolean; salesAssignments:Record<StockId,number>; boostSeconds:Record<BoostId,number>; missionsClaimed:number[]; researched:string[];
};
const SAVE_KEY = 'ironworks-tycoon-save-v2';
const fresh:GameState = {
  cash:0,gears:0,gearShipmentProgress:0,ore:0,beams:0,coils:0,ingot:0,plate:0,parts:0,copperOre:0,copperIngot:0,wire:0,circuits:0,
  miner:0,smelter:0,press:0,assembler:0,copperMiner:0,copperSmelter:0,wiremill:0,circuitpress:0,beamMill:0,coilWinder:0,
  tier_miner:0,tier_smelter:0,tier_press:0,tier_assembler:0,tier_copperMiner:0,tier_copperSmelter:0,tier_wiremill:0,tier_circuitpress:0,tier_beamMill:0,tier_coilWinder:0,
  level:1,experience:0,sold:0,xpMigrationVersion:1,salesXpProgress:0,autoSalesXpProgress:0,mechanics:0,salespeople:0,
  broken:{miner:0,smelter:0,press:0,assembler:0,copperMiner:0,copperSmelter:0,wiremill:0,circuitpress:0,beamMill:0,coilWinder:0},unitFaults:{miner:[],smelter:[],press:[],assembler:[],copperMiner:[],copperSmelter:[],wiremill:[],circuitpress:[],beamMill:[],coilWinder:[]},
  mechanicAssignments:{miner:0,smelter:0,press:0,assembler:0,copperMiner:0,copperSmelter:0,wiremill:0,circuitpress:0,beamMill:0,coilWinder:0},breakdownEvent:null,powerCutEvent:false,powerCutSeen:false,cyberAttackEvent:false,cyberAttackSeen:false,cybersecuritySpecialists:0,
  salesTarget:'parts',autoSell:false,salesAssignments:{ore:0,ingot:0,plate:0,parts:0,copperOre:0,copperIngot:0,wire:0,circuits:0,beams:0,coils:0},boostSeconds:{production:0,dispatch:0,protection:0},missionsClaimed:[],researched:[],reputation:0,acceptedContracts:[],contractsCompleted:[],repeatContractRounds:[0,0,0],contractClock:0,repeatNextAt:[0,60,120],repeatDeadline:[0,0,0]
};
const machines:{id:MachineId;name:string;short:string;cost:number;desc:string;input:string;output:string;rate:number}[]=[
  {id:'miner',name:'Rockbreaker Mine',short:'EXTRACT',cost:50,desc:'Breaks rock into raw ore.',input:'Raw ore',output:'Raw ore',rate:.22},
  {id:'smelter',name:'Blast Furnace',short:'SMELT',cost:180,desc:'Melts ore into iron ingots.',input:'Raw ore',output:'Iron ingots',rate:.16},
  {id:'press',name:'Stamping Press',short:'PRESS',cost:600,desc:'Shapes ingots into metal plates.',input:'Iron ingots',output:'Metal plates',rate:.09},
  {id:'assembler',name:'Mech Assembly',short:'ASSEMBLE',cost:1600,desc:'Builds finished precision parts.',input:'Metal plates',output:'Precision parts',rate:.055},
  {id:'copperMiner',name:'Copper Excavator',short:'COPPER MINE',cost:1800,desc:'Extracts copper ore for the electrical production line.',input:'Copper seam',output:'Copper ore',rate:.26},
  {id:'copperSmelter',name:'Copper Foundry',short:'COPPER SMELT',cost:5500,desc:'Refines copper ore into conductive ingots.',input:'Copper ore',output:'Copper ingots',rate:.18},
  {id:'wiremill',name:'Wire Drawing Mill',short:'WIRE DRAW',cost:14000,desc:'Draws copper ingots into fine electrical wire.',input:'Copper ingots',output:'Copper wire',rate:.12},
  {id:'circuitpress',name:'Circuit Board Line',short:'CIRCUITS',cost:30000,desc:'Builds circuit boards from precision electrical wire.',input:'Copper wire',output:'Circuit boards',rate:.07},
  {id:'beamMill',name:'Beam Rolling Mill',short:'STEEL BEAMS',cost:2500,desc:'Rolls iron ingots into structural steel beams.',input:'Iron ingots',output:'Steel beams',rate:.075},
  {id:'coilWinder',name:'Coil Winding Machine',short:'COPPER COILS',cost:21000,desc:'Winds copper wire into precision electrical coils.',input:'Copper wire',output:'Copper coils',rate:.065}
];
const goods:{id:StockId;name:string;emoji:string;price:number;detail:string}[]=[
  {id:'ore',name:'Raw Ore',emoji:'🪨',price:5,detail:'Fresh from the mine'},
  {id:'ingot',name:'Iron Ingots',emoji:'🧱',price:14,detail:'Smelted and ready'},
  {id:'plate',name:'Metal Plates',emoji:'🔩',price:36,detail:'Pressed steel stock'},
  {id:'parts',name:'Precision Parts',emoji:'🧰',price:105,detail:'Premium finished goods'},
  {id:'copperOre',name:'Copper Ore',emoji:'🟠',price:6,detail:'Raw copper from the new excavation line'},
  {id:'copperIngot',name:'Copper Ingots',emoji:'🟤',price:18,detail:'Refined conductive metal'},
  {id:'wire',name:'Copper Wire',emoji:'🧵',price:48,detail:'Drawn wire for electrical manufacturing'},
  {id:'circuits',name:'Circuit Boards',emoji:'🟩',price:140,detail:'High-value electrical components'},
  {id:'beams',name:'Steel Beams',emoji:'🏗️',price:85,detail:'Structural steel for major construction projects'},
  {id:'coils',name:'Copper Coils',emoji:'🌀',price:110,detail:'Wound electrical coils for motors and generators'}
];
const contracts:{id:string;name:string;detail:string;good:StockId;qty:number;reward:number;rep:number;xp:number;minRep:number}[]=[
  {id:'first-ore',name:'First Ore Delivery',detail:'A nearby foundry advances your first machine purchase, then pays the balance when you deliver five raw ore.',good:'ore',qty:5,reward:85,rep:5,xp:25,minRep:0},
  {id:'foundry-batch',name:'Foundry Batch',detail:'Supply a run of iron ingots.',good:'ingot',qty:8,reward:180,rep:7,xp:35,minRep:5},
  {id:'steel-plates',name:'Steel Plate Consignment',detail:'A construction firm needs steel plates.',good:'plate',qty:6,reward:360,rep:10,xp:45,minRep:12},
  {id:'precision-order',name:'Precision Components',detail:'A machinery customer wants precision parts.',good:'parts',qty:4,reward:650,rep:15,xp:60,minRep:22},
  {id:'copper-delivery',name:'Copper Ore Delivery',detail:'An electrical foundry needs copper.',good:'copperOre',qty:10,reward:700,rep:12,xp:50,minRep:25},
  {id:'wire-contract',name:'Electrical Wire Contract',detail:'Wire for a regional infrastructure project.',good:'wire',qty:6,reward:1100,rep:20,xp:65,minRep:40},
  {id:'circuit-contract',name:'Circuit Board Supply',detail:'A technology manufacturer needs circuits.',good:'circuits',qty:4,reward:1800,rep:30,xp:80,minRep:60},
  {id:'structural-steel',name:'Construction Steel Order',detail:'A building contractor needs a shipment of Steel Beams for a major project.',good:'beams',qty:10,reward:1120,rep:12,xp:55,minRep:18},
  {id:'generator-coils',name:'Generator Coil Order',detail:'An energy equipment firm needs Copper Coils for electric motors.',good:'coils',qty:8,reward:1440,rep:18,xp:75,minRep:50}
];
const contractProducer:Record<StockId,MachineId>={ore:'miner',ingot:'smelter',plate:'press',parts:'assembler',copperOre:'copperMiner',copperIngot:'copperSmelter',wire:'wiremill',circuits:'circuitpress',beams:'beamMill',coils:'coilWinder'};
type RepeatOrder = {slot:number;name:string;detail:string;good:StockId;qty:number;reward:number;rep:number;xp:number;kind:string;due:number};
const repeatClients=['Local Fabricators','Midtown Engineering','Northern Supply Co.','Pennyworth Industrial','Regional Repairs','Docks & Freight','Municipal Works','Emergency Supply'];
const orderKinds=['BULK PURCHASE','RUSH DELIVERY','STOCK REPLENISHMENT','PRIORITY MANUFACTURING','INFRASTRUCTURE ORDER','WHOLESALE SUPPLY'];
const contractWait=(slot:number,round:number)=>75+slot*25+Math.min(90,round*5);
function generateRepeatOrders(s:GameState):RepeatOrder[]{
  const available=goods.filter(g=>s[contractProducer[g.id]]>0);
  if(!available.length)return [];
  return [0,1,2].filter(slot=>s.contractClock>=s.repeatNextAt[slot]).map(slot=>{
    const round=s.repeatContractRounds[slot]||0;
    const item=available[(round*3+slot*2+Math.floor(round/2))%available.length];
    const kind=orderKinds[(round+slot*2)%orderKinds.length];
    const variation=[1,1.6,2.2,1.3,1.9,2.6][(round+slot*2)%6];
    const progress=Math.min(8,Math.floor(s.experience/250)+Math.floor(s.reputation/35));
    const qty=Math.max(5,Math.ceil((12+progress*7+round*3)*(item.price>=100?.4:item.price>=35?.65:1)*variation));
    const reward=Math.ceil(qty*item.price*(kind==='RUSH DELIVERY'?1.65:1.3));
    const due=s.repeatDeadline[slot]||s.contractClock+(kind==='RUSH DELIVERY'?150:300+progress*25);
    return {slot,name:repeatClients[(round+slot)%repeatClients.length],detail:kind==='RUSH DELIVERY'?'Urgent: our production line is waiting on this shipment.':kind==='BULK PURCHASE'?'We need a sizeable batch for a large project.':kind==='INFRASTRUCTURE ORDER'?'A municipal project needs reliable industrial supplies.':kind==='PRIORITY MANUFACTURING'?'Our client has moved the manufacturing schedule forward.':'Could you supply another batch to our facility?',good:item.id,qty,reward,rep:1+Math.floor(variation),xp:12+progress*3+slot*5,kind,due};
  });
}
function loadGame():GameState{
  try{
    const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
    const completed=Array.isArray(saved.contractsCompleted)?saved.contractsCompleted:[];
    const shouldRecoverPowerCut=completed.includes('first-ore')&&!saved.powerCutSeen&&!saved.powerCutEvent;
    const shouldRecoverCyberAttack=Number(saved.assembler)>0&&!saved.cyberAttackSeen&&!saved.cyberAttackEvent;
    const missionXp:Record<number,number>={1:10,2:15,3:15,4:20,5:20,6:25,7:20,8:25,9:30,10:35,11:40,12:45,13:50,14:60};
    const legacyXpFromContracts=completed.reduce((total:string|number,id:string)=>Number(total)+(contracts.find(c=>c.id===id)?.xp||0),0);
    const legacyXpFromMissions=(Array.isArray(saved.missionsClaimed)?saved.missionsClaimed:[]).reduce((total:number,id:number)=>total+(missionXp[id]||0),0);
    const migratedExperience=saved.experience!==undefined?Math.max(0,Number(saved.experience)||0):Math.max(legacyXpFromContracts+legacyXpFromMissions,Number(saved.assembler)>0?270:Number(saved.press)>0?165:Number(saved.smelter)>0?60:Number(saved.miner)>0?25:0);
    const legacyShipmentXp=saved.xpMigrationVersion===undefined?Math.floor(Math.max(0,Number(saved.sold)||0)/500):0;
    return {...fresh,...saved,xpMigrationVersion:1,gearShipmentProgress:Math.max(0,Number(saved.gearShipmentProgress)||0)%GEARS_PER_FINISHED_UNITS,salesXpProgress:Math.max(0,Number(saved.salesXpProgress)||0)%25,autoSalesXpProgress:Math.max(0,Number(saved.autoSalesXpProgress)||0)%60,broken:{...fresh.broken,...saved.broken},unitFaults:Object.fromEntries(machines.map(m=>[m.id,Array.from({length:Math.max(0,Number(saved[m.id])||0)},(_,i)=>Math.max(0,Number(saved.unitFaults?.[m.id]?.[i]??(i===0?saved.broken?.[m.id]:0))||0))])) as Record<MachineId,number[]>,mechanicAssignments:{...fresh.mechanicAssignments,...saved.mechanicAssignments},breakdownEvent:saved.breakdownEvent??null,powerCutEvent:shouldRecoverPowerCut?true:(saved.powerCutEvent??false),powerCutSeen:shouldRecoverPowerCut?true:(saved.powerCutSeen??false),cyberAttackEvent:shouldRecoverCyberAttack?true:(saved.cyberAttackEvent??false),cyberAttackSeen:shouldRecoverCyberAttack?true:(saved.cyberAttackSeen??false),cybersecuritySpecialists:Math.max(0,Number(saved.cybersecuritySpecialists)||0),researched:Array.isArray(saved.researched)?saved.researched:[],acceptedContracts:Array.isArray(saved.acceptedContracts)?saved.acceptedContracts:[],contractsCompleted:completed,boostSeconds:{production:Math.max(0,Math.floor(Number(saved.boostSeconds?.production)||0)),dispatch:Math.max(0,Math.floor(Number(saved.boostSeconds?.dispatch)||0)),protection:Math.max(0,Math.floor(Number(saved.boostSeconds?.protection)||0))},salesAssignments:goods.reduce((result,g)=>({...result,[g.id]:Math.max(0,Math.floor(Number(saved.salesAssignments?.[g.id]??(!saved.salesAssignments&&saved.salesTarget===g.id?saved.salespeople:0))||0))}),{...fresh.salesAssignments}),repeatContractRounds:Array.from({length:3},(_,i)=>Math.max(0,Math.floor(Number(saved.repeatContractRounds?.[i])||0))),contractClock:Math.max(0,Math.floor(Number(saved.contractClock)||0)),repeatNextAt:Array.from({length:3},(_,i)=>Math.max(0,Math.floor(Number(saved.repeatNextAt?.[i]??i*60)||0))),repeatDeadline:Array.from({length:3},(_,i)=>Math.max(0,Math.floor(Number(saved.repeatDeadline?.[i])||0))),experience:migratedExperience+legacyShipmentXp,reputation:Math.max(0,Number(saved.reputation)||0)};
  }catch{return fresh;}
}
const fmt=(n:number)=>Math.floor(n).toLocaleString();
const machineCost=(m:typeof machines[number],s:GameState)=>Math.floor(m.cost*Math.pow(1.48,s[m.id]));
const mechanicCost=(s:GameState)=>Math.floor(300*Math.pow(1.85,s.mechanics));
const salesCost=(s:GameState)=>Math.floor(420*Math.pow(1.85,s.salespeople));
const WAGES={mechanic:5,sales:8,cyber:12} as const;
const payrollPerMinute=(v:GameState)=>v.mechanics*WAGES.mechanic+v.salespeople*WAGES.sales+v.cybersecuritySpecialists*WAGES.cyber;
const REPAIR_COSTS:Record<MachineId,number>={miner:40,smelter:65,press:90,assembler:130,copperMiner:85,copperSmelter:155,wiremill:230,circuitpress:340,beamMill:185,coilWinder:285};
const repairCostFor=(id:MachineId,level:number)=>REPAIR_COSTS[id]+level*15;
const MAX_MACHINE_UNITS=3;
const GEARS_PER_FINISHED_UNITS=12;
const finishedGearUnits=(id:StockId,amount:number)=>(id==='parts'||id==='circuits'||id==='beams'||id==='coils')?amount:0;
const shipmentGearGain=(state:GameState,amount:number)=>{
  const whole=Math.floor((state.gearShipmentProgress+amount+1e-8)/GEARS_PER_FINISHED_UNITS);
  return {earned:whole,remainder:state.gearShipmentProgress+amount-whole*GEARS_PER_FINISHED_UNITS};
};
const FACTORY_STAGES=[
  {number:1,name:'First Workshop',xp:0,rep:0,detail:'Mine ore and smelt your first iron ingots.'},
  {number:2,name:'Steel Manufacturing',xp:150,rep:8,detail:'Build precision parts and branch out into structural steel.'},
  {number:3,name:'Copper Expansion',xp:200,rep:20,detail:'Launch the electrical line and supply conductive metals.'},
  {number:4,name:'Industrial Electronics',xp:500,rep:50,detail:'Turn copper wire into circuit boards and wound coils.'},
  {number:5,name:'National Manufacturer',xp:1600,rep:125,detail:'Establish a national supplier network and expand several production lines.'},
  {number:6,name:'Multinational Manufacturer',xp:6500,rep:350,detail:'Operate a diversified industrial group supplying customers worldwide.'}
] as const;
const machineStage:Record<MachineId,number>={miner:1,smelter:1,press:2,assembler:2,beamMill:2,copperMiner:3,copperSmelter:3,wiremill:3,circuitpress:4,coilWinder:4};

const faultCount=(v:GameState,id:MachineId)=>v.unitFaults[id].slice(0,v[id]).filter(f=>f>0).length;
const workingUnits=(v:GameState,id:MachineId)=>Math.max(0,v[id]-faultCount(v,id));
const firstFault=(v:GameState,id:MachineId)=>v.unitFaults[id].findIndex((f,i)=>i<v[id]&&f>0);
const repairUnit=(v:GameState,id:MachineId,index:number)=>({...v,unitFaults:{...v.unitFaults,[id]:v.unitFaults[id].map((f,i)=>i===index?0:f)},broken:{...v.broken,[id]:0}});

const BOOSTS:{id:BoostId;name:string;subtitle:string;description:string;cost:number;duration:number}[]=[
  {id:'production',name:'Production Overdrive',subtitle:'2× FACTORY OUTPUT',description:'Double every working machine’s output for three minutes. Does not increase breakdown risk.',cost:350,duration:180},
  {id:'dispatch',name:'Express Dispatch',subtitle:'2× AUTOMATIC SALES',description:'Salespeople ship twice as much stock for three minutes. Earn the normal XP from all those sales.',cost:250,duration:180},
  {id:'protection',name:'Machine Insurance',subtitle:'NO RANDOM BREAKDOWNS',description:'Protect all machines from new random breakdowns for three minutes. Existing faults still need repairs.',cost:300,duration:180}
];
const boostClock=(seconds:number)=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;

function MachineArt({id,active,broken,cycle,lights}:{id:MachineId;active:boolean;broken:boolean;cycle:number;lights:('on'|'off'|'empty')[]}){
 const beat=cycle%2?'cycle-b':'cycle-a';
 const electrical=['copperMiner','copperSmelter','wiremill','circuitpress','coilWinder'].includes(id);
 const copper=electrical?'#bd8054':'#bd985e';
 const steel=electrical?'#78877e':'#819187';
 const dark=electrical?'#39453d':'#35453d';
 const glass=electrical?'#d8a16d':'#d5c18b';
 const bolt=(x:number,y:number)=><circle cx={x} cy={y} r="2.3" fill="#d7c9a8" stroke="#39453b" strokeWidth="1"/>;
 return <div className={'machine-art art-'+id+(electrical?' art-electrical':'')+(active?' running '+beat:'')+(broken?' broken':'')}>
  <div className="art-backdrop"/>
  <svg viewBox="0 0 320 210" role="img" aria-label={machines.find(m=>m.id===id)?.name+' detailed industrial machine illustration'}>
   <defs>
    <linearGradient id={'body-'+id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d3d9c9"/><stop offset=".42" stopColor={steel}/><stop offset="1" stopColor="#303d36"/></linearGradient>
    <linearGradient id={'copper-'+id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f0c28a"/><stop offset=".5" stopColor={copper}/><stop offset="1" stopColor="#704a35"/></linearGradient>
    <linearGradient id={'dark-'+id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#59685d"/><stop offset="1" stopColor="#202a25"/></linearGradient>
    <linearGradient id={'glass-'+id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f4e3b5"/><stop offset="1" stopColor="#b4b18b"/></linearGradient>
    <radialGradient id={'glow-'+id}><stop stopColor="#f3c879" stopOpacity=".8"/><stop offset="1" stopColor="#f3c879" stopOpacity="0"/></radialGradient>
    <filter id={'shadow-'+id} x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dy="4"/><feComponentTransfer><feFuncA type="linear" slope=".45"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
   </defs>
   <ellipse cx="160" cy="184" rx="122" ry="14" fill="#08110d" opacity=".72"/>
   <path d="M35 164l25-12h199l27 12-24 15H58z" fill="#26332c" stroke="#101a14" strokeWidth="3"/>
   <path d="M48 161h224v13H48z" fill="#59685a" stroke="#26372e" strokeWidth="3"/>
   <path d="M57 174h206" stroke="#b4a17a" strokeWidth="2" strokeDasharray="10 8" opacity=".7"/>
   <g filter={'url(#shadow-'+id+')'} stroke="#26372e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
    {id==='miner'&&<g>
      <path d="M68 87l18-37 103-8 35 30v82H68z" fill={'url(#body-'+id+')'}/>
      <path d="M86 51l14-23 80-4 27 24-18 14-91 5z" fill="#d0b477"/>
      <path d="M94 69l92-8 22 17v58H94z" fill={'url(#dark-'+id+')'}/>
      <path d="M109 82h79v42h-79z" fill="#1d2b24" stroke="#9caa91"/>
      <path d="M117 89h63v29h-63z" fill="#82917d"/><path d="M124 95h49v17h-49z" fill="#394d40"/>
      <path d="M74 84L44 65l-18 17 31 27 18-8z" fill="#a6b19a"/><g className="moving-part"><path d="M35 76l-13 22 20 17 17-22z" fill="#d2a66f"/><path d="M28 98l-13 21 21 16 17-22z" fill="#748579"/><path d="M21 119l-7 15 18 11 11-16z" fill="#c0a06d"/></g>
      <path d="M205 87h26v67h-26z" fill="#68796e"/><path d="M211 97h14v42h-14z" fill="#28372e"/>
      <path d="M84 139h116v13H84z" fill="#c08b57"/><path d="M98 151h86v7H98z" fill="#303d34"/>
      {bolt(83,91)}{bolt(194,77)}{bolt(83,145)}{bolt(217,145)}
      <path d="M116 31l12-12h43l13 11" fill="none" stroke="#d9c18b" strokeWidth="6"/>
      <path d="M235 91l19 8v42l-19 8" fill="none" stroke="#a0ad96" strokeWidth="7"/>
    </g>}
    {id==='smelter'&&<g>
      <path d="M79 62h163v99H79z" fill="#985d45"/><path d="M91 73h139v78H91z" fill="#4b3a31"/>
      <path d="M104 87h113v62H104z" fill="#1d2520"/><path d="M116 100h89v49h-89z" fill="#a95e3d"/>
      <path d="M129 139q-19-28 2-49 4 17 16 22 3-24 19-34 24 36-1 61z" fill="#e8753f" stroke="#f6c17c" strokeWidth="3" className="furnace-flame"/>
      <path d="M144 141q-8-15 6-27 1 11 9 13 8-12 11-18 11 24-3 32z" fill="#ffe29a" stroke="#fff0bd" strokeWidth="2" className="furnace-flame"/>
      <path d="M95 62V34h31v28m74 0V27h32v35" fill="#b17b57"/><path d="M102 35h17M201 29h18" stroke="#d9b184" strokeWidth="5"/>
      <path d="M71 82h10v68H71zm160 0h10v68h-10z" fill="#d0a06f"/>
      <path d="M82 156h160v9H82z" fill="#d7b179"/>
      <path d="M111 73h92" stroke="#d7b179" strokeWidth="4"/>{bolt(88,77)}{bolt(232,77)}{bolt(88,145)}{bolt(232,145)}
      <path d="M245 70h17v28h-17" fill="none" stroke="#8d9b8c" strokeWidth="6"/>
    </g>}
    {id==='press'&&<g>
      <path d="M73 42h174v121H73z" fill={'url(#body-'+id+')'}/><path d="M88 54h145v15H88z" fill="#d7d9c9"/>
      <path d="M93 69h20v79H93zm115 0h20v79h-20z" fill="#43574b"/>
      <path d="M115 73h92v17h-92z" fill="#25362d"/><g className="press-ram"><path d="M132 85h59v53h-59z" fill={'url(#copper-'+id+')'}/><path d="M121 134h81v12h-81z" fill="#d8bd81"/><path d="M139 94h45v29h-45z" fill="#8e6849"/></g>
      <path d="M85 150h150v12H85z" fill="#8a9a8a"/><path d="M103 160h113v6H103z" fill="#25352d"/>
      <path d="M75 37h170v12H75z" fill="#bdc5b4"/><path d="M87 27h146v10H87z" fill="#b17d50"/>
      <path d="M122 20h70v9h-70z" fill="#d2b67e"/><path d="M150 18v10" stroke="#34453a" strokeWidth="5"/>
      <path d="M111 91h-16m130 0h-16" stroke="#e2c68e" strokeWidth="4"/>
      {bolt(83,48)}{bolt(237,48)}{bolt(83,153)}{bolt(237,153)}
      <path d="M65 78h9v62h-9zm174 0h9v62h-9z" fill="#d09a64"/>
    </g>}
    {id==='assembler'&&<g>
      <path d="M59 128h198v27H59z" fill="#53685b"/><path d="M72 119h171v10H72z" fill="#c49b64"/>
      <path d="M88 110V74h76v36z" fill="#44594b"/><path d="M98 82h57v23H98z" fill="#202c25"/>
      <path d="M111 88h31v12h-31z" fill="#d1b27a"/><circle cx="127" cy="94" r="6" fill="#536e5a"/>
      <path d="M163 66l21-23 19 8-10 26-19 13z" fill="#9aa99a"/><g className="robot-arm"><path d="M187 54l16-31 22 8-7 34-19 8z" fill="#d0a36a"/><circle cx="200" cy="53" r="11" fill="#e2c68e"/><path d="M214 34l15-11 15 11-12 18z" fill="#8e9e90"/><path d="M229 49l10 10-10 12-11-9z" fill="#d0a36a"/></g>
      <path d="M69 65h29v12H69z" fill="#c08a57"/><path d="M81 76v41" stroke="#b9c5b3" strokeWidth="6"/>
      <path d="M105 119h8v-9h12v9h8v-9h12v9h8" fill="none" stroke="#d6b87e" strokeWidth="4"/>
      <path d="M62 155v-26h12v26m162 0v-26h12v26" fill="#29382f"/>
      {bolt(76,136)}{bolt(242,136)}{bolt(92,116)}{bolt(157,116)}
    </g>}
    {id==='copperMiner'&&<g>
      <path d="M67 88l18-35 104-6 36 31v79H67z" fill={'url(#copper-'+id+')'}/>
      <path d="M88 54l14-23 80-4 27 24-18 14-91 5z" fill="#e1b17c"/>
      <path d="M94 73l92-8 22 17v57H94z" fill={'url(#dark-'+id+')'}/>
      <path d="M109 85h79v41h-79z" fill="#28352d" stroke="#d5a16c"/><path d="M119 94h58v24h-58z" fill="#bd8054"/>
      <g className="moving-part"><path d="M68 76L42 58 24 80l31 27 18-8z" fill="#d49a68"/><path d="M35 94l-17 23 20 16 18-23z" fill="#8f674a"/></g>
      <path d="M204 91h28v63h-28z" fill="#7f7760"/><circle cx="218" cy="110" r="13" fill="#dba16c"/><circle cx="218" cy="110" r="6" fill="#614735"/>
      <path d="M83 140h116v13H83z" fill="#c18456"/>{bolt(84,92)}{bolt(194,79)}{bolt(84,145)}{bolt(218,145)}
      <path d="M112 35h64" stroke="#f0c18c" strokeWidth="5"/>
    </g>}
    {id==='copperSmelter'&&<g>
      <path d="M79 62h163v99H79z" fill="#986349"/><path d="M91 73h139v78H91z" fill="#48372e"/>
      <path d="M104 87h113v62H104z" fill="#1d2520"/><path d="M116 100h89v49h-89z" fill="#ad613f"/>
      <path d="M129 139q-19-28 2-49 4 17 16 22 3-24 19-34 24 36-1 61z" fill="#e78c4c" stroke="#f5ca8a" strokeWidth="3" className="furnace-flame"/>
      <path d="M144 141q-8-15 6-27 1 11 9 13 8-12 11-18 11 24-3 32z" fill="#ffe1a0" className="furnace-flame"/>
      <path d="M95 62V34h31v28m74 0V27h32v35" fill="#c18a60"/><path d="M102 35h17m82-6h18" stroke="#e2b789" strokeWidth="5"/>
      <path d="M71 82h10v68H71zm160 0h10v68h-10z" fill="#d4a071"/><path d="M82 156h160v9H82z" fill="#d7b179"/>
      {bolt(88,77)}{bolt(232,77)}{bolt(88,145)}{bolt(232,145)}
    </g>}
    {id==='wiremill'&&<g>
      <path d="M53 76h216v84H53z" fill="#66776c"/><path d="M65 87h192v59H65z" fill="#26352d"/>
      <path d="M71 95h48v43H71z" fill="#9b7653"/><path d="M203 95h48v43h-48z" fill="#9b7653"/>
      <circle cx="94" cy="116" r="26" fill="#26342d" stroke="#d0a06e" strokeWidth="8"/><circle cx="94" cy="116" r="10" fill="#d9c08d"/>
      <circle cx="226" cy="116" r="26" fill="#26342d" stroke="#d0a06e" strokeWidth="8"/><circle cx="226" cy="116" r="10" fill="#d9c08d"/>
      <g className="wire-spool"><path d="M119 107Q160 58 201 107M119 124Q160 171 201 124" fill="none" stroke="#e3b77f" strokeWidth="5"/><path d="M119 115h82" stroke="#c6d0b8" strokeWidth="3"/></g>
      <path d="M74 151h174" stroke="#c1c9b9" strokeWidth="5"/><path d="M78 75h166" stroke="#d6b486" strokeWidth="5"/>
      {bolt(63,84)}{bolt(260,84)}{bolt(63,152)}{bolt(260,152)}
    </g>}
    {id==='circuitpress'&&<g>
      <path d="M58 39h204v122H58z" fill="#617267"/><path d="M72 53h176v91H72z" fill="#27352d"/>
      <path d="M85 66h150v63H85z" fill="#355d47" stroke="#a0b194"/>
      <path d="M98 79h124v38H98z" fill="#172b22"/>
      <path d="M108 87h20v20h-20zm35 0h20v20h-20zm35 0h20v20h-20z" fill="#d0bd87" stroke="#283a30" strokeWidth="2"/>
      <path d="M118 77v-8m35 8v-8m35 8v-8M118 109v11m35-11v11m35-11v11" stroke="#d0a16c" strokeWidth="3"/>
      <path d="M98 126h124" stroke="#d0a16c" strokeWidth="3" strokeDasharray="5 4"/>
      <path d="M73 42h175v9H73z" fill="#c5cbbb"/><path d="M91 31h138v11H91z" fill="#b97c52"/>
      <path d="M87 150h146v10H87z" fill="#c18b5f"/>{bolt(67,48)}{bolt(251,48)}{bolt(67,151)}{bolt(251,151)}
      <path d="M263 66h15v47h-15" fill="none" stroke="#d2a36f" strokeWidth="6"/>
    </g>}
    <g fill="#d5c18b" stroke="#29372f" strokeWidth="1.5"><circle cx="48" cy="167" r="5"/><circle cx="272" cy="167" r="5"/></g>
   </g>
   {active&&<g className="sparkles" fill="#f4d28f" stroke="#f4d28f"><path d="M42 39v-12m-6 6h12"/><path d="M279 83V71m-6 6h12"/><circle cx="291" cy="126" r="2.5"/></g>}
   {broken&&<path d="M151 27l-10 20h12l-7 18 22-26h-13l8-12z" fill="#d47b55" stroke="#ffe0aa" strokeWidth="2"/>}
  </svg>
  <div className="machine-art-floor"/><span className="art-lamp" role="group" aria-label="Individual machine status lights">{lights.map((light,i)=><i key={i} className={"unit-light "+light} title={"Unit "+(i+1)+": "+(light==="on"?"running":light==="off"?"stopped":"not purchased")}/>)}</span>
  {broken&&<span className="broken-stamp"><AlertTriangle size={14}/> BROKEN</span>}{active&&<span className="art-status-dot"/>}
 </div>;
}

export default function App(){
  const [s,setS]=useState<GameState>(loadGame);
  const [page,setPage]=useState<Page>('factory');
  const [running,setRunning]=useState(true);
  const [speed,setSpeed]=useState(1);
  const [notice,setNotice]=useState('');
  const [showReset,setShowReset]=useState(false);
  const [contractFilter,setContractFilter]=useState<'all'|'ready'|'progress'>('all');
  const [cycle,setCycle]=useState(0);
  const [inboxOpen,setInboxOpen]=useState(false);
  const [expandedMail,setExpandedMail]=useState<string|null>(null);
  useEffect(()=>{localStorage.setItem(SAVE_KEY,JSON.stringify(s));},[s]);
  useEffect(()=>{
    if(!running)return;
    const timer=window.setInterval(()=>{setCycle(c=>c+1);setS(v=>{
      const n={...v,broken:{...v.broken},unitFaults:Object.fromEntries(machines.map(m=>[m.id,[...v.unitFaults[m.id]]])) as Record<MachineId,number[]>};
      if(n.breakdownEvent||n.powerCutEvent||n.cyberAttackEvent)return n;
      n.contractClock++;
      n.repeatDeadline=[...n.repeatDeadline];
      n.repeatNextAt=[...n.repeatNextAt];
      n.repeatContractRounds=[...n.repeatContractRounds];
      for(const order of generateRepeatOrders(n)){
        if(!n.repeatDeadline[order.slot])n.repeatDeadline[order.slot]=order.due;
        else if(n.contractClock>n.repeatDeadline[order.slot]){
          n.repeatNextAt[order.slot]=n.contractClock+contractWait(order.slot,n.repeatContractRounds[order.slot]);
          n.repeatContractRounds[order.slot]++;
          n.repeatDeadline[order.slot]=0;
        }
      }
      const boostActive={production:n.boostSeconds.production>0,dispatch:n.boostSeconds.dispatch>0,protection:n.boostSeconds.protection>0};
      n.boostSeconds={production:Math.max(0,n.boostSeconds.production-1),dispatch:Math.max(0,n.boostSeconds.dispatch-1),protection:Math.max(0,n.boostSeconds.protection-1)};
      const wages=payrollPerMinute(n)/60;
      const payrollFunded=n.cash+1e-8>=wages;
      if(payrollFunded)n.cash=Math.max(0,n.cash-wages);
      const multiplier=speed;
      const reliabilityBonus=(n.researched.includes('reinforced-bearings')?.35:0)+(n.researched.includes('predictive-maintenance')?.2:0);
      machines.forEach(m=>{
        if(boostActive.protection)return;
        for(let i=0;i<n[m.id];i++){
          if(n.unitFaults[m.id][i]>0)continue;
          if(Math.random()<.00065*(speed===2?4:1)*(1-reliabilityBonus)){
            n.unitFaults[m.id][i]=24;
            if(!n.breakdownEvent)n.breakdownEvent=m.id;
          }
        }
      });
      if(n.breakdownEvent)return n;
      machines.forEach(m=>{
        const assigned=n.mechanicAssignments[m.id]||0;
        if(payrollFunded&&assigned>0){
          const i=firstFault(n,m.id);
          if(i>=0)n.unitFaults[m.id][i]=Math.max(0,n.unitFaults[m.id][i]-assigned*multiplier);
        }
      });
      const researchOutput=(n.researched.includes('efficient-extraction')?1.15:1)*(n.researched.includes('precision-tooling')?1.3:1)*(n.researched.includes('smart-robotics')?1.2:1);
      const rate=(id:MachineId,base:number)=>workingUnits(n,id)*base*(1+n['tier_'+id]*.25)*researchOutput*multiplier*(boostActive.production?2:1);
      const oreMade=rate('miner',.35);
      const ingotsMade=Math.min(n.ore+oreMade,rate('smelter',.22));
      const beamsMade=Math.min((n.ingot+ingotsMade)*.45,rate('beamMill',.075));
      const platesMade=Math.min(Math.max(0,n.ingot+ingotsMade-beamsMade),rate('press',.12));
      const partsMade=Math.min(n.plate+platesMade,rate('assembler',.07));
      const copperOreMade=rate('copperMiner',.26);
      const copperIngotsMade=Math.min(n.copperOre+copperOreMade,rate('copperSmelter',.18));
      const wireMade=Math.min(n.copperIngot+copperIngotsMade,rate('wiremill',.12));
      const coilsMade=Math.min((n.wire+wireMade)*.45,rate('coilWinder',.065));
      const circuitsMade=Math.min(Math.max(0,n.wire+wireMade-coilsMade),rate('circuitpress',.07));
      n.ore=Math.max(0,n.ore+oreMade-ingotsMade);
      n.ingot=Math.max(0,n.ingot+ingotsMade-platesMade-beamsMade);
      n.beams+=beamsMade;
      n.plate=Math.max(0,n.plate+platesMade-partsMade);
      n.parts+=partsMade;
      n.copperOre=Math.max(0,n.copperOre+copperOreMade-copperIngotsMade);
      n.copperIngot=Math.max(0,n.copperIngot+copperIngotsMade-wireMade);
      n.wire=Math.max(0,n.wire+wireMade-circuitsMade-coilsMade);
      n.coils+=coilsMade;
      n.circuits+=circuitsMade;
      if(payrollFunded&&n.autoSell&&n.salespeople>0){
        let activeSellers=0;
        const saleBonus=n.researched.includes('market-intelligence')?1.2:1;
        goods.forEach(item=>{
          const count=Math.min(n.salespeople,Math.max(0,n.salesAssignments[item.id]||0));
          if(count<=0)return;
          const amount=Math.min(n[item.id],count*.12*(n.researched.includes('dispatch-systems')?1.25:1)*multiplier*(boostActive.dispatch?2:1));
          if(amount<=0)return;
          const revenue=amount*item.price*saleBonus;
          const total=n.salesXpProgress+revenue;
          const shipmentXp=Math.floor((total+1e-8)/25);
          n.salesXpProgress=total-shipmentXp*25;
          n[item.id]-=amount;n.cash+=revenue;n.sold+=revenue;
          n.experience+=shipmentXp;
          const reward=shipmentGearGain(n,finishedGearUnits(item.id,amount));
          n.gears+=reward.earned;n.gearShipmentProgress=reward.remainder;
          activeSellers+=count;
        });
        const totalStaffXp=n.autoSalesXpProgress+activeSellers;
        const staffXp=Math.floor(totalStaffXp/60);
        n.autoSalesXpProgress=totalStaffXp-staffXp*60;
        n.experience+=staffXp;
      }
      return n;
    });},1000);
    return()=>window.clearInterval(timer);
  },[running,speed]);
  const machineCount=machines.reduce((sum,m)=>sum+s[m.id],0);
  const stockValue=goods.reduce((sum,g)=>sum+s[g.id]*g.price,0);
  const brokenCount=machines.reduce((sum,m)=>sum+faultCount(s,m.id),0);
  const assignedTotal=machines.reduce((sum,m)=>sum+s.mechanicAssignments[m.id],0);
  const unassigned=s.mechanics-assignedTotal;
  const assignedSales=goods.reduce((sum,g)=>sum+(s.salesAssignments[g.id]||0),0);
  const unassignedSales=Math.max(0,s.salespeople-assignedSales);
  const payroll=payrollPerMinute(s);
  const payrollFunded=s.cash+1e-8>=payroll/60;
  const economyActive=running&&!s.breakdownEvent&&!s.powerCutEvent&&!s.cyberAttackEvent;
  const autoIncomePerMinute=economyActive&&payrollFunded&&s.autoSell?goods.reduce((sum,item)=>{
    const assigned=Math.min(s.salespeople,Math.max(0,s.salesAssignments[item.id]||0));
    // Estimate the next minute from the current one-second dispatch rate.
    const amount=Math.min(Math.max(0,s[item.id]),assigned*.12*(s.researched.includes('dispatch-systems')?1.25:1)*speed*(s.boostSeconds.dispatch>0?2:1));
    return sum+amount*item.price*(s.researched.includes('market-intelligence')?1.2:1)*60;
  },0):0;
  const wagesPerMinute=economyActive&&payrollFunded?payroll:0;
  const netPerMinute=autoIncomePerMinute-wagesPerMinute;
  const moneyPerMinute=(amount:number)=>Math.abs(amount).toFixed(1);
  // XP requirements increase with each level; there is no artificial maximum.
  const xpForLevel=(level:number)=>75*(level-1)*level;
  const progressionLevel=Math.max(1,Math.floor((1+Math.sqrt(1+4*s.experience/75))/2));
  const levelStart=xpForLevel(progressionLevel);
  const nextGoal=xpForLevel(progressionLevel+1);
  const reputationUnlock:Record<MachineId,number>={miner:0,smelter:2,press:8,assembler:18,copperMiner:20,copperSmelter:35,wiremill:50,circuitpress:60,beamMill:18,coilWinder:50};
  const machineTypesOwned=machines.filter(m=>s[m.id]>0).length;
  const companyRanks=[
    {name:'WORKSHOP',rep:0,xp:0,sales:0,machines:0},
    {name:'LOCAL MANUFACTURER',rep:15,xp:150,sales:500,machines:2},
    {name:'REGIONAL SUPPLIER',rep:55,xp:550,sales:5000,machines:4},
    {name:'INDUSTRIAL CORPORATION',rep:125,xp:1600,sales:20000,machines:6},
    {name:'NATIONAL MANUFACTURER',rep:220,xp:3500,sales:65000,machines:8},
    {name:'MULTINATIONAL MANUFACTURER',rep:350,xp:6500,sales:150000,machines:10}
  ];
  const rankUnlocked=(rank:typeof companyRanks[number])=>s.reputation>=rank.rep&&s.experience>=rank.xp&&s.sold>=rank.sales&&machineTypesOwned>=rank.machines;
  const currentRank=[...companyRanks].reverse().find(rankUnlocked)||companyRanks[0];
  const companyRank=currentRank.name;
  const nextRank=companyRanks[companyRanks.indexOf(currentRank)+1];
  const nextRep=nextRank?.rep??currentRank.rep;
  const repProgress=nextRank?Math.min(100,s.reputation/Math.max(1,nextRank.rep)*100):100;
  const goalProgress=Math.min(100,(s.experience-levelStart)/(nextGoal-levelStart)*100);
  const unlockAt:Record<MachineId,number>={miner:0,smelter:25,press:150,assembler:200,copperMiner:200,copperSmelter:350,wiremill:500,circuitpress:700,beamMill:260,coilWinder:650};
  // Keep the floor focused: show every machine already owned and just the next milestone.
  const stageReached=(stage:number)=>{
    const goal=FACTORY_STAGES[stage-1];
    if(s.experience<goal.xp||s.reputation<goal.rep)return false;
    return stage===5?rankUnlocked(companyRanks[3]):stage===6?rankUnlocked(companyRanks[5]):true;
  };
  const currentStage=[...FACTORY_STAGES].reverse().find(stage=>stageReached(stage.number))||FACTORY_STAGES[0];
  const nextStage=FACTORY_STAGES.find(stage=>stage.number===currentStage.number+1);
  const nextMachine=machines.filter(m=>s[m.id]===0).sort((a,b)=>unlockAt[a.id]-unlockAt[b.id])[0];
  const visibleMachines=machines.filter(m=>s[m.id]>0||m.id===nextMachine?.id||(m.id==='beamMill'&&s.smelter>0)||(m.id==='coilWinder'&&s.wiremill>0));
  const visibleGoods=goods.filter((g)=>{
    const producer=contractProducer;
    return s[producer[g.id]]>0||producer[g.id]===nextMachine?.id||(producer[g.id]==='beamMill'&&s.smelter>0)||(producer[g.id]==='coilWinder'&&s.wiremill>0);
  });
  const achievements=[
    {name:'First Foundations',detail:'Build your first machine',done:machineCount>=1,icon:'🏗️'},
    {name:'Hot Metal',detail:'Unlock the Blast Furnace',done:s.sold>=150,icon:'🔥'},
    {name:'Precision Work',detail:'Build the Stamping Press',done:s.press>0,icon:'🔩'},
    {name:'Full Production',detail:'Build the Mech Assembly',done:s.assembler>0,icon:'🦾'},
    {name:'First Shipment',detail:'Ship 1,000 Rivets worth of goods',done:s.sold>=1000,icon:'🚚'},
    {name:'Growing Crew',detail:'Hire your first team member',done:s.mechanics+s.salespeople>0,icon:'👷'},
    {name:'A New Metal',detail:'Build the Copper Excavator',done:s.copperMiner>0,icon:'🟠'},
    {name:'Going Electric',detail:'Build the Circuit Board Line',done:s.circuitpress>0,icon:'🟩'}
  ];
  const missions=[
    {id:1,title:'Make your first shipment',detail:'Ship any goods from the Warehouse.',progress:Math.min(1,s.sold),target:1,done:s.sold>=1,rivets:40,gears:0,xp:10},
    {id:2,title:'Bring the heat',detail:'Build your first Blast Furnace.',progress:s.smelter>0?1:0,target:1,done:s.smelter>0,rivets:60,gears:0,xp:15},
    {id:3,title:'Build your maintenance crew',detail:'Hire your first mechanic in Staff.',progress:Math.min(1,s.mechanics),target:1,done:s.mechanics>0,rivets:80,gears:0,xp:15},
    {id:4,title:'Become a serious supplier',detail:'Ship 1,000 Rivets worth of goods in total.',progress:Math.min(1000,s.sold),target:1000,done:s.sold>=1000,rivets:100,gears:2,xp:20},
    {id:5,title:'Shape the steel',detail:'Build your first Stamping Press.',progress:s.press>0?1:0,target:1,done:s.press>0,rivets:120,gears:0,xp:20},
    {id:6,title:'Assemble the future',detail:'Build your first Mech Assembly.',progress:s.assembler>0?1:0,target:1,done:s.assembler>0,rivets:150,gears:3,xp:25},
    {id:7,title:'Double your extraction',detail:'Build a second Rockbreaker Mine.',progress:Math.min(2,s.miner),target:2,done:s.miner>=2,rivets:180,gears:2,xp:20},
    {id:8,title:'Take sales off the floor',detail:'Hire your first sales representative.',progress:Math.min(1,s.salespeople),target:1,done:s.salespeople>0,rivets:200,gears:2,xp:25},
    {id:9,title:'Work smarter, not harder',detail:'Research Efficient Extraction.',progress:s.researched.includes('efficient-extraction')?1:0,target:1,done:s.researched.includes('efficient-extraction'),rivets:250,gears:3,xp:30},
    {id:10,title:'Become a regional supplier',detail:'Reach 10,000 Rivets in lifetime shipments.',progress:Math.min(10000,s.sold),target:10000,done:s.sold>=10000,rivets:350,gears:5,xp:35},
    {id:11,title:'Scale up the press room',detail:'Build a second Stamping Press.',progress:Math.min(2,s.press),target:2,done:s.press>=2,rivets:450,gears:6,xp:40},
    {id:12,title:'A new metal to master',detail:'Build your first Copper Excavator.',progress:s.copperMiner>0?1:0,target:1,done:s.copperMiner>0,rivets:550,gears:5,xp:45},
    {id:13,title:'Power the future',detail:'Build your first Wire Drawing Mill.',progress:s.wiremill>0?1:0,target:1,done:s.wiremill>0,rivets:700,gears:8,xp:50},
    {id:14,title:'Electronics manufacturer',detail:'Build your first Circuit Board Line.',progress:s.circuitpress>0?1:0,target:1,done:s.circuitpress>0,rivets:900,gears:12,xp:60}
  ];
  const activeMission=missions.find(m=>!s.missionsClaimed.includes(m.id));
  const visibleContracts=contracts.filter(c=>!s.contractsCompleted.includes(c.id)&&(s[contractProducer[c.good]]>0||contractProducer[c.good]===nextMachine?.id));
  const repeatOrders=generateRepeatOrders(s);
  const incomingMail=[...visibleContracts.map(c=>({key:'story-'+c.id,title:c.name,from:'Contract Office',detail:c.detail,good:c.good,qty:c.qty,kind:'STORY ORDER',due:0})),...repeatOrders.map(o=>({key:'repeat-'+o.slot+'-'+s.repeatContractRounds[o.slot],title:o.name,from:o.name,detail:o.detail,good:o.good,qty:o.qty,kind:o.kind,due:o.due}))];
  const nextMailWait=s.repeatNextAt.map((at,i)=>repeatOrders.some(o=>o.slot===i)?Infinity:Math.max(0,at-s.contractClock)).reduce((a,b)=>Math.min(a,b),Infinity);
  const inboxSignature=repeatOrders.map(o=>o.slot+':'+s.repeatContractRounds[o.slot]).join('|');
  const [lastInboxSignature,setLastInboxSignature]=useState('');
  useEffect(()=>{if(inboxSignature&&inboxSignature!==lastInboxSignature){setLastInboxSignature(inboxSignature);setInboxOpen(true);}},[inboxSignature,lastInboxSignature]);
  const readyOrders=visibleContracts.filter(c=>!s.contractsCompleted.includes(c.id)&&s.reputation>=c.minRep&&s[c.good]>=c.qty).length+repeatOrders.filter(c=>s[c.good]>=c.qty).length;
  const activeOrders=visibleContracts.filter(c=>!s.contractsCompleted.includes(c.id)&&s.reputation>=c.minRep&&s[c.good]<c.qty).length+repeatOrders.filter(c=>s[c.good]<c.qty).length;
  const completedOrders=s.contractsCompleted.length;
  const noticeTitle=notice.toLowerCase().includes('contract fulfilled')||notice.toLowerCase().includes('delivery signed off')?'Order complete · lovely stuff':notice.toLowerCase().includes('contract accepted')||notice.toLowerCase().includes('order accepted')?'New order · no pressure (some pressure)':notice.toLowerCase().includes('not enough')||notice.toLowerCase().includes('need ')||notice.toLowerCase().includes('no full units')?'Small snag · the numbers say no':notice.toLowerCase().includes('repaired')?'Back in business':notice.toLowerCase().includes('shipped')?'Out the loading bay':notice.toLowerCase().includes('built')?'Fresh machinery':notice.toLowerCase().includes('mission complete')?'Milestone smashed':'Workshop update';
  const noticeKind=notice.toLowerCase().includes('contract')||notice.toLowerCase().includes('order accepted')||notice.toLowerCase().includes('delivery signed off')?'ORDER DESK':notice.toLowerCase().includes('not enough')||notice.toLowerCase().includes('need ')?'QUICK HEADS-UP':'FACTORY NOTICE';
  useEffect(()=>{
    const next=missions.find(m=>!s.missionsClaimed.includes(m.id));
    if(next&&next.done){
      setS(v=>v.missionsClaimed.includes(next.id)?v:{...v,missionsClaimed:[...v.missionsClaimed,next.id],cash:v.cash+next.rivets,gears:v.gears+next.gears,experience:v.experience+next.xp});
      setNotice('Mission complete: '+next.title+' · +'+next.rivets+' Rivets · +'+next.xp+' XP'+(next.gears?' · +'+next.gears+' Gears':''));
    }
  },[s]);
  const researchOutput=(s.researched.includes('efficient-extraction')?1.15:1)*(s.researched.includes('precision-tooling')?1.3:1)*(s.researched.includes('smart-robotics')?1.2:1);
  const saleMultiplier=s.researched.includes('market-intelligence')?1.2:1;
  const rateFor=(m:typeof machines[number])=>workingUnits(s,m.id)*m.rate*(1+s['tier_'+m.id]*.25)*researchOutput*(s.boostSeconds.production>0?2:1);
  const resolvePowerCut=(hireMechanic:boolean)=>{
    if(!s.powerCutEvent)return;
    if(hireMechanic){
      setS(v=>({...v,cash:v.cash-60,mechanics:v.mechanics+1,mechanicAssignments:{...v.mechanicAssignments,miner:v.mechanicAssignments.miner+1},broken:{...v.broken,miner:0},unitFaults:{...v.unitFaults,miner:v.unitFaults.miner.map(()=>0)},powerCutEvent:false}));
      setNotice('Mechanic hired on a first-day discount. The Rockbreaker Mine is repaired and back online.');
      return;
    }
    setS(v=>({...v,cash:v.cash-40,broken:{...v.broken,miner:0},powerCutEvent:false}));
    setNotice('One-off emergency repair complete. The Rockbreaker Mine is back online.');
  };
  const cybersecurityCost=(state:GameState)=>Math.floor(600*Math.pow(1.9,state.cybersecuritySpecialists));
  const hireCybersecuritySpecialist=()=>{
    const cost=cybersecurityCost(s);
    if(s.cash<cost){setNotice('Not enough Rivets. Ship existing stock from the Warehouse to fund the security hire.');return;}
    setS(v=>({...v,cash:v.cash-cost,cybersecuritySpecialists:v.cybersecuritySpecialists+1,cyberAttackEvent:false}));
    setNotice('Cybersecurity specialist hired. The breach is contained and a permanent factory firewall is now active.');
  };
  const emergencyCyberRecovery=()=>{
    if(s.cash<120){setNotice('Emergency system recovery costs 120 RVT. Ship available warehouse stock to raise the funds.');return;}
    setS(v=>({...v,cash:v.cash-120,cyberAttackEvent:false}));
    setNotice('External response team restored the production network. The breach is contained, but you have no in-house cyber protection.');
  };
  const resolveBreakdown=(useMechanic:boolean)=>{
    const id=s.breakdownEvent;
    if(!id)return;
    if(useMechanic&&s.mechanicAssignments[id]>0){setS(v=>({...repairUnit(v,id,firstFault(v,id)),breakdownEvent:null}));setNotice(machines.find(m=>m.id===id)!.name+' repaired by your assigned mechanic. Production is back online.');return;}
    const cost=repairCostFor(id,s['tier_'+id]);
    if(s.cash>=cost){setS(v=>({...repairUnit(v,id,firstFault(v,id)),cash:v.cash-cost,breakdownEvent:null}));setNotice('Emergency repair complete · '+cost+' RVT spent. Production is back online.');return;}
    setS(v=>({...v,breakdownEvent:null}));setNotice('Emergency stop cleared. The machine remains broken until you assign a mechanic or save '+cost+' RVT for repairs.');
  };
  const buyMachine=(m:typeof machines[number])=>{
    if(m.id==='miner'&&s.miner===0&&!s.acceptedContracts.includes('first-ore')){setNotice('Accept your First Ore Delivery contract to receive the machine advance.');return;}
    if(s[m.id]>=MAX_MACHINE_UNITS){setNotice('Maximum of three units reached for '+m.name+'.');return;}
    if(s[m.id]===0&&(!stageReached(machineStage[m.id])||s.experience<unlockAt[m.id]||s.reputation<reputationUnlock[m.id])){setNotice('This machine type is not unlocked yet.');return;}
    const cost=machineCost(m,s);
    if(s.cash<cost){setNotice('Not enough Rivets. Ship some stock to raise funds.');return;}
    setS(v=>v[m.id]>=MAX_MACHINE_UNITS||v.cash<cost?v:{...v,cash:v.cash-cost,[m.id]:v[m.id]+1,unitFaults:{...v.unitFaults,[m.id]:[...v.unitFaults[m.id],0]},...(m.id==='assembler'&&!v.cyberAttackSeen?{cyberAttackSeen:true,cyberAttackEvent:true}:{})});
    setNotice(m.id==='assembler'&&!s.cyberAttackSeen?'Mech Assembly commissioned. Security breach detected — the factory network is locked down.':m.name+' unit '+(s[m.id]+1)+' built and added to the factory.');
  };
  const upgradeMachine=(m:typeof machines[number])=>{
    const cost=(s['tier_'+m.id]+1)*3;
    if(s.gears<cost){setNotice('You need '+cost+' Gears for this upgrade.');return;}
    setS(v=>({...v,gears:v.gears-cost,['tier_'+m.id]:v['tier_'+m.id]+1}));
    setNotice(m.name+' upgraded. Output increased by 25%.');
  };
  const sellStock=(id:StockId)=>{
    const item=goods.find(g=>g.id===id)!;const amount=Math.floor(s[id]);
    if(amount<1){setNotice('There are no full units ready to ship.');return;}
    const revenue=amount*item.price*saleMultiplier;
    setS(v=>{const total=v.salesXpProgress+revenue;const shipmentXp=Math.floor((total+1e-8)/25);return {...v,[id]:v[id]-amount,cash:v.cash+revenue,sold:v.sold+revenue,salesXpProgress:total-shipmentXp*25,experience:v.experience+shipmentXp,gears:v.gears+shipmentGearGain(v,finishedGearUnits(id,amount)).earned,gearShipmentProgress:shipmentGearGain(v,finishedGearUnits(id,amount)).remainder};});
    const shipmentXp=Math.floor((s.salesXpProgress+revenue+1e-8)/25);
    setNotice('Shipped '+fmt(amount)+' '+item.name+' for '+fmt(revenue)+' Rivets.'+(shipmentXp>0?' · +'+shipmentXp+' XP from shipments.':''));
  };
  const shipAllStock=()=>{
    const items=goods.map(g=>({item:g,amount:Math.max(0,Math.floor(s[g.id]))})).filter(x=>x.amount>0);
    if(!items.length){setNotice('There are no full units ready to ship.');return;}
    const revenue=items.reduce((total,{item,amount})=>total+amount*item.price*saleMultiplier,0);
    const totalUnits=items.reduce((total,{amount})=>total+amount,0);
    const earnedXp=Math.floor((s.salesXpProgress+revenue+1e-8)/25);
    setS(v=>{
      const shipped=goods.map(g=>({item:g,amount:Math.max(0,Math.floor(v[g.id]))}));
      const actualRevenue=shipped.reduce((total,{item,amount})=>total+amount*item.price*(v.researched.includes('market-intelligence')?1.2:1),0);
      if(actualRevenue<=0)return v;
      const progress=v.salesXpProgress+actualRevenue;
      const xp=Math.floor((progress+1e-8)/25);
      const next={...v,cash:v.cash+actualRevenue,sold:v.sold+actualRevenue,salesXpProgress:progress-xp*25,experience:v.experience+xp,gears:v.gears+shipmentGearGain(v,shipped.reduce((total,{item,amount})=>total+finishedGearUnits(item.id,amount),0)).earned,gearShipmentProgress:shipmentGearGain(v,shipped.reduce((total,{item,amount})=>total+finishedGearUnits(item.id,amount),0)).remainder};
      shipped.forEach(({item,amount})=>{next[item.id]-=amount;});
      return next;
    });
    setNotice('Shipped '+fmt(totalUnits)+' units across '+items.length+' products for '+fmt(revenue)+' Rivets · +'+earnedXp+' XP.');
  };
  const completeContract=(contract:typeof contracts[number])=>{
    if(s.contractsCompleted.includes(contract.id))return;
    if(contract.id==='first-ore'&&!s.acceptedContracts.includes('first-ore')){setNotice('Accept the opening contract before delivering goods.');return;}
    if(s.reputation<contract.minRep){setNotice('Your company needs '+contract.minRep+' reputation.');return;}
    if(s[contract.good]<contract.qty){setNotice('You need '+contract.qty+' units in stock.');return;}
    setS(v=>({...v,[contract.good]:v[contract.good]-contract.qty,cash:v.cash+contract.reward,reputation:v.reputation+contract.rep,experience:v.experience+contract.xp,contractsCompleted:[...v.contractsCompleted,contract.id],...(contract.id==='first-ore'&&!v.powerCutSeen?{powerCutSeen:true,powerCutEvent:true,broken:{...v.broken,miner:Math.max(v.broken.miner,30)},unitFaults:{...v.unitFaults,miner:v.unitFaults.miner.map((fault,i)=>i===0?Math.max(fault,30):fault)}}:{})}));
    setNotice(contract.id==='first-ore'?'DELIVERY SIGNED OFF · +'+contract.xp+' XP — then the lights go out. The Rockbreaker Mine has lost power.':'Delivery signed off. +'+fmt(contract.reward)+' RVT · +'+contract.rep+' reputation · +'+contract.xp+' XP. The client says you are now their favourite supplier.');
  };
  const completeRepeatOrder=(order:RepeatOrder)=>{
    setS(v=>{
      // Re-check stock and slot generation to prevent double collection.
      const current=generateRepeatOrders(v).find(c=>c.slot===order.slot);
      if(!current||current.good!==order.good||current.qty!==order.qty||v.contractClock>current.due||v[current.good]<current.qty)return v;
      return {...v,[current.good]:v[current.good]-current.qty,cash:v.cash+current.reward,reputation:v.reputation+current.rep,experience:v.experience+current.xp,repeatContractRounds:v.repeatContractRounds.map((round,i)=>i===order.slot?round+1:round),repeatNextAt:v.repeatNextAt.map((at,i)=>i===order.slot?v.contractClock+contractWait(i,v.repeatContractRounds[i]):at),repeatDeadline:v.repeatDeadline.map((d,i)=>i===order.slot?0:d)};
    });
    if(s[order.good]<order.qty){setNotice('Not enough stock to deliver this repeat order.');return;}
    setNotice('Repeat contract fulfilled · +'+order.xp+' XP · +'+order.rep+' reputation. Another order will arrive after a short customer cooldown.');
  };
  const hire=(role:'mechanic'|'sales')=>{
    const cost=role==='mechanic'?mechanicCost(s):salesCost(s);
    if(s.cash<cost){setNotice('You need '+fmt(cost)+' Rivets to hire this person.');return;}
    setS(v=>({...v,cash:v.cash-cost,[role==='mechanic'?'mechanics':'salespeople']:v[role==='mechanic'?'mechanics':'salespeople']+1}));
    setNotice(role==='mechanic'?'Mechanic hired. Assign them to a machine below.':'Sales representative hired. Set their product target below.');
  };
  const fire=(role:'mechanic'|'sales'|'cyber')=>{
    const key=role==='mechanic'?'mechanics':role==='sales'?'salespeople':'cybersecuritySpecialists';
    if(s[key]<=0){setNotice('No staff in this role to dismiss.');return;}
    setS(v=>{
      if(v[key]<=0)return v;
      const next={...v,[key]:v[key]-1};
      if(role==='mechanic'){
        const assignments={...v.mechanicAssignments};
        let excess=Math.max(0,machines.reduce((sum,m)=>sum+assignments[m.id],0)-next.mechanics);
        for(const m of [...machines].reverse()){if(excess<=0)break;const removed=Math.min(excess,assignments[m.id]);assignments[m.id]-=removed;excess-=removed;}
        next.mechanicAssignments=assignments;
      }
      if(role==='sales'){
        const assignments={...v.salesAssignments};
        let excess=Math.max(0,goods.reduce((sum,g)=>sum+assignments[g.id],0)-next.salespeople);
        for(const g of [...goods].reverse()){if(excess<=0)break;const removed=Math.min(excess,assignments[g.id]);assignments[g.id]-=removed;excess-=removed;}
        next.salesAssignments=assignments;
      }
      return next;
    });
    setNotice('Employee dismissed. Payroll reduced by '+(role==='mechanic'?WAGES.mechanic:role==='sales'?WAGES.sales:WAGES.cyber)+' RVT per minute.');
  };
  const assignSales=(id:StockId,count:number)=>{
    setS(v=>{
      const used=goods.reduce((sum,g)=>sum+(g.id===id?0:v.salesAssignments[g.id]||0),0);
      return {...v,salesAssignments:{...v.salesAssignments,[id]:Math.max(0,Math.min(count,v.salespeople-used))}};
    });
  };
  const assignMechanic=(id:MachineId,count:number)=>{
    const used=machines.reduce((sum,m)=>sum+(m.id===id?0:s.mechanicAssignments[m.id]),0);
    const allowed=Math.max(0,Math.min(s.mechanics-used,count));
    setS(v=>({...v,mechanicAssignments:{...v.mechanicAssignments,[id]:allowed}}));
  };
  const technologies=[
    {id:'efficient-extraction',tier:1,name:'Efficient Extraction',branch:'PRODUCTION',cost:2,icon:Zap,detail:'Optimised drills and furnace timing increase all machine output by 15%.',effect:'+15% production',requires:[] as string[]},
    {id:'reinforced-bearings',tier:1,name:'Reinforced Bearings',branch:'MAINTENANCE',cost:3,icon:ShieldCheck,detail:'Hard-wearing components reduce machine breakdown chance by 35%.',effect:'35% fewer breakdowns',requires:['efficient-extraction']},
    {id:'market-intelligence',tier:1,name:'Market Intelligence',branch:'COMMERCE',cost:4,icon:TrendingUp,detail:'Better pricing data and smarter contracts increase every sale value by 20%.',effect:'+20% sale value',requires:['efficient-extraction']},
    {id:'precision-tooling',tier:2,name:'Precision Tooling',branch:'ADVANCED PRODUCTION',cost:6,icon:Cpu,detail:'High-tolerance tooling pushes every production line another 30% faster.',effect:'+30% production',requires:['reinforced-bearings','market-intelligence']},
    {id:'dispatch-systems',tier:2,name:'Dispatch Systems',branch:'LOGISTICS',cost:8,icon:Truck,detail:'Better routing and order handling allow sales representatives to sell goods 25% faster.',effect:'+25% automatic sales speed',requires:['market-intelligence']},
    {id:'predictive-maintenance',tier:3,name:'Predictive Maintenance',branch:'INDUSTRIAL SYSTEMS',cost:12,icon:ShieldCheck,detail:'Condition monitoring further reduces breakdown risk by 20 percentage points.',effect:'Additional 20% fewer breakdowns',requires:['precision-tooling']},
    {id:'smart-robotics',tier:3,name:'Smart Robotics',branch:'AUTOMATION',cost:15,icon:Factory,detail:'Factory-wide robotic control boosts all production by another 20%.',effect:'+20% production',requires:['precision-tooling','dispatch-systems']}
  ];
  const researchTierNames:Record<number,string>={1:'Workshop Fundamentals',2:'Industrial Engineering',3:'Advanced Automation'};
  const researchTierUnlocked=(tier:number,done:string[])=>tier===1||(tier===2?done.includes('efficient-extraction'):done.includes('precision-tooling'));
  const researchTech=(id:string)=>{
    const tech=technologies.find(t=>t.id===id);
    if(!tech||s.researched.includes(id))return;
    if(!researchTierUnlocked(tech.tier,s.researched)){setNotice('Research the preceding tier first.');return;}
    if(!tech.requires.every(req=>s.researched.includes(req))){setNotice('Complete the prerequisite research first.');return;}
    if(s.gears<tech.cost){setNotice('You need '+tech.cost+' Gears to fund this research.');return;}
    setS(v=>v.researched.includes(id)?v:{...v,gears:v.gears-tech.cost,researched:[...v.researched,id]});
    setNotice(tech.name+' researched · '+tech.effect+'.');
  };
  const buyBoost=(id:BoostId)=>{
    const offer=BOOSTS.find(b=>b.id===id);
    if(!offer)return;
    if(s.boostSeconds[id]>0){setNotice('That boost is already running. You can buy it again after it expires.');return;}
    if(s.cash<offer.cost){setNotice('You need '+fmt(offer.cost)+' Rivets for '+offer.name+'.');return;}
    setS(v=>v.boostSeconds[id]>0||v.cash<offer.cost?v:{...v,cash:v.cash-offer.cost,boostSeconds:{...v.boostSeconds,[id]:offer.duration}});
    setNotice(offer.name+' activated for '+boostClock(offer.duration)+' · '+fmt(offer.cost)+' RVT spent.');
  };
  const reset=()=>{setS(fresh);setRunning(true);setSpeed(1);setShowReset(false);setNotice('A fresh factory. Let’s get to work!');};
  return <div className="game">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Factory size={23}/></span><span><b>ORE &amp; ORDER</b><small>FACTORY TYCOON</small></span></div>
      <div className="wallet">
        <div className="wallet-cash"><span className="coin-symbol">R</span><span><small>RIVETS</small><b>{fmt(s.cash)} <i>RVT</i></b></span></div>
        <div className="wallet-gears"><Cog size={18}/><span><small>GEARS</small><b>{fmt(s.gears)}</b></span></div>
      </div>
      <div className="top-controls"><span className="online"><i/> {s.cyberAttackEvent?'SECURITY LOCKDOWN':running?'RUNNING':'PAUSED'}</span><button className="round-btn" onClick={()=>setRunning(!running)} aria-label={running?'Pause':'Resume'}>{running?<Pause size={16}/>:<Play size={16}/>}</button><button className="round-btn" onClick={()=>setShowReset(true)} aria-label="Reset game"><RotateCcw size={16}/></button></div>
    </header>
    <main>
      <nav className="main-nav" aria-label="Main menu">
        <button className={page==='factory'?'active':''} onClick={()=>setPage('factory')}><Factory size={16}/> Factory</button>
        <button className={page==='staff'?'active':''} onClick={()=>setPage('staff')}><Users size={16}/> Staff <span>{s.mechanics+s.salespeople+s.cybersecuritySpecialists}</span></button>
        <button className={page==='warehouse'?'active':''} onClick={()=>setPage('warehouse')}><Boxes size={16}/> Warehouse</button>
        <button className={page==='research'?'active':''} onClick={()=>setPage('research')}><FlaskConical size={16}/> Research <span>{s.researched.filter(id=>technologies.some(t=>t.id===id)).length}/{technologies.length}</span></button>
        <button className={page==='store'?'active':''} onClick={()=>setPage('store')}><Zap size={16}/> Boost Store</button>
      </nav>
      <aside className="mail-dock">
        <button className="mail-trigger" onClick={()=>setInboxOpen(v=>!v)} aria-expanded={inboxOpen}><span>✉</span><b>ORDER INBOX</b><em>{incomingMail.length}</em><small>{inboxOpen?'▲':'▼'}</small></button>
        {inboxOpen&&<div className="mail-dropdown"><div className="mail-heading"><strong>INCOMING MAIL</strong><small>{incomingMail.length} open · max 3 repeat offers</small></div>
          {incomingMail.map(mail=>{const expanded=expandedMail===mail.key;const order=repeatOrders.find(o=>'repeat-'+o.slot+'-'+s.repeatContractRounds[o.slot]===mail.key);const story=contracts.find(c=>'story-'+c.id===mail.key);const stock=s[mail.good];return <div className="mail-message" key={mail.key}>
            <button className="mail-subject" onClick={()=>setExpandedMail(expanded?null:mail.key)}><span>✉</span><span><b>{mail.from}</b><small>{mail.kind} · {goods.find(g=>g.id===mail.good)?.name}</small><small>{mail.detail}</small></span><span>{expanded?'−':'+'}</span></button>
            {expanded&&<div className="mail-body"><strong>RE: {mail.title}</strong><p>{mail.detail}</p><b>{mail.qty} {goods.find(g=>g.id===mail.good)?.name}</b><small>In stock: {fmt(stock)} / {mail.qty}</small>{order&&<small className={order.due-s.contractClock<60?'mail-urgent':''}>Deadline: {boostClock(Math.max(0,order.due-s.contractClock))} remaining</small>}<small>Reward: {fmt(order?.reward??story?.reward??0)} RVT · +{order?.xp??story?.xp??0} XP · +{order?.rep??story?.rep??0} REP</small>
              {story?.id==='first-ore'&&!s.acceptedContracts.includes('first-ore')&&<button className="secondary-button" onClick={()=>{setS(v=>v.acceptedContracts.includes('first-ore')?v:{...v,acceptedContracts:[...v.acceptedContracts,'first-ore'],cash:v.cash+50});setNotice('Opening order accepted · 50 RVT equipment advance received.')}}>ACCEPT OPENING ORDER · +50 RVT</button>}
              <button className="primary-button" disabled={stock<mail.qty||!!(story&&s.reputation<story.minRep)||!!(story?.id==='first-ore'&&!s.acceptedContracts.includes('first-ore'))} onClick={()=>{if(order)completeRepeatOrder(order);else if(story)completeContract(story);setExpandedMail(null)}}>{stock<mail.qty?'PRODUCE '+fmt(Math.ceil(mail.qty-stock))+' MORE':'FULFIL ORDER'}</button></div>}
          </div>})}
          {incomingMail.length===0&&<p className="mail-empty">Inbox clear. More orders will arrive soon.</p>}
          {Number.isFinite(nextMailWait)&&<div className="mail-next">Next customer email in roughly {boostClock(nextMailWait)}</div>}
        </div>}
      </aside>
      <section className="cashflow-strip" aria-label="Estimated factory cash flow per minute">
        <div className="cashflow-stat cashflow-income"><small>+ AUTOMATIC INCOME / MIN</small><b>+{moneyPerMinute(autoIncomePerMinute)} <i>RVT</i></b></div>
        <div className="cashflow-stat cashflow-expense"><small>− STAFF WAGES / MIN</small><b>−{moneyPerMinute(wagesPerMinute)} <i>RVT</i></b></div>
        <div className={'cashflow-stat cashflow-net '+(netPerMinute>=0?'positive':'negative')}><small>NET CASH FLOW / MIN</small><b>{netPerMinute>=0?'+':'−'}{moneyPerMinute(netPerMinute)} <i>RVT</i></b></div>
        <small className="cashflow-note">{!running?'Paused · income and wages stopped':s.breakdownEvent||s.powerCutEvent||s.cyberAttackEvent?'Incident · income and wages paused':!payrollFunded?'Not enough cash for payroll · dispatch paused':'Live estimate from current automatic sales and payroll · excludes manual shipments and contracts'}</small>
      </section>
      {page==='factory'&&<div className="page-content">
        <section className="welcome-row"><div><span className="eyebrow">{companyRank} · LEVEL {progressionLevel}</span><h1>Factory floor</h1><p>Build machines, keep production moving and ship what you make.</p><div className="level-progress"><span>COMPANY XP · {fmt(s.experience)} · LEVEL {progressionLevel}</span><div><i style={{width:goalProgress+'%'}}/></div><small>{fmt(Math.max(0,nextGoal-s.experience))} XP to level {progressionLevel+1}</small></div><div className="reputation-meter"><span>COMPANY REPUTATION · {s.reputation}</span><div><i style={{width:repProgress+'%'}}/></div><small>{companyRank} · {nextRank?('Next: '+nextRank.name+' · '+Math.max(0,nextRank.rep-s.reputation)+' REP · '+Math.max(0,nextRank.xp-s.experience)+' XP · '+fmt(Math.max(0,nextRank.sales-s.sold))+' RVT shipped · '+Math.max(0,nextRank.machines-machineTypesOwned)+' machine types'):'Top rank reached'}</small></div></div><div className="quick-stats"><div><small>MACHINES</small><b>{machineCount}/{machines.length*MAX_MACHINE_UNITS}</b></div><div><small>THROUGHPUT</small><b>{machines.reduce((sum,m)=>sum+rateFor(m),0).toFixed(2)}<i>/s</i></b></div><div><small>STAFF</small><b>{s.mechanics+s.salespeople}</b></div></div></section>
        <section className="factory-stages"><div className="section-heading"><div><span className="eyebrow">FACTORY ROADMAP</span><h2>Stage {currentStage.number} · {currentStage.name}</h2><p>{currentStage.detail}</p></div><span className="machine-count">{currentStage.number}/{FACTORY_STAGES.length} STAGES</span></div><div className="factory-stages-grid">{FACTORY_STAGES.map(stage=>{const unlocked=stageReached(stage.number);const active=stage.number===currentStage.number;return <div className={'factory-stage '+(active?'current':unlocked?'complete':'locked')} key={stage.number}><span className="factory-stage-num">{unlocked?'✓':'🔒'} STAGE {stage.number}</span><b>{stage.name}</b><small>{stage.detail}</small><small>{stage.xp} XP · {stage.rep} REP</small></div>})}</div>{nextStage&&<p className="stage-upcoming">Next: {nextStage.name} · {Math.max(0,nextStage.xp-s.experience)} XP and {Math.max(0,nextStage.rep-s.reputation)} REP still needed{nextStage.number>=5?' · company rank and manufacturing scale required':''}</p>}</section>
        <section className="mission-panel"><div className="mission-heading"><div><span className="eyebrow">YOUR NEXT OBJECTIVE</span><h2>{activeMission?activeMission.title:'All missions complete!'}</h2><p>{activeMission?activeMission.detail:'You have completed the starter mission line. Keep expanding your factory.'}</p></div><span className="mission-count">{s.missionsClaimed.length}/{missions.length} COMPLETE</span></div>{activeMission?<><div className="mission-progress"><i style={{width:(activeMission.progress/activeMission.target*100)+'%'}}/></div><div className="mission-footer"><span>{activeMission.target>1?fmt(activeMission.progress)+' / '+fmt(activeMission.target):activeMission.progress>=1?'Objective complete':'Not complete yet'}</span><b>REWARD · {fmt(activeMission.rivets)} RVT · {activeMission.xp} XP{activeMission.gears?' + '+activeMission.gears+' GEARS':''}</b></div></>:<div className="mission-finished">Starter campaign finished. Your next challenge is to grow the factory your way.</div>}</section>
        {brokenCount>0&&<div className="alert-banner"><AlertTriangle size={18}/><span><b>{brokenCount} machine{brokenCount>1?'s':''} broken.</b> Visit Staff to assign a mechanic, or repair them here.</span><button onClick={()=>setPage('staff')}>MANAGE STAFF</button></div>}
        <section className="line-panel"><div className="line-heading"><div><span className="eyebrow">LIVE PRODUCTION</span><h2>Assembly line</h2></div><span className="line-live"><i/> {running?'RUNNING':'PAUSED'}</span></div>
          <div className={'production-route '+(!running?'is-paused':'')}>
            {visibleMachines.map((m,i)=>{const owned=s[m.id]>0;const stageGoods=goods.find(g=>g.id===({miner:'ore',smelter:'ingot',press:'plate',assembler:'parts',copperMiner:'copperOre',copperSmelter:'copperIngot',wiremill:'wire',circuitpress:'circuits',beamMill:'beams',coilWinder:'coils'} as Record<MachineId,StockId>)[m.id]);return <div className={'route-stage '+(owned?'stage-owned':'stage-next')} key={m.id}>
              <span className="route-index">{String(i+1).padStart(2,'0')}</span><span className="route-symbol">{stageGoods?.emoji||'⚙'}</span><b>{m.name}</b><small>{owned?'INSTALLED':'NEXT STAGE'}</small>
              {i<visibleMachines.length-1&&<span className="route-link"><i/></span>}
            </div>;})}
          </div>
          <div className="line-caption"><span>YOUR CURRENT PRODUCTION ROUTE</span><span>{visibleMachines.length} STAGE{visibleMachines.length===1?'':'S'} SHOWN</span></div>
        </section>
        <section className="machines-heading"><div><span className="eyebrow">YOUR EQUIPMENT</span><h2>Machines</h2><p>Each machine has its own job. Build the next stage when you're ready.</p></div><span className="machine-count">{machineCount} BUILT</span></section>
        {s.miner===0&&<section className="starter-contract"><div><span className="eyebrow">YOUR FIRST COMMISSION</span><h2>First Ore Delivery</h2><p>A local foundry has placed a small order for five raw ore. Accept it to receive a 50 RVT equipment advance, buy your first Rockbreaker Mine, produce the ore and deliver it for the final payment.</p><div className="starter-contract-reward"><b>50 RVT ADVANCE</b><span>+85 RVT · +5 REP ON DELIVERY</span></div></div><button className="primary-button" disabled={s.acceptedContracts.includes('first-ore')} onClick={()=>{setS(v=>({...v,acceptedContracts:[...v.acceptedContracts,'first-ore'],cash:v.cash+50}));setNotice('Order accepted. The foundry has advanced 50 RVT. Now buy your first Rockbreaker Mine — try not to spend it all on snacks.')}}>{s.acceptedContracts.includes('first-ore')?'ORDER ACCEPTED · ADVANCE PAID':'ACCEPT ORDER · GET 50 RVT'}</button></section>}
        <section className="machine-grid">{visibleMachines.map(m=>{
          const owned=s[m.id];const hasInput=m.id==='miner'||m.id==='copperMiner'||(m.id==='smelter'?s.ore>0:m.id==='press'||m.id==='beamMill'?s.ingot>0:m.id==='assembler'?s.plate>0:m.id==='copperSmelter'?s.copperOre>0:m.id==='wiremill'?s.copperIngot>0:s.wire>0);const stopped=!running||!!s.breakdownEvent||s.powerCutEvent||s.cyberAttackEvent||!hasInput;const unitsWorking=workingUnits(s,m.id);const failed=faultCount(s,m.id);const active=!stopped&&unitsWorking>0;const lights:Array<'on'|'off'|'empty'>=Array.from({length:MAX_MACHINE_UNITS},(_,i)=>i>=owned?'empty':stopped||(s.unitFaults[m.id][i]||0)>0?'off':'on');const cost=machineCost(m,s);const tier=s['tier_'+m.id];const repairCost=repairCostFor(m.id,tier);
          return <article className={'machine-card '+(owned?'owned':'locked')+(failed>0?' is-broken':'')} key={m.id}>
            <div className="machine-card-head"><span className="machine-number">0{machines.indexOf(m)+1} · {m.short}</span><span className={'status '+(failed>0?'bad':active?'good':'idle')}>{owned===0?'NOT BUILT':failed===owned?'BROKEN':active?failed>0?'PARTIAL':'WORKING':'STOPPED'}</span></div>
            <MachineArt id={m.id} active={active} broken={failed>0} cycle={cycle} lights={lights}/>
            <div className="machine-info"><div><h3>{m.name}</h3><p>{m.desc}</p></div><span className="machine-level">LV {tier+1}</span></div>
            <div className="machine-details"><span>OUTPUT</span><b>{rateFor(m).toFixed(2)} / sec</b><span>RUNNING / OWNED</span><b>{active?unitsWorking:0} / {owned}</b></div>
            {failed>0&&<div className="machine-repair"><span>{failed} broken unit{failed>1?'s':''} · {s.mechanicAssignments[m.id]>0?'mechanic repairing':'awaiting repair'}</span><button onClick={()=>{if(s.cash<repairCost){setNotice('Emergency repair costs '+repairCost+' Rivets per machine.');return;}const index=firstFault(s,m.id);if(index<0)return;setS(v=>({...repairUnit(v,m.id,index),cash:v.cash-repairCost}));setNotice(m.name+' unit '+(index+1)+' repaired.')}}>REPAIR ONE · {fmt(repairCost)} RVT</button></div>}
            <div className="machine-buttons">{owned===0?(!stageReached(machineStage[m.id])||s.experience<unlockAt[m.id]||s.reputation<reputationUnlock[m.id]?<div className="machine-locked-note">🔒 STAGE {machineStage[m.id]} · {unlockAt[m.id]} XP + {reputationUnlock[m.id]} REP</div>:<button className="primary-button" disabled={s.cash<cost} onClick={()=>buyMachine(m)}>BUILD MACHINE · {fmt(cost)} RVT</button>):<><button className="primary-button" disabled={owned>=MAX_MACHINE_UNITS||s.cash<cost} onClick={()=>buyMachine(m)}>{owned>=MAX_MACHINE_UNITS?'3/3 UNITS · MAX':'ADD UNIT '+(owned+1)+' · '+fmt(cost)+' RVT'}</button><button className="secondary-button" disabled={s.gears<(tier+1)*3} onClick={()=>upgradeMachine(m)}><ArrowUpRight size={15}/> UPGRADE · {(tier+1)*3} GEARS</button></>}</div>
            {owned>0&&<small className="machine-footnote">+25% output per upgrade · {m.output} · {owned}/{MAX_MACHINE_UNITS} units installed</small>}
          </article>;
        })}</section>
        <section className="achievement-panel"><div className="achievement-heading"><div><span className="eyebrow">MILESTONES</span><h2>Factory achievements</h2></div><span>{achievements.filter(a=>a.done).length}/{achievements.length} UNLOCKED</span></div><div className="achievement-grid">{achievements.map(a=><div className={'achievement '+(a.done?'earned':'')} key={a.name}><span>{a.icon}</span><div><b>{a.name}</b><small>{a.detail}</small></div><strong>{a.done?'✓':'LOCKED'}</strong></div>)}</div></section>
        <section className="factory-footer"><div><Zap size={16}/><span>Production speed</span>{[1,2].map(x=><button key={x} className={speed===x?'selected':''} onClick={()=>setSpeed(x)} title={x===2?'Double output, 4× breakdown risk':'Normal speed and breakdown risk'}>{x}×</button>)}<small className="speed-risk-note">{speed===2?'⚠ 2× output · 4× breakdown risk':'1× output · normal breakdown risk'}</small></div><span className="saved"><CheckCircle2 size={14}/> Progress auto-saves</span></section>
      </div>}
      {page==='staff'&&<div className="page-content">
        <section className="welcome-row"><div><span className="eyebrow">PEOPLE MAKE THE FACTORY</span><h1>Staff room</h1><p>Hire your crew, give them a clear job and keep every department covered.</p></div><div className="staff-summary"><b>{s.mechanics+s.salespeople+s.cybersecuritySpecialists}</b><span>TEAM MEMBERS</span><small>{unassigned} mechanic{unassigned===1?'':'s'} unassigned</small></div></section>
        <section className="contract-summary"><span><b>{payroll.toFixed(1)} RVT</b> WAGES PER MINUTE</span><span><b>{(payroll/60).toFixed(2)} RVT</b> PER SECOND</span><span><b>{payrollFunded?'FUNDED':'UNPAID'}</b> PAYROLL</span></section>
        <div className="sales-note"><CircleDollarSign size={18}/> Wages are charged each real-time second while the factory is running, independent of production speed. Pausing or active incident cutscenes pause payroll. If the balance cannot cover wages, automatic dispatch and staff repairs stop until cash is available.</div>
        <section className="staff-roles">
          <article className="role-card mechanic-role"><div className="role-top"><span className="role-icon"><Wrench size={24}/></span><span className="role-tag">MAINTENANCE</span></div><h2>Mechanic</h2><p>Repairs breakdowns and gets machines running again. Assign each mechanic to the machine you want them to look after.</p><div className="role-bottom"><div><b>{s.mechanics}</b><small>HIRED</small></div><button className="primary-button" disabled={s.cash<mechanicCost(s)} onClick={()=>hire('mechanic')}>HIRE · {fmt(mechanicCost(s))} RVT</button><button className="secondary-button" disabled={s.mechanics===0} onClick={()=>fire('mechanic')}>FIRE ONE</button><small>{WAGES.mechanic} RVT/min per mechanic</small></div></article>
          <article className="role-card sales-role"><div className="role-top"><span className="role-icon"><Store size={24}/></span><span className="role-tag">DISPATCH & SALES</span></div><h2>Sales representative</h2><p>Sells warehouse stock automatically and earns 1 bonus XP per minute per active salesperson, plus XP based on shipment value. Choose a product and enable automatic sales.</p><div className="role-bottom"><div><b>{s.salespeople}</b><small>HIRED</small></div><button className="primary-button" disabled={s.cash<salesCost(s)} onClick={()=>hire('sales')}>HIRE · {fmt(salesCost(s))} RVT</button><button className="secondary-button" disabled={s.salespeople===0} onClick={()=>fire('sales')}>FIRE ONE</button><small>{WAGES.sales} RVT/min per salesperson</small></div></article>
          <article className="role-card cyber-role"><div className="role-top"><span className="role-icon"><ShieldCheck size={24}/></span><span className="role-tag">NETWORK SECURITY</span></div><h2>Cybersecurity specialist</h2><p>Monitors factory systems, contains digital intrusions and installs a permanent firewall against future cyber incidents.</p><div className="role-bottom"><div><b>{s.cybersecuritySpecialists}</b><small>HIRED</small></div><button className="primary-button" disabled={s.cash<cybersecurityCost(s)} onClick={hireCybersecuritySpecialist}>HIRE · {fmt(cybersecurityCost(s))} RVT</button><button className="secondary-button" disabled={s.cybersecuritySpecialists===0} onClick={()=>fire('cyber')}>FIRE ONE</button><small>{WAGES.cyber} RVT/min per specialist</small></div></article>
        </section>
        <section className="staff-assignments">
          <div className="section-heading"><div><span className="eyebrow">TEAM SETUP</span><h2>Assign your staff</h2><p>Choose where each mechanic works. One mechanic repairs one machine at a time.</p></div><div className="available-staff"><b>{unassigned}</b><span>AVAILABLE MECHANICS</span></div></div>
          <div className="assignment-list">{machines.filter(m=>s[m.id]>0).map(m=><div className="assignment-row" key={m.id}><span className="assignment-machine"><Cog size={19}/></span><div className="assignment-copy"><b>{m.name}</b><small>{faultCount(s,m.id)>0?faultCount(s,m.id)+' broken unit(s) · '+(s.mechanicAssignments[m.id]>0?'being repaired':'awaiting mechanic'):s[m.id]>0?'Machines operational':'Not built yet'}</small></div><label><span>MECHANICS</span><select value={s.mechanicAssignments[m.id]} onChange={e=>assignMechanic(m.id,Number(e.target.value))} disabled={s.mechanics===0||s[m.id]===0}>{Array.from({length:s.mechanics+1},(_,i)=>i).map(i=><option key={i} value={i}>{i===0?'Unassigned':i+' assigned'}</option>)}</select></label></div>)}</div>
          {s.mechanics===0&&<div className="empty-hint"><Wrench size={17}/> Hire a mechanic above to unlock machine assignments.</div>}
        </section>
        <section className="sales-setup"><div className="sales-setup-title"><span className="role-icon"><Truck size={22}/></span><div><span className="eyebrow">DISPATCH SETTINGS</span><h2>Sales team assignments</h2><p>Assign your sales representatives to different goods. Each sells their assigned product independently.</p></div></div><div className="contract-summary"><span><b>{assignedSales}</b> ASSIGNED</span><span><b>{unassignedSales}</b> AVAILABLE</span><span><b>{s.salespeople}</b> TOTAL SALESPEOPLE</span></div><div className="assignment-list">{goods.filter(g=>s[contractProducer[g.id]]>0).map(g=><div className="assignment-row" key={g.id}><span className="assignment-machine">{g.emoji}</span><div className="assignment-copy"><b>{g.name}</b><small>{((s.salesAssignments[g.id]||0)*.12).toFixed(2)} units/sec when automatic sales are on</small></div><label><span>SALES STAFF</span><select value={s.salesAssignments[g.id]||0} onChange={e=>assignSales(g.id,Number(e.target.value))} disabled={s.salespeople===0}>{Array.from({length:s.salespeople+1},(_,i)=>i).map(i=><option key={i} value={i}>{i===0?'None':i+' assigned'}</option>)}</select></label></div>)}</div><div className="sales-controls"><label className="toggle-row"><input type="checkbox" checked={s.autoSell} disabled={s.salespeople===0} onChange={e=>setS(v=>({...v,autoSell:e.target.checked}))}/><span><b>Automatic sales</b><small>Each active salesperson sells 0.12 units/sec and earns bonus XP while shipping stock.</small></span></label></div></section>
      </div>}
      {page==='store'&&<div className="page-content">
        <section className="welcome-row"><div><span className="eyebrow">SHORT-TERM FACTORY ADVANTAGES</span><h1>Boost Store</h1><p>Spend Rivets on temporary boosts. No real-money purchases; every upgrade uses your in-game balance.</p></div><div className="staff-summary"><b>{fmt(s.cash)}</b><span>RIVETS AVAILABLE</span><small>Boost timers pause when production is paused or an incident stops the factory.</small></div></section>
        <section className="boost-store-grid">{BOOSTS.map(offer=>{const remaining=s.boostSeconds[offer.id];const active=remaining>0;return <article className={'boost-store-card '+(active?'boost-active':'')} key={offer.id}>
          <div className="boost-store-heading"><span className="boost-store-symbol">{offer.id==='production'?'⚙️':offer.id==='dispatch'?'🚚':'🛡️'}</span><span className="boost-store-tag">{active?'ACTIVE · '+boostClock(remaining):offer.subtitle}</span></div>
          <h2>{offer.name}</h2><p>{offer.description}</p><div className="boost-store-timer"><span>DURATION</span><b>{active?boostClock(remaining):boostClock(offer.duration)}</b></div>
          <button className="primary-button" disabled={active||s.cash<offer.cost} onClick={()=>buyBoost(offer.id)}>{active?'BOOST RUNNING':s.cash<offer.cost?'NEED '+fmt(offer.cost-s.cash)+' MORE RVT':'ACTIVATE · '+fmt(offer.cost)+' RVT'}</button>
        </article>})}</section>
        <div className="sales-note"><Zap size={18}/> Boosts do not stack with themselves. Production Overdrive multiplies production separately from the 2× speed control, but only the speed control increases breakdown risk. Timers tick down only while the factory is operating.</div>
      </div>}
      {page==='research'&&<div className="page-content">
        <section className="welcome-row"><div><span className="eyebrow">THE NEXT INDUSTRIAL REVOLUTION</span><h1>Research &amp; Technology</h1><p>Invest Gears into permanent factory-wide improvements. Every discovery stays unlocked, even when you leave the game.</p></div><div className="staff-summary research-summary"><b>{s.researched.filter(id=>technologies.some(t=>t.id===id)).length}/{technologies.length}</b><span>TECHNOLOGIES</span><small>{fmt(s.gears)} Gears available</small></div></section>
        <section className="research-overview"><div><FlaskConical size={22}/><span><b>Research department</b><small>Turn precision parts into permanent competitive advantages.</small></span></div><div className="research-active-effects">{s.researched.length===0?'No technologies researched yet':s.researched.map(id=>technologies.find(t=>t.id===id)?.effect).filter(Boolean).join(' · ')}</div></section>
        <section className="technology-tree"><div className="technology-heading"><div><span className="eyebrow">TIERED TECHNOLOGY TREE</span><h2>Research progression</h2><p>Start with workshop fundamentals, then unlock industrial engineering and advanced automation. Earlier discoveries are kept.</p></div><span className="machine-count">{technologies.filter(t=>s.researched.includes(t.id)).length} / {technologies.length} UNLOCKED</span></div>
          {[1,2,3].map(tier=>{const tierTech=technologies.filter(t=>t.tier===tier);const tierOpen=researchTierUnlocked(tier,s.researched);const tierDone=tierTech.filter(t=>s.researched.includes(t.id)).length;return <div className={'research-tier '+(tierOpen?'tier-open':'tier-locked')} key={tier}><div className="research-tier-heading"><div><span className="eyebrow">TIER {tier}</span><h3>{researchTierNames[tier]}</h3><small>{tier===1?'Available from the start':tier===2?'Unlocks after Efficient Extraction':'Unlocks after Precision Tooling'}</small></div><span className="research-tier-count">{tierOpen?'OPEN':'LOCKED'} · {tierDone}/{tierTech.length}</span></div><div className="technology-grid">{tierTech.map(tech=>{const done=s.researched.includes(tech.id);const unlocked=tierOpen&&tech.requires.every(req=>s.researched.includes(req));const Icon=tech.icon;return <article className={'technology-card '+(done?'researched':unlocked?'available':'locked-tech')} key={tech.id}><div className="technology-top"><span className="technology-icon"><Icon size={21}/></span><span className="technology-branch">{tech.branch}</span></div><h3>{tech.name}</h3><p>{tech.detail}</p><div className="technology-effect">{tech.effect}</div>{done?<div className="technology-complete"><CheckCircle2 size={16}/> RESEARCH COMPLETE</div>:<><small className="technology-cost">COST · {tech.cost} GEARS</small><button className="primary-button" disabled={!unlocked||s.gears<tech.cost} onClick={()=>researchTech(tech.id)}>{!tierOpen?'TIER '+tier+' LOCKED':!unlocked?'LOCKED · PREREQUISITES':s.gears<tech.cost?'NEED MORE GEARS':'RESEARCH · '+tech.cost+' GEARS'}</button></>}</article>})}</div></div>})}
        </section>
        <div className="research-footnote"><Cog size={16}/> Research effects apply automatically across every machine and sale. Your discoveries are saved with your factory.</div>
      </div>}
      {page==='warehouse'&&<div className="page-content">
        <section className="welcome-row"><div><span className="eyebrow">STORAGE & DISPATCH</span><h1>Warehouse</h1><p>Keep an eye on your stock and decide when to turn it into Rivets.</p></div><div className="warehouse-total"><small>TOTAL STOCK VALUE</small><b>{fmt(stockValue)} RVT</b><button className="primary-button" disabled={!goods.some(g=>s[g.id]>=1)} onClick={shipAllStock}>SHIP ALL PRODUCTS · {fmt(goods.reduce((total,g)=>total+Math.floor(s[g.id])*g.price*saleMultiplier,0))} RVT</button></div></section>
        <div className="gear-banner"><Cog size={21}/><span><b>{fmt(s.gears)} Gears</b><small>Earn 1 Gear per 12 total finished goods shipped (Precision Parts, Circuit Boards, Steel Beams or Copper Coils). Current progress: {s.gearShipmentProgress.toFixed(1)}/12. Mission rewards also grant Gears.</small></span></div>
        <section className="warehouse-grid">{visibleGoods.map(g=><article className="stock-card" key={g.id}><span className="stock-emoji">{g.emoji}</span><div><h3>{g.name}</h3><p>{g.detail} · {g.price} RVT each</p><b>{fmt(s[g.id])} <small>IN STOCK</small></b></div><button disabled={s[g.id]<1} onClick={()=>sellStock(g.id)}>SHIP ALL · {fmt(Math.floor(s[g.id])*g.price)} RVT</button></article>)}</section>
        <section className="contracts-panel"><div className="section-heading"><div><span className="eyebrow">CUSTOMER EMAILS</span><h2>Order Desk</h2><p>Contracts now arrive in the Order Inbox at the top-right. Requests have varied sizes, deadlines and cooldowns before replacements.</p></div><button className="primary-button" onClick={()=>setInboxOpen(true)}>OPEN INBOX · {incomingMail.length}</button></div><div className="contract-summary"><span><b>{readyOrders}</b> READY</span><span><b>{activeOrders}</b> PREPARING</span><span><b>{completedOrders}</b> STORY DELIVERIES</span></div></section>
        <div className="sales-note"><CircleDollarSign size={18}/> {s.salespeople>0&&s.autoSell?'Your assigned sales team is automatically dispatching stock.':'Hire sales staff and enable automatic sales from the Staff page to automate dispatch.'}</div>
      </div>}
    </main>
    {s.cyberAttackEvent&&<div className="cyberattack-backdrop" role="dialog" aria-modal="true" aria-labelledby="cyberattack-title"><section className="cyberattack-panel"><div className="powercut-topline"><span>ORE &amp; ORDER · INCIDENT 002</span><span className="cyberattack-live"><i/> NETWORK BREACH</span></div><h2 id="cyberattack-title">Someone's in the system.</h2><p className="powercut-intro">The new Mech Assembly has just joined the line when every terminal flashes red. An unknown process has seized the factory network, locked the control systems and frozen production. This isn't a blown fuse — someone has got inside.</p><img className="powercut-storyboard" src="/resources/Factory Lockdown_ Cyberattack Alert.png" alt="Six-panel comic storyboard showing a factory network breach, warning terminal, frozen machinery and red emergency lighting"/><div className="powercut-choice-heading"><b>TAKE BACK CONTROL</b><span>Production stays paused until recovery</span></div><div className="powercut-actions"><button className="primary-button" disabled={s.cash<cybersecurityCost(s)} onClick={hireCybersecuritySpecialist}>HIRE CYBERSECURITY SPECIALIST · {fmt(cybersecurityCost(s))} RVT <small>Contains the breach and installs permanent protection</small></button><button className="secondary-button" disabled={s.cash<120} onClick={emergencyCyberRecovery}>EXTERNAL SYSTEM RESTORE · 120 RVT <small>Restores production without an in-house specialist</small></button></div><small className="powercut-footnote">The incident is one-time. A specialist stays on your team and protects the factory network.</small></section></div>}
    {s.powerCutEvent&&<div className="powercut-backdrop" role="dialog" aria-modal="true" aria-labelledby="powercut-title"><section className="powercut-panel"><div className="powercut-topline"><span>ORE &amp; ORDER · INCIDENT 001</span><span className="powercut-live"><i/> POWER FAILURE</span></div><h2 id="powercut-title">Well, that's put a stop to things.</h2><p className="powercut-intro">The lights flicker. The Rockbreaker Mine gives one last shudder, then everything goes quiet. Your first proper factory problem has arrived.</p><img className="powercut-storyboard" src="/resources/Factory Power Cut_ A Comic Storyboard.png" alt="Comic storyboard showing the factory lights flickering, a machine sparking, the factory going dark and emergency red lights coming on"/><div className="powercut-choice-heading"><b>GET THE MINE BACK ONLINE</b><span>Choose how to recover</span></div><div className="powercut-actions"><button className="primary-button" disabled={s.cash<60} onClick={()=>resolvePowerCut(true)}>HIRE A MECHANIC · 60 RVT <small>First-day discount · keeps them on your team</small></button><button className="secondary-button" disabled={s.cash<40} onClick={()=>resolvePowerCut(false)}>ONE-OFF REPAIR · 40 RVT <small>Fix the mine without hiring staff</small></button></div><small className="powercut-footnote">Your factory is paused until the mine is repaired. This incident only happens once.</small></section></div>}
    {s.breakdownEvent&&<div className="incident-backdrop" role="dialog" aria-modal="true" aria-labelledby="incident-title"><section className="incident-panel"><div className="incident-siren"><AlertTriangle size={28}/><span>EMERGENCY STOP · 01</span></div><p className="incident-kicker">FACTORY INCIDENT REPORT</p><h2 id="incident-title">Critical machine failure</h2><p className="incident-copy"><b>{machines.find(m=>m.id===s.breakdownEvent)?.name}</b> has suffered a mechanical failure. The line has been stopped while the fault is isolated. Production and automatic dispatch are temporarily suspended.</p><div className="incident-readout"><span>FAULT DETECTED</span><b>DRIVE ASSEMBLY OVERHEATING</b><span>REQUIRED ACTION</span><b>REPAIR THE AFFECTED MACHINE</b></div><div className="incident-actions">{s.mechanicAssignments[s.breakdownEvent]>0&&<button className="primary-button" onClick={()=>resolveBreakdown(true)}>USE ASSIGNED MECHANIC · FREE</button>}<button className="primary-button" disabled={s.cash<repairCostFor(s.breakdownEvent,s['tier_'+s.breakdownEvent])} onClick={()=>resolveBreakdown(false)}>EMERGENCY REPAIR · {fmt(repairCostFor(s.breakdownEvent,s['tier_'+s.breakdownEvent]))} RVT</button><button className="secondary-button" onClick={()=>{setS(v=>({...v,breakdownEvent:null}));setNotice('Emergency stop cleared. '+machines.find(m=>m.id===s.breakdownEvent)?.name+' still needs repair.')}}>CONTINUE · REPAIR LATER</button></div><small className="incident-footnote">Tip: assign a mechanic in Staff to handle future breakdowns. You can also repair the machine from its factory card.</small></section></div>}
    {notice&&<div className="toast" role="status" aria-live="polite"><span className="toast-icon">{noticeKind==='ORDER DESK'?'📦':noticeKind==='QUICK HEADS-UP'?'🛠️':'🏭'}</span><div className="toast-copy"><small>{noticeKind}</small><b>{noticeTitle}</b><p>{notice}</p></div><button className="toast-close" aria-label="Dismiss notification" onClick={()=>setNotice('')}>×</button></div>
    }{showReset&&<div className="modal-backdrop"><div className="reset-modal"><h2>Reset your factory?</h2><p>This clears machines, Rivets, Gears and staff saved on this device.</p><div><button onClick={()=>setShowReset(false)}>CANCEL</button><button className="danger" onClick={reset}>RESET FACTORY</button></div></div></div>}
  </div>;
}
