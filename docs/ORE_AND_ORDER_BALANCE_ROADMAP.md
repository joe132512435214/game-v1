# Ore & Order — Economy, Progression, Retention & Expansion Roadmap
**Working design plan · 16 November 2026 · v1**

## 1. Product goal and player promise

A satisfying industrial tycoon where every purchase visibly changes the factory, every new material expands the production chain, and staffing or transport choices have genuine financial trade-offs. The homepage shows the next action, not every possible action. Aim for a complete early-game arc in the first 15 minutes, meaningful mid-game decisions every 3–8 minutes, and major industrial milestones every 20–40 minutes of active play after the first hour. These are design targets, **not observed player statistics**.

**Player fantasy:** start with one ore mine and a delivery van; grow into an electrical manufacturer; eventually build robotic manufacturing and heavy equipment. Contracts add direction and occasional personality. Profitability should come primarily from smart production chains, not deliberately waiting through an unexplained paywall.

**Non-goals:** forced daily logins, punitive waiting timers, endless intrusive notifications, mechanically distinct currencies without a clear purpose, or mandatory real-money purchases.

## 2. Current technical and economy audit

### Observed source code and deployment status
- Game is React/TypeScript/Vite. Source: GitHub joe132512435214/game-v1 (main). Current build checks are GitHub Actions, separate from Vercel.
- Vercel previously failed due to build-rate limits, but the most recent app-code commit (2e938fc) has **a successful Vercel deployment check**. GitHub Actions type-check and production build also passed. **No complete live-browser playtest has been performed**.
- Autosave uses browser localStorage. There is no confirmed offline production or cloud-save recovery. Players can lose saves if browser data is cleared or devices change.
- Ten story orders, three repeat-order slots, fourteen sequential starter missions, eleven production machines, six stages, seven technologies, multiple staff types and two currencies are already implemented.
- The first power-cut event's one-off repair previously cleared its modal without clearing the real unit fault. Fixed in code.
- The Mech Assembly could trigger a cyberattack when the player had no remaining funds, potentially trapping them in the modal. Free emergency recovery fallback now exists for insolvent players.
- Random failure probability was reduced from 0.00065 per second per operational unit to 0.00022. The 2x production setting now doubles (rather than quadruples) the failure chance. This is an initial pacing decision.

### Rebalanced current machines

Values are in fictional Rivets (RVT). **New costs are already committed.** Production prices/rates stay unchanged until tests indicate otherwise.

| Machine | Previous cost | New cost | Idealised incremental net RVT/min | Approx payback |
|---|---:|---:|---:|---:|
| Rockbreaker Mine | 50 | 50 | 99 | 0.5 min |
| Blast Furnace | 180 | 180 | 107 | 1.7 min |
| Stamping Press | 600 | 600 | 142 | 4.2 min |
| Mech Assembly | 1,600 | 1,600 | 268 | 6.0 min |
| Beam Rolling Mill | 2,500 | 2,500 | 300 | 8.3 min |
| Copper Excavator | 1,800 | 1,100 | 86 | 12.9 min |
| Copper Foundry | 5,500 | 2,500 | 116 | 21.6 min |
| Wire Drawing Mill | 14,000 | 6,000 | 198 | 30.3 min |
| Circuit Board Line | 30,000 | 12,000 | 358 | 33.5 min |
| Coil Winding Machine | 21,000 | 8,000 | 218 | 36.7 min |
| Electric Motor Works | 1,000,000 | 120,000 | approx 6,900–7,600 | approx 16–18 min |

**Method:** value added per second = final good price minus the sale value of required consumed goods, multiplied by throughput; subtract machine electricity per minute. Motor throughput is capped at about 0.0325/sec by one Coil Winder even though the motor machine's nameplate rate is 0.04/sec. These are **optimistic isolated-machine benchmarks**, not actual whole-factory profits: they exclude shared bottlenecks, staff, reserve stock, interruptions, research and order volatility. Contracts often pay a premium and may change realised profitability.

### Unlock and pace diagnostics
- The original costs exposed an unproductive jump in copper: the Copper Foundry, Wiremill, Circuit Line and Coil Winder had approximate standalone paybacks of 48, 71, 84 and 96 minutes respectively, versus 2–8 minutes for comparable iron-line steps.
- The motor had **two simultaneous paywalls**: 1,000,000 RVT and 220 reputation. Both could leave a well-developed factory with no meaningful purchase for a long period. New motor cost: 120,000 RVT; reputation gate: 190, including matching story contract.
- There is currently no production type between Stage 4 electronics and Stage 5 motor works. This is the **largest remaining content/pacing gap**.
- Story orders and repeat orders provide almost all reputation. A player who ignores expiring offers can have abundant cash but not enough reputation to unlock machinery. Add clearer reputation earning guidance before considering another hard gate.
- The first six stages require XP and REP of 0/0, 150/8, 200/20, 500/50, 1600/125 and 6500/350. Later stages also use company-rank requirements. Stage 2 and Stage 3 are close in XP; use playtest evidence before increasing either threshold.

### Rough deterministic early-game scenarios
A simplified model that takes the opening contract, automatically completes eligible orders, ships surplus once a minute, resolves scripted events immediately, buys the next affordable eligible machine and **ignores random faults and interface delays** gives approximately:
- Opening delivery: 0–1 min; Blast Furnace: 1–3 min.
- Press: 3–6 min; Copper Excavator: 7–18 min; Mech Assembly: 11–16 min.
- Copper Foundry: 20–25 min; Wiremill: 27–31 min; Coils: 30–35 min; Circuit Line: 41–45 min.
- First Motor Works: around 120 minutes under a favourable scenario, with substantial sensitivity to cash and reputation.
These figures are **modelling illustrations, not verified playthrough results**. A human player who misses contracts or visits other menus will be slower. Treat them as a starting hypothesis only.

## 3. Balancing targets for active play

| Play phase | Desired experience | Target milestone | Decision frequency |
|---|---|---|---|
| 0–2 min | Understand mine → van → contract → Rivets | First contract + first scripted incident | 20–60 sec |
| 2–7 min | Learn reinvestment and materials | Blast Furnace and first repeat sale | 1–2 min |
| 7–15 min | Build a visible manufacturing chain | Press + Assembly or beam branch | 2–4 min |
| 15–30 min | Explore a meaningful second metal | Copper mine, Foundry, new freight need | 3–6 min |
| 30–60 min | Feel industrial diversification | Wire, circuits/coils, first optional staff | 4–8 min |
| 60–100 min | Bridge electronics and heavy industry | Sensor Workshop then Control Cabinets | 6–12 min |
| 100–150 min | Earn a big industrial achievement | First Electric Motor Works | 10–20 min |
| 2–5 hours | Optimise scarce inputs and specialise | Generators/robotics, automated operations | 15–30 min |
| 5+ hours | Major factories and player-designed goals | Heavy equipment, optional prestige | 20–40 min |

These are **target bands**, not guarantees. Tests should measure active play time, including menus and incident resolution, rather than just a theoretical rate divided into purchase price.

**Economy calibration rule:** each purchase should improve at least one of (net profit, supply-chain quality, automation, new contract access, visual factory change). Expensive content with no meaningful return is not a valid “long-term goal.” Prefer 3–12 minute early payback, 12–35 minute mid-game payback and roughly 20–50 minute endgame payback under realistic input supply.

## 4. The next machines — planned, NOT implemented

Do not launch everything simultaneously. Add two bridge machines, validate the new income curve, then add higher-tier combinations. Base power is RVT/min/unit while producing. All values are first-pass targets and should be simulation-tested with material competition and contract reserves.

| Priority | Machine / new good | Input per item | Output rate | Product sale value | Base machine cost | Power | Why it matters |
|---|---|---|---:|---:|---:|---:|---|
| 1 | **Industrial Sensor Workshop → Sensors** | 1 Circuit Board + 1 Precision Part | 0.025/sec | 700 RVT | 16,000 | 50 | First bridge between iron and copper; real reason to expand both lines |
| 2 | **Control Cabinet Works → Control Cabinets** | 1 Sensor + 2 Wire + 1 Plate | 0.020/sec | 1,800 RVT | 30,000 | 75 | New intermediate product and deliberate wire bottleneck |
| 3 | **Generator Assembly → Industrial Generators** | 1 Motor + 1 Beam + 1 Control Cabinet | 0.016/sec | 16,000 RVT | 240,000 | 300 | Makes motors a valuable upstream resource, not merely sale stock |
| 4 | **Industrial Robotics Cell → Factory Robots** | 1 Motor + 2 Sensors + 2 Circuits | 0.012/sec | 36,000 RVT | 520,000 | 380 | Forces an expansion choice between boards, sensors and motor use |
| 5 | **Heavy Equipment Yard → Industrial Loaders** | 1 Robot + 1 Motor + 2 Beams + 1 Control Cabinet | 0.006/sec | 120,000 RVT | 1,400,000 | 700 | Late-stage multi-branch showcase and capstone vehicle |

**Nominal incremental payback at fully supplied rates:** Sensors about 25 min; Control Cabinets about 28 min; Generators about 26 min; Robots about 24 min; Industrial Loaders about 51 min. **These values are upper-bound profitability assumptions**; shared inputs and order reservations can stretch real payback considerably. In particular, the Control Cabinet adds extra wire consumption, and Robots compete for the same circuits as sensors and motors. This friction is intentional only if the game clearly explains the bottleneck and offers a practical upgrade path.

**Visual design:** each machine deserves a consistent cartoony pixel/isometric sprite with motion tied to real production: sensor LEDs and pick-and-place arm; cabinets with wiring and closing doors; spinning generator rotor; robot arm assembly; crawler/tracked loader rolling off a final conveyor. Keep purchased and upcoming machines only visible, preserving the clean dashboard rule.

**Unlock approach:** Sensor Workshop after Circuits + Mech Assembly; Control Cabinets after Sensors + Wiremill; Generators after Motors; Robotics after Motors + Sensors; Heavy Equipment after Generators or Robots. Gate by milestone and input dependency, not just arbitrary XP.

**Longer-term raw material:** silicon, oil or refined alloys should be considered *after* existing iron/copper combinations have meaning. Adding a third mine immediately creates more UI, stock types and freight work without solving the Stage 4-to-5 plateau.

## 5. New staff — choices, not chores

| Priority | Role | Suggested hire | Wage / minute | Core job | Unlock | Design condition |
|---|---|---:|---:|---|---|---|
| 1 | **Logistics Dispatcher** | 3,000 RVT | 22 RVT | Automatically rebalance assigned drivers/drones to the mine with greatest delivery shortfall; small efficiency benefit where applicable | Copper expansion | Never override manually locked routes; show savings |
| 2 | **Inventory Planner** | 5,000 RVT | 28 RVT | Protect contracted inventory and auto-select sensible Stockpile/Split/Use modes; **does not duplicate sales staff** | Two active production branches | Clearly show reserved stock and what may be sold |
| 3 | **Electrical Engineer** | 12,000 RVT | 40 RVT | Reduce power consumption by 20% while working | Motors or power bill >250/min | A deliberate trade-off; not profitable too early |
| 4 | **Quality Manager** | 9,000 RVT | 35 RVT | 10% bonus on eligible fulfilled customer contracts and +1 REP for quality delivery | Industrial electronics | Benefits need a clear report in contract receipts |
| 5 | **Shift Supervisor** | 30,000 RVT | 70 RVT | Automatically triage mechanics and minor interruptions; enables optional factory automation presets | National manufacturer | Never consume a player's scarce parts silently |

Staff should occupy one clean “Operations” subsection with summary, payroll and a single recommended hire, not five extra always-open panels. Every staff member needs an obvious **value proposition** and an “estimated impact per minute” or “hours of work saved” explanation. Hiring should never be the only escape from an incident. Staff costs should remain active trade-offs, but avoid invisible payroll that traps a player before they can earn their next delivery.

## 6. Transport economics — identified problem and calibration proposal

**Current mechanics:** mine output is about 0.35 iron or 0.26 copper ore/sec per first machine. One starter van transports 0.75 ore/sec. Additional vans cost escalating driver-hire fees; base driver wage is only 8 RVT/min. Vehicle tiers cost 6,500 / 35,000 / 175,000 RVT, so in many common mine configurations, hiring another driver is dramatically cheaper than buying a better fleet. New permanent route upgrades and boosts are technically real but not automatically good-value purchases.

**Example:** with five basic iron mines, production is approximately 1.75 ore/sec. Three starter van drivers cover it. Adding two drivers costs about 255 + 433 = 688 RVT upfront and 16 RVT/min wages; upgrading one starter van to a Small Lorry costs 6,500 RVT. Wage savings alone do not repay the extra upfront expenditure for approximately six hours. That is much too long for an early logistics choice.

**Next test candidate, not yet applied:** tier prices **1,200 / 9,000 / 45,000 RVT**, with throughput **1.8 / 4 / 9 ore/sec per driver** unchanged. At 1,200, the first upgrade's relative payback against two hired drivers falls to about 32 minutes in the five-mine example. Check route-specific upgrades after this change so they complement fleet choices rather than duplicating or invalidating them.

Before allowing paid boosts, show **“your mine is already fully covered; boost won't increase deliveries”** when capacity is unused. Consider deep-shaft extraction and advanced mine sites later to create authentic demand for drones and Heavy Lorries. Drone price 95,000 RVT and 75 RVT/min operating cost currently make them difficult to justify versus drivers in many scenarios. Rework their gameplay role and economics before advertising drones as a profitable upgrade.

## 7. Contract and reputation balancing

- Show one recommended contract plus an Inbox count by default. The first stage should not have three competing repeat contracts and several open story orders at once. Unlock the second repeat slot after Stage 2 and the third after Stage 4.
- Repeat offers now update the Inbox counter **without auto-opening the dropdown**. Preserve this calmer approach; keep the opening order discoverable.
- Make manual “Ship Surplus” the default action. Explain if stock is reserved for an existing customer contract; require an intentional override to sell reserved stock. Automatic sales already reserve many contracts, so manual sales should behave consistently.
- For timed orders, calculate deadlines from **actual bottleneck throughput**, including whether upstream machines and other contract reservations have access to materials. The current estimate uses the older machines[].rate field and does not fully model upstream shared demand.
- Reputation must not be an invisible wall. Show “need X REP — fulfil a customer order” by every locked purchase. Consider slowly earning reputation from lifetime sales milestones (e.g., 1 REP per 2,500 RVT shipped), but test the entire progression curve first so Rank 6 doesn't become trivial. Existing saves need migration if this is introduced.
- Story contracts should pay more than selling their required stock on the market. Repeat bonuses should be sustainable but not dwarf regular production profits; target approx 1.25–1.6x product value for standard orders, with a rush premium and a meaningful but achievable deadline.

## 8. Player satisfaction, retention and ethical engagement

**During a session**
1. **Clarity:** show one next objective and one current problem. Link to the exact screen/action.
2. **Agency:** at least two viable improvement paths (more equipment or greater efficiency; more staff or better automation). Neither should be mathematically dominated.
3. **Visible payoff:** every purchase causes an observable change in sprites, goods on conveyors, status and/or profit.
4. **Recoverability:** no permanent softlocks due to outages, broke payroll, unreadable stock reserves, or late contracts.
5. **Natural session break:** after a completed goal, show the next achievable milestone and autosave. Never shame a player for leaving.
6. **No popup spam:** story cutscenes remain major scripted moments; random malfunctions should be rarer and increasingly automatable by paid *in-game* specialists.

**Between sessions**
- Phase 1: trustworthy local save, export/import backup, optional “resume” explanation on return.
- Phase 2: optional **capped offline progress** (initial proposal: first 30 minutes at 25–50% ordinary production, capped by inputs, payroll and electricity; no offline random catastrophes). This requires a robust economy simulation and clock-tamper handling before shipping.
- Phase 3: optional personal factory goals, daily customer catalogue refresh without expiring streaks, and later endgame specialisations. Do not add prestige resets until the factory has meaningful post-motor progression and save protection.

**Research grounding:** studies of idle games highlight visible feedback and continued progression; game-design research consistently links clear goals and competence feedback with improved experience. These support the approach, but do **not** constitute measured retention results for Ore & Order.

## 9. What to measure in testing

Do not claim D1 or D7 retention until real users exist. Track anonymised event totals initially without user-identifying data. Suggested events: session started/ended; tutorial contract accepted/completed; machine bought; upgrade chosen; order completed/expired; bottleneck viewed; mechanic hired; incident entered/exited; failed purchase (cash/REP/XP); session resumed; save exported.

**Initial experiment acceptance criteria (hypotheses):**
- Tutorial contract completed within ~2 minutes by a majority of test players without verbal coaching.
- First Blast Furnace seen within ~7 minutes for engaged testers.
- Players can describe their next action in less than ten seconds at any stage.
- No save becomes permanently stuck after a scripted incident.
- In a 20–30 minute newcomer test, at least one player chooses a non-obvious but economically valid alternative strategy and can explain why.
- Fewer than three forced non-critical interruptions in the first fifteen minutes.
- When a new machine is bought, its input/output paths and delivered value are understandable from the screen.
- Under ordinary material supply, three successive meaningful purchases should not require over 30 minutes of idle waiting without a usable alternative.
- Build/typecheck green, then manual browser QA on desktop and mobile before tagging a release.

After small-scale user tests, compare activation and return rates by onboarding version, rather than inventing universal D1/D7 targets. Evaluate **player satisfaction** as well as time-on-site.

## 10. Roadmap, dependency order and implementation gates

### P0 — Stabilise and verify (underway)
- [x] Fix one-off power-cut repair clearing the modal but not the machine fault.
- [x] Add emergency incident fallback when repair cost is unaffordable.
- [x] Reduce random interruption frequency.
- [x] Add GitHub Actions production build and strict TypeScript checks.
- [x] Obtain a successful Vercel deployment check (latest app-code commit).
- [ ] Verify the actual browser experience and production URL; deployment success is not the same as gameplay QA.
- [ ] Play through first 15 minutes in a real browser, including return from saved state.
- [ ] Regression-check all scripted story cutscenes, timers, payroll, drone assignments and progress migration.

### P1 — Prove the first-hour economy
- [x] Reprice existing copper machines and Electric Motor Works.
- [x] Align motor reputation lock with its new price.
- [ ] Centralise machine/reward/wage numbers in a typed balance module.
- [ ] Add deterministic scenario simulator: optimal, normal and novice play; include random outage distribution.
- [ ] Rebalance early driver/fleet economics **after** this test and publish why each purchase is useful.
- [ ] Replace hidden REP gates with one clear recommended way to progress.
- [x] Stop ordinary repeat contracts from interrupting play by automatically opening the Inbox.
- [ ] Add safe “Ship Surplus” flow and actual contract-aware deadline estimates.

### P2 — Fill the midgame gap
- [ ] Sensor Workshop and Control Cabinet Works, with a full resource dependency chart.
- [ ] Smart Logistics Dispatcher and Inventory Planner.
- [ ] Visual production feedback and a compact one-click upgrade panel.
- [ ] New 30–90-minute milestone contracts and optional story scenes.
- [ ] Re-run 2-hour cost/payback simulation; adjust motor cost to keep the milestone satisfying, not interminable.

### P3 — Deep industry and autonomy
- [ ] Generator Assembly and Robotics Cell.
- [ ] Quality Manager, Electrical Engineer; optional automation rules.
- [ ] Cloud-save or at least export/import before introducing offline progress.
- [ ] Capped offline progress with deterministic ledger and clear return summary.
- [ ] Expand achievement set from simple ownership milestones into strategic specialisations.

### P4 — Sustainable endgame
- [ ] Heavy Equipment Yard and new factory stage(s).
- [ ] Larger long-term contracts, configurable automation, optional prestige based on total industrial reach.
- [ ] Cross-device save and real player analytics only with the appropriate privacy and hosting work.
- [ ] Test endgame budgets with months-long save values, not only new games.

## 11. Test matrix / release gates

- New save with first-ore contract; buy first miner; fulfil 5 ore; pay one-off or hire mechanic; confirm unitFaults.miner resets.
- Buy Mech Assembly leaving under 120 RVT; trigger cyber scene; confirm manual reboot is accessible and production resumes.
- Existing save from before freight and drone changes; verify no null assignment crash or transport inflation.
- Pay zero wages with full mine backlog; recover by selling stock, then confirm production restarts.
- Copper and iron active at once with scarce drivers; reassign drivers and drones, watch mined/delivered live metrics.
- Route boost expires after exactly 60 operational seconds and cooldown does not drift through paused/incident states.
- All eleven existing machine types; motor inputs consume exactly 2 Coils + 1 Circuit, and do not consume a customer's reserved stock.
- Automatic sales vs manual shipments; story contract stock reserve and expired repeating offer behavior.
- Resume from localStorage, deliberately malformed save, mobile narrow viewport and two-speed mode.
- Run both TypeScript check and production bundle build on every change; do not call Vercel healthy until a live deploy is independently confirmed.

## 12. Decision summary

**Build next:** a repeatable gameplay simulator and contract-safe shipping; then implement the Sensor Workshop and Control Cabinet Works. **Don't** add another raw ore mine or six more staff screens. The remaining largest design problem is the long, relatively empty wait between electronics and the first Motor Works. Solve that with a believable combined-resource production chain and measurable economic upside.

**Status:** source changes are committed; latest GitHub Actions source checks and Vercel deployment check succeeded for app-code commit 2e938fc. The live browser could not be independently navigated, so gameplay verification remains open. Financial figures and time windows are models, not player telemetry.

---
Useful reading:
- Idle game pacing and cost-ladder reasoning: https://open-loop-games.github.io/incremental-math/design-playbook/pacing/
- Idle game player-engagement research: https://escholarship.org/uc/item/0b07v51w
- Psychological need satisfaction in game mechanics: https://doi.org/10.1016/j.chb.2016.12.033
