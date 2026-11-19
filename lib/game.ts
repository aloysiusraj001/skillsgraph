import { isFilmId } from "@/lib/films";
import {
  type Action,
  type BoneId,
  type Chip,
  type Dot,
  type Hop,
  type Participant,
  type Pin,
  type Quadrant,
  type RoleId,
  type RoomState,
  type StageId,
  type Stakeholder,
  type Statement,
  NEXT_STAGE,
  PLANTED_LABEL,
  ROLE_ORDER,
  makeState,
  previousStage,
  ROLES,
  STAGE_MS,
  blameWarning,
  causeWarning,
  clip,
  emptyDeepen,
  freshTimer,
  quadrantName,
  sentence,
  shortPreview,
  stakeholderWarning,
  statementIssues,
  uid,
} from "@/lib/domain";

export type Meter = {
  color: "red" | "amber" | "green";
  reason: string;
  blocker: string | null;
  ready: boolean;
  items: { label: string; done: boolean }[];
};

export type RadarCue = {
  color: "green" | "amber" | "red";
  reason: string;
  blocker: string | null;
  coach: string;
  say: string;
  checklist: {
    id: string;
    name: string;
    role: string | null;
    dots: { label: string; done: boolean }[];
  }[];
};

export type Result =
  | { ok: true; state: RoomState }
  | { ok: false; error: string; state: RoomState };

const MAJOR: StageId[] = ["s1b", "s2", "s3", "s4a", "s4b", "s4c", "s4d", "s6"];

export function students(state: RoomState) {
  return state.participants.filter((p) => p.kind === "student");
}

export function present(state: RoomState) {
  return students(state).filter((p) => p.claimed);
}

export function roots(state: RoomState) {
  return state.stakeholders.filter((card) => !card.mergedInto);
}

export function person(state: RoomState, id: string) {
  return state.participants.find((p) => p.id === id);
}

export function roleName(role: RoleId | null) {
  return role ? ROLES[role].name : "No role";
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

function actsAs(state: RoomState, actor: Participant, role: RoleId) {
  if (actor.kind === "teacher") return false;
  if (actor.role === role) return true;
  if (!state.allowFour || !actor.claimed) return false;
  const holder = present(state).find((p) => p.role === role);
  if (holder) return false;
  return actor.role === "leader" || actor.role === "mapper";
}

function needCount(state: RoomState) {
  return state.allowFour ? 4 : 5;
}

function cardsBy(state: RoomState, authorId: string) {
  return state.stakeholders.filter((card) => card.authorId === authorId && !card.planted);
}

function dotCount(dots: Dot[], by: string, targetId?: string) {
  return dots.filter((dot) => dot.by === by && (targetId ? dot.targetId === targetId : true)).length;
}

function addDot(dots: Dot[], by: string, targetId: string, max: number) {
  if (dotCount(dots, by) >= max) return "You already used your votes.";
  dots.push({ by, targetId });
  return null;
}

function removeDot(dots: Dot[], by: string, targetId: string) {
  const index = dots.findIndex((dot) => dot.by === by && dot.targetId === targetId);
  if (index < 0) return "You have no vote on that card.";
  dots.splice(index, 1);
  return null;
}

export function voteTally(dots: Dot[]) {
  const counts = new Map<string, number>();
  for (const dot of dots) counts.set(dot.targetId, (counts.get(dot.targetId) ?? 0) + 1);
  return counts;
}

export function priorityCards(state: RoomState) {
  const counts = voteTally(state.cardVotes);
  const picked = roots(state).filter((card) => (counts.get(card.id) ?? 0) > 0);
  if (picked.length < 2 || picked.length > 3) return null;
  const order = ["Work closely", "Keep involved", "Keep satisfied", "Monitor"];
  return picked.sort((a, b) => {
    const av = counts.get(b.id)! - counts.get(a.id)!;
    if (av !== 0) return av;
    const aq = a.grid ? order.indexOf(quadrantName(a.grid)) : 9;
    const bq = b.grid ? order.indexOf(quadrantName(b.grid)) : 9;
    return aq - bq;
  });
}

function everyoneVoted(state: RoomState, dots: Dot[], max: number) {
  return present(state).every((p) => dotCount(dots, p.id) === max);
}

function blocker(state: RoomState, id: string | undefined, missing: string) {
  if (!id) return missing;
  const p = person(state, id);
  if (!p) return missing;
  return `${p.name} — ${roleName(p.role)} — ${missing}`;
}

function markReview(state: RoomState) {
  state.reviewed[state.stage] = true;
}

function devilOk(state: RoomState) {
  if (!MAJOR.includes(state.stage)) return true;
  if (!present(state).some((p) => p.role === "devil") && state.allowFour) return true;
  return Boolean(state.reviewed[state.stage]);
}

function touch(actor: Participant, now: number) {
  actor.lastActionAt = now;
}

function note(state: RoomState, actor: Participant, action: string, detail: string, now: number, audit = false) {
  touch(actor, now);
  state.log.push({ at: now, actorId: actor.id, action, detail, audit });
  if (state.log.length > 400) state.log.splice(0, state.log.length - 400);
}

function advance(state: RoomState, stage: StageId, now: number) {
  state.stage = stage;
  state.stageEnteredAt = now;
  state.timer = freshTimer(stage);
  state.voteOpen = false;
  state.packVoteOpen = stage === "s6";
  state.veto = null;
  if (stage === "s1b") ensurePlant(state);
  if (stage === "s5") state.summary.open = true;
}

function ensurePlant(state: RoomState) {
  if (state.stakeholders.some((card) => card.planted)) return;
  state.stakeholders.push({
    id: uid("plant"),
    authorId: "",
    label: PLANTED_LABEL,
    source: "guess",
    planted: true,
    authorIds: [],
    mergedLabels: [],
    mergedInto: null,
    grid: null,
    talkTo: false,
    dailyPain: false,
    challenged: false,
  });
}

export function evolve(state: RoomState, now: number) {
  let changed = false;
  if (state.timer.running && state.timer.endsAt && now >= state.timer.endsAt) {
    state.timer.running = false;
    state.timer.endsAt = null;
    state.timer.remainingMs = 0;
    state.timer.expired = true;
    changed = true;
    if (state.stage === "s1") state.s1Revealed = true;
  }
  if (!state.holdStage && state.stage === "s1" && state.s1Revealed) {
    advance(state, "s1b", now);
    changed = true;
  }
  if (!state.holdStage && state.stage === "s5" && allStatementsIn(state)) {
    advance(state, "s6", now);
    changed = true;
  }
  return changed;
}

function allStatementsIn(state: RoomState) {
  const people = present(state);
  if (people.length < needCount(state)) return false;
  return people.every((p) => {
    const card = state.statements.find((item) => item.authorId === p.id);
    return Boolean(card?.submitted && statementIssues(card).length === 0);
  });
}

function requireStudent(actor: Participant) {
  if (actor.kind !== "student" || !actor.claimed) return "Join with your name before you move a piece.";
  if (!actor.role) return "Your role is blank. Ask your teacher to assign roles before Start.";
  return null;
}

export function carryFor(state: RoomState, pinId: string | null) {
  const whoCard = state.stakeholders.find((card) => card.id === state.summary.whoseId);
  const placed = state.pins.filter((pin) => pin.placed && !pin.blocked);
  const pin = placed.find((item) => item.id === pinId) ?? placed[0] ?? null;
  const suggested = pin ? suggestCandidates(state, pin) : { obstacle: "", insight: "" };
  const who = whoCard?.label ?? "";
  const harm = lockedIncident(state)?.text?.trim() || state.summary.harm || "";
  const obstacle = pin?.obstacle || suggested.obstacle;
  const insight = pin?.insight || suggested.insight;
  return {
    who,
    harm,
    obstacle,
    insight,
    pinId: pin?.id ?? null,
    stamp: [who, harm, obstacle, insight, pin?.id ?? ""].join("|"),
  };
}

function chainOf(state: RoomState, causeId: string) {
  const hops = state.hops.filter((hop) => !hop.proposed && ancestorCause(state, hop) === causeId);
  const depth = (hop: Hop) => {
    let d = 1;
    let parent = hop.parentId;
    for (let guard = 0; guard < 8 && parent && parent !== causeId; guard += 1) {
      const next = state.hops.find((item) => item.id === parent);
      if (!next) break;
      d += 1;
      parent = next.parentId;
    }
    return d;
  };
  return hops.map((hop) => ({ hop, depth: depth(hop) })).sort((a, b) => a.depth - b.depth);
}

function ancestorCause(state: RoomState, hop: Hop) {
  let parent = hop.parentId;
  if (state.causes.some((cause) => cause.id === parent)) return parent;
  for (let guard = 0; guard < 8; guard += 1) {
    const next = state.hops.find((item) => item.id === parent);
    if (!next) return parent;
    if (state.causes.some((cause) => cause.id === next.parentId)) return next.parentId;
    parent = next.parentId;
  }
  return parent;
}

export function suggestCandidates(state: RoomState, pin: Pin) {
  const chain = chainOf(state, pin.causeId);
  const cause = state.causes.find((item) => item.id === pin.causeId);
  const markedRoot = chain.find((item) => item.hop.root)?.hop.text ?? "";
  return { obstacle: cause?.text || "", insight: markedRoot };
}

function bonesWithCards(state: RoomState) {
  const used = new Set(state.causes.map((cause) => cause.bone).filter(Boolean));
  return used.size;
}

function selectedWithHops(state: RoomState) {
  return state.selectedBones.filter((bone) =>
    state.hops.some((hop) => hop.bone === bone && !hop.proposed && hop.chip),
  ).length;
}

export function topThree(state: RoomState) {
  const submitted = state.statements.filter((card) => card.submitted && !card.masked);
  if (submitted.length < 3) return null;
  const counts = voteTally(state.statementVotes);
  const ranked = [...submitted].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
  const third = counts.get(ranked[2].id) ?? 0;
  const fourth = ranked[3] ? (counts.get(ranked[3].id) ?? 0) : -1;
  if (fourth === third) return null;
  return ranked.slice(0, 3).map((card) => card.id);
}

function allFlagged(state: RoomState) {
  const submitted = state.statements.filter((card) => card.submitted);
  return submitted.length > 0 && submitted.every((card) => card.tags.length > 0);
}

export function meter(state: RoomState): Meter {
  const people = present(state);
  const readyCount = people.filter((p) => cardsBy(state, p.id).length >= 3).length;
  const items: { label: string; done: boolean }[] = [];
  const pack = (color: Meter["color"], reason: string, blocker: string | null, ready: boolean): Meter => ({
    color,
    reason,
    blocker,
    ready,
    items,
  });

  if (state.stage === "s0") {
    const needed = needCount(state);
    const filled = ROLE_LIST.filter((role) => people.some((p) => p.role === role));
    items.push({ label: `${people.length}/${needed} joined`, done: people.length >= needed });
    items.push({ label: "Roles assigned", done: filled.length >= needed });
    if (people.length >= needed && filled.length >= needed) {
      return pack("green", "All roles present. Leader can start.", null, true);
    }
    const missing = students(state).find((p) => !p.claimed || !p.role);
    const unassigned = students(state).some((p) => p.claimed && !p.role);
    if (unassigned || people.length < 4 || filled.length < Math.min(4, needed)) {
      return pack(
        "red",
        `Not everyone has joined yet (${people.length}/${needed}).`,
        missing ? blocker(state, missing.id, missing.role ? "not joined" : "ask teacher to assign") : "Roles unassigned",
        false,
      );
    }
    return pack(
      "amber",
      `Not everyone has joined yet (${people.length}/${needed}).`,
      missing ? blocker(state, missing.id, "not joined") : null,
      false,
    );
  }

  if (state.stage === "s1") {
    const guided = readyCount === people.length && people.length > 0;
    items.push({ label: `Aim for 3 cards each (${readyCount}/${people.length})`, done: guided });
    return pack(
      guided ? "green" : "amber",
      state.timer.running
        ? `Silent time is running. Aim for at least 3 people cards each (${readyCount}/${people.length} there). This does not block the next step.`
        : "Aim for at least 3 people cards each. Your teacher ends this step when the time is up.",
      null,
      true,
    );
  }

  if (state.stage === "s1b") {
    const openVeto = Boolean(state.veto && state.veto.kind !== "merge");
    items.push({ label: "No open veto", done: !openVeto });
    items.push({ label: "Suggestions cleared", done: state.suggestions.length === 0 });
    if (openVeto) return pack("red", "Open veto — resolve or override.", blocker(state, state.veto?.overrideVotes[0], "open veto"), false);
    if (state.suggestions.length) {
      return pack("amber", `Suggested merges waiting (${state.suggestions.length}).`, null, false);
    }
    return pack("green", "Pile is ready. Mapper can tap Merges done.", null, true);
  }

  if (state.stage === "s2") {
    const placed = roots(state).filter((card) => card.grid);
    const unplaced = roots(state).length - placed.length;
    const whose = state.summary.whoseId;
    const harmOk = state.summary.harm.trim().length > 2 && state.summary.confirmed;
    items.push({ label: "Cards placed", done: unplaced === 0 && roots(state).length > 0 });
    items.push({ label: "Whose problem + what goes wrong", done: Boolean(whose && harmOk) });
    items.push({ label: "Devil reviewed guesses", done: devilOk(state) });
    if (state.veto) return pack("red", "Open veto — resolve or override.", "Open veto", false);
    if (unplaced > 0) {
      const mapper = people.find((p) => p.role === "mapper");
      return pack("amber", `Mapper still placing cards (${unplaced} unplaced).`, blocker(state, mapper?.id, `${unplaced} cards unplaced`), false);
    }
    if (!whose) return pack("red", "Lead Interviewer picks whose problem we follow.", blocker(state, people.find((p) => p.role === "interviewer")?.id, "whose problem blank"), false);
    if (!harmOk) {
      const who = state.stakeholders.find((card) => card.id === whose)?.label ?? "them";
      return pack("red", `Write what goes wrong for ${who}.`, blocker(state, people.find((p) => p.role === "interviewer")?.id, "What goes wrong blank"), false);
    }
    if (!devilOk(state)) return pack("red", "Devil's Advocate still owes a review.", blocker(state, people.find((p) => p.role === "devil")?.id, "challenge or clear"), false);
    return pack("green", "Map can lock. Artifact A saves priorities, whose problem, and harm.", null, true);
  }

  if (state.stage === "s3") {
    const proposed = state.incidents.some((card) => person(state, card.authorId)?.role === "interviewer" || state.allowFour);
    const voted = everyoneVoted(state, incidentDots(state), 1);
    const winner = incidentWinner(state);
    items.push({ label: "Incident proposed", done: state.incidents.length > 0 && proposed });
    items.push({ label: "No blame veto", done: !state.veto && !state.incidents.some((card) => card.blame) });
    items.push({ label: "One clear winner", done: Boolean(winner && voted) });
    if (!state.incidents.length) return pack("red", "No incident proposed yet.", blocker(state, people.find((p) => p.role === "interviewer")?.id, "0 incident proposed"), false);
    if (state.veto || state.incidents.some((card) => card.blame)) return pack("red", "Blame veto open — rewrite the card.", "Blame wording", false);
    if (!voted) return pack("amber", "Vote not finished.", null, false);
    if (!winner) return pack("amber", "Vote not finished.", null, false);
    if (!devilOk(state)) return pack("red", "Devil's Advocate still owes a review.", blocker(state, people.find((p) => p.role === "devil")?.id, "review wording"), false);
    return pack("green", "Incident can lock and drop onto the fish head.", null, true);
  }

  if (state.stage === "s4a") {
    const covered = bonesWithCards(state);
    const eachCause = people.every((p) => state.causes.some((cause) => cause.authorId === p.id));
    const evidence = state.causes.some((cause) => cause.evidence) || people.some((p) => p.role === "interviewer" && p.evidenceNa);
    items.push({ label: "Each person added a cause", done: eachCause });
    items.push({ label: "At least 4 bones", done: covered >= 4 });
    items.push({ label: "Evidence or a reason", done: evidence || !people.some((p) => p.role === "interviewer") });
    items.push({ label: "Devil reviewed causes", done: devilOk(state) });
    if (!eachCause) {
      const short = people.find((p) => !state.causes.some((cause) => cause.authorId === p.id));
      return pack("amber", "Add possible causes into the holding tray.", blocker(state, short?.id, "0 causes"), false);
    }
    if (covered < 4) {
      return pack(state.timer.expired ? "red" : "amber", "Need causes on at least 4 bones.", blocker(state, people.find((p) => p.role === "mapper")?.id, "tray still waiting"), false);
    }
    if (!evidence && people.some((p) => p.role === "interviewer")) {
      return pack("amber", "Attach a quote, or mark evidence not available.", blocker(state, people.find((p) => p.role === "interviewer")?.id, "evidence missing"), false);
    }
    if (!devilOk(state)) return pack("red", "Devil's Advocate still owes a review.", blocker(state, people.find((p) => p.role === "devil")?.id, "stamp or clear"), false);
    return pack("green", "Bones ready. Next: choose 2–3 branches to dig.", null, true);
  }

  if (state.stage === "s4b") {
    const tally = voteTally(state.boneVotes);
    const chosen = [...tally.keys()];
    const voted = everyoneVoted(state, state.boneVotes, 2);
    items.push({ label: "Everyone voted", done: voted });
    items.push({ label: "2–3 bones", done: chosen.length >= 2 && chosen.length <= 3 });
    items.push({ label: "Devil reviewed evidence", done: devilOk(state) });
    if (!voted) return pack("amber", "Not everyone has voted.", null, false);
    if (chosen.length < 2 || chosen.length > 3) return pack("amber", `Select 2–3 bones (now ${chosen.length}).`, null, false);
    if (!devilOk(state)) return pack("red", "Devil's Advocate still owes a review.", blocker(state, people.find((p) => p.role === "devil")?.id, "challenge or clear"), false);
    return pack("green", "Branches can lock. Selected bones will glow.", null, true);
  }

  if (state.stage === "s4c") {
    const deepened = selectedWithHops(state);
    const missingChip = state.hops.filter((hop) => !hop.chip).length;
    const insightHop = state.hops.some((hop) => !hop.proposed && hop.chip);
    items.push({ label: "2 bones with tagged hops", done: deepened >= 2 });
    items.push({ label: "Every hop tagged", done: missingChip === 0 });
    items.push({ label: "Insight added a hop", done: insightHop });
    if (!insightHop) return pack("amber", "Insight has not added a hop yet.", blocker(state, people.find((p) => p.role === "insight")?.id, "0 Why hops"), false);
    if (missingChip) return pack("red", `${missingChip} hops missing evidence chips.`, null, false);
    if (deepened < 2) return pack("amber", `Need ≥2 bones with tagged Why hops (now ${deepened}).`, null, false);
    if (!devilOk(state)) return pack("red", "Devil's Advocate still owes a review.", blocker(state, people.find((p) => p.role === "devil")?.id, "check chips"), false);
    return pack("green", "Depth meter green. Next: pin what to address.", null, true);
  }

  if (state.stage === "s4d") {
    const live = state.pins.filter((pin) => pin.placed && !pin.blocked);
    const labelled = live.filter((pin) => pin.obstacleSet && pin.insightSet);
    const blocked = state.pins.some((pin) => pin.blocked);
    items.push({ label: "1–3 pins", done: live.length >= 1 && live.length <= 3 });
    items.push({ label: "Obstacle + insight labelled", done: live.length > 0 && labelled.length === live.length });
    items.push({ label: "No blocked pin", done: !blocked });
    if (blocked) return pack("red", "A pin is blocked — replace or override.", "Pins blocked — replace unsupported pin", false);
    if (live.length < 1 || live.length > 3) return pack("amber", `Need 1–3 pins (now ${live.length}).`, null, false);
    if (labelled.length !== live.length) return pack("red", "Label Obstacle and Insight candidates on each pin.", blocker(state, people.find((p) => p.role === "insight")?.id, "candidates blank"), false);
    if (!devilOk(state)) return pack("red", "Devil's Advocate still owes a review.", blocker(state, people.find((p) => p.role === "devil")?.id, "challenge or clear"), false);
    return pack("green", "Fishbone can lock. Artifact B saves pins and candidates.", null, true);
  }

  if (state.stage === "s5") {
    const submitted = state.statements.filter((card) => card.submitted);
    items.push({ label: `${submitted.length}/${people.length} statements`, done: submitted.length === people.length && people.length >= needCount(state) });
    const waiting = people.find((p) => !state.statements.some((card) => card.authorId === p.id && card.submitted));
    if (submitted.length === people.length && people.length >= needCount(state)) {
      return pack("green", "All statements are in with green Done gates. Opening red-flag and vote…", null, true);
    }
    return pack(
      state.timer.expired ? "red" : "amber",
      `Waiting for statements (${submitted.length}/${people.length}).`,
      waiting ? blocker(state, waiting.id, "statement not in") : null,
      false,
    );
  }

  if (state.stage === "s6") {
    const voted = everyoneVoted(state, state.statementVotes, 2);
    const top = topThree(state);
    const stuck = allFlagged(state) && !state.fixRoundDone;
    items.push({ label: "Devil reviewed", done: devilOk(state) });
    items.push({ label: "Fix round if everything is flagged", done: !stuck });
    items.push({ label: "Insight polish or none needed", done: insightReady(state) });
    items.push({ label: "Mapper finished clusters", done: state.clustersDone });
    items.push({ label: "Top 3 votes", done: Boolean(state.packVoteOpen && voted && top) });
    if (stuck) return pack("red", "All statements are still red-flagged — complete one revision round.", "Every card has a red flag", false);
    if (!devilOk(state)) return pack("red", "Devil's Advocate still owes a review.", blocker(state, people.find((p) => p.role === "devil")?.id, "0 tags"), false);
    if (!insightReady(state)) return pack("amber", "Insight can propose a fix, or say none needed.", blocker(state, people.find((p) => p.role === "insight")?.id, "no polish yet"), false);
    if (!state.clustersDone) return pack("amber", "Mapper clusters near-duplicates, or taps no twins.", blocker(state, people.find((p) => p.role === "mapper")?.id, "clusters open"), false);
    if (!state.packVoteOpen) return pack("amber", "Leader can open the vote.", null, false);
    if (!voted) return pack("amber", "Not everyone has voted.", null, false);
    if (!top) return pack("red", `Need top 3 selected (now ${topThreeCount(state)}).`, null, false);
    return pack("green", "C60 Pack can lock. Artifact C saves the top 3 five-blank sentences.", null, true);
  }

  return pack("green", "Pack ready.", null, true);
}

const ROLE_LIST: RoleId[] = ["leader", "interviewer", "mapper", "insight", "devil"];

function insightReady(state: RoomState) {
  if (!present(state).some((p) => p.role === "insight") && state.allowFour) return true;
  if (state.statements.some((card) => card.proposal) || state.fixRoundDone) return true;
  return present(state).some((p) => p.role === "insight" && p.insightNoneNeeded);
}

function topThreeCount(state: RoomState) {
  return topThree(state)?.length ?? Math.min(3, state.statements.filter((card) => card.submitted).length);
}

function incidentDots(state: RoomState): Dot[] {
  return state.incidents.flatMap((card) => card.votes.map((by) => ({ by, targetId: card.id })));
}

function incidentWinner(state: RoomState) {
  if (!state.incidents.length) return null;
  const ranked = [...state.incidents].sort((a, b) => b.votes.length - a.votes.length);
  if (ranked[0].votes.length === 0) return null;
  if (ranked[1] && ranked[1].votes.length === ranked[0].votes.length) return null;
  return ranked[0];
}

export function checklistFor(state: RoomState, actor: Participant) {
  const dots: { label: string; done: boolean }[] = [];
  if (actor.kind === "teacher") return dots;
  if (state.stage === "s0") dots.push({ label: "Ready check-in", done: actor.ready });
  if (state.stage === "s1" || state.stage === "s0") {
    dots.push({ label: "Aim for 3 stakeholder cards", done: cardsBy(state, actor.id).length >= 3 });
  }
  if (state.stage === "s1b" && actor.role === "mapper") dots.push({ label: "Merges confirmed", done: false });
  if (state.stage === "s2" && actor.role === "interviewer") dots.push({ label: "Whose problem and what goes wrong", done: Boolean(state.summary.whoseId && state.summary.harm.trim().length > 2) });
  if (state.stage === "s4a") dots.push({ label: "Cause on a bone", done: state.causes.some((cause) => cause.authorId === actor.id) });
  if (state.stage === "s4b") dots.push({ label: "2 bone votes", done: dotCount(state.boneVotes, actor.id) === 2 });
  if (state.stage === "s5" || state.stage === "s6" || state.stage === "s7") {
    dots.push({ label: "Statement submitted", done: state.statements.some((card) => card.authorId === actor.id && card.submitted) });
  }
  if (state.stage === "s6") dots.push({ label: "2 pack votes", done: dotCount(state.statementVotes, actor.id) === 2 });
  return dots;
}

const RADAR_COPY: Record<StageId, { green: string; amber: string; red: string; coach: string; say: string }> = {
  s0: {
    green: "5/5 joined; Leader can Start",
    amber: "4/5 joined",
    red: "Role unassigned or fewer than 4 present",
    coach: "Assign the missing role, or allow start with 4.",
    say: "Roles are on your badges — Leader taps Start.",
  },
  s1: {
    green: "Students are adding people cards",
    amber: "One student has few cards, and the time is almost up",
    red: "Timer ended",
    coach: "Three cards each is a guide. End the step when you are ready.",
    say: "People cards — not solutions. Point at Add stakeholder + Your move.",
  },
  s1b: {
    green: "Mapper is merging and suggestions are flowing",
    amber: "Theme Mapper looks idle",
    red: "Open veto, or merges were never confirmed",
    coach: "Theme Mapper drags stacks. Others tap Suggest same.",
    say: "Only Mapper merges — others tap Suggest same.",
  },
  s2: {
    green: "Cards are placing and Summary is underway",
    amber: "Unplaced cards, a missing vote, or Summary still blank",
    red: "Fewer than 2 priorities, or no whose problem / what goes wrong",
    coach: "Finish Summary: whose problem + what goes wrong before Lock map.",
    say: "Mapper places; you vote; then Interviewer writes what goes wrong for the person you follow.",
  },
  s3: {
    green: "Incident proposed; vote underway",
    amber: "No proposal yet",
    red: "Blame veto is open without a rewrite",
    coach: "Lead Interviewer needs one factual what-happened card.",
    say: "Facts only — not “people are lazy.”",
  },
  s4a: {
    green: "Causes are landing on bones",
    amber: "The bones are still thin",
    red: "Fewer than 4 bones have cards past the soft time",
    coach: "Each person adds a cause onto the bone it belongs to.",
    say: "Pick a bone, write the cause, and it appears on the fish.",
  },
  s4b: {
    green: "Votes are collecting toward 2–3 bones",
    amber: "One student has not voted",
    red: "A popular bone with no evidence is stuck in the vote",
    coach: "Pick evidenced bones, not just popular ones.",
    say: "Pick evidenced bones, not just popular ones.",
  },
  s4c: {
    green: "Insight is adding hops and chips are appearing",
    amber: "Insight looks idle on the glowing bones",
    red: "Hops are missing chips, or fewer than 2 bones are deepened",
    coach: "Insight Extractor should pull Why arrows on glowing bones.",
    say: "Tag every hop Evidence / Assumption / Need-to-check.",
  },
  s4d: {
    green: "Pins and Obstacle + Insight candidates are landing",
    amber: "Pins are missing, or candidates are unlabelled",
    red: "A pin or insight was blocked with no replacement",
    coach: "Pin a cause on the rib. Obstacle is that cause. Insight is the Why marked as the root.",
    say: "The cause you pin is the obstacle. The marked root Why is the insight.",
  },
  s5: {
    green: "Five-blank statements are coming in with carry filled",
    amber: "Someone still has an empty Need near the end of the time",
    red: "Empty blank, generic Who, or a solution word is blocking Submit",
    coach: "Need starts from the interview. Who is the person. Obstacle is the pinned cause. Harm is the incident. Insight is the marked root Why.",
    say: "Edit the need. Who is the person, obstacle is the pinned cause, harm is the incident, insight is the root Why.",
  },
  s6: {
    green: "Tags, fixes, clusters, and votes are moving",
    amber: "Devil, Mapper, or the vote looks idle",
    red: "All five are still red-flagged with no fix, or the top 3 are unclear",
    coach: "Devil tags quality issues first, then Insight proposes five-blank-safe fixes.",
    say: "Devil tags first — including generic Who and solution in Need — then Insight proposes fixes.",
  },
  s7: {
    green: "Pack ready",
    amber: "Share failed — download still works",
    red: "Pack still generating",
    coach: "Celebrate briefly; note next chunk C18 or C28.",
    say: "Nice work. The screen already has the pack.",
  },
};

function immediateRed(state: RoomState) {
  if (state.stage === "s0") {
    const unassigned = students(state).some((person) => person.claimed && !person.role);
    return unassigned || present(state).length < 4;
  }
  if (state.stage === "s1") return false;
  if (state.stage === "s3") return Boolean(state.veto) || state.incidents.some((card) => card.blame);
  if (state.stage === "s4d") return state.pins.some((pin) => pin.blocked);
  if (state.stage === "s6") return allFlagged(state) && !state.fixRoundDone;
  return false;
}

export function radar(state: RoomState, now: number): RadarCue {
  const gate = meter(state);
  const copy = RADAR_COPY[state.stage];
  const age = now - state.stageEnteredAt;
  const soft = STAGE_MS[state.stage];
  const vetoStuck = Boolean(state.veto && now - state.veto.at > 60_000);
  const pastSoft = soft > 0 && age > soft && !gate.ready;
  let color: RadarCue["color"] = "green";
  let reason = copy.green;
  let who: string | null = null;

  if (gate.ready) {
    color = "green";
    reason = copy.green;
  } else if (vetoStuck || immediateRed(state) || (pastSoft && gate.color === "red")) {
    color = "red";
    reason = vetoStuck ? "Open veto — resolve or override." : copy.red;
    who = gate.blocker;
  } else if (pastSoft) {
    color = "amber";
    reason = copy.amber;
    who = gate.blocker;
  }

  if (state.stage === "s1") {
    const short = present(state).filter((p) => cardsBy(state, p.id).length <= 1);
    const left = state.timer.running && state.timer.endsAt ? state.timer.endsAt - now : state.timer.remainingMs;
    if (short.length && left < 90_000 && !state.timer.expired) {
      color = "amber";
      reason = copy.amber;
      const p = short[0];
      who = blocker(state, p.id, `${cardsBy(state, p.id).length} cards so far`);
    } else {
      color = "green";
      reason = copy.green;
      who = null;
    }
  }

  if (state.stage === "s0" && color !== "red" && present(state).length === 4 && age > 60_000 && !state.allowFour) {
    color = "amber";
    reason = copy.amber;
  }

  const idle = idleActor(state, now);
  if (idle && color === "green" && !gate.ready) {
    color = "amber";
    reason = copy.amber;
    who = blocker(state, idle.id, "idle");
  }

  let coach = `${state.teamName} — ${copy.coach}`;
  let say = copy.say;
  if (state.stage === "s0") {
    const needed = state.allowFour ? 4 : 5;
    const joined = present(state).length;
    const rolesReady = students(state).filter((person) => person.role).length >= needed;
    if (rolesReady && joined < needed) {
      color = "amber";
      reason = `Seats are assigned. ${joined} of ${needed} are open on a device.`;
      who = null;
      coach = `${state.teamName} — Open the five seats on this screen. No one else has to join.`;
      say = "Switch to the Leader and tap Start.";
    }
  }

  return {
    color,
    reason,
    blocker: color === "green" ? null : who,
    coach,
    say,
    checklist: students(state).map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role ? ROLES[p.role].name : null,
      dots: checklistFor(state, p),
    })),
  };
}

function idleActor(state: RoomState, now: number) {
  const role: RoleId | null =
    state.stage === "s1b" || state.stage === "s2" || state.stage === "s4a"
      ? "mapper"
      : state.stage === "s4c" || state.stage === "s4d"
        ? "insight"
        : state.stage === "s3"
          ? "interviewer"
          : state.stage === "s6"
            ? "devil"
            : null;
  if (!role) return null;
  const actor = present(state).find((p) => p.role === role);
  if (!actor) return null;
  if (now - actor.lastActionAt < 90_000) return null;
  return actor;
}

export function project(state: RoomState, viewerId: string) {
  const next = structuredClone(state) as RoomState;
  if (!Array.isArray(next.filmsPlayed)) next.filmsPlayed = [];
  if (next.stage === "s1" && !next.s1Revealed) {
    next.stakeholders = next.stakeholders.map((card) =>
      card.authorId === viewerId || card.planted ? card : { ...card, label: "", masked: true },
    );
  }
  if (next.stage === "s5") {
    next.statements = next.statements.map((card) =>
      card.authorId === viewerId || card.submitted
        ? card
        : {
            ...card,
            who: "",
            need: "",
            obstacle: "",
            harm: "",
            insight: "",
            masked: true,
          },
    );
  }
  return next;
}

export function applyAction(prev: RoomState, actorId: string, action: Action, now: number): Result {
  const ticked = structuredClone(prev) as RoomState;
  evolve(ticked, now);
  const actor = ticked.participants.find((p) => p.id === actorId);
  if (!actor) return { ok: false, error: "Join the room first.", state: ticked };
  const working = structuredClone(ticked) as RoomState;
  if (!Array.isArray(working.filmsPlayed)) working.filmsPlayed = [];
  const current = working.participants.find((p) => p.id === actorId)!;
  const error = dispatch(working, current, action, now);
  if (error) return { ok: false, error, state: ticked };
  evolve(working, now);
  return { ok: true, state: working };
}

function dispatch(state: RoomState, actor: Participant, action: Action, now: number): string | null {
  if (action.type === "claim") {
    if (actor.kind !== "student") return "That seat is not a student seat.";
    if (actor.claimed) return "This seat already joined on another device.";
    actor.claimed = true;
    note(state, actor, "claim", `${actor.name} joined`, now);
    return null;
  }
  if (action.type === "check-in") {
    const seat = state.participants.find((p) => p.id === action.seatId && p.kind === "student");
    if (!seat) return "That seat is not in this room.";
    seat.claimed = true;
    const checked = new Set(state.checkedInIds ?? []);
    checked.add(seat.id);
    state.checkedInIds = [...checked];
    note(state, seat, "check-in", `${seat.name} checked in`, now);
    return null;
  }
  if (action.type === "play-film") return playFilm(state, actor, action.id, now);
  if (actor.kind === "teacher") return teacherAction(state, actor, action, now);
  const joined = requireStudent(actor);
  if (joined) return joined;

  switch (action.type) {
    case "ready":
      if (state.stage !== "s0") return "Ready check-in is only at the start.";
      actor.ready = true;
      note(state, actor, "ready", `${actor.name} is ready`, now);
      return null;
    case "start":
      return startActivity(state, actor, now);
    case "timer":
      return timerAction(state, actor, action, now);
    case "next-step":
      return nextStep(state, actor, now);
    case "previous-step":
      return previousStep(state, actor, now);
    case "reset-board":
      return resetBoard(state, actor, now);
    case "reveal":
      return reveal(state, actor, now);
    case "add-stakeholder":
      return addStakeholder(state, actor, action.label, now);
    case "edit-stakeholder":
      return editStakeholder(state, actor, action.id, action.label, now);
    case "delete-stakeholder":
      return deleteStakeholder(state, actor, action.id, now);
    case "suggest-merge":
      return suggestMerge(state, actor, action.a, action.b, now);
    case "dismiss-suggestion":
      return dismissSuggestion(state, actor, action.id, now);
    case "merge":
      return merge(state, actor, action.a, action.b, now);
    case "unmerge":
      return unmerge(state, actor, action.id, now);
    case "rename":
      return rename(state, actor, action.id, action.label, now);
    case "merges-done":
      return mergesDone(state, actor, now);
    case "veto-merge":
      return vetoMerge(state, actor, action.id, now);
    case "override-veto":
      return overrideVeto(state, actor, now);
    case "place":
      return place(state, actor, action.id, { power: action.power, interest: action.interest }, now, false);
    case "suggest-move":
      return suggestMove(state, actor, action.id, { power: action.power, interest: action.interest }, now);
    case "resolve-move":
      return resolveMove(state, actor, action.id, action.accept, now);
    case "source":
      return setSource(state, actor, action.id, action.source, now);
    case "talk-to":
      return talkTo(state, actor, action.id, now);
    case "daily-pain":
      return dailyPain(state, actor, action.id, action.kind, now);
    case "flag-missing":
      return flagMissing(state, actor, action.flag, now);
    case "challenge-guess":
      return challengeGuess(state, actor, action.id, now);
    case "open-vote":
      return openVote(state, actor, now);
    case "vote-card":
      return voteCard(state, actor, action.id, now);
    case "unvote-card":
      return unvoteCard(state, actor, action.id, now);
    case "whose":
      return setWhose(state, actor, action.id, now);
    case "harm":
      return setHarm(state, actor, action.text, now);
    case "lock-map":
      return lockMap(state, actor, now);
    case "add-incident":
      return addIncident(state, actor, action.text, now);
    case "vote-incident":
      return voteIncident(state, actor, action.id, now);
    case "veto-blame":
      return vetoBlame(state, actor, action.id, now);
    case "rewrite-incident":
      return rewriteIncident(state, actor, action.id, action.text, now);
    case "lock-incident":
      return lockIncident(state, actor, now);
    case "rename-bone":
      return renameBone(state, actor, action.id, action.label, now);
    case "add-cause":
      return addCause(state, actor, action.text, action.bone ?? null, now);
    case "edit-cause":
      return editCause(state, actor, action.id, action.text, now);
    case "snap":
      return snap(state, actor, action.id, action.bone, now);
    case "evidence":
      return evidence(state, actor, action.id, action.quote, now);
    case "evidence-na":
      return evidenceNa(state, actor, action.reason, now);
    case "stamp":
      return stamp(state, actor, action.id, action.stamp, now);
    case "bones-ready":
      return bonesReady(state, actor, now);
    case "vote-bone":
      return voteBone(state, actor, action.id, true, now);
    case "unvote-bone":
      return voteBone(state, actor, action.id, false, now);
    case "challenge-bone":
      return challengeBone(state, actor, action.id, now);
    case "confirm-bones":
      return confirmBones(state, actor, now);
    case "follow-bone":
      return followBone(state, actor, action.id, now);
    case "add-hop":
      return addHop(state, actor, action, now);
    case "propose-hop":
      return proposeHop(state, actor, action, now);
    case "accept-hop":
      return acceptHop(state, actor, action.id, action.chip, now);
    case "edit-hop":
      return editHop(state, actor, action.id, action.text, now);
    case "ask-whom":
      return askWhom(state, actor, action.id, action.whom, now);
    case "mark-root":
      return markRoot(state, actor, action.id, now);
    case "continue-pins":
      return continuePins(state, actor, now);
    case "nominate-pin":
      return nominatePin(state, actor, action.causeId, action.hopId ?? null, now);
    case "vote-pin":
      return votePin(state, actor, action.id, now);
    case "place-pin":
      return placePin(state, actor, action.id, now);
    case "set-candidates":
      return setCandidates(state, actor, action.id, action.obstacle, action.insight, now);
    case "block-pin":
      return blockPin(state, actor, action.id, now);
    case "lock-fishbone":
      return lockFishbone(state, actor, now);
    case "save-statement":
      return saveStatement(state, actor, action, now);
    case "submit-statement":
      return submitStatement(state, actor, now);
    case "tag":
      return tagStatement(state, actor, action.id, action.tag, true, now);
    case "untag":
      return tagStatement(state, actor, action.id, action.tag, false, now);
    case "propose-fix":
      return proposeFix(state, actor, action, now);
    case "accept-fix":
      return acceptFix(state, actor, action.id, now);
    case "cluster":
      return cluster(state, actor, action.a, action.b, now);
    case "uncluster":
      return uncluster(state, actor, action.id, now);
    case "recognizable":
      return recognizable(state, actor, action.id, action.value, now);
    case "clusters-done":
      return clustersDone(state, actor, now);
    case "open-pack-vote":
      return openPackVote(state, actor, now);
    case "vote-statement":
      return voteStatement(state, actor, action.id, true, now);
    case "unvote-statement":
      return voteStatement(state, actor, action.id, false, now);
    case "lock-pack":
      return lockPack(state, actor, now);
    case "review-clear":
      return reviewClear(state, actor, now);
    case "none-needed":
      return noneNeeded(state, actor, now);
    case "rename-team":
      return renameTeam(state, actor, action.name, now);
    default:
      return "That move is not on your role card.";
  }
}

function teacherAction(state: RoomState, actor: Participant, action: Action, now: number): string | null {
  switch (action.type) {
    case "assign-role": {
      const seat = state.participants.find((p) => p.id === action.seatId && p.kind === "student");
      if (!seat) return "That seat is not in this room.";
      if (action.role) {
        const taken = students(state).find((p) => p.role === action.role && p.id !== seat.id);
        if (taken) return `${taken.name} already has ${ROLES[action.role].name}. Clear that seat first.`;
      }
      seat.role = action.role;
      note(state, actor, "assign-role", `${seat.name} → ${roleName(action.role)}`, now, state.stage !== "s0");
      return null;
    }
    case "set-room": {
      const team = clip(action.teamName, 40);
      const theme = clip(action.theme, 80);
      if (!team || !theme) return "Team and theme both need a name.";
      state.teamName = team;
      state.theme = theme;
      note(state, actor, "set-room", `${team} · ${theme}`, now);
      return null;
    }
    case "allow-four":
      state.allowFour = action.value;
      note(state, actor, "allow-four", action.value ? "Start with 4 is allowed" : "Full team of 5 required", now, true);
      return null;
    case "release-seat": {
      const seat = state.participants.find((p) => p.id === action.seatId && p.kind === "student");
      if (!seat) return "That seat is not in this room.";
      seat.claimed = false;
      seat.ready = false;
      note(state, actor, "release-seat", `${seat.name} can join again`, now, true);
      return null;
    }
    case "clear-veto":
      if (state.veto?.kind === "pin") {
        const pin = state.pins.find((item) => item.id === state.veto?.targetId);
        if (pin) pin.blocked = false;
      }
      state.veto = null;
      note(state, actor, "clear-veto", "Teacher cleared a stuck veto", now, true);
      return null;
    case "next-step":
      return nextStep(state, actor, now);
    case "previous-step":
      return previousStep(state, actor, now);
    case "reset-board":
      return resetBoard(state, actor, now);
    case "timer":
      return timerAction(state, actor, action, now);
    case "extend-timer":
      return timerAction(state, actor, { type: "timer", op: "nudge", delta: 1 }, now);
    case "workshop-phase": {
      state.workshopPhase = action.phase;
      if (action.phase === "live") {
        const list = students(state);
        const taken = new Set(list.map((s) => s.role).filter((r): r is RoleId => Boolean(r)));
        const remaining = ROLE_ORDER.filter((r) => !taken.has(r));
        for (const seat of list) {
          if (!seat.role && remaining.length > 0) {
            seat.role = remaining.shift() ?? null;
          }
        }
        state.rolesSpun = true;
      }
      note(state, actor, "workshop-phase", `Phase -> ${action.phase}`, now);
      return null;
    }
    case "spin-roles": {
      for (const pair of action.assignments) {
        const seat = state.participants.find((p) => p.id === pair.seatId && p.kind === "student");
        if (seat) seat.role = pair.role;
      }
      state.rolesSpun = true;
      note(state, actor, "spin-roles", "Teacher spun the wheel to deal roles", now);
      return null;
    }
    default:
      return "Teachers coach from the radar. Students move the board.";
  }
}

function playFilm(state: RoomState, actor: Participant, id: string, now: number) {
  if (actor.kind !== "teacher") return "Only the teacher plays a film for the class.";
  if (!isFilmId(id)) return "That film is not in this lesson.";
  if (!state.filmsPlayed.includes(id)) state.filmsPlayed.push(id);
  note(state, actor, "play-film", id, now, true);
  return null;
}

function nextStep(state: RoomState, actor: Participant, now: number) {
  if (actor.kind !== "teacher") return "Your teacher moves the class to the next step.";
  const next = NEXT_STAGE[state.stage];
  if (!next) return "This is the last step.";
  if (state.stage === "s1") state.s1Revealed = true;
  if (state.stage === "s2") state.mapLocked = true;
  if (state.stage === "s3" && !state.lockedIncidentId) {
    const winner = incidentWinner(state) ?? state.incidents[0];
    if (winner) state.lockedIncidentId = winner.id;
  }
  if (state.stage === "s4b") {
    if (state.focusBone) state.selectedBones = [state.focusBone];
    else if (state.selectedBones.length === 0 && state.boneVotes.length > 0) {
      state.selectedBones = [...voteTally(state.boneVotes).keys()] as BoneId[];
    }
  }
  if (state.stage === "s4d") state.fishboneLocked = true;
  if (state.stage === "s6") {
    state.packLocked = true;
    state.top3 = topThree(state) ?? state.statements.filter((card) => card.submitted).slice(0, 3).map((card) => card.id);
  }
  advance(state, next, now);
  state.holdStage = true;
  note(state, actor, "next-step", next, now, true);
  return null;
}

function previousStep(state: RoomState, actor: Participant, now: number) {
  if (actor.kind !== "teacher") return "Your teacher moves the class between steps.";
  const previous = previousStage(state.stage);
  if (!previous) return "This is the first step.";
  advance(state, previous, now);
  state.holdStage = true;
  if (previous === "s1") state.s1Revealed = state.stakeholders.some((card) => !card.planted);
  note(state, actor, "previous-step", previous, now, true);
  return null;
}

function resetBoard(state: RoomState, actor: Participant, now: number) {
  if (actor.kind !== "teacher") return "Only the teacher can reset the board.";
  const teacher = state.participants.find((person) => person.kind === "teacher");
  if (!teacher) return "This room has no teacher.";
  const fresh = makeState({
    code: state.code,
    teamName: state.teamName,
    theme: state.theme,
    now,
    teacher: { id: teacher.id, name: teacher.name },
    students: state.participants
      .filter((person) => person.kind === "student")
      .map((person) => ({ id: person.id, name: person.name, role: person.role, claimed: person.claimed })),
  });
  fresh.allowFour = state.allowFour;
  Object.assign(state, fresh);
  note(state, actor, "reset-board", "Board cleared for another test", now, true);
  return null;
}

function startActivity(state: RoomState, actor: Participant, now: number) {
  if (state.stage !== "s0") return "The activity has already started.";
  if (!actsAs(state, actor, "leader")) return "Only the Leader can tap Start.";
  if (!meter(state).ready) return meter(state).reason;
  advance(state, "s1", now);
  note(state, actor, "start", "Activity started", now);
  return null;
}

function timerAction(state: RoomState, actor: Participant, action: Extract<Action, { type: "timer" }>, now: number) {
  if (actor.kind !== "teacher") return "Your teacher runs the timer.";
  if (action.op === "end") {
    state.timer.running = false;
    state.timer.endsAt = null;
    state.timer.remainingMs = 0;
    state.timer.expired = true;
    if (state.stage === "s1") state.s1Revealed = true;
    note(state, actor, "timer", "Teacher ended this step's time", now, true);
    return null;
  }
  if (STAGE_MS[state.stage] === 0) return "This step has no timer.";
  if (action.op === "start") {
    const ms = Math.max(15_000, state.timer.remainingMs || STAGE_MS[state.stage]);
    state.timer.running = true;
    state.timer.expired = false;
    state.timer.endsAt = now + ms;
    state.timer.remainingMs = ms;
    note(state, actor, "timer", "Timer started", now);
    return null;
  }
  if (action.op === "pause") {
    if (state.timer.running && state.timer.endsAt) state.timer.remainingMs = Math.max(0, state.timer.endsAt - now);
    state.timer.running = false;
    state.timer.endsAt = null;
    note(state, actor, "timer", "Timer paused", now);
    return null;
  }
  const delta = action.delta === -1 ? -1 : 1;
  state.timer.remainingMs = Math.max(15_000, state.timer.remainingMs + delta * 60_000);
  if (state.timer.running && state.timer.endsAt) state.timer.endsAt += delta * 60_000;
  state.timer.expired = false;
  note(state, actor, "timer", `Teacher ${delta > 0 ? "added" : "removed"} 1 minute`, now, true);
  return null;
}

function reveal(state: RoomState, actor: Participant, now: number) {
  if (actor.kind !== "teacher") return "Your teacher ends silent time.";
  if (state.stage !== "s1") return "Cards reveal at the end of the silent dump.";
  state.s1Revealed = true;
  state.timer.running = false;
  state.timer.endsAt = null;
  state.timer.remainingMs = 0;
  state.timer.expired = true;
  note(state, actor, "reveal", "Silent time ended", now);
  return null;
}

function addStakeholder(state: RoomState, actor: Participant, label: string, now: number) {
  if (state.stage !== "s1") return "Stakeholder cards are added in the silent dump.";
  const text = clip(label, 80);
  if (text.length < 2) return "Type a short label, like cocoa farmer or buying agent.";
  const warning = stakeholderWarning(text);
  if (warning) return warning;
  if (cardsBy(state, actor.id).length >= 8) return "Eight cards is enough. Make the next ones count in the merge.";
  state.stakeholders.push({
    id: uid("card"),
    authorId: actor.id,
    label: text,
    source: "guess",
    planted: false,
    authorIds: [actor.id],
    mergedLabels: [],
    mergedInto: null,
    grid: null,
    talkTo: false,
    dailyPain: false,
    challenged: false,
  });
  note(state, actor, "add-stakeholder", text, now);
  return null;
}

function ownCard(state: RoomState, actor: Participant, id: string) {
  const card = state.stakeholders.find((item) => item.id === id);
  if (!card || card.planted) return null;
  if (card.authorId !== actor.id) return null;
  return card;
}

function editStakeholder(state: RoomState, actor: Participant, id: string, label: string, now: number) {
  if (state.stage !== "s1" || state.s1Revealed) return "You can edit your own cards until the reveal.";
  const card = ownCard(state, actor, id);
  if (!card) return "You can only edit your own cards.";
  const text = clip(label, 80);
  const warning = stakeholderWarning(text);
  if (warning) return warning;
  if (text.length < 2) return "Type a short label.";
  card.label = text;
  note(state, actor, "edit-stakeholder", text, now);
  return null;
}

function deleteStakeholder(state: RoomState, actor: Participant, id: string, now: number) {
  if (state.stage !== "s1" || state.s1Revealed) return "You can delete your own cards until the reveal.";
  const card = ownCard(state, actor, id);
  if (!card) return "You can only delete your own cards.";
  state.stakeholders = state.stakeholders.filter((item) => item.id !== id);
  note(state, actor, "delete-stakeholder", card.label, now);
  return null;
}

function visibleRoot(state: RoomState, id: string) {
  return roots(state).find((card) => card.id === id) ?? null;
}

function suggestMerge(state: RoomState, actor: Participant, a: string, b: string, now: number) {
  if (state.stage !== "s1b") return "Suggestions happen while the pile is face up.";
  if (actsAs(state, actor, "mapper")) return "Theme Mapper merges directly. Drag one card onto the other.";
  if (a === b) return "Pick two different cards.";
  const left = visibleRoot(state, a);
  const right = visibleRoot(state, b);
  if (!left || !right) return "Those cards are not both in the pile.";
  if (state.blockedPairs.includes(pairKey(a, b))) return "Devil's Advocate vetoed that merge. Override it or keep them separate.";
  if (state.suggestions.some((item) => pairKey(item.a, item.b) === pairKey(a, b))) return "That pair is already suggested.";
  state.suggestions.push({ id: uid("sug"), by: actor.id, a, b });
  note(state, actor, "suggest-merge", `${left.label} = ${right.label}`, now);
  return null;
}

function dismissSuggestion(state: RoomState, actor: Participant, id: string, now: number) {
  if (!actsAs(state, actor, "mapper")) return "Only the Theme Mapper clears a suggestion.";
  const before = state.suggestions.length;
  state.suggestions = state.suggestions.filter((item) => item.id !== id);
  if (state.suggestions.length === before) return "That suggestion is already gone.";
  note(state, actor, "dismiss-suggestion", "Suggestion cleared", now);
  return null;
}

function merge(state: RoomState, actor: Participant, a: string, b: string, now: number) {
  if (state.stage !== "s1b") return "Merging happens on the revealed pile.";
  if (!actsAs(state, actor, "mapper")) return "Only the Theme Mapper can merge.";
  if (state.veto?.kind === "merge") return "Open veto — resolve or override.";
  if (a === b) return "Pick two different cards.";
  const left = visibleRoot(state, a);
  const right = visibleRoot(state, b);
  if (!left || !right) return "Those cards are not both in the pile.";
  if (state.blockedPairs.includes(pairKey(a, b))) return "Devil's Advocate vetoed that merge. Override it or keep them separate.";
  right.mergedInto = left.id;
  left.authorIds = Array.from(new Set([...left.authorIds, ...right.authorIds, right.authorId].filter(Boolean)));
  left.mergedLabels.push(right.label);
  state.suggestions = state.suggestions.filter((item) => item.a !== a && item.b !== a && item.a !== b && item.b !== b);
  note(state, actor, "merge", `${right.label} stacked under ${left.label}`, now);
  return null;
}

function unmerge(state: RoomState, actor: Participant, id: string, now: number) {
  if (!actsAs(state, actor, "mapper")) return "Only the Theme Mapper can unmerge.";
  const child = state.stakeholders.find((card) => card.mergedInto === id);
  const root = state.stakeholders.find((card) => card.id === id);
  if (!child || !root) return "That stack has nothing to split off.";
  child.mergedInto = null;
  root.mergedLabels = root.mergedLabels.filter((label) => label !== child.label);
  note(state, actor, "unmerge", child.label, now);
  return null;
}

function rename(state: RoomState, actor: Participant, id: string, label: string, now: number) {
  if (!actsAs(state, actor, "mapper")) return "Only the Theme Mapper renames a stack.";
  const card = visibleRoot(state, id);
  if (!card) return "That card is not in the pile.";
  const text = clip(label, 80);
  const warning = stakeholderWarning(text);
  if (warning) return warning;
  if (text.length < 2) return "Type a short label.";
  card.label = text;
  note(state, actor, "rename", text, now);
  return null;
}

function mergesDone(state: RoomState, actor: Participant, now: number) {
  if (state.stage !== "s1b") return "Merges are confirmed on the pile.";
  if (!actsAs(state, actor, "mapper")) return "Only the Theme Mapper can tap Merges done.";
  if (!meter(state).ready) return meter(state).reason;
  advance(state, "s2", now);
  note(state, actor, "merges-done", "Merges done", now);
  return null;
}

function vetoMerge(state: RoomState, actor: Participant, id: string, now: number) {
  if (state.stage !== "s1b") return "Merge veto is only on the pile.";
  if (!actsAs(state, actor, "devil")) return "Only Devil's Advocate can veto a merge.";
  if (state.veto || state.vetoSpent[state.stage]) return "You can veto once this stage.";
  const root = visibleRoot(state, id);
  if (!root || root.mergedLabels.length === 0) return "Veto a stack that actually merged two people.";
  const child = state.stakeholders.find((card) => card.mergedInto === root.id);
  if (!child) return "That stack has nothing to split.";
  child.mergedInto = null;
  root.mergedLabels = root.mergedLabels.filter((label) => label !== child.label);
  state.blockedPairs.push(pairKey(root.id, child.id));
  state.vetoSpent[state.stage] = true;
  state.veto = {
    stage: state.stage,
    kind: "merge",
    targetId: root.id,
    at: now,
    overrideVotes: [],
    note: `${root.label} stayed separate from ${child.label}`,
  };
  markReview(state);
  note(state, actor, "veto-merge", state.veto.note, now);
  return null;
}

function overrideVeto(state: RoomState, actor: Participant, now: number) {
  if (!state.veto) return "There is no open veto.";
  if (actor.kind !== "student") return "Students override a veto together.";
  if (!state.veto.overrideVotes.includes(actor.id)) state.veto.overrideVotes.push(actor.id);
  const threshold = present(state).length >= 5 ? 4 : Math.max(3, present(state).length - 1);
  note(state, actor, "override-veto", `${state.veto.overrideVotes.length}/${threshold}`, now);
  if (state.veto.overrideVotes.length >= threshold) {
    if (state.veto.kind === "pin") {
      const pin = state.pins.find((item) => item.id === state.veto?.targetId);
      if (pin) pin.blocked = false;
    }
    if (state.veto.kind === "merge") {
      state.blockedPairs = state.blockedPairs.filter((key) => !key.includes(state.veto!.targetId));
    }
    if (state.veto.kind === "blame") {
      const card = state.incidents.find((item) => item.id === state.veto?.targetId);
      if (card) card.blame = false;
    }
    state.veto = null;
  }
  return null;
}

function place(state: RoomState, actor: Participant, id: string, grid: Quadrant, now: number, audit: boolean) {
  if (state.stage !== "s2" || state.mapLocked) return "Placement happens on the power map.";
  const mapperIdle = mapperIsIdle(state, now);
  const allowed = actsAs(state, actor, "mapper") || (actsAs(state, actor, "leader") && mapperIdle);
  if (!allowed) return "Only the Theme Mapper places cards on the grid.";
  const card = visibleRoot(state, id);
  if (!card) return "That card is not on the board.";
  if (grid.power !== "high" && grid.power !== "low") return "Pick high or low power.";
  if (grid.interest !== "high" && grid.interest !== "low") return "Pick high or low interest.";
  card.grid = grid;
  state.moves = state.moves.filter((move) => move.cardId !== id);
  note(state, actor, "place", `${card.label} → ${quadrantName(grid)}`, now, audit || mapperIdle);
  return null;
}

function mapperIsIdle(state: RoomState, now: number) {
  const mapper = present(state).find((p) => p.role === "mapper");
  if (!mapper) return state.allowFour;
  return now - mapper.lastActionAt >= 180_000;
}

function suggestMove(state: RoomState, actor: Participant, id: string, grid: Quadrant, now: number) {
  if (state.stage !== "s2") return "Move suggestions happen on the power map.";
  if (actsAs(state, actor, "mapper")) return "Theme Mapper places the card directly.";
  const card = visibleRoot(state, id);
  if (!card) return "That card is not on the board.";
  state.moves = state.moves.filter((move) => !(move.cardId === id && move.by === actor.id));
  state.moves.push({ id: uid("move"), by: actor.id, cardId: id, grid });
  note(state, actor, "suggest-move", `${card.label} → ${quadrantName(grid)}`, now);
  return null;
}

function resolveMove(state: RoomState, actor: Participant, id: string, accept: boolean, now: number) {
  if (!actsAs(state, actor, "mapper")) return "Only the Theme Mapper accepts a move.";
  const move = state.moves.find((item) => item.id === id);
  if (!move) return "That suggestion is already gone.";
  state.moves = state.moves.filter((item) => item.id !== id);
  if (accept) return place(state, actor, move.cardId, move.grid, now, false);
  note(state, actor, "reject-move", "Move suggestion declined", now);
  return null;
}

function setSource(state: RoomState, actor: Participant, id: string, source: "heard" | "guess", now: number) {
  if (state.stage !== "s1b" && state.stage !== "s2") return "Heard from and Our guess are set on the stakeholder cards.";
  if (!actsAs(state, actor, "interviewer")) return "Lead Interviewer owns Heard from.";
  const card = visibleRoot(state, id);
  if (!card) return "That card is not on the board.";
  card.source = source;
  if (source === "heard") card.challenged = false;
  note(state, actor, "source", `${card.label} · ${source === "heard" ? "Heard from" : "Our guess"}`, now);
  return null;
}

function talkTo(state: RoomState, actor: Participant, id: string, now: number) {
  if (!actsAs(state, actor, "interviewer")) return "Lead Interviewer marks Talk-to.";
  const card = visibleRoot(state, id);
  if (!card) return "That card is not on the board.";
  card.talkTo = !card.talkTo;
  note(state, actor, "talk-to", card.label, now);
  return null;
}

function dailyPain(state: RoomState, actor: Participant, id: string, kind: "stakeholder" | "cause", now: number) {
  if (!actsAs(state, actor, "insight")) return "Insight Extractor stars Daily pain.";
  if (kind === "stakeholder") {
    const card = visibleRoot(state, id);
    if (!card) return "That card is not on the board.";
    card.dailyPain = !card.dailyPain;
    note(state, actor, "daily-pain", card.label, now);
    return null;
  }
  const cause = state.causes.find((item) => item.id === id);
  if (!cause) return "That cause is not on the fish.";
  cause.dailyPain = !cause.dailyPain;
  note(state, actor, "daily-pain", cause.text, now);
  return null;
}

function flagMissing(state: RoomState, actor: Participant, flag: "payer" | "sponsor" | "blocker", now: number) {
  if (state.stage !== "s2") return "Missing-role flags belong on the power map.";
  if (!actsAs(state, actor, "devil")) return "Devil's Advocate flags a missing payer, sponsor, or blocker.";
  state.missingFlags[flag] = !state.missingFlags[flag];
  markReview(state);
  note(state, actor, "flag-missing", flag, now);
  return null;
}

function challengeGuess(state: RoomState, actor: Participant, id: string, now: number) {
  if (!actsAs(state, actor, "devil")) return "Devil's Advocate challenges Our guess.";
  const card = visibleRoot(state, id);
  if (!card) return "That card is not on the board.";
  if (card.source !== "guess") return "Heard from cards are already tied to someone. Challenge an Our guess claim.";
  card.challenged = !card.challenged;
  markReview(state);
  note(state, actor, "challenge-guess", card.label, now);
  return null;
}

function openVote(state: RoomState, actor: Participant, now: number) {
  if (state.stage !== "s2") return "The priority vote is on the power map.";
  if (!actsAs(state, actor, "leader")) return "Only the Leader opens the vote.";
  if (roots(state).some((card) => !card.grid)) return meter(state).reason;
  state.voteOpen = true;
  note(state, actor, "open-vote", "Priority vote open", now);
  return null;
}

function voteCard(state: RoomState, actor: Participant, id: string, now: number) {
  if (state.stage !== "s2" || !state.voteOpen) return "Wait for the Leader to open the vote.";
  if (!visibleRoot(state, id)) return "That card is not on the board.";
  const error = addDot(state.cardVotes, actor.id, id, 2);
  if (error) return error;
  const priorities = priorityCards(state);
  if (priorities) state.summary.open = true;
  note(state, actor, "vote-card", id, now);
  return null;
}

function unvoteCard(state: RoomState, actor: Participant, id: string, now: number) {
  const error = removeDot(state.cardVotes, actor.id, id);
  if (error) return error;
  note(state, actor, "unvote-card", id, now);
  return null;
}

function setWhose(state: RoomState, actor: Participant, id: string, now: number) {
  if (!actsAs(state, actor, "interviewer")) return "Lead Interviewer confirms whose problem we follow.";
  const card = visibleRoot(state, id);
  if (!card) return "That person is not on the map.";
  state.summary.whoseId = id;
  state.summary.confirmed = true;
  state.summary.open = true;
  note(state, actor, "whose", card.label, now);
  return null;
}

function setHarm(state: RoomState, actor: Participant, text: string, now: number) {
  if (!actsAs(state, actor, "interviewer")) return "Lead Interviewer writes what goes wrong.";
  if (!state.summary.whoseId) return "Pick whose problem we follow first.";
  const harm = clip(text, 280);
  if (harm.length < 8) return "Write what goes wrong in a full phrase, not one word.";
  if (blameWarning(harm)) return blameWarning(harm);
  state.summary.harm = harm;
  state.summary.confirmed = true;
  note(state, actor, "harm", harm, now);
  return null;
}

function lockWhenReady(state: RoomState, actor: Participant, now: number, stage: StageId, next: StageId, label: string) {
  if (state.stage !== stage) return "That lock is not on this step.";
  if (!actsAs(state, actor, "leader")) return "Only the Leader can lock, and only when the checklist is green.";
  if (!meter(state).ready) return meter(state).reason;
  if (stage === "s2") state.mapLocked = true;
  if (stage === "s4d") state.fishboneLocked = true;
  if (stage === "s6") {
    state.packLocked = true;
    state.top3 = topThree(state) ?? [];
  }
  advance(state, next, now);
  note(state, actor, label, label, now);
  return null;
}

function lockMap(state: RoomState, actor: Participant, now: number) {
  return lockWhenReady(state, actor, now, "s2", "s3", "lock-map");
}

function addIncident(state: RoomState, actor: Participant, text: string, now: number) {
  if (state.stage !== "s3") return "Incidents are pinned on this step.";
  const body = clip(text, 400);
  if (body.length < 2) return "Write the fact before you add it.";
  const blame = blameWarning(body);
  if (blame) return blame;
  const interviewerFirst = state.incidents.some((card) => person(state, card.authorId)?.role === "interviewer");
  if (!interviewerFirst && !actsAs(state, actor, "interviewer")) {
    return "Lead Interviewer proposes the first factual incident.";
  }
  state.incidents.push({ id: uid("inc"), authorId: actor.id, text: body, votes: [actor.id], blame: false });
  focusIncident(state);
  note(state, actor, "add-incident", body, now);
  return null;
}

function focusIncident(state: RoomState) {
  if (!state.incidents.length) {
    state.lockedIncidentId = null;
    return;
  }
  const ranked = [...state.incidents].sort((a, b) => b.votes.length - a.votes.length);
  state.lockedIncidentId = ranked[0].id;
}

function voteIncident(state: RoomState, actor: Participant, id: string, now: number) {
  if (state.stage !== "s3") return "Incident voting is on this step.";
  const card = state.incidents.find((item) => item.id === id);
  if (!card) return "That incident is gone.";
  for (const item of state.incidents) item.votes = item.votes.filter((voter) => voter !== actor.id);
  card.votes.push(actor.id);
  focusIncident(state);
  note(state, actor, "vote-incident", card.text, now);
  return null;
}

function vetoBlame(state: RoomState, actor: Participant, id: string, now: number) {
  if (!actsAs(state, actor, "devil")) return "Devil's Advocate vetoes blame wording.";
  if (state.veto || state.vetoSpent[state.stage]) return "You can veto once this stage.";
  const card = state.incidents.find((item) => item.id === id);
  if (!card) return "That incident is gone.";
  card.blame = true;
  state.vetoSpent[state.stage] = true;
  state.veto = { stage: state.stage, kind: "blame", targetId: id, at: now, overrideVotes: [], note: "Blame wording" };
  markReview(state);
  note(state, actor, "veto-blame", card.text, now);
  return null;
}

function rewriteIncident(state: RoomState, actor: Participant, id: string, text: string, now: number) {
  const card = state.incidents.find((item) => item.id === id);
  if (!card) return "That incident is gone.";
  if (card.authorId !== actor.id && !actsAs(state, actor, "interviewer")) return "The author rewrites the card.";
  const body = clip(text, 400);
  if (blameWarning(body)) return blameWarning(body)!;
  if (body.length < 2) return "Write the fact before you add it.";
  card.text = body;
  card.blame = false;
  if (state.veto?.targetId === id) state.veto = null;
  note(state, actor, "rewrite-incident", body, now);
  return null;
}

function lockIncident(state: RoomState, actor: Participant, now: number) {
  if (state.stage !== "s3") return "Incident lock is on this step.";
  if (!actsAs(state, actor, "leader")) return "Only the Leader locks the incident.";
  if (!meter(state).ready) return meter(state).reason;
  const winner = incidentWinner(state);
  if (!winner) return "Vote not finished.";
  state.lockedIncidentId = winner.id;
  advance(state, "s4a", now);
  note(state, actor, "lock-incident", winner.text, now);
  return null;
}

function renameBone(state: RoomState, actor: Participant, id: BoneId, label: string, now: number) {
  if (!actsAs(state, actor, "leader")) return "Only the Leader renames a bone, before the fish locks.";
  if (state.fishboneLocked || state.stage === "s5" || state.stage === "s6" || state.stage === "s7") return "Bones are already locked.";
  const bone = state.bones.find((item) => item.id === id);
  if (!bone) return "That bone is not on the fish.";
  const text = clip(label, 40);
  if (text.length < 2) return "Give the bone a short name.";
  bone.label = text;
  note(state, actor, "rename-bone", text, now);
  return null;
}

function addCause(state: RoomState, actor: Participant, text: string, bone: BoneId | null, now: number) {
  if (state.stage !== "s4a") return "Causes go on the fish on this step.";
  const body = clip(text, 200);
  if (body.length < 3) return "Write a cause, not a single word.";
  const warning = causeWarning(body);
  if (warning) return warning;
  if (bone && !state.bones.some((item) => item.id === bone)) return "That bone is not on the fish.";
  if (state.causes.filter((cause) => cause.authorId === actor.id).length >= 6) return "Six causes is enough from you.";
  state.causes.push({
    id: uid("cause"),
    authorId: actor.id,
    text: body,
    bone,
    blame: false,
    vague: false,
    dailyPain: false,
    evidence: null,
  });
  note(state, actor, "add-cause", bone ? `${body} → ${bone}` : body, now);
  return null;
}

function editCause(state: RoomState, actor: Participant, id: string, text: string, now: number) {
  const cause = state.causes.find((item) => item.id === id);
  if (!cause || cause.authorId !== actor.id) return "You can edit your own cause cards.";
  if (state.stage !== "s4a") return "Cause text locks once the bones are chosen.";
  const body = clip(text, 200);
  const warning = causeWarning(body);
  if (warning) return warning;
  cause.text = body;
  note(state, actor, "edit-cause", body, now);
  return null;
}

function snap(state: RoomState, actor: Participant, id: string, bone: BoneId | null, now: number) {
  if (state.stage !== "s4a") return "Snapping onto bones happens on the broad map.";
  if (!actsAs(state, actor, "mapper")) return "Only the Theme Mapper snaps cards onto bones.";
  const cause = state.causes.find((item) => item.id === id);
  if (!cause) return "That cause is not in the tray.";
  if (bone && !state.bones.some((item) => item.id === bone)) return "That bone is not on the fish.";
  cause.bone = bone;
  note(state, actor, "snap", `${cause.text} → ${bone ?? "tray"}`, now);
  return null;
}

function evidence(state: RoomState, actor: Participant, id: string, quote: string, now: number) {
  if (!actsAs(state, actor, "interviewer")) return "Lead Interviewer attaches evidence.";
  const cause = state.causes.find((item) => item.id === id);
  if (!cause) return "That cause is not on the fish.";
  const body = clip(quote, 300);
  if (body.length < 3) return "Add a short quote or what you observed.";
  cause.evidence = body;
  note(state, actor, "evidence", body, now);
  return null;
}

function evidenceNa(state: RoomState, actor: Participant, reason: string, now: number) {
  if (!actsAs(state, actor, "interviewer")) return "Lead Interviewer marks evidence not available.";
  const body = clip(reason, 180);
  if (body.length < 3) return "Say why evidence is not available yet.";
  actor.evidenceNa = body;
  note(state, actor, "evidence-na", body, now);
  return null;
}

function stamp(state: RoomState, actor: Participant, id: string, stampName: "blame" | "vague", now: number) {
  if (!actsAs(state, actor, "devil")) return "Devil's Advocate stamps blame or vague cards.";
  const cause = state.causes.find((item) => item.id === id);
  if (!cause) return "That cause is not on the fish.";
  if (stampName === "blame") cause.blame = !cause.blame;
  else cause.vague = !cause.vague;
  markReview(state);
  note(state, actor, "stamp", `${stampName} · ${cause.text}`, now);
  return null;
}

function bonesReady(state: RoomState, actor: Participant, now: number) {
  if (state.stage !== "s4a") return "Bones ready is on the broad map.";
  if (!actsAs(state, actor, "mapper")) return "Only the Theme Mapper taps Bones ready.";
  if (!meter(state).ready) return meter(state).reason;
  state.bonesReady = true;
  advance(state, "s4b", now);
  note(state, actor, "bones-ready", "Bones ready", now);
  return null;
}

function voteBone(state: RoomState, actor: Participant, id: BoneId, add: boolean, now: number) {
  if (state.stage !== "s4b") return "Bone votes happen while you choose branches.";
  if (!state.bones.some((bone) => bone.id === id)) return "That bone is not on the fish.";
  const error = add ? addDot(state.boneVotes, actor.id, id, 2) : removeDot(state.boneVotes, actor.id, id);
  if (error) return error;
  note(state, actor, add ? "vote-bone" : "unvote-bone", id, now);
  return null;
}

function challengeBone(state: RoomState, actor: Participant, id: BoneId, now: number) {
  if (!actsAs(state, actor, "devil")) return "Devil's Advocate challenges thin evidence.";
  if (!state.challengedBones.includes(id)) state.challengedBones.push(id);
  markReview(state);
  note(state, actor, "challenge-bone", id, now);
  return null;
}

function confirmBones(state: RoomState, actor: Participant, now: number) {
  if (state.stage !== "s4b") return "Branch selection is on this step.";
  if (!actsAs(state, actor, "leader")) return "Only the Leader confirms the bones.";
  if (!meter(state).ready) return meter(state).reason;
  const tally = voteTally(state.boneVotes);
  state.selectedBones = [...tally.keys()] as BoneId[];
  advance(state, "s4c", now);
  note(state, actor, "confirm-bones", state.selectedBones.join(", "), now);
  return null;
}

function followBone(state: RoomState, actor: Participant, id: BoneId, now: number) {
  if (state.stage !== "s4b" && state.stage !== "s4c" && state.stage !== "s4d") return "The team picks one bone to follow before the five Whys.";
  if (actor.kind !== "student") return "Students pick the bone the five Whys will follow.";
  if (!state.bones.some((bone) => bone.id === id)) return "That bone is not on the fish.";
  if (state.selectedBones.length > 0 && !state.selectedBones.includes(id)) return "Pick one of the bones the team already chose.";
  state.focusBone = id;
  note(state, actor, "follow-bone", id, now);
  return null;
}

function whyDepth(state: RoomState, id: string): number {
  const cause = state.causes.find((item) => item.id === id);
  if (cause) return 0;
  const hop = state.hops.find((item) => item.id === id);
  if (!hop) return 0;
  return 1 + whyDepth(state, hop.parentId);
}

function parentAllowed(state: RoomState, bone: BoneId, parentId: string) {
  const cause = state.causes.find((item) => item.id === parentId && item.bone === bone);
  if (cause) return true;
  const hop = state.hops.find((item) => item.id === parentId && item.bone === bone && !item.proposed);
  return Boolean(hop);
}

function addHop(
  state: RoomState,
  actor: Participant,
  action: Extract<Action, { type: "add-hop" }>,
  now: number,
) {
  if (state.stage !== "s4c") return "Why hops grow on the bone the team follows.";
  if (!actsAs(state, actor, "insight")) return "Only the Insight Extractor adds a Why hop.";
  const focus = state.focusBone ?? null;
  if (!focus) return "Students pick one bone to follow before the five Whys.";
  if (action.bone !== focus) return "The five Whys stay on the bone the team picked.";
  if (!parentAllowed(state, action.bone, action.parentId)) return "Attach the hop to a cause or hop on that bone.";
  if (whyDepth(state, action.parentId) >= 5) return "Five Whys is the end of this line.";
  const text = clip(action.text, 200);
  if (text.length < 3) return "Write one Why, not a speech.";
  if (!action.chip) return "Tag this hop before adding another.";
  state.hops.push({
    id: uid("hop"),
    bone: action.bone,
    parentId: action.parentId,
    text,
    authorId: actor.id,
    chip: action.chip,
    askWhom: "",
    proposed: false,
  });
  note(state, actor, "add-hop", text, now);
  return null;
}

function proposeHop(
  state: RoomState,
  actor: Participant,
  action: Extract<Action, { type: "propose-hop" }>,
  now: number,
) {
  if (state.stage !== "s4c") return "Proposals happen while you ask Why.";
  if (actsAs(state, actor, "insight")) return "Insight Extractor adds the hop directly.";
  if (!state.selectedBones.includes(action.bone)) return "Ask Why on glowing bones only.";
  if (!parentAllowed(state, action.bone, action.parentId)) return "Attach the proposal to a cause or hop on that bone.";
  const text = clip(action.text, 200);
  if (text.length < 3) return "Write one Why.";
  state.hops.push({
    id: uid("hop"),
    bone: action.bone,
    parentId: action.parentId,
    text,
    authorId: actor.id,
    chip: null,
    askWhom: "",
    proposed: true,
  });
  note(state, actor, "propose-hop", text, now);
  return null;
}

function acceptHop(state: RoomState, actor: Participant, id: string, chip: Chip, now: number) {
  if (!actsAs(state, actor, "insight")) return "Insight Extractor accepts a proposed Why.";
  const hop = state.hops.find((item) => item.id === id);
  if (!hop) return "That proposal is gone.";
  hop.proposed = false;
  hop.chip = chip;
  note(state, actor, "accept-hop", hop.text, now);
  return null;
}

function editHop(state: RoomState, actor: Participant, id: string, text: string, now: number) {
  const hop = state.hops.find((item) => item.id === id);
  if (!hop) return "That hop is gone.";
  if (hop.authorId !== actor.id && !actsAs(state, actor, "insight")) return "The author or Insight Extractor edits hop text.";
  const body = clip(text, 200);
  if (body.length < 3) return "Write one Why.";
  hop.text = body;
  note(state, actor, "edit-hop", body, now);
  return null;
}

function askWhom(state: RoomState, actor: Participant, id: string, whom: string, now: number) {
  if (!actsAs(state, actor, "interviewer")) return "Lead Interviewer adds Ask whom?";
  const hop = state.hops.find((item) => item.id === id);
  if (!hop) return "That hop is gone.";
  if (hop.chip !== "need-to-check") return "Ask whom belongs on Need-to-check hops.";
  const body = clip(whom, 80);
  if (body.length < 2) return "Name who you would ask.";
  hop.askWhom = body;
  note(state, actor, "ask-whom", body, now);
  return null;
}

function markRoot(state: RoomState, actor: Participant, id: string, now: number) {
  if (state.stage !== "s4c" && state.stage !== "s4d") return "Mark the root cause while the Whys are on the rib.";
  if (!actsAs(state, actor, "insight")) return "The Insight Extractor marks which Why is the root cause.";
  const hop = state.hops.find((item) => item.id === id && !item.proposed);
  if (!hop) return "That Why is not on the rib.";
  const turningOn = !hop.root;
  for (const item of state.hops) {
    if (item.bone === hop.bone) item.root = false;
  }
  hop.root = turningOn;
  for (const pin of state.pins) {
    if (pin.blocked || pin.bone !== hop.bone) continue;
    const suggested = suggestCandidates(state, pin);
    if (!pin.obstacleSet) pin.obstacle = suggested.obstacle;
    if (!pin.insightSet) pin.insight = suggested.insight;
  }
  note(state, actor, "mark-root", turningOn ? hop.text : "Root mark cleared", now);
  return null;
}

function continuePins(state: RoomState, actor: Participant, now: number) {
  if (state.stage !== "s4c") return "Pins open after the Why step.";
  if (!actsAs(state, actor, "leader")) return "Only the Leader opens pins.";
  if (!meter(state).ready) return meter(state).reason;
  advance(state, "s4d", now);
  note(state, actor, "continue-pins", "Pins open", now);
  return null;
}

function nominatePin(state: RoomState, actor: Participant, causeId: string, hopId: string | null, now: number) {
  if (state.stage !== "s4d") return "Pins are chosen on this step.";
  const cause = state.causes.find((item) => item.id === causeId);
  if (!cause?.bone) return "Pin a cause that is on a bone.";
  const allowed = cause.bone === state.focusBone || state.selectedBones.includes(cause.bone) || state.selectedBones.length === 0;
  if (!allowed) return "Pin a cause on the bone the team is following.";
  if (state.pins.some((pin) => pin.causeId === causeId && !pin.blocked)) return "That cause is already nominated.";
  const rootHop = state.hops.find((hop) => hop.bone === cause.bone && hop.root && !hop.proposed);
  const chosenHop = hopId ?? rootHop?.id ?? null;
  const suggested = suggestCandidates(state, {
    id: "tmp",
    bone: cause.bone,
    causeId,
    hopId: chosenHop,
    by: actor.id,
    votes: [],
    placed: false,
    blocked: false,
    obstacle: "",
    insight: "",
    obstacleSet: false,
    insightSet: false,
  });
  state.pins.push({
    id: uid("pin"),
    bone: cause.bone,
    causeId,
    hopId: chosenHop,
    by: actor.id,
    votes: [actor.id],
    placed: false,
    blocked: false,
    obstacle: suggested.obstacle,
    insight: suggested.insight,
    obstacleSet: false,
    insightSet: false,
  });
  note(state, actor, "nominate-pin", cause.text, now);
  return null;
}

function votePin(state: RoomState, actor: Participant, id: string, now: number) {
  const pin = state.pins.find((item) => item.id === id);
  if (!pin) return "That pin is gone.";
  if (pin.votes.includes(actor.id)) pin.votes = pin.votes.filter((voter) => voter !== actor.id);
  else {
    const mine = state.pins.filter((item) => item.votes.includes(actor.id)).length;
    if (mine >= 3) return "You can support up to 3 pins.";
    pin.votes.push(actor.id);
  }
  note(state, actor, "vote-pin", id, now);
  return null;
}

function placePin(state: RoomState, actor: Participant, id: string, now: number) {
  if (!actsAs(state, actor, "mapper")) return "Theme Mapper places the pin marker.";
  const pin = state.pins.find((item) => item.id === id);
  if (!pin) return "That pin is gone.";
  if (pin.blocked) return "A pin is blocked — replace or override.";
  const placed = state.pins.filter((item) => item.placed && !item.blocked).length;
  if (!pin.placed && placed >= 3) return "Three pins are already placed. Unpin the focus before adding another.";
  pin.placed = true;
  note(state, actor, "place-pin", pin.causeId, now);
  return null;
}

function setCandidates(state: RoomState, actor: Participant, id: string, obstacle: string, insight: string, now: number) {
  if (!actsAs(state, actor, "insight")) return "Insight Extractor sets Obstacle and Insight candidates.";
  const pin = state.pins.find((item) => item.id === id);
  if (!pin) return "That pin is gone.";
  const obstacleText = clip(obstacle, 200);
  const insightText = clip(insight, 200);
  if (obstacleText.length < 3 || insightText.length < 3) return "Label both the Obstacle candidate and the Insight candidate.";
  pin.obstacle = obstacleText;
  pin.insight = insightText;
  pin.obstacleSet = true;
  pin.insightSet = true;
  note(state, actor, "set-candidates", `${obstacleText} / ${insightText}`, now);
  return null;
}

function blockPin(state: RoomState, actor: Participant, id: string, now: number) {
  if (!actsAs(state, actor, "devil")) return "Devil's Advocate blocks an unsupported pin.";
  if (state.veto || state.vetoSpent[state.stage]) return "You can veto once this stage.";
  const pin = state.pins.find((item) => item.id === id);
  if (!pin) return "That pin is gone.";
  pin.blocked = true;
  pin.placed = false;
  state.vetoSpent[state.stage] = true;
  state.veto = { stage: state.stage, kind: "pin", targetId: id, at: now, overrideVotes: [], note: "Unsupported pin" };
  markReview(state);
  note(state, actor, "block-pin", id, now);
  return null;
}

function lockFishbone(state: RoomState, actor: Participant, now: number) {
  return lockWhenReady(state, actor, now, "s4d", "s5", "lock-fishbone");
}

function saveStatement(state: RoomState, actor: Participant, action: Extract<Action, { type: "save-statement" }>, now: number) {
  if (state.stage !== "s5" && state.stage !== "s6") return "Statements are written in the sprint, then fixed in the red-flag round.";
  let card = state.statements.find((item) => item.authorId === actor.id);
  if (card?.submitted && state.stage === "s5") return "You already submitted. Wait for the red-flag round to edit.";
  const carry = carryFor(state, action.pinId);
  const need = clip(action.need, 200);
  let who = clip(action.who, 120);
  let obstacle = clip(action.obstacle, 200);
  let harm = clip(action.harm, 280);
  let insight = clip(action.insight, 200);
  if (action.useNewVersion) {
    who = carry.who;
    obstacle = carry.obstacle;
    harm = carry.harm;
    insight = carry.insight;
  }
  if (!card) {
    card = {
      id: uid("stmt"),
      authorId: actor.id,
      pinId: carry.pinId,
      who: "",
      need: "",
      obstacle: "",
      harm: "",
      insight: "",
      edited: { who: false, obstacle: false, harm: false, insight: false },
      carryStamp: "",
      deepen: emptyDeepen(),
      submitted: false,
      tags: [],
      proposal: null,
      recognizable: null,
      clusterId: null,
    };
    state.statements.push(card);
  }
  card.pinId = action.useNewVersion ? carry.pinId : action.pinId ?? carry.pinId;
  card.who = who;
  card.need = need;
  card.obstacle = obstacle;
  card.harm = harm;
  card.insight = insight;
  card.edited = {
    who: who !== carry.who,
    obstacle: obstacle !== carry.obstacle,
    harm: harm !== carry.harm,
    insight: insight !== carry.insight,
  };
  card.carryStamp = carry.stamp;
  if (state.stage === "s6" && card.submitted) {
    card.tags = [];
    state.fixRoundDone = true;
  }
  card.deepen = {
    context: clip(action.deepen?.context, 240),
    emotion: clip(action.deepen?.emotion, 240),
    impact: clip(action.deepen?.impact, 240),
    alternatives: clip(action.deepen?.alternatives, 240),
  };
  if (action.submit) {
    if (state.stage !== "s5") return "Submit during the statement sprint.";
    const issues = statementIssues(card);
    if (issues.length) return issues[0];
    card.submitted = true;
  }
  note(state, actor, action.submit ? "submit-statement" : "save-statement", sentence(card), now);
  return null;
}

function submitStatement(state: RoomState, actor: Participant, now: number) {
  if (state.stage !== "s5") return "Submit during the statement sprint.";
  const card = state.statements.find((item) => item.authorId === actor.id);
  if (!card) return "Write your statement first.";
  const issues = statementIssues(card);
  if (issues.length) return issues[0];
  card.submitted = true;
  note(state, actor, "submit-statement", sentence(card), now);
  return null;
}

function tagStatement(state: RoomState, actor: Participant, id: string, tag: Statement["tags"][number], on: boolean, now: number) {
  if (state.stage !== "s6") return "Red-flag tags belong on the choose step.";
  if (!actsAs(state, actor, "devil")) return "Devil's Advocate applies official red-flag tags.";
  const card = state.statements.find((item) => item.id === id && item.submitted);
  if (!card) return "That statement is not on the table.";
  if (on && !card.tags.includes(tag)) card.tags.push(tag);
  if (!on) card.tags = card.tags.filter((item) => item !== tag);
  markReview(state);
  note(state, actor, on ? "tag" : "untag", tag, now);
  return null;
}

function proposeFix(state: RoomState, actor: Participant, action: Extract<Action, { type: "propose-fix" }>, now: number) {
  if (!actsAs(state, actor, "insight")) return "Insight Extractor proposes a five-blank-safe fix.";
  const card = state.statements.find((item) => item.id === action.id);
  if (!card) return "That statement is not on the table.";
  const proposal = {
    who: clip(action.who, 120),
    need: clip(action.need, 200),
    obstacle: clip(action.obstacle, 200),
    harm: clip(action.harm, 280),
    insight: clip(action.insight, 200),
    by: actor.id,
  };
  if (statementIssues(proposal).length) return statementIssues(proposal)[0];
  card.proposal = proposal;
  note(state, actor, "propose-fix", sentence(proposal), now);
  return null;
}

function acceptFix(state: RoomState, actor: Participant, id: string, now: number) {
  const card = state.statements.find((item) => item.id === id);
  if (!card || card.authorId !== actor.id) return "Authors accept fixes on their own cards.";
  if (!card.proposal) return "There is no fix waiting on your card.";
  card.who = card.proposal.who;
  card.need = card.proposal.need;
  card.obstacle = card.proposal.obstacle;
  card.harm = card.proposal.harm;
  card.insight = card.proposal.insight;
  card.proposal = null;
  card.tags = [];
  state.fixRoundDone = true;
  note(state, actor, "accept-fix", sentence(card), now);
  return null;
}

function cluster(state: RoomState, actor: Participant, a: string, b: string, now: number) {
  if (!actsAs(state, actor, "mapper")) return "Theme Mapper clusters near-duplicates.";
  const left = state.statements.find((item) => item.id === a);
  const right = state.statements.find((item) => item.id === b);
  if (!left || !right) return "Pick two statements.";
  const clusterId = left.clusterId || right.clusterId || uid("cluster");
  left.clusterId = clusterId;
  right.clusterId = clusterId;
  note(state, actor, "cluster", clusterId, now);
  return null;
}

function uncluster(state: RoomState, actor: Participant, id: string, now: number) {
  if (!actsAs(state, actor, "mapper")) return "Theme Mapper unclusters a stack.";
  const card = state.statements.find((item) => item.id === id);
  if (!card?.clusterId) return "That statement is not in a cluster.";
  const clusterId = card.clusterId;
  for (const item of state.statements) if (item.clusterId === clusterId) item.clusterId = null;
  note(state, actor, "uncluster", clusterId, now);
  return null;
}

function recognizable(state: RoomState, actor: Participant, id: string, value: boolean, now: number) {
  if (!actsAs(state, actor, "interviewer")) return "Lead Interviewer marks recognizable.";
  const card = state.statements.find((item) => item.id === id);
  if (!card) return "That statement is not on the table.";
  card.recognizable = value;
  note(state, actor, "recognizable", value ? "yes" : "no", now);
  return null;
}

function clustersDone(state: RoomState, actor: Participant, now: number) {
  if (state.stage !== "s6") return "Clusters happen when statements are on the table.";
  if (!actsAs(state, actor, "mapper")) return "Theme Mapper confirms clusters.";
  state.clustersDone = true;
  note(state, actor, "clusters-done", "Clusters settled", now);
  return null;
}

function openPackVote(state: RoomState, actor: Participant, now: number) {
  if (state.stage !== "s6") return "The pack vote is on the choose step.";
  if (!actsAs(state, actor, "leader")) return "Only the Leader opens the vote.";
  if (allFlagged(state) && !state.fixRoundDone) return "All statements are still red-flagged — complete one revision round.";
  if (!devilOk(state) || !insightReady(state) || !state.clustersDone) return meter(state).reason;
  state.packVoteOpen = true;
  note(state, actor, "open-pack-vote", "Pack vote open", now);
  return null;
}

function voteStatement(state: RoomState, actor: Participant, id: string, add: boolean, now: number) {
  if (!state.packVoteOpen) return "Wait for the Leader to open the vote.";
  if (!state.statements.some((card) => card.id === id && card.submitted)) return "Vote for a statement on the table.";
  const error = add ? addDot(state.statementVotes, actor.id, id, 2) : removeDot(state.statementVotes, actor.id, id);
  if (error) return error;
  note(state, actor, add ? "vote-statement" : "unvote-statement", id, now);
  return null;
}

function lockPack(state: RoomState, actor: Participant, now: number) {
  return lockWhenReady(state, actor, now, "s6", "s7", "lock-pack");
}

function reviewClear(state: RoomState, actor: Participant, now: number) {
  if (!actsAs(state, actor, "devil")) return "Devil's Advocate can clear a step when nothing needs a flag.";
  markReview(state);
  note(state, actor, "review-clear", state.stage, now);
  return null;
}

function noneNeeded(state: RoomState, actor: Participant, now: number) {
  if (state.stage !== "s6") return "That check happens when the statements are on the table.";
  if (!actsAs(state, actor, "insight")) return "Insight Extractor says when no polish is needed.";
  actor.insightNoneNeeded = true;
  note(state, actor, "none-needed", "No polish needed", now);
  return null;
}

function renameTeam(state: RoomState, actor: Participant, name: string, now: number) {
  if (!actsAs(state, actor, "leader")) return "Only the Leader renames the team.";
  const team = clip(name, 40);
  if (team.length < 2) return "Give the team a short name.";
  state.teamName = team;
  note(state, actor, "rename-team", team, now);
  return null;
}

export function lockedIncident(state: RoomState) {
  return state.incidents.find((card) => card.id === state.lockedIncidentId) ?? null;
}

export function packDocument(state: RoomState) {
  const priorities = priorityCards(state) ?? [];
  const whose = state.stakeholders.find((card) => card.id === state.summary.whoseId);
  const top = state.top3
    .map((id) => state.statements.find((card) => card.id === id))
    .filter((card): card is Statement => Boolean(card));
  const lines = [
    `C60 pack · ${state.teamName}`,
    `Theme: ${state.theme}`,
    "",
    "Artifact A — stakeholder map",
    ...roots(state).map((card) => {
      const where = card.grid ? quadrantName(card.grid) : "unplaced";
      const source = card.source === "heard" ? "Heard from" : "Our guess";
      return `- ${card.label} · ${source} · ${where}${card.talkTo ? " · Talk-to" : ""}${card.dailyPain ? " · Daily pain" : ""}`;
    }),
    `Priorities: ${priorities.map((card) => card.label).join("; ") || "—"}`,
    `Whose problem: ${whose?.label ?? "—"}`,
    `What goes wrong: ${state.summary.harm || "—"}`,
    "",
    "Artifact B — fishbone",
    `Incident: ${lockedIncident(state)?.text ?? "—"}`,
    ...state.causes.filter((cause) => cause.bone).map((cause) => `- ${boneLabel(state, cause.bone)} · ${cause.text}${cause.evidence ? ` · “${cause.evidence}”` : ""}`),
    ...state.hops.filter((hop) => !hop.proposed).map((hop) => `- Why on ${boneLabel(state, hop.bone)} · ${hop.text} · ${hop.chip ?? "untagged"}`),
    ...state.pins.filter((pin) => pin.placed && !pin.blocked).map((pin) => `- Pin · obstacle: ${pin.obstacle} · insight: ${pin.insight}`),
    "",
    "Artifact C — top 3 five-blank statements",
    ...top.map((card, index) => `${index + 1}. ${sentence(card)}${shortPreview(card) ? `\n   Preview: ${shortPreview(card)}` : ""}`),
    "",
    "Suggested next: interviews (C18) or statement polish (C28).",
  ];
  return lines.join("\n");
}

function boneLabel(state: RoomState, id: BoneId | null) {
  return state.bones.find((bone) => bone.id === id)?.label ?? "Tray";
}

export function authorNames(state: RoomState, card: Stakeholder) {
  const ids = card.authorIds.length ? card.authorIds : [card.authorId].filter(Boolean);
  const names = ids.map((id) => person(state, id)?.name).filter((name): name is string => Boolean(name));
  if (card.planted) return "Pilot claim";
  return names.join(", ") || "Team";
}

export type { Quadrant };
