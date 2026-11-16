import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join,dirname} from 'node:path';
import ts from 'typescript';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const folder=await mkdtemp(join(root,'.contract-test-'));
const source=await readFile(join(root,'src/App.tsx'),'utf8');
const output=ts.transpileModule(source+'\nexport {fresh,goods,machines,contracts,issueRepeatOrder,estimateContractSeconds,orderPayout,orderExpiry,updateContractOffers,deliverRepeatOrder,closeRepeatOrder,contractStockTarget,stockSaleReminder,sellSurplusStock,salesWages,salesCost,SALES_UNITS_PER_SECOND,payrollPerMinute,loadGame,CONTRACT_TERMS};',{
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}
}).outputText;
await writeFile(join(folder,'game.mjs'),output);
const game=await import(pathToFileURL(join(folder,'game.mjs')));
after(()=>rm(folder,{recursive:true,force:true}));
function factory(all=false){
  const s=structuredClone(game.fresh);
  Object.assign(s,{cash:100000,reputation:100,experience:600,contractClock:600,nextContractOfferAt:0,
    contractsCompleted:game.contracts.map(c=>c.id),repeatNextAt:[0,0,0],drivers:2,driverAssignments:{iron:1,copper:1}});
  for(const m of game.machines){s[m.id]=all||m.id==='miner'?1:0;s.unitFaults[m.id]=s[m.id]?[0]:[];}
  return s;
}
function offer(s,round=0){s.repeatContractRounds[0]=round;return game.issueRepeatOrder(s,0);}

test('offers only request products the current factory can make',()=>{
  const s=factory();
  for(let round=0;round<24;round++){
    const o=offer(s,round);assert.ok(o);assert.deepEqual(o.items.map(x=>x.good),['ore']);
    assert.ok(o.due-s.contractClock>=game.estimateContractSeconds(s,o.items));
    assert.ok(game.orderExpiry(o)>o.due);assert.ok(o.detail.includes('raw ore'));
  }
});
test('missing upstream machines, broken units and absent freight cannot create impossible offers',()=>{
  const s=factory();s.miner=0;s.unitFaults.miner=[];s.assembler=1;s.unitFaults.assembler=[0];
  assert.equal(offer(s),null);
  const broken=factory();broken.unitFaults.miner=[30];assert.equal(offer(broken),null);
  const freight=factory();freight.driverAssignments.iron=0;assert.equal(offer(freight),null);
  const blocked=factory(true);blocked.flowMode.ingot='stockpile';
  assert.equal(game.estimateContractSeconds(blocked,[{good:'plate',qty:2}],false),Infinity);
});
test('inventory and motor recipes are allocated once across mixed order lines',()=>{
  const s=factory();s.miner=0;s.unitFaults.miner=[];s.ore=5;
  assert.equal(game.estimateContractSeconds(s,[{good:'ore',qty:4},{good:'ore',qty:4}],false),Infinity);
  const motor=factory(true);motor.coils=2;motor.circuits=1;
  assert.equal(game.estimateContractSeconds(motor,[{good:'motors',qty:1}],false),25);
  motor.motorworks=0;motor.unitFaults.motorworks=[];
  assert.equal(game.estimateContractSeconds(motor,[{good:'motors',qty:1}],false),Infinity);
});
test('difficulty controls premium, batch size and slack; rush orders appear',()=>{
  const s=factory();const seen=new Set();
  for(let round=0;round<12;round++){
    const o=offer(s,round);seen.add(o.difficulty);
    const terms=game.CONTRACT_TERMS[o.difficulty];
    assert.equal(o.reward,Math.ceil(o.qty*5*terms.premium));
    assert.ok(o.due-s.contractClock>=o.estimatedSeconds);
  }
  assert.deepEqual([...seen].sort(),['easy','hard','rush','standard']);
  assert.ok(game.CONTRACT_TERMS.easy.slack>game.CONTRACT_TERMS.hard.slack);
  assert.ok(game.CONTRACT_TERMS.rush.premium>game.CONTRACT_TERMS.hard.premium);
});
test('offer arrivals are staggered globally even with three available slots',()=>{
  let s=game.updateContractOffers(factory());
  assert.equal(s.repeatOffers.filter(Boolean).length,1);
  s.contractClock+=149;s=game.updateContractOffers(s);assert.equal(s.repeatOffers.filter(Boolean).length,1);
  s.contractClock+=1;s=game.updateContractOffers(s);assert.equal(s.repeatOffers.filter(Boolean).length,2);
});
test('late payments fall gradually and expired orders pay nothing',()=>{
  const s=factory();const o=offer(s);const expiry=game.orderExpiry(o);
  assert.equal(game.orderPayout(o,o.due),o.reward);
  const mid=game.orderPayout(o,Math.floor((o.due+expiry)/2));
  assert.ok(mid<o.reward&&mid>0);
  assert.ok(game.orderPayout(o,expiry-1)<=mid);assert.equal(game.orderPayout(o,expiry),0);
});
test('late costs 2 REP once, expiry removes the order and costs 3 in total',()=>{
  let s=factory();const o=offer(s);s.repeatOffers=[o,null,null];s.nextContractOfferAt=999999;
  s.contractClock=o.due+1;s=game.updateContractOffers(s);assert.equal(s.reputation,98);
  s=game.updateContractOffers(s);assert.equal(s.reputation,98);
  s.contractClock=game.orderExpiry(o);s=game.updateContractOffers(s);
  assert.equal(s.reputation,97);assert.equal(s.repeatOffers[0],null);
  s=game.updateContractOffers(s);assert.equal(s.reputation,97);
});
test('delivery awards the actual late payout without restoring lost REP or paying twice',()=>{
  let s=factory();const o=offer(s);s.repeatOffers=[o,null,null];s.ore=o.qty;
  s.contractClock=o.due+20;s=game.updateContractOffers(s);const before=s.cash;
  const paid=game.deliverRepeatOrder(s,o);
  assert.equal(paid.cash-before,game.orderPayout(o,s.contractClock));assert.equal(paid.reputation,98);
  assert.equal(paid.ore,0);assert.equal(paid.repeatOffers[0],null);
  assert.strictEqual(game.deliverRepeatOrder(paid,o),paid);
});
test('on-time delivery gains REP; insufficient or expired stock cannot be collected',()=>{
  const s=factory();const o=offer(s);s.repeatOffers=[o,null,null];
  assert.strictEqual(game.deliverRepeatOrder(s,o),s);s.ore=o.qty;
  const paid=game.deliverRepeatOrder(s,o);assert.equal(paid.reputation,100+o.rep);
  s.contractClock=game.orderExpiry(o);assert.strictEqual(game.deliverRepeatOrder(s,o),s);
});
test('reservations include late orders and sum overlapping commitments',()=>{
  const s=factory();const a=offer(s);const b={...a,id:'1-0',slot:1};s.repeatOffers=[a,b,null];
  assert.equal(game.contractStockTarget(s,'ore'),a.qty+b.qty);
  s.contractClock=a.due+1;assert.equal(game.contractStockTarget(s,'ore'),a.qty+b.qty);
  s.contractClock=game.orderExpiry(a);assert.equal(game.contractStockTarget(s,'ore'),0);
});
test('existing saves retain legacy orders and receive cooldown defaults',()=>{
  const legacy=factory();const o=offer(legacy);delete o.difficulty;delete o.expiresAt;
  legacy.repeatOffers=[o,null,null];delete legacy.nextContractOfferAt;
  globalThis.localStorage={getItem:()=>JSON.stringify(legacy)};
  const loaded=game.loadGame();delete globalThis.localStorage;
  assert.equal(loaded.repeatOffers[0].id,o.id);assert.equal(loaded.nextContractOfferAt,legacy.contractClock+120);
  assert.ok(game.orderExpiry(loaded.repeatOffers[0])>o.due);
});

test('declining costs less reputation than being late; late decline does not double-charge',()=>{
  const s=factory();const o=offer(s);s.repeatOffers=[o,null,null];
  const declined=game.closeRepeatOrder(s,o);assert.equal(declined.reputation,99);
  assert.strictEqual(game.closeRepeatOrder(declined,o),declined);
  s.contractClock=o.due+1;
  assert.equal(game.closeRepeatOrder(s,o).reputation,98);
  const late=game.updateContractOffers(s);assert.equal(game.closeRepeatOrder(late,o).reputation,98);
  s.contractClock=game.orderExpiry(o);assert.equal(game.closeRepeatOrder(s,o).reputation,97);
  late.contractClock=game.orderExpiry(o);assert.equal(game.closeRepeatOrder(late,o).reputation,97);
});

test('complete factories receive varied, product-specific and feasible requests',()=>{
  const s=factory(true);const subjects=new Set(),products=new Set();
  for(let round=0;round<90;round++){
    s.contractClock=600+round*180;
    const o=offer(s,round);assert.ok(o);
    subjects.add(o.name);o.items.forEach(line=>{
      products.add(line.good);assert.ok(line.qty>=2);
      assert.ok(o.detail.includes(game.goods.find(g=>g.id===line.good).name.toLowerCase()));
    });
    assert.ok(Number.isFinite(game.estimateContractSeconds(s,o.items)));
    assert.ok(o.due-s.contractClock>=o.estimatedSeconds);
  }
  assert.ok(subjects.size>=15);assert.ok(products.size>=8);
});

test('dashboard shows the reduced current payout for a late delivery',async()=>{
  const {renderToStaticMarkup}=await import('react-dom/server');
  const {createElement}=await import('react');
  const s=factory();const o=offer(s,5);s.repeatOffers=[o,null,null];s.contractClock=o.due+50;
  globalThis.localStorage={getItem:()=>JSON.stringify(s)};
  const html=renderToStaticMarkup(createElement(game.default));delete globalThis.localStorage;
  assert.ok(html.includes('Order Inbox')||html.includes('ORDER INBOX'));
  assert.ok(html.includes('fulfil the order for '+game.orderPayout(o,s.contractClock).toLocaleString()+' RVT.'));
});

test('stock reminder excludes promised stock and fractional units',()=>{
  const s=factory();const o=offer(s);s.repeatOffers=[o,null,null];s.ore=o.qty+3.8;
  const reminder=game.stockSaleReminder(s);
  assert.equal(reminder.units,3);assert.equal(reminder.value,15);
  s.ore=o.qty-.1;assert.equal(game.stockSaleReminder(s).value,0);
});
test('stock reminder includes researched sale prices and excludes zero stock',()=>{
  const s=factory();assert.equal(game.stockSaleReminder(s).value,0);
  s.parts=2.9;s.researched=['market-intelligence'];
  const reminder=game.stockSaleReminder(s);
  assert.equal(reminder.units,2);assert.equal(reminder.value,252);
});

test('surplus sale keeps current and late contract goods plus fractional stock',()=>{
  const s=factory();const o=offer(s);s.repeatOffers=[o,null,null];s.ore=o.qty+4.75;s.contractClock=o.due+1;
  const next=game.sellSurplusStock(s);
  assert.equal(next.ore,o.qty+.75);assert.equal(next.cash-s.cash,20);
  assert.equal(s.ore,o.qty+4.75);assert.strictEqual(game.sellSurplusStock(next),next);
  assert.equal(next.repeatOffers[0].id,o.id);
});
test('surplus sale preserves exact researched revenue and XP/Gear carryover',()=>{
  const s=factory();s.ingot=1;s.parts=12;s.researched=['market-intelligence'];s.salesXpProgress=24;s.gearShipmentProgress=11;
  const next=game.sellSurplusStock(s);const revenue=(14+12*105)*1.2;
  assert.ok(Math.abs(next.cash-s.cash-revenue)<1e-7);
  assert.ok(Math.abs(next.sold-s.sold-revenue)<1e-7);
  assert.equal(next.experience-s.experience,Math.floor((24+revenue+1e-8)/25));
  assert.ok(next.salesXpProgress>=0&&next.salesXpProgress<25);
  assert.equal(next.gears-s.gears,1);assert.equal(next.gearShipmentProgress,11);
});
test('surplus sale pays nothing for fully reserved or fractional-only stock',()=>{
  const s=factory();const o=offer(s);s.repeatOffers=[o,null,null];s.ore=o.qty;s.parts=.9;
  assert.strictEqual(game.sellSurplusStock(s),s);
});

test('first salesperson is affordable and profitable with one basic ore mine',()=>{
 const s=factory();s.salespeople=0;
 assert.equal(game.salesCost(s),150);
 assert.equal(game.salesWages(1),12);
 const revenue=Math.min(.35,game.SALES_UNITS_PER_SECOND)*60*5;
 assert.equal(revenue-8-6-game.salesWages(1),79);
});
test('later hires retain higher wages and cost; first discount is counted once',()=>{
 const s=factory();s.salespeople=1;assert.equal(game.salesCost(s),1350);
 assert.equal(game.salesWages(0),0);assert.equal(game.salesWages(2),48);assert.equal(game.salesWages(3),84);
 s.salespeople=2;assert.equal(game.payrollPerMinute(s),48+2*8);
 assert.equal(game.salesCost(s),2700);
});
