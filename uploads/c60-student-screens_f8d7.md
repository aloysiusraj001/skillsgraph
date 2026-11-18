# C60 Student Screens — exact UI copy

The room no longer follows this copy. For what each screen does now, and which fields to fill, use [docs/screens.md](../../docs/screens.md).

The text below is the earlier spec. It still says the Leader starts the room, that Obstacle is the first Why, and that Harm comes from the map. None of that is how the board works.

**Product copy for the online teaching tool**  
Audience: five students in one shared room. Screens carry title, body, checklist, Your move, and buttons. Teachers still speak: answer questions; brief walk-over coach on amber/red — no stage script to read aloud.

Global chrome (every stage):
- Top bar: `C60 · What's the problem` · theme chip · timer · stage pills S0…S7
- Left rail: role badge + short jobline
- Bottom: contribution meter (red → amber → green) · primary action button(s)
- Persistent panel: **Your move** (role-specific one-liner for this stage)

Placeholder tokens the product substitutes:
- `{theme}` — session theme text
- `{team}` — team name
- `{role}` — this student's role
- `{n}` — live counts

---

## S0 — Room open

**Screen title:** Welcome to C60 · What's the problem  

**Header / theme reminder:**  
`Theme: {theme}` · `Team: {team}` · `Your role: {role}`

**Primary instruction (exact words):**  
Your theme is already set. Your roles are already assigned. Together you will build three things: who is affected, why it happens on a fishbone, and three clear five-blank problem statements. Follow the screen. The Leader unlocks each next step when your checklist turns green. Your teacher answers questions and may coach briefly if a cue lights amber or red.

**Bullet steps (visible to all):**
- Check your role badge — you keep this job for the whole activity
- Read the theme card so everyone shares the same focus
- Wait for the Leader to tap Start

**Your move (per role):**
- Leader: When everyone is here and has read the theme, tap Start.
- Lead Interviewer: Confirm your badge. You'll keep us tied to real people.
- Theme Mapper: Confirm your badge. You'll merge and place cards later.
- Insight Extractor: Confirm your badge. You'll deepen Why branches later.
- Devil's Advocate: Confirm your badge. You'll challenge blame and smuggled solutions.

**Buttons:**
- Leader only: `Start activity` (primary)
- Others: `I'm ready` (optional check-in; does not unlock)

**Gate / lock messages:**
- Incomplete: `Waiting for Leader to start…` · `Not everyone has joined yet ({n}/5).`
- Complete: `All roles present. Leader can start.`

**Empty / warnings:**
- Missing teammate: `Someone is missing. Ask your teacher, or Leader may start with 4 if allowed.`
- Role unassigned: `Your role is blank. Ask your teacher to assign roles before Start.`

---

## S1 — Stakeholder silent dump

**Screen title:** Who is touched by this?  

**Header / theme reminder:**  
`Theme: {theme}` · `Silent mode · {timer}` · `Cards private until timer ends`

**Primary instruction (exact words):**  
Add people or groups touched by this theme. Name a role or a specific person type — not a product and not a solution. Work silently. Others cannot see your cards until the timer ends. Each of you needs at least 3 cards.

**Bullet steps (visible to all):**
- Tap Add stakeholder
- Type a short label (e.g. first-year student, canteen staff, parent who pays)
- Add at least 3 cards of your own
- Stay silent until the reveal

**Your move (per role):**
- Leader: Start the 4:00 timer. Remind the team: people, not products.
- Lead Interviewer: Include at least one end user who feels the problem.
- Theme Mapper: Just add cards for now — you will merge next.
- Insight Extractor: Include someone who feels it daily but has little power.
- Devil's Advocate: Include a blocker, skeptic, or gatekeeper.

**Buttons:**
- All: `Add stakeholder` · `Edit` · `Delete` (own cards only)
- Leader: `Start timer` · `Pause` (if allowed)

**Gate / lock messages:**
- Incomplete: `Need ≥3 cards from each person ({n}/5 ready).` · `Timer still running — keep adding.`
- Complete: `Everyone has ≥3 cards. Revealing board…` → auto advance to S1b

**Empty / warnings:**
- Empty board tip: `Stuck? Think: who uses it, who pays, who decides, who blocks, who is quietly hurt.`
- Solution-word warn (inline): `That sounds like a solution. Name a person or group instead.`
- Product-word warn: `Apps and tools aren't stakeholders. Who is affected?`

---

## S1b — Merge duplicates

**Screen title:** Clean the pile — merge, don't retype  

**Header / theme reminder:**  
`Theme: {theme}` · `Revealed pile · {n} cards` · `Mapper merges`

**Primary instruction (exact words):**  
Don't retype. Stack cards that mean the same person or group. Only the Theme Mapper can merge. Everyone else can tap Suggest same. Devil's Advocate may veto a bad merge once this stage. Keep author names under each stack.

**Bullet steps (visible to all):**
- Scan the pile for near-duplicates
- Non-Mappers: tap Suggest same on a card and pick its twin
- Mapper: drag one card onto another to merge, or accept a suggestion
- Mapper: rename the merged label if needed
- When the pile looks clean, Mapper taps Merges done

**Your move (per role):**
- Leader: Keep the 3:00 timer honest. Don't merge for the Mapper.
- Lead Interviewer: Suggest merges that keep real interview targets distinct (user ≠ payer).
- Theme Mapper: Drag to merge. Rename stacks. Tap Merges done when ready.
- Insight Extractor: Suggest merges that preserve "quiet daily pain" people.
- Devil's Advocate: Veto one bad merge if user and payer (or similar) get collapsed wrongly.

**Buttons:**
- All: `Suggest same`
- Theme Mapper: `Merge` (drag) · `Unmerge` · `Rename label` · `Merges done` (primary)
- Devil's Advocate: `Veto merge` (1 use)
- Team after veto: `Override veto (need 4/5)` 

**Gate / lock messages:**
- Incomplete: `Mapper has not confirmed merges.` · `Open veto — resolve or override.` · `Suggested merges waiting ({n}).`
- Complete: `Merges done. Opening the power map…`

**Empty / warnings:**
- No duplicates: Mapper may tap `No duplicates — continue`
- Bad merge hint: `Careful: end user and payer are often different people.`

---

## S2 — Power × interest, priorities & Summary carry

**Screen title:** Who has power? Who cares? Whose problem do we follow?  

**Header / theme reminder:**  
`Theme: {theme}` · `Grid: Power × Interest` · `Summary carry` · `{timer}`

**Primary instruction (exact words):**  
Theme Mapper places each merged card on the power × interest grid. Vote for 2 or 3 priority groups. Then pick whose problem you follow and write what goes wrong for that person. Tag each card Heard from or Our guess. Only the Leader can lock the map when the meter is green.

**Bullet steps (visible to all):**
- Mapper places every merged card on the 2×2
- On each card, set Heard from or Our guess (Interviewer owns Heard from)
- Interviewer marks Talk-to on realistic interviewees
- Insight stars Daily pain
- Devil flags if payer, sponsor, or blocker is missing — and challenges thin Our guess claims
- Everyone casts 2 votes for priority groups
- After 2–3 priorities: pick Whose problem we follow (one priority person)
- Lead Interviewer writes What goes wrong for [who]? (saved as Harm)
- Leader locks when Summary carry is complete and the meter is green

**Your move (per role):**
- Leader: Open the 2-dot vote when placement looks ready. Open Summary strip after priorities. Lock map only on green.
- Lead Interviewer: Mark Talk-to. Confirm Whose problem. Set Heard from chips. Write What goes wrong for [who]?
- Theme Mapper: Place all cards. Accept or reject move suggestions.
- Insight Extractor: Star Daily pain on people who feel this every day.
- Devil's Advocate: Flag Missing payer / sponsor / blocker. Challenge Our guess claims that look like planted guesses.

**Buttons:**
- Theme Mapper: `Place on grid` · `Accept move` · `Reject move`
- All: `Suggest move` · `Vote` (2 dots) · `Toggle Heard from / Our guess` (Interviewer confirms Heard from)
- Lead Interviewer: `Mark Talk-to` · `Confirm whose problem` · `Write what goes wrong`
- Insight Extractor: `Star Daily pain`
- Devil's Advocate: `Flag missing role` · `Challenge our guess`
- Leader: `Open vote` · `Open summary` · `Lock map` (primary, gated)

**Gate / lock messages:**
- Incomplete: `Mapper still placing cards ({n} unplaced).` · `Need 2–3 priority groups (now {n}).` · `Not everyone has voted.` · `Pick whose problem we follow.` · `Write what goes wrong for {who}.` · `Contribution meter red — check Your move.`
- Complete: `Map locked. Artifact A saved (priorities + whose problem + harm). Next: pick one real incident.`

**Empty / warnings:**
- Empty quadrant tip: `High power / low interest is often a quiet sponsor or blocker — don't leave it empty if one exists.`
- Too many priorities: `Pick at most 3. Narrow your focus.`
- Our guess tip: `Our guess means the team invented this — Interviewer should verify or Devil should challenge.`
- Soft plant note (pilot, on-screen toast if seeded): `One claim on this board started as Our guess. Check it.`

---

## S3 — Incident pin

**Screen title:** Pin one real incident  

**Header / theme reminder:**  
`Theme: {theme}` · `Priority groups: {list}` · `{timer}`

**Primary instruction (exact words):**  
Pick one observable incident related to a priority group. Write what happened as a fact — not a blame story. Example shape: Last Tuesday, three students left the workshop after 10 minutes. Not: Students are lazy.

**Bullet steps (visible to all):**
- Lead Interviewer proposes one incident card
- Others may add alternate incident cards
- Devil's Advocate can veto blame wording once
- Team votes for one incident
- Leader locks the winner — it becomes the fish head

**Your move (per role):**
- Leader: Run the quick vote. Lock incident when one winner is clear.
- Lead Interviewer: Propose the first factual incident tied to a priority group.
- Theme Mapper: Keep alternate cards tidy on the board.
- Insight Extractor: Prefer incidents that show daily pain, not one-off drama.
- Devil's Advocate: Veto blame or character attacks in the wording.

**Buttons:**
- Lead Interviewer: `Propose incident` (primary for role)
- All: `Add alternate` · `Vote`
- Devil's Advocate: `Veto blame wording`
- Leader: `Lock incident`

**Gate / lock messages:**
- Incomplete: `No incident proposed yet.` · `Blame veto open — rewrite the card.` · `Vote not finished.`
- Complete: `Incident locked. Dropping it onto the fish head…`

**Empty / warnings:**
- Blame detect: `Rewrite without blaming people. Describe what you saw or heard.`
- Too vague: `Add when / where / what so the team can dig into causes.`

---

## S4a — Fishbone broad map

**Screen title:** Map possible causes on the fish  

**Header / theme reminder:**  
`Fish head: {incident}` · `Bones: Timing · Communication · Perceived value · Process · Tools · Environment` · `{timer}`

**Primary instruction (exact words):**  
Add possible causes into the holding tray. Do not pick a single root yet. Theme Mapper snaps cards from the tray onto the bones. Stamp out blame. Attach evidence when you have it.

**Bullet steps (visible to all):**
- Everyone adds cause cards into the holding tray (silent first if timer says so)
- Mapper snaps tray cards onto the matching bones
- Devil stamps blame or vague cards
- Interviewer can attach a quote or photo to a cause
- Mapper taps Bones ready when ≥4 bones have at least one card

**Your move (per role):**
- Leader: Run the 6:00 timer. No root-cause speeches yet.
- Lead Interviewer: Attach quote/photo evidence to at least one cause when you can.
- Theme Mapper: Snap tray cards onto bones. Cluster lookalikes on the same bone.
- Insight Extractor: Star causes that show daily pain.
- Devil's Advocate: Stamp Blame or Vague on cards that attack character or say nothing useful.

**Buttons:**
- All: `Add cause` · `Edit own`
- Theme Mapper: `Snap to bone` · `Bones ready` (primary)
- Lead Interviewer: `Attach evidence`
- Insight Extractor: `Star daily pain`
- Devil's Advocate: `Stamp blame` · `Stamp vague`
- Leader: `Start timer`

**Gate / lock messages:**
- Incomplete: `Need causes on at least 4 bones.` · `Tray still full — Mapper should place cards.` · `Mapper has not tapped Bones ready.`
- Complete: `Bones ready. Next: choose 2–3 branches to dig.`

**Empty / warnings:**
- Solution-as-cause warn: `That's a solution. Write a cause of the incident instead.`
- Empty tray tip: `Ask: what about timing, messages, value, process, tools, or the environment made this incident happen?`

---

## S4b — Select branches

**Screen title:** Choose 2–3 bones to investigate  

**Header / theme reminder:**  
`Fish head: {incident}` · `Vote · evidence over popularity` · `{timer}`

**Primary instruction (exact words):**  
Vote for 2 or 3 bones to investigate deeper. Choose where you already have some evidence — not just the most popular guesses. Selected bones will glow; others will dim.

**Bullet steps (visible to all):**
- Review which bones have evidence chips or strong cards
- Cast your votes (2 dots)
- Confirm 2–3 bones are selected
- Continue when the selection locks

**Your move (per role):**
- Leader: Close the vote when 2–3 bones are clearly ahead.
- Lead Interviewer: Argue for bones with real quotes or observations.
- Theme Mapper: Keep the board readable while bones glow/dim.
- Insight Extractor: Prefer bones that can yield a need or insight later.
- Devil's Advocate: Challenge a popular bone that has no evidence.

**Buttons:**
- All: `Vote for bone`
- Leader: `Confirm selection` (primary)
- Devil's Advocate: `Challenge thin evidence`

**Gate / lock messages:**
- Incomplete: `Select 2–3 bones (now {n}).` · `Not everyone has voted.`
- Complete: `Branches selected. Time to ask Why on the glowing bones.`

**Empty / warnings:**
- Popularity warn: `This bone is popular but untagged. Prefer evidenced branches.`

---

## S4c — Why deepen

**Screen title:** Dig deeper — ask Why on glowing bones  

**Header / theme reminder:**  
`Glowing bones: {list}` · `Each hop = one Why` · `Tag every hop` · `{timer}`

**Primary instruction (exact words):**  
On glowing bones only, grow Why branches outward. Each hop is one Why. You are not forced to stop at five or reach five. Tag every hop: Evidence, Assumption, or Need-to-check. Multiple contributing causes are OK. An unsupported early link weakens everything after it.

**Bullet steps (visible to all):**
- Insight Extractor adds Why hops on glowing bones
- Others may propose hop text; Insight accepts or edits
- Devil enforces an evidence chip on every new hop
- Interviewer adds Ask whom? on Need-to-check hops
- Deepen at least 2 bones with ≥1 tagged hop each

**Your move (per role):**
- Leader: Keep pace on the 6:00 timer. Protect depth over speed.
- Lead Interviewer: On Need-to-check hops, add Ask whom?
- Theme Mapper: Keep Why arrows tidy so depth is readable.
- Insight Extractor: Add Why hops. Pull one level deeper when a hop is shallow.
- Devil's Advocate: Block hops with no chip. Stamp blame if it creeps back.

**Buttons:**
- Insight Extractor: `Add Why hop` (primary) · `Accept proposal` · `Edit hop`
- All: `Propose Why text`
- Devil's Advocate: `Require chip` · `Stamp blame`
- Lead Interviewer: `Add ask whom?`
- Theme Mapper: `Tidy layout`

**Gate / lock messages:**
- Incomplete: `Need ≥2 bones with tagged Why hops (now {n}).` · `{n} hops missing evidence chips.` · `Insight has not added a hop yet.`
- Complete: `Depth meter green. Next: pin what to address.`

**Empty / warnings:**
- Chip missing: `Tag this hop before adding another.`
- Forced-root warn: `Don't collapse everything into one root yet — keep strong branches visible.`
- Exactly-five tip: `Stop earlier or go deeper when the evidence justifies it — not because of the number 5.`

---

## S4d — Pin interventions

**Screen title:** Pin 1–3 causes to carry forward  

**Header / theme reminder:**  
`Supported causes only` · `Obstacle + Insight candidates` · `{timer}`

**Primary instruction (exact words):**  
Pin 1 to 3 supported contributing causes. These pins feed your statements. On each pin the board labels an Obstacle candidate (first Why on that branch) and an Insight candidate (deepest or marked supported cause). Prefer Evidence-tagged links. Multiple pins are allowed — you do not need a single root.

**Bullet steps (visible to all):**
- Review glowing branches and their chips
- Vote or agree on 1–3 pins
- Insight nominates Obstacle candidate + Insight candidate on each pin
- Devil may block a pin or Insight candidate that has no evidence
- Mapper keeps pin markers readable if there are several
- Leader locks the fishbone when pins are set and the meter is green

**Your move (per role):**
- Leader: Lock fishbone only when 1–3 pins sit on supported causes with candidates labelled.
- Lead Interviewer: Prefer pins tied to quotes, Heard-from people, or observed incidents.
- Theme Mapper: Place pin markers cleanly. Help show which pin feeds which statement later.
- Insight Extractor: Nominate Obstacle candidate (first Why) and Insight candidate (deepest / marked) on each pin.
- Devil's Advocate: Block pins or Insight candidates that rest only on assumptions.

**Buttons:**
- All: `Nominate pin` · `Vote pin`
- Insight Extractor: `Set obstacle candidate` · `Set insight candidate`
- Theme Mapper: `Place pin`
- Devil's Advocate: `Block unsupported pin` · `Challenge insight candidate`
- Leader: `Lock fishbone` (primary, gated)

**Gate / lock messages:**
- Incomplete: `Need 1–3 pins (now {n}).` · `A pin is blocked — replace or override.` · `Label Obstacle and Insight candidates on each pin.` · `Contribution meter still red.`
- Complete: `Fishbone locked. Artifact B saved (pins + obstacle/insight candidates). Next: write five-blank statements.`

**Empty / warnings:**
- Assumption-only pin: `This pin is mostly assumptions. Dig one more Why or pick another cause.`
- Candidate tip: `Obstacle = first Why on the main path. Insight = the deepest supported cause you marked.`

---

## S5 — Statement sprint

**Screen title:** Write one five-blank problem statement each  

**Header / theme reminder:**  
`Pins: {list}` · `Whose problem: {who}` · `Five blanks` · `{timer}`

**Primary instruction (exact words):**  
Each person writes one statement. The sentence on screen is: [who] needs [need], but [obstacle], so [harm], because [insight]. Need is empty — you type it. Who, Obstacle, Harm, and Insight carry from your map and fishbone (labels say from your map / from your fishbone). Edit a blank if it is wrong; edited blanks are not overwritten. Do not put a solution in Need. Silent writing until everyone has submitted.

**Carry labels (on each blank):**
- Who — from your map (priority whose-problem person)
- Need — you type this (never auto-filled)
- Obstacle — from your fishbone (first Why on chosen pin)
- Harm — from your map (what goes wrong)
- Insight — from your fishbone (pinned / marked root)

**Bullet steps (visible to all):**
- Check the carried Who, Obstacle, Harm, and Insight (edit if stale or wrong)
- Type Need only — a human need, not a product
- Read the full sentence aloud in your head
- Optional: open Deepen strip (Context · Emotion · Impact · Alternatives) — not required to submit
- Submit your one statement
- Wait for all five before the red-flag round

**Your move (per role):**
- Leader: Enforce silence. Start the ~7:00 timer. No editing others' drafts. Lock when 5 submitted and Done gates green.
- Lead Interviewer: Check Who + Harm are recognizable. Prefer a Heard-from Who.
- Theme Mapper: If multiple pins, help your teammates pick which pin feeds Obstacle/Insight — then write your own statement.
- Insight Extractor: Suggest Obstacle/Insight polish from pins. Never overwrite someone else's Need.
- Devil's Advocate: Gate generic Who (users/people) and solution words in any blank — model the rule on your own draft.

**Buttons:**
- All: `Write statement` · `Edit blank` · `Open deepen (optional)` · `Submit` (primary) · `Edit mine` (before submit)
- If map/fishbone changed after draft: `This may be out of date` toast · `Use new version` (keeps Need)
- Leader: `Start timer`

**Gate / lock messages:**
- Incomplete: `Waiting for statements ({n}/5).` · `Empty blank — fill every field.` · `Who looks too generic — name a real person or group.` · `Fix the warning on your Need field.`
- Complete: `All 5 in with green Done gates. Opening red-flag and vote…`

**Empty / warnings:**
- Solution words in Need (`app`, `platform`, `website`, `system`, `dashboard`, `feature`, `build`, `create a…`): `Need should be a human need, not a solution. Move product ideas out.`
- Generic Who (`users`, `people`): `Name the priority person from your map — not a generic word.`
- Empty blank: `Every blank needs text before Submit.`
- Stale carry: `This may be out of date` · tap `Use new version` (keeps your Need).
- Multi-problem warn: `This looks like two problems. Split or focus on one.`
- Deepen tip (optional): `Context or Emotion makes the statement stronger for the top-3 — not required to submit.`

---

## S6 — Red-flag, cluster, choose

**Screen title:** Clean five-blank statements — pick the top 3  

**Header / theme reminder:**  
`5 candidates on the table` · `Red flags → fixes → vote` · `{timer}`

**Primary instruction (exact words):**  
Devil's Advocate tags problems: too broad, multi-problem, has solution, generic Who, missing Harm or Obstacle carry, or solution in Need. Insight Extractor proposes five-blank-safe fixes. Authors accept fixes on their own cards. Theme Mapper clusters near-duplicates (stack, don't retype). Soft recommend: at least one top-3 has Context or Emotion filled. Then everyone votes. Keep the top 3 full sentences. Leader locks the C60 Pack.

**Bullet steps (visible to all):**
- Devil applies official red-flag tags (including PSC quality)
- Insight proposes edited five-blank wording
- Authors accept or revise their own cards
- Mapper clusters near-duplicates into stacks
- Interviewer marks recognizable? Soft check deepen on top candidates
- Everyone casts 2 votes
- Leader locks when top 3 are set and the meter is green

**Your move (per role):**
- Leader: Open vote after one fix round. Lock C60 Pack on green.
- Lead Interviewer: Ask: would our priority person recognize this Who + Harm? Soft recommend Context or Emotion on ≥1 top-3.
- Theme Mapper: Cluster near-duplicates — stack, don't retype.
- Insight Extractor: Propose five-blank-safe fixes for tagged cards (don't overwrite Need unless author accepts).
- Devil's Advocate: Apply too broad / multi-problem / has solution / generic Who / missing Harm or Obstacle / solution in Need tags.

**Buttons:**
- Devil's Advocate: `Tag too broad` · `Tag multi-problem` · `Tag has solution` · `Tag generic Who` · `Tag missing carry` · `Clear tag`
- Insight Extractor: `Propose fix` (five-blank safe)
- Authors: `Accept fix` · `Edit mine` · `Add deepen field`
- Theme Mapper: `Cluster` · `Uncluster`
- Lead Interviewer: `Mark recognizable?`
- All: `Vote` (2 dots)
- Leader: `Open vote` · `Lock C60 Pack` (primary, gated)

**Gate / lock messages:**
- Incomplete: `All statements are still red-flagged — complete one revision round.` · `Need top 3 selected (now {n}).` · `Not everyone has voted.` · `Mapper clusters still open.`
- Complete: `C60 Pack locked. Artifact C saved (top 3 five-blank sentences). Opening export…`

**Empty / warnings:**
- All flagged: `Every card has a red flag. Fix at least one before voting.`
- Solution tag tip: `If Need names a product, rewrite Need as a human job or struggle.`
- Generic Who tip: `Replace users/people with the priority person from your map.`
- Missing carry tip: `Pull Harm from What goes wrong and Obstacle from the first Why on your pin.`
- Deepen soft tip: `Nice if one top-3 has Context or Emotion — not a hard lock.`

---

## S7 — Pack export

**Screen title:** C60 complete — your pack is ready  

**Header / theme reminder:**  
`Theme: {theme}` · `Team: {team}` · `Pack saved`

**Primary instruction (exact words):**  
Nice work. Your C60 Pack is ready for the next chunk. Review the three artifacts, download or share the pack, and celebrate the contribution badges you earned. Suggested next steps are interviews (C18) or statement polish (C28).

**Bullet steps (visible to all):**
- Preview Artifact A — stakeholder map + priority groups
- Preview Artifact B — fishbone + Why depths + pins
- Preview Artifact C — top 3 five-blank problem statements (full sentence)
- Download or share the pack
- Optional: open the contribution log with your teacher

**Your move (per role):**
- Leader: Share the pack link with the teacher or next activity room.
- Lead Interviewer: Note which priority people you would interview first in C18.
- Theme Mapper: Confirm the exported map and fishbone look complete.
- Insight Extractor: Skim full sentences — keep Obstacle + Insight sharp for C28.
- Devil's Advocate: Spot-check that no solution language survived in the top 3.

**Buttons:**
- All: `Preview A` · `Preview B` · `Preview C` · `View my contributions`
- Leader / any: `Download pack` · `Share pack` · `Suggest next: C18` · `Suggest next: C28`

**Gate / lock messages:**
- Incomplete: `Pack still generating…` (rare)
- Complete: `Pack ready.`

**Empty / warnings:**
- Share failed: `Download worked locally. Ask your teacher if share is blocked.`
- Contribution gap note (teacher-facing, optional student toast): `Some role actions were filled by backup rules — check the log.`

---

## Cross-stage microcopy (reuse)

**Meter tooltips:**
- Red: `Someone still owes a required action — check Your move.`
- Amber: `Almost — finish votes or confirmations.`
- Green: `Leader can lock.`

**Solution / blame dictionary (auto-warn):**  
Solution-ish: app, platform, website, build, create, feature, system, tool, dashboard  
Blame-ish: lazy, don't care, stupid, bad attitude, always / never (character claims)

**Teacher is not a stage narrator:**  
No screen says “ask your teacher what to do next.” Stuck states offer in-product tips + `Ask teacher` only as a help button that opens FAQ chips. Teachers still answer questions and may coach briefly on amber/red.
