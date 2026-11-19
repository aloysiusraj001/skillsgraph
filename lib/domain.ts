export type StageId =
  | "s0"
  | "s1"
  | "s1b"
  | "s2"
  | "s3"
  | "s4a"
  | "s4b"
  | "s4c"
  | "s4d"
  | "s5"
  | "s6"
  | "s7";

export type RoleId = "leader" | "interviewer" | "mapper" | "insight" | "devil";

export type BoneId =
  | "timing"
  | "communication"
  | "value"
  | "process"
  | "tools"
  | "environment";

export type Chip = "evidence" | "assumption" | "need-to-check";

export type FlagTag =
  | "too-broad"
  | "multi"
  | "has-solution"
  | "generic-who"
  | "missing-carry"
  | "solution-in-need";

export type Power = "high" | "low";

export type Quadrant = { power: Power; interest: Power };

export type Participant = {
  id: string;
  name: string;
  kind: "teacher" | "student";
  role: RoleId | null;
  claimed: boolean;
  ready: boolean;
  lastActionAt: number;
  evidenceNa: string | null;
  insightNoneNeeded: boolean;
};

export type Stakeholder = {
  id: string;
  authorId: string;
  label: string;
  source: "heard" | "guess";
  planted: boolean;
  authorIds: string[];
  mergedLabels: string[];
  mergedInto: string | null;
  grid: Quadrant | null;
  talkTo: boolean;
  dailyPain: boolean;
  challenged: boolean;
  masked?: boolean;
};

export type Suggestion = { id: string; by: string; a: string; b: string };

export type MoveSuggestion = {
  id: string;
  by: string;
  cardId: string;
  grid: Quadrant;
};

export type Veto = {
  stage: StageId;
  kind: "merge" | "blame" | "pin";
  targetId: string;
  at: number;
  overrideVotes: string[];
  note: string;
} | null;

export type Incident = {
  id: string;
  authorId: string;
  text: string;
  votes: string[];
  blame: boolean;
};

export type Cause = {
  id: string;
  authorId: string;
  text: string;
  bone: BoneId | null;
  blame: boolean;
  vague: boolean;
  dailyPain: boolean;
  evidence: string | null;
};

export type Hop = {
  id: string;
  bone: BoneId;
  parentId: string;
  text: string;
  authorId: string;
  chip: Chip | null;
  askWhom: string;
  proposed: boolean;
  root?: boolean;
};

export type Pin = {
  id: string;
  bone: BoneId;
  causeId: string;
  hopId: string | null;
  by: string;
  votes: string[];
  placed: boolean;
  blocked: boolean;
  obstacle: string;
  insight: string;
  obstacleSet: boolean;
  insightSet: boolean;
};

export type Deepen = {
  context: string;
  emotion: string;
  impact: string;
  alternatives: string;
};

export type Statement = {
  id: string;
  authorId: string;
  pinId: string | null;
  who: string;
  need: string;
  obstacle: string;
  harm: string;
  insight: string;
  edited: { who: boolean; obstacle: boolean; harm: boolean; insight: boolean };
  carryStamp: string;
  deepen: Deepen;
  submitted: boolean;
  tags: FlagTag[];
  proposal: null | {
    who: string;
    need: string;
    obstacle: string;
    harm: string;
    insight: string;
    by: string;
  };
  recognizable: boolean | null;
  clusterId: string | null;
  masked?: boolean;
};

export type Dot = { by: string; targetId: string };

export type BoneLabel = { id: BoneId; label: string };

export type Timer = {
  running: boolean;
  endsAt: number | null;
  remainingMs: number;
  nudge: -1 | 0 | 1;
  expired: boolean;
};

export type LogEntry = {
  at: number;
  actorId: string;
  action: string;
  detail: string;
  audit?: boolean;
};

export type Summary = {
  open: boolean;
  whoseId: string | null;
  confirmed: boolean;
  harm: string;
};

export type InterviewTurn = { speaker: "team" | "persona"; text: string };

export type InterviewMessage = {
  id: string;
  by: string;
  role: "student" | "persona";
  text: string;
  at: number;
};

export type Interview = {
  whoseId: string;
  source: "model" | "map";
  turns: InterviewTurn[];
  messages: InterviewMessage[];
};

export type WorkshopPhase = "lobby" | "roles-intro" | "roles-deal" | "live";

export type RoomState = {
  code: string;
  teamName: string;
  theme: string;
  stage: StageId;
  stageEnteredAt: number;
  holdStage: boolean;
  allowFour: boolean;
  createdAt: number;
  timer: Timer;
  s1Revealed: boolean;
  participants: Participant[];
  stakeholders: Stakeholder[];
  suggestions: Suggestion[];
  moves: MoveSuggestion[];
  blockedPairs: string[];
  veto: Veto;
  vetoSpent: Partial<Record<StageId, boolean>>;
  reviewed: Partial<Record<StageId, boolean>>;
  missingFlags: { payer: boolean; sponsor: boolean; blocker: boolean };
  summary: Summary;
  interview?: Interview | null;
  voteOpen: boolean;
  cardVotes: Dot[];
  incidents: Incident[];
  lockedIncidentId: string | null;
  causes: Cause[];
  hops: Hop[];
  bones: BoneLabel[];
  bonesReady: boolean;
  boneVotes: Dot[];
  challengedBones: BoneId[];
  selectedBones: BoneId[];
  focusBone: BoneId | null;
  pins: Pin[];
  fishboneLocked: boolean;
  statements: Statement[];
  statementVotes: Dot[];
  packVoteOpen: boolean;
  packLocked: boolean;
  fixRoundDone: boolean;
  clustersDone: boolean;
  mapLocked: boolean;
  top3: string[];
  filmsPlayed: string[];
  log: LogEntry[];
  workshopPhase?: WorkshopPhase;
  checkedInIds?: string[];
  rolesSpun?: boolean;
};

export type Action =
  | { type: "claim" }
  | { type: "ready" }
  | { type: "start" }
  | { type: "timer"; op: "start" | "pause" | "nudge" | "end"; delta?: -1 | 1 }
  | { type: "next-step" }
  | { type: "previous-step" }
  | { type: "reset-board" }
  | { type: "reveal" }
  | { type: "add-stakeholder"; label: string }
  | { type: "edit-stakeholder"; id: string; label: string }
  | { type: "delete-stakeholder"; id: string }
  | { type: "suggest-merge"; a: string; b: string }
  | { type: "dismiss-suggestion"; id: string }
  | { type: "merge"; a: string; b: string }
  | { type: "unmerge"; id: string }
  | { type: "rename"; id: string; label: string }
  | { type: "merges-done" }
  | { type: "veto-merge"; id: string }
  | { type: "override-veto" }
  | { type: "place"; id: string; power: Power; interest: Power }
  | { type: "suggest-move"; id: string; power: Power; interest: Power }
  | { type: "resolve-move"; id: string; accept: boolean }
  | { type: "source"; id: string; source: "heard" | "guess" }
  | { type: "talk-to"; id: string }
  | { type: "daily-pain"; id: string; kind: "stakeholder" | "cause" }
  | { type: "flag-missing"; flag: "payer" | "sponsor" | "blocker" }
  | { type: "challenge-guess"; id: string }
  | { type: "open-vote" }
  | { type: "vote-card"; id: string }
  | { type: "unvote-card"; id: string }
  | { type: "whose"; id: string }
  | { type: "harm"; text: string }
  | { type: "lock-map" }
  | { type: "add-incident"; text: string }
  | { type: "vote-incident"; id: string }
  | { type: "veto-blame"; id: string }
  | { type: "rewrite-incident"; id: string; text: string }
  | { type: "lock-incident" }
  | { type: "rename-bone"; id: BoneId; label: string }
  | { type: "add-cause"; text: string; bone?: BoneId }
  | { type: "edit-cause"; id: string; text: string }
  | { type: "snap"; id: string; bone: BoneId | null }
  | { type: "evidence"; id: string; quote: string }
  | { type: "evidence-na"; reason: string }
  | { type: "stamp"; id: string; stamp: "blame" | "vague" }
  | { type: "bones-ready" }
  | { type: "vote-bone"; id: BoneId }
  | { type: "unvote-bone"; id: BoneId }
  | { type: "challenge-bone"; id: BoneId }
  | { type: "confirm-bones" }
  | { type: "follow-bone"; id: BoneId }
  | { type: "add-hop"; bone: BoneId; parentId: string; text: string; chip: Chip }
  | { type: "propose-hop"; bone: BoneId; parentId: string; text: string }
  | { type: "accept-hop"; id: string; chip: Chip }
  | { type: "edit-hop"; id: string; text: string }
  | { type: "ask-whom"; id: string; whom: string }
  | { type: "mark-root"; id: string }
  | { type: "continue-pins" }
  | { type: "nominate-pin"; causeId: string; hopId?: string | null }
  | { type: "vote-pin"; id: string }
  | { type: "place-pin"; id: string }
  | { type: "set-candidates"; id: string; obstacle: string; insight: string }
  | { type: "block-pin"; id: string }
  | { type: "lock-fishbone" }
  | {
      type: "save-statement";
      pinId: string | null;
      who: string;
      need: string;
      obstacle: string;
      harm: string;
      insight: string;
      deepen: Deepen;
      useNewVersion: boolean;
      submit?: boolean;
    }
  | { type: "submit-statement" }
  | { type: "tag"; id: string; tag: FlagTag }
  | { type: "untag"; id: string; tag: FlagTag }
  | {
      type: "propose-fix";
      id: string;
      who: string;
      need: string;
      obstacle: string;
      harm: string;
      insight: string;
    }
  | { type: "accept-fix"; id: string }
  | { type: "cluster"; a: string; b: string }
  | { type: "uncluster"; id: string }
  | { type: "recognizable"; id: string; value: boolean }
  | { type: "clusters-done" }
  | { type: "open-pack-vote" }
  | { type: "vote-statement"; id: string }
  | { type: "unvote-statement"; id: string }
  | { type: "lock-pack" }
  | { type: "review-clear" }
  | { type: "none-needed" }
  | { type: "rename-team"; name: string }
  | { type: "assign-role"; seatId: string; role: RoleId | null }
  | { type: "set-room"; teamName: string; theme: string }
  | { type: "allow-four"; value: boolean }
  | { type: "release-seat"; seatId: string }
  | { type: "clear-veto" }
  | { type: "extend-timer" }
  | { type: "play-film"; id: string }
  | { type: "workshop-phase"; phase: WorkshopPhase }
  | { type: "spin-roles"; assignments: { seatId: string; role: RoleId }[] }
  | { type: "check-in"; seatId: string };

export const ROLES: Record<
  RoleId,
  { id: RoleId; name: string; job: string; color: string; ink: string }
> = {
  leader: {
    id: "leader",
    name: "Leader",
    job: "Keep time. Lock a stage only when the meter is green.",
    color: "#2F62E0",
    ink: "#ffffff",
  },
  interviewer: {
    id: "interviewer",
    name: "Lead Interviewer",
    job: "Keep us tied to real people and real incidents. Attach evidence.",
    color: "#0E948C",
    ink: "#ffffff",
  },
  mapper: {
    id: "mapper",
    name: "Theme Mapper",
    job: "Merge duplicates. Place cards on maps and bones. Keep the board tidy.",
    color: "#E0941A",
    ink: "#1c1404",
  },
  insight: {
    id: "insight",
    name: "Insight Extractor",
    job: "Deepen Why branches. Help turn causes into needs and insights.",
    color: "#7A45D6",
    ink: "#ffffff",
  },
  devil: {
    id: "devil",
    name: "Devil's Advocate",
    job: "Challenge blame, vagueness, bad merges, and smuggled solutions.",
    color: "#E25B4A",
    ink: "#ffffff",
  },
};

export const ROLE_ORDER: RoleId[] = [
  "leader",
  "interviewer",
  "mapper",
  "insight",
  "devil",
];

export const STAGE_MS: Record<StageId, number> = {
  s0: 30_000,
  s1: 4 * 60_000,
  s1b: 3 * 60_000,
  s2: 8.5 * 60_000,
  s3: 3 * 60_000,
  s4a: 6 * 60_000,
  s4b: 2 * 60_000,
  s4c: 6 * 60_000,
  s4d: 3 * 60_000,
  s5: 7 * 60_000,
  s6: 8 * 60_000,
  s7: 0,
};

export function previousStage(stage: StageId): StageId | null {
  const found = (Object.entries(NEXT_STAGE) as [StageId, StageId | null][]).find(([, next]) => next === stage);
  return found ? found[0] : null;
}

export const NEXT_STAGE: Record<StageId, StageId | null> = {
  s0: "s1",
  s1: "s1b",
  s1b: "s2",
  s2: "s3",
  s3: "s4a",
  s4a: "s4b",
  s4b: "s4c",
  s4c: "s4d",
  s4d: "s5",
  s5: "s6",
  s6: "s7",
  s7: null,
};

export const STAGE_SHORT: { id: StageId; pill: string; track: string }[] = [
  { id: "s0", pill: "S0", track: "Room" },
  { id: "s1", pill: "S1", track: "People" },
  { id: "s1b", pill: "S1b", track: "Merge" },
  { id: "s2", pill: "S2", track: "Power" },
  { id: "s3", pill: "S3", track: "Incident" },
  { id: "s4a", pill: "S4", track: "Fish" },
  { id: "s4b", pill: "S4", track: "Fish" },
  { id: "s4c", pill: "S4", track: "Fish" },
  { id: "s4d", pill: "S4", track: "Fish" },
  { id: "s5", pill: "S5", track: "Statement" },
  { id: "s6", pill: "S6", track: "Choose" },
  { id: "s7", pill: "S7", track: "Pack" },
];

export const DEFAULT_BONES: BoneLabel[] = [
  { id: "timing", label: "Timing" },
  { id: "communication", label: "Communication" },
  { id: "value", label: "Perceived value" },
  { id: "process", label: "Process" },
  { id: "tools", label: "Tools" },
  { id: "environment", label: "Environment" },
];

export const PILOT = {
  teamName: "Team Kestrel",
  theme: "The chocolate challenge",
  teacherName: "Teacher",
  students: [
    { name: "Alex", role: "leader" as const },
    { name: "Leo", role: "interviewer" as const },
    { name: "Maya", role: "mapper" as const },
    { name: "Asha", role: "insight" as const },
    { name: "Kai", role: "devil" as const },
  ],
};

export const SKILLGRAPH_DEMO = {
  teamName: "8A · Group 1",
  theme: "The chocolate challenge",
  workshopTitle: "What's the Problem",
  courseName: "How to build and sell a product",
  className: "8A",
  scheduleLabel: "Thu Sep 24 · 1:00 PM",
  teacherName: "Teacher",
  students: [
    { name: "Amara Osei", role: "leader" as const },
    { name: "Ben Halvorsen", role: "interviewer" as const },
    { name: "Chloe Yeung", role: "mapper" as const },
    { name: "Diego Ramos", role: "insight" as const },
    { name: "Elif Demir", role: "devil" as const },
  ],
};

export const PLANTED_LABEL = "Cocoa farmers prefer selling to buying agents";

const NEED_SOLUTION =
  /\b(apps?|platforms?|websites?|systems?|dashboards?|features?|builds?|create)\b/i;
const STAKEHOLDER_SOLUTION = /\b(apps?|platforms?|websites?|dashboards?|features?)\b/i;
const TOOLISH = /\b(tools?|systems?)\b/i;
const BLAME = /\b(lazy|don'?t care|stupid|bad attitude)\b/i;
const GENERIC_WHO = /^(the |our )?(users?|people|everyone|someone|customers?)$/i;

export function clip(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function stakeholderWarning(label: string) {
  if (STAKEHOLDER_SOLUTION.test(label) || TOOLISH.test(label)) {
    return "Apps and tools aren't stakeholders. Who is affected?";
  }
  if (BLAME.test(label)) {
    return "That sounds like blame. Name a person or group instead.";
  }
  return null;
}

export function causeWarning(text: string) {
  if (STAKEHOLDER_SOLUTION.test(text)) {
    return "That's a solution. Write a cause of the incident instead.";
  }
  return null;
}

export function blameWarning(text: string) {
  if (BLAME.test(text)) {
    return "Rewrite without blaming people. Describe what you saw or heard.";
  }
  return null;
}

export function isGenericWho(text: string) {
  return GENERIC_WHO.test(text.trim().toLowerCase().replace(/[.!?]/g, ""));
}

export function needWarning(need: string) {
  if (NEED_SOLUTION.test(need)) {
    return "Need should be a human need, not a solution. Move product ideas out.";
  }
  return null;
}

export function solutionAnywhere(text: string) {
  return NEED_SOLUTION.test(text);
}

export function statementIssues(input: {
  who: string;
  need: string;
  obstacle: string;
  harm: string;
  insight: string;
}) {
  const issues: string[] = [];
  if (
    !input.who.trim() ||
    !input.need.trim() ||
    !input.obstacle.trim() ||
    !input.harm.trim() ||
    !input.insight.trim()
  ) {
    issues.push("Every blank needs text before Submit.");
  }
  if (input.who.trim() && isGenericWho(input.who)) {
    issues.push("Name the priority person from your map — not a generic word.");
  }
  const need = needWarning(input.need);
  if (input.need.trim() && need) issues.push(need);
  return issues;
}

export function sentence(input: {
  who: string;
  need: string;
  obstacle: string;
  harm: string;
  insight: string;
}) {
  const who = input.who.trim() || "[who]";
  const need = input.need.trim() || "[need]";
  const obstacle = input.obstacle.trim() || "[obstacle]";
  const harm = input.harm.trim() || "[harm]";
  const insight = input.insight.trim() || "[insight]";
  return `${who} needs ${need}, but ${obstacle}, so ${harm}, because ${insight}.`;
}

export function shortPreview(input: { who: string; need: string }) {
  if (!input.who.trim() || !input.need.trim()) return "";
  return `${input.who.trim()} needs ${input.need.trim()}`;
}

export function quadrantName(grid: Quadrant) {
  if (grid.power === "high" && grid.interest === "high") return "Work closely";
  if (grid.power === "low" && grid.interest === "high") return "Keep involved";
  if (grid.power === "high" && grid.interest === "low") return "Keep satisfied";
  return "Monitor";
}

export function formatMs(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function emptyDeepen(): Deepen {
  return { context: "", emotion: "", impact: "", alternatives: "" };
}

let seq = 0;
export function uid(prefix: string) {
  seq += 1;
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${seq.toString(36)}-${rand}`;
}

export function freshTimer(stage: StageId): Timer {
  return {
    running: false,
    endsAt: null,
    remainingMs: STAGE_MS[stage],
    nudge: 0,
    expired: false,
  };
}

export function makeState(input: {
  code: string;
  teamName: string;
  theme: string;
  now: number;
  teacher: { id: string; name: string };
  students: { id: string; name: string; role: RoleId | null; claimed?: boolean }[];
  workshopPhase?: WorkshopPhase;
}): RoomState {
  const participants: Participant[] = [
    {
      id: input.teacher.id,
      name: input.teacher.name,
      kind: "teacher",
      role: null,
      claimed: true,
      ready: true,
      lastActionAt: input.now,
      evidenceNa: null,
      insightNoneNeeded: false,
    },
    ...input.students.map((student) => ({
      id: student.id,
      name: student.name,
      kind: "student" as const,
      role: student.role,
      claimed: Boolean(student.claimed),
      ready: false,
      lastActionAt: input.now,
      evidenceNa: null,
      insightNoneNeeded: false,
    })),
  ];
  const phase = input.workshopPhase ?? "live";
  return {
    code: input.code,
    teamName: input.teamName,
    theme: input.theme,
    stage: "s0",
    stageEnteredAt: input.now,
    holdStage: false,
    allowFour: false,
    createdAt: input.now,
    timer: freshTimer("s0"),
    s1Revealed: false,
    participants,
    stakeholders: [],
    suggestions: [],
    moves: [],
    blockedPairs: [],
    veto: null,
    vetoSpent: {},
    reviewed: {},
    missingFlags: { payer: false, sponsor: false, blocker: false },
    summary: { open: false, whoseId: null, confirmed: false, harm: "" },
    interview: null,
    voteOpen: false,
    cardVotes: [],
    incidents: [],
    lockedIncidentId: null,
    causes: [],
    hops: [],
    bones: DEFAULT_BONES.map((bone) => ({ ...bone })),
    bonesReady: false,
    boneVotes: [],
    challengedBones: [],
    selectedBones: [],
    focusBone: null,
    pins: [],
    fishboneLocked: false,
    statements: [],
    statementVotes: [],
    packVoteOpen: false,
    packLocked: false,
    fixRoundDone: false,
    clustersDone: false,
    mapLocked: false,
    top3: [],
    filmsPlayed: [],
    log: [],
    workshopPhase: phase,
    checkedInIds: [],
    rolesSpun: phase === "live",
  };
}
