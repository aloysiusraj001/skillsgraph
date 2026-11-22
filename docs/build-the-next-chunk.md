# How to build the next chunk

What each C60 screen asks the team to fill in is in [screens.md](screens.md). The films are in [section-videos.md](section-videos.md). This file is the one to give Grok when the next chunk is built.

Use this file to teach Grok to build another classroom chunk the way C60 was built. C60 is the worked example. The next chunk keeps the room, the roles, the teacher controls, and the way a decision gets corrected. It does not keep the cocoa lesson.

## How to start the next chat

Open a new Grok chat. Do not continue the C60 chat. Attach this file, `docs/screens.md`, and that chunk’s own scripts (system brief, student screens, teacher cues, flow). Then paste the prompt at the bottom of this file, with the blanks filled in.

Say that the C60 app is the pattern for the software, and that the attached scripts are the pattern for the lesson. If those two disagree, the scripts win on the teaching, and the decision rules in this file win on the software.

Build one chunk per app. Do not put C16, C18, C28, and C60 in the same room.

## What C60 became

The first brief asked for a Live App for classroom C60 only: five students and one teacher, a shared board, role-gated moves, a teacher radar, and the stages from Welcome through the pack. The stack is Next.js, TypeScript, Tailwind, and Postgres. One room is one row. Every move is checked on the server against the person’s role. The teacher can open all five seats on one computer and switch between them.

Ages 11 to 15 read it. Type is large. Each role has a color and a token. **Your move** is the only place a student types. The board is what the whole team sees.

The teacher presses **Start** and **Next**, runs the clock, and plays the films. Students do not advance the room.

## What changed after the first build

The first brief was the start, not the finished rule. These corrections came from using the board. Apply the same test to the next chunk: if a control does not match the sentence the class is building, remove it.

| What the first brief said | What the room does now | Why |
| --- | --- | --- |
| The Leader unlocks the next stage when the meter is green. | The teacher presses Start and Next. | A class needs one person to move every group at the same moment. The meter still shows who is stuck. |
| The class votes for the priority person. | The Lead Interviewer taps one person. There is no vote. | The interviewer had already chosen. A second vote repeated the choice, and every button looked the same. |
| Harm on the statement comes from “what goes wrong” on the map. | Harm is the incident in the fish head. “What goes wrong” stays the early guess. | The map line is written before the team has a moment. The incident is the checked version. |
| Obstacle is the first Why. Insight is the deepest Why. | Obstacle is the cause on the rib that was pinned. Insight is only the Why marked as the root. | The first Why is already an explanation of the cause. The deepest card is often the outcome, which belongs in Harm. |
| The team follows two or three bones. | The team taps one rib. The Whys grow on that rib only. | Five Whys on six ribs becomes six unfinished chains. |
| A Why chain must reach five. | Stop when one Why is the root. That is often the third or the fourth. | A forced fifth Why invents an answer. |
| Anyone can chat with the persona. The script said “the class”. | The short interview is the team asking. Only the Lead Interviewer types extra questions. Everyone reads the answers. | Five chat boxes on one persona made the incident noisy. |
| The phase over the statement was “Test ideas”. | That phase is **Define**. | This room writes the problem. It does not test solutions. |
| Causes sat in a tray, and Whys stacked in a column. | The incident is the fish head. Ribs leave the spine. Each Why is the next card to the left. | Students could not see where a card had gone. |
| A pin was a marker with no owner. | The Insight Extractor writes Obstacle and Insight. The Theme Mapper places the pin on the fish. | Two jobs were hidden in one button. |
| The sample story was school lunch waste. | The sample story is cocoa farmers: the work, the safety, and about 6 cents of each dollar. The teaching example inside the films is a morning bus that fills at the first stop, so the class does not copy it onto their own board. | The lesson has to be wide enough to explore, the way a sweatshop lesson can be about pay, safety, and hours, not one narrow fact. |

## The reusable shape of a chunk

Every chunk gets the same shell.

1. **Home.** The teacher names the team, the theme, and five students, and assigns the five roles. Two buttons open a filled example and a smaller pilot.
2. **One room code.** Each browser tab holds one seat. The teacher can also open all five seats and press **Move as**.
3. **Teacher radar.** Green, amber, or red, with one sentence about who is stuck. Start, Next, Back, the clock, and Reset. Reset clears the board and keeps the code and the roles.
4. **Student board plus Your move.** The board is shared. Your move shows only the fields that role can change. If a role has nothing to type, the panel says so.
5. **A film at each gate.** The teacher plays it out loud, then presses Start or Next. The frame says **Video will play here** until a file exists. **Play for the class** unlocks **Watch the film** on the student screens. **Read this step** starts closed. The notes inside each film start closed too.
6. **A filled example** that lands on a late screen, so the flow can be checked without typing every card.
7. **`docs/screens.md` for that chunk.** One section per screen. For each field: who fills it, what they type or tap, what the room rejects, and where the value shows up later.
8. **A second story inside the films**, unrelated to the theme, so the class learns the clicks without copying the sample answers.

Keep the five roles unless that chunk’s script names different jobs. Their C60 jobs are:

| Role | Job on this board |
| --- | --- |
| Leader | Pace. No private fields. |
| Lead Interviewer | The person, the interview, the incident. |
| Theme Mapper | Merge, place on the matrix, move a card to the right rib, place the pin. |
| Insight Extractor | Whys, the root mark, the pin labels. |
| Devil’s Advocate | Blame, vague cards, weak sentences. |

## How a sentence should be carried

Do this for any chunk that ends in a problem statement. Do not copy the old carry table from the first brief.

| Blank | Source | Rule |
| --- | --- | --- |
| Who | The person the Lead Interviewer followed | A specific person or group. “Users” and “people” fail. |
| Need | The interview line “What are you trying to get done?”, then edited | A human need. An app, platform, website, system, dashboard, or feature fails. |
| Obstacle | The cause on the pinned rib | Not the first Why. The first Why explains the cause. |
| Harm | The incident locked into the fish head | Not the early “what goes wrong” line. |
| Insight | The Why marked as the root | Not “whatever card is furthest left”. |

If the student edits a carried blank, keep the edit. A later change to the map must not wipe it. Offer **Use new version** when the source changes, and let that button keep Need.

## How the fish should be built

Use this when the chunk has a fishbone.

- The head is one incident: a when, a where, and what happened. Not a cause, and not a solution.
- Six ribs leave the spine: Timing, Communication, Perceived value, Process, Tools, Environment.
- A cause is added onto a rib from Your move. It appears on that rib. The Theme Mapper can move it.
- The team then taps one rib.
- Whys grow to the left, one card at a time, tagged Evidence, Assumption, or Need to check.
- Only the Insight Extractor adds a Why and marks the root.
- The pin sits on the cause. Obstacle is that cause. Insight is the marked root. The Theme Mapper places the pin.

If a card can be added and then cannot be seen, the screen is wrong. Fix the board before adding the next stage.

## How the films should be built

Write the films after the screens are settled, not before. A film that describes a button you later remove will fight the class.

C60 uses five films:

| Film | Teacher plays it on | Students then enter |
| --- | --- | --- |
| 1. The theme | Welcome | Still the welcome. Scene only. No clicks. |
| 2. The first tool | Welcome, after film 1 | The first working screen |
| 3. The interview and the moment | The screen where the person is chosen | The incident |
| 4. The fish through the pin | The incident, once one moment has won | Causes, one rib, Whys, pin |
| 5. The sentence and the top 3 | The pin screen | The statement, then the vote |

For another chunk, keep film 1 as the scene from that chunk’s deck. Split the rest at the teacher’s Next buttons, one film per stretch of screens that belong together. Teach the clicks with a story that is not the theme.

## What to hand Grok for a new chunk

Attach all of these.

- This file.
- `docs/screens.md` from C60, as the shape of the finished field guide, not as the content to copy.
- That chunk’s system script, student screens, teacher cues, and flow.
- The theme deck, if there is one.
- One sentence on what the chunk must leave behind. C60 leaves a map, a fish, and three problem statements.

Tell Grok to build the app, not a slide deck and not a single HTML file. Postgres if more than one browser shares the board. A dev server on an uncommon port. A README that says how to run it. Tests for the role gates and for whatever value carries from one screen to the next.

## How to correct it

Correct one thing at a time, in the same chat, after you have clicked through the room.

Use these tests. They are the ones that changed C60.

- Can a student see the card they just added, on the board, without hunting?
- Does the person chosen early still appear on every later screen?
- Does any button repeat a choice someone already made?
- Do two roles share one button that is really two jobs?
- Can the class stop before the last step of a chain, when an earlier answer is the one they trust?
- Does a label on the final sentence name the card it came from?
- Does the teaching example use a different story from the theme?
- Does a film play on five laptops at once? It should not. The teacher plays it. Students read, and watch later.
- Does `docs/screens.md` still match the buttons? If a button was removed, delete it from the guide in the same change.

When the screens are right, ask for the films and the field guide. Do not ask for them on the first turn.

## What not to copy from C60

Do not copy the cocoa farmers, the 6 cents, the full-bus example, or the five-blank sentence unless that chunk really uses them. Do not copy stages that the new script does not have. Do not add a vote, a chat box, or a fish because C60 has one.

Do copy the shell: one room, five roles, teacher Next, Your move, a shared board, films with collapsed read-throughs, a filled example, and a screen guide written after the rules settle.

## Prompt to paste

Fill the brackets. Delete a line if that chunk does not have that piece.

```
Build a Live App for classroom [CHUNK] only. One team: five students and one teacher. Deployable web app, shared room in Postgres, teacher radar, student board plus Your move.

Use the attached file "How to build the next chunk" as the build rules. Use the C60 screen guide only as the shape of the finished field document. Use the attached [CHUNK] scripts for the lesson. Where the old C60 brief disagrees with those rules, follow the rules: the teacher presses Start and Next, a choice is made once, a carried blank is named for the card it came from, and a film plays on the teacher screen only.

Chunk: [CHUNK NAME]
Theme: [THEME]
What the team leaves with: [ARTIFACTS]
Stages, in order: [LIST THE SCREENS]
Roles: Leader, Lead Interviewer, Theme Mapper, Insight Extractor, Devil's Advocate, unless the script renames a job.
Sentence, if this chunk has one: [SENTENCE AND WHERE EACH BLANK COMES FROM]

First slice: the teacher can open a room, assign roles, see the radar, and the first three screens work on one shared board, including empty, waiting, and error states. Then stop and let me click through before you add the rest.

After the screens are right, add a filled example, placeholder films at the teacher’s Next gates with collapsed student read-throughs, and docs/screens.md that lists every field on every screen.

Do not invent a public URL. Do not add auth beyond what the room code needs. Do not build the other chunks.
```
