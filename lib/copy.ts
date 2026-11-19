import type { BoneId, RoleId, StageId } from "@/lib/domain";

export const BONE_HINTS: Record<BoneId, string> = {
  timing: "When it happens, or how long it takes.",
  communication: "What people are told, or not told.",
  value: "Whether it feels worth the effort.",
  process: "The steps people have to follow.",
  tools: "The things people have to use.",
  environment: "The place, or what is around them.",
};

export type ScreenCopy = {
  title: string;
  instruction: string;
  steps: string[];
  move: Record<RoleId, string>;
};

export const STEP_PURPOSE: Partial<Record<StageId, string>> = {
  s3: "Write one fact that happened. It shows on the board and becomes the fish head as soon as you add it. Voting moves a different fact into the head. Not a cause, and not a solution.",
  s4a: "This is the fishbone. The head is the incident. Each bone is one kind of cause. On the right, pick a bone, write why the incident happened, and add it. The card appears on that bone. Do not choose one root yet, and do not write a solution.",
  s4b: "The six bones are labeled with the causes you wrote. Read them, then tap the one bone the team will follow. The five Whys happen next, and only on that bone.",
  s4c: "On the bone you picked, ask Why, then Why again. Stop when one answer is the root cause. That is often the third or the fourth Why, not always the fifth. Tap that card and mark it as the root cause.",
  s4d: "Choose 1 to 3 causes to carry into the problem statement. Obstacle is the cause on the rib you pin. Insight is the Why marked as the root cause. On the next screen, Harm is the incident in the fish head.",
};

export const SCREENS: Record<StageId, ScreenCopy> = {
  s0: {
    title: "Welcome to C60 · What's the problem",
    instruction:
      "Your theme is already set. Your roles are already assigned. Together you will build three things: who is affected, why it happens on a fishbone, and three clear five-blank problem statements. Follow the screen. Your teacher starts the activity and moves the class to each next step. Your teacher also answers questions and may coach briefly if a cue lights amber or red.",
    steps: [
      "Check your role badge — you keep this job for the whole activity",
      "Read the theme card so everyone shares the same focus",
      "Wait for your teacher to start",
    ],
    move: {
      leader: "Your teacher starts the activity. Remind the team to read the theme.",
      interviewer: "Confirm your badge. You'll keep us tied to real people.",
      mapper: "Confirm your badge. You'll merge and place cards later.",
      insight: "Confirm your badge. You'll deepen Why branches later.",
      devil: "Confirm your badge. You'll challenge blame and smuggled solutions.",
    },
  },
  s1: {
    title: "Who is touched by this?",
    instruction:
      "Add people or groups touched by this theme. Name a role or a specific person type — not a product and not a solution. Work silently. Others cannot see your cards until the teacher ends the time. Aim for at least 3 cards each. Fewer cards does not stop the next step.",
    steps: [
      "Tap Add stakeholder",
      "Type a short label (e.g. cocoa farmer, buying agent, chocolate maker)",
      "Aim for at least 3 cards of your own",
      "Stay silent until the teacher ends the time",
    ],
    move: {
      leader: "Your teacher runs the timer. Remind the team: people, not products.",
      interviewer: "Include at least one end user who feels the problem.",
      mapper: "Just add cards for now — you will merge next.",
      insight: "Include someone who feels it daily but has little power.",
      devil: "Include a blocker, skeptic, or gatekeeper.",
    },
  },
  s1b: {
    title: "Clean the pile — merge, don't retype",
    instruction:
      "Don't retype. Stack cards that mean the same person or group. Only the Theme Mapper can merge. Everyone else can tap Suggest same. Devil's Advocate may veto a bad merge once this stage. Keep author names under each stack.",
    steps: [
      "Scan the pile for near-duplicates",
      "Non-Mappers: tap Suggest same on a card and pick its twin",
      "Mapper: drag one card onto another to merge, or accept a suggestion",
      "Mapper: rename the merged label if needed",
      "When the pile looks clean, Mapper taps Merges done",
    ],
    move: {
      leader: "Keep the 3:00 timer honest. Don't merge for the Mapper.",
      interviewer: "Suggest merges that keep real interview targets distinct (user ≠ payer).",
      mapper: "Drag one card onto its twin to merge. Rename the stack if the label should change. Tap Merges done when ready.",
      insight: "Suggest merges that preserve quiet daily pain people.",
      devil: "Veto one bad merge if user and payer (or similar) get collapsed wrongly.",
    },
  },
  s2: {
    title: "Who has power? Who cares? Whose problem do we follow?",
    instruction:
      "Theme Mapper places each card on the power map. The Lead Interviewer picks the one person we follow and writes what goes wrong. There is no class vote on this screen.",
    steps: [
      "Mapper places every card on the 2×2",
      "Lead Interviewer taps the one person we follow",
      "Lead Interviewer writes what goes wrong for that person",
      "Teacher moves to the incident",
    ],
    move: {
      leader: "Watch the map. The Lead Interviewer picks who we follow. There is no vote.",
      interviewer: "Mark Talk-to. Confirm Whose problem. Set Heard from chips. Write What goes wrong for the person you follow.",
      mapper: "Place all cards. Accept or reject move suggestions.",
      insight: "Star Daily pain on people who feel this every day.",
      devil: "Flag missing payer, sponsor, or blocker. Challenge Our guess claims that look like planted guesses.",
    },
  },
  s3: {
    title: "Pin one real incident",
    instruction:
      "Pick one observable incident related to a priority group. Write what happened as a fact — not a blame story. Example shape: At last week's buying station, a family's bag weighed less on the buyer's scale than on a checked scale. Not: Buyers are dishonest.",
    steps: [
      "Lead Interviewer proposes one incident card",
      "Others may add alternate incident cards",
      "Devil's Advocate can veto blame wording once",
      "Team votes for one incident",
      "Leader locks the winner — it becomes the fish head",
    ],
    move: {
      leader: "Run the quick vote. Lock incident when one winner is clear.",
      interviewer: "Propose the first factual incident tied to a priority group.",
      mapper: "Keep alternate cards tidy on the board.",
      insight: "Prefer incidents that show daily pain, not one-off drama.",
      devil: "Veto blame or character attacks in the wording.",
    },
  },
  s4a: {
    title: "Map possible causes on the fish",
    instruction:
      "Pick one bone, write a cause of the incident, and add it. The card appears on that bone of the fish. The Theme Mapper can move a card if it belongs on a different bone.",
    steps: [
      "Pick the bone the cause belongs to",
      "Write the cause and add it onto that bone",
      "Theme Mapper moves a card only if the bone is wrong",
      "Devil stamps blame or vague cards",
      "Interviewer can attach a quote to a cause",
    ],
    move: {
      leader: "Pick a bone and add a cause onto the fish. Do not pick one root yet.",
      interviewer: "Pick a bone and add a cause onto the fish. Add a quote when you have one.",
      mapper: "Pick a bone and add a cause. Move a card if it belongs on a different bone.",
      insight: "Pick a bone and add a cause onto the fish. Mark one that shows a daily pain.",
      devil: "Pick a bone and add a cause onto the fish. Stamp a card that blames people or says nothing useful.",
    },
  },
  s4b: {
    title: "Pick the one bone to follow",
    instruction:
      "Each bone is already labeled with a kind of cause and the cards on it. Read those labels, then tap the one bone the team will follow. The five Whys come after this, on that bone only.",
    steps: [
      "Read the cause on each of the six bones",
      "Tap the one bone the team will follow",
      "The teacher moves to the five Whys",
    ],
    move: {
      leader: "Help the team pick one bone, then wait for the teacher to open the five Whys.",
      interviewer: "Read the causes and tap the bone that matches what you heard.",
      mapper: "Read the causes and tap the one bone the team will follow.",
      insight: "Read the causes and tap the bone you can ask Why about.",
      devil: "Read the causes and tap the bone that is not just a guess.",
    },
  },
  s4c: {
    title: "Dig deeper — ask Why on glowing bones",
    instruction:
      "On glowing bones only, grow Why branches outward. Each hop is one Why. You are not forced to stop at five or reach five. Tag every hop: Evidence, Assumption, or Need-to-check. Multiple contributing causes are OK. An unsupported early link weakens everything after it.",
    steps: [
      "Insight Extractor adds Why hops on glowing bones",
      "Others may propose hop text; Insight accepts or edits",
      "Devil enforces an evidence chip on every new hop",
      "Interviewer adds Ask whom? on Need-to-check hops",
      "Deepen at least 2 bones with one tagged hop each",
    ],
    move: {
      leader: "Keep pace on the 6:00 timer. Protect depth over speed.",
      interviewer: "On Need-to-check hops, add Ask whom?",
      mapper: "Keep Why arrows tidy so depth is readable.",
      insight: "Add one Why. It grows out from the selected card, and the box clears for the next level.",
      devil: "Block hops with no chip. Stamp blame if it creeps back.",
    },
  },
  s4d: {
    title: "Pin 1–3 causes to carry forward",
    instruction:
      "Pin 1 to 3 causes. Obstacle is the cause written on that rib. Insight is the Why marked as the root cause on that branch. If no Why is marked, mark one before you save the labels. Harm in the statement is the incident in the fish head, not these two labels.",
    steps: [
      "Review glowing branches and their chips",
      "Vote or agree on 1–3 pins",
      "Insight nominates Obstacle candidate and Insight candidate on each pin",
      "Devil may block a pin or Insight candidate that has no evidence",
      "Mapper keeps pin markers readable if there are several",
      "Leader locks the fishbone when pins are set and the meter is green",
    ],
    move: {
      leader: "Lock fishbone only when 1–3 pins sit on supported causes with candidates labelled.",
      interviewer: "Prefer pins tied to quotes, Heard-from people, or observed incidents.",
      mapper: "After the labels are saved, place the pin on the fish.",
      insight: "Choose a cause. Obstacle starts as that cause. Insight starts as the Why you marked as the root. Maya places the pin.",
      devil: "Block pins or Insight candidates that rest only on assumptions.",
    },
  },
  s5: {
    title: "Write one five-blank problem statement each",
    instruction:
      "Each person writes one statement. The sentence on screen is: [who] needs [need], but [obstacle], so [harm], because [insight]. Who is the person from the map. Need starts from the interview answer to what they are trying to get done — edit it into a human need, not a product. Obstacle is the cause you pinned. Harm is the incident in the fish head. Insight is the Why marked as the root cause. Edit a blank if it is wrong; edited blanks are not overwritten. Silent writing until everyone has submitted.",
    steps: [
      "Check Who, Obstacle, Harm, and Insight",
      "Edit Need so it is a human need, not a product",
      "Read the full sentence aloud in your head",
      "Optional: open Deepen strip (Context, Emotion, Impact, Alternatives) — not required to submit",
      "Submit your one statement",
      "Wait for all five before the red-flag round",
    ],
    move: {
      leader: "Enforce silence. Start the 7:00 timer. No editing others' drafts. The step opens the red-flag round when 5 are submitted and Done gates are green.",
      interviewer: "Check Who and Harm are recognizable. Prefer a Heard-from Who.",
      mapper: "If multiple pins, help your teammates pick which pin feeds Obstacle and Insight — then write your own statement.",
      insight: "Suggest Obstacle and Insight polish from pins. Never overwrite someone else's Need.",
      devil: "Gate generic Who (users or people) and solution words in any blank — model the rule on your own draft.",
    },
  },
  s6: {
    title: "Clean five-blank statements — pick the top 3",
    instruction:
      "Devil's Advocate tags problems: too broad, multi-problem, has solution, generic Who, missing Harm or Obstacle carry, or solution in Need. Insight Extractor proposes five-blank-safe fixes. Authors accept fixes on their own cards. Theme Mapper clusters near-duplicates (stack, don't retype). Soft recommend: at least one top 3 has Context or Emotion filled. Then everyone votes. Keep the top 3 full sentences. Leader locks the C60 Pack.",
    steps: [
      "Devil applies official red-flag tags",
      "Insight proposes edited five-blank wording",
      "Authors accept or revise their own cards",
      "Mapper clusters near-duplicates into stacks",
      "Interviewer marks recognizable",
      "Everyone casts 2 votes",
      "Leader locks when the top 3 are set and the meter is green",
    ],
    move: {
      leader: "Open vote after one fix round. Lock C60 Pack on green.",
      interviewer: "Ask: would our priority person recognize this Who and Harm? Context or Emotion on one top statement helps, and is not a hard lock.",
      mapper: "Cluster near-duplicates — stack, don't retype.",
      insight: "Propose five-blank-safe fixes for tagged cards. Don't overwrite Need unless the author accepts.",
      devil: "Apply too broad, multi-problem, has solution, generic Who, missing carry, or solution in Need tags.",
    },
  },
  s7: {
    title: "C60 complete — your pack is ready",
    instruction:
      "Nice work. Your C60 Pack is ready for the next chunk. Review the three artifacts, download or share the pack, and notice the role jobs you finished. Suggested next steps are interviews (C18) or statement polish (C28).",
    steps: [
      "Preview Artifact A — stakeholder map and priority groups",
      "Preview Artifact B — fishbone, Why depths, and pins",
      "Preview Artifact C — top 3 five-blank problem statements",
      "Download or copy the pack",
      "Optional: open the contribution log with your teacher",
    ],
    move: {
      leader: "Share the pack text with the teacher or the next activity.",
      interviewer: "Note which priority people you would interview first in C18.",
      mapper: "Confirm the exported map and fishbone look complete.",
      insight: "Skim full sentences — keep Obstacle and Insight sharp for C28.",
      devil: "Spot-check that no solution language survived in the top 3.",
    },
  },
};

export const FAQ = [
  {
    q: "What if someone is absent?",
    a: "The teacher can allow a start with 4. The empty role's powers sit with the Leader and Theme Mapper for this run.",
  },
  {
    q: "What if we disagree on a merge?",
    a: "Only the Theme Mapper merges. Everyone else taps Suggest same. Devil's Advocate can veto one bad merge. Four of five can override.",
  },
  {
    q: "Can we name an app or a product?",
    a: "Not in this activity. Name people, causes, and a human need. Products come in a later chunk.",
  },
  {
    q: "Whose problem do we follow?",
    a: "One of your 2 or 3 priority groups. That person is Who. What goes wrong on the map is the early guess. The incident in the fish head becomes Harm in the statement.",
  },
  {
    q: "What is Heard from versus Our guess?",
    a: "Heard from means someone actually said or showed it. Our guess means the team invented it. The Lead Interviewer owns Heard from. Thin guesses should be challenged.",
  },
];

export const METER_HINT = {
  red: "Someone still owes a required action — check Your move.",
  amber: "Almost — finish votes or confirmations.",
  green: "Leader can lock.",
} as const;

export const FLAG_LABELS = {
  "too-broad": "Too broad",
  multi: "Multi-problem",
  "has-solution": "Has solution",
  "generic-who": "Generic Who",
  "missing-carry": "Missing carry",
  "solution-in-need": "Solution in Need",
} as const;
