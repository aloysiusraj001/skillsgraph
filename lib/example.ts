import type { BoneId, Cause, Hop, Pin, RoomState, Stakeholder, Statement } from "@/lib/domain";
import { emptyDeepen } from "@/lib/domain";

// Filled chocolate-bar example. The class stays with cocoa farmers:
// who does the work, how safe it is, and what they are paid.
// Teacher Ms Rivera. Alex leader, Leo interviewer, Maya mapper, Asha insight, Kai devil.
export function fillExample(state: RoomState) {
  const id = Object.fromEntries(state.participants.map((person) => [person.name, person.id]));
  const alex = id.Alex;
  const leo = id.Leo;
  const maya = id.Maya;
  const asha = id.Asha;
  const kai = id.Kai;
  const all = [alex, leo, maya, asha, kai];

  for (const person of state.participants) {
    person.claimed = true;
    person.ready = true;
  }

  state.teamName = "Team Cocoa";
  state.theme = "The hidden world behind a chocolate bar";

  const farmers = stakeholder("sh-farmers", leo, "Cocoa farmers", "heard", { power: "low", interest: "high" }, true);
  const children = stakeholder("sh-children", asha, "Children on the farm", "heard", { power: "low", interest: "high" }, true);
  const buyers = stakeholder("sh-buyers", kai, "Buying agents", "heard", { power: "high", interest: "low" }, false);
  const coops = stakeholder("sh-coops", alex, "Cooperatives", "heard", { power: "high", interest: "high" }, false);
  const makers = stakeholder("sh-makers", maya, "Chocolate makers", "heard", { power: "high", interest: "low" }, false);
  const family = stakeholder("sh-family", leo, "Family workers", "heard", null, false);
  family.mergedInto = farmers.id;
  farmers.mergedLabels = ["Family workers"];

  const timing = cause("c-timing", alex, "Cocoa trees take years before the first harvest", "timing");
  const communication = cause("c-communication", leo, "Farmers are not told how the grade or the price was set", "communication");
  communication.evidence = "A farmer in Ghana said the grade was announced only after the bag was already weighed.";
  const value = cause("c-value", maya, "A day of cutting pods returns only a few cents of the bar's price", "value");
  const process = cause("c-process", asha, "Beans must be fermented and dried before anyone will buy them", "process");
  const tools = cause("c-tools", kai, "Pods are opened with machetes, and the scale belongs to the buyer", "tools");
  const environment = cause("c-environment", alex, "Beans dry in the open, so rain can spoil a week of work", "environment");

  const why1 = hop("h1", "value", value.id, asha, "The whole family, including children, cuts and opens the pods", "evidence");
  const why2 = hop("h2", "value", why1.id, leo, "The buyer pays from a scale the family cannot check", "assumption");
  const why3 = hop("h3", "value", why2.id, maya, "The grade is decided after the beans leave the household", "need-to-check");
  why3.askWhom = "The buying agent";
  const why4 = hop("h4", "value", why3.id, asha, "The farmer receives about 6 cents of every dollar spent on the bar", "evidence");
  why3.root = true;

  const pin: Pin = {
    id: "pin-value",
    bone: "value",
    causeId: value.id,
    hopId: why3.id,
    by: asha,
    votes: all,
    placed: true,
    blocked: false,
    obstacle: value.text,
    insight: why3.text,
    obstacleSet: true,
    insightSet: true,
  };

  const who = "Cocoa farmers";
  const obstacle = value.text;
  const mapHarm = "They do the harvesting, fermenting, and drying, and receive about 6 cents of each dollar spent on the bar.";
  const harm = "At the village buying station, a family's bag of dried cocoa weighed less on the buyer's scale than on a checked scale.";
  const insight = why3.text;
  const needs = [
    [alex, "a price for each bag that covers a year of work on the trees"],
    [leo, "a scale they can check before the bag is priced"],
    [maya, "tools that keep blades and spray away from children's hands"],
    [asha, "to know the grade before their beans are mixed with other farms"],
    [kai, "payment on the day the beans are sold"],
  ] as const;

  state.stage = "s4d";
  state.holdStage = true;
  state.s1Revealed = true;
  state.mapLocked = true;
  state.bonesReady = true;
  state.fishboneLocked = false;
  state.summary = { open: true, whoseId: farmers.id, confirmed: true, harm: mapHarm };
  state.stakeholders = [farmers, children, buyers, coops, makers, family];
  state.cardVotes = [];
  state.incidents = [{
    id: "inc-scale",
    authorId: leo,
    text: "At the village buying station, a family's bag of dried cocoa weighed less on the buyer's scale than on a checked scale.",
    votes: all,
    blame: false,
  }];
  state.lockedIncidentId = "inc-scale";
  state.causes = [timing, communication, value, process, tools, environment];
  state.hops = [why1, why2, why3, why4];
  state.selectedBones = ["value"];
  state.focusBone = "value";
  state.pins = [pin];
  state.reviewed = { s1: true, s1b: true, s2: true, s3: true, s4a: true, s4b: true, s4c: true };
  state.statements = needs.map(([authorId, need], index) => statement(`st-${index + 1}`, authorId, pin.id, who, need, obstacle, harm, insight));
  state.log = [
    { at: state.createdAt, actorId: leo, action: "add-incident", detail: state.incidents[0].text },
    { at: state.createdAt, actorId: asha, action: "mark-root", detail: why3.text },
    { at: state.createdAt, actorId: maya, action: "place-pin", detail: value.text },
  ];
  return state;
}

function stakeholder(
  id: string,
  authorId: string,
  label: string,
  source: "heard" | "guess",
  grid: Stakeholder["grid"],
  dailyPain: boolean,
): Stakeholder {
  return {
    id,
    authorId,
    label,
    source,
    planted: false,
    authorIds: [authorId],
    mergedLabels: [],
    mergedInto: null,
    grid,
    talkTo: source === "heard",
    dailyPain,
    challenged: false,
  };
}

function cause(id: string, authorId: string, text: string, bone: BoneId): Cause {
  return { id, authorId, text, bone, blame: false, vague: false, dailyPain: false, evidence: null };
}

function hop(id: string, bone: BoneId, parentId: string, authorId: string, text: string, chip: Hop["chip"]): Hop {
  return { id, bone, parentId, text, authorId, chip, askWhom: "", proposed: false, root: false };
}

function statement(
  id: string,
  authorId: string,
  pinId: string,
  who: string,
  need: string,
  obstacle: string,
  harm: string,
  insight: string,
): Statement {
  return {
    id,
    authorId,
    pinId,
    who,
    need,
    obstacle,
    harm,
    insight,
    edited: { who: false, obstacle: false, harm: false, insight: false },
    carryStamp: [who, harm, obstacle, insight, pinId].join("|"),
    deepen: emptyDeepen(),
    submitted: true,
    tags: [],
    proposal: null,
    recognizable: true,
    clusterId: null,
  };
}
