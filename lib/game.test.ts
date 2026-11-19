import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyDeepen, makeState, type Action, type RoleId, type RoomState } from "@/lib/domain";
import { applyAction, carryFor, meter, present, roots, suggestCandidates } from "@/lib/game";

const NOW = 1_700_000_000_000;

function room() {
  const students: { id: string; name: string; role: RoleId; claimed: boolean }[] = [
    { id: "alex", name: "Alex", role: "leader", claimed: true },
    { id: "leo", name: "Leo", role: "interviewer", claimed: true },
    { id: "maya", name: "Maya", role: "mapper", claimed: true },
    { id: "asha", name: "Asha", role: "insight", claimed: true },
    { id: "kai", name: "Kai", role: "devil", claimed: true },
  ];
  return makeState({
    code: "K7MP",
    teamName: "Team Cocoa",
    theme: "The chocolate challenge",
    now: NOW,
    teacher: { id: "teacher", name: "Teacher" },
    students,
  });
}

function act(state: RoomState, name: string, action: Action, now = NOW) {
  const actor = state.participants.find((person) => person.name === name);
  assert.ok(actor, name);
  const result = applyAction(state, actor.id, action, now);
  if (!result.ok) throw new Error(`${name} ${action.type}: ${result.error}`);
  return result.state;
}

function fail(state: RoomState, name: string, action: Action) {
  const actor = state.participants.find((person) => person.name === name);
  assert.ok(actor);
  const result = applyAction(state, actor.id, action, NOW);
  assert.equal(result.ok, false);
  return result.ok ? "" : result.error;
}

describe("C60 room rules", () => {
  it("lets the teacher move back and reset without losing the room", () => {
    let state = room();
    state = act(state, "Teacher", { type: "next-step" });
    state = act(state, "Alex", { type: "add-stakeholder", label: "Buying agents" });
    state = act(state, "Teacher", { type: "next-step" });
    assert.equal(state.stage, "s1b");
    state = act(state, "Teacher", { type: "previous-step" });
    assert.equal(state.stage, "s1");
    assert.equal(state.stakeholders.some((card) => card.label === "Buying agents"), true);
    state = act(state, "Teacher", { type: "reset-board" });
    assert.equal(state.stage, "s0");
    assert.equal(state.stakeholders.length, 0);
    assert.equal(state.teamName, "Team Cocoa");
    assert.equal(state.participants.find((person) => person.name === "Maya")?.role, "mapper");
    assert.match(fail(state, "Alex", { type: "reset-board" }), /teacher/i);
  });

  it("lets the teacher open the next screen from any step", () => {
    let state = room();
    state = act(state, "Teacher", { type: "next-step" });
    assert.equal(state.stage, "s1");
    state = act(state, "Alex", { type: "add-stakeholder", label: "Buying agents" });
    state = act(state, "Teacher", { type: "next-step" });
    assert.equal(state.stage, "s1b");
    assert.match(fail(state, "Alex", { type: "next-step" }), /teacher/i);
  });

  it("moves on when the teacher ends time, even with fewer than 3 cards", () => {
    let state = room();
    state = act(state, "Alex", { type: "start" });
    state = act(state, "Alex", { type: "add-stakeholder", label: "Buying agents" });
    assert.equal(meter(state).ready, true);
    state = act(state, "Teacher", { type: "timer", op: "end" });
    assert.equal(state.stage, "s1b");
    assert.match(fail(state, "Alex", { type: "timer", op: "start" }), /teacher/i);
  });

  it("lets the teacher mark a film as played for the class", () => {
    let state = room();
    assert.deepEqual(state.filmsPlayed, []);
    assert.match(fail(state, "Leo", { type: "play-film", id: "scene" }), /teacher/i);
    assert.match(fail(state, "Teacher", { type: "play-film", id: "trailer" }), /not in this lesson/);
    state = act(state, "Teacher", { type: "play-film", id: "scene" });
    state = act(state, "Teacher", { type: "play-film", id: "scene" });
    state = act(state, "Teacher", { type: "play-film", id: "stakeholders" });
    assert.deepEqual(state.filmsPlayed, ["scene", "stakeholders"]);
  });

  it("keeps merge, heard-from, and locks role-gated", () => {
    let state = room();
    assert.match(fail(state, "Maya", { type: "start" }), /Leader/);
    state = act(state, "Alex", { type: "start" });
    assert.equal(state.stage, "s1");
    assert.match(fail(state, "Leo", { type: "add-stakeholder", label: "a tracking app" }), /aren't stakeholders/);
    state = act(state, "Leo", { type: "add-stakeholder", label: "First-year students" });
    assert.match(fail(state, "Maya", { type: "edit-stakeholder", id: state.stakeholders[0].id, label: "Parents" }), /own cards/);
  });

  it("carries who from the map, harm from the incident, obstacle from the pinned cause, and insight from the marked root", () => {
    let state = room();
    let now = NOW;
    const next = () => {
      now += 1000;
      return now;
    };
    state = act(state, "Alex", { type: "start" }, next());
    const labels = [
      ["Alex", ["Village buyer", "Cooperative lead", "Export inspector"]],
      ["Leo", ["Cocoa farmers", "Buying agents", "Chocolate makers"]],
      ["Maya", ["Field transporters", "Drying shed workers", "Local traders"]],
      ["Asha", ["Children on farms", "Seasonal pickers", "Younger helpers"]],
      ["Kai", ["Scale operator", "Warehouse clerk", "Price board"]],
    ] as const;
    for (const [name, cards] of labels) {
      for (const label of cards) state = act(state, name, { type: "add-stakeholder", label }, next());
    }
    assert.equal(meter(state).ready, true);
    state = act(state, "Teacher", { type: "timer", op: "end" }, next());
    assert.equal(state.stage, "s1b");
    assert.ok(state.stakeholders.some((card) => card.planted && card.source === "guess"));

    const pile = roots(state);
    const left = pile.find((card) => card.label === "Buying agents");
    const right = pile.find((card) => card.label === "Local traders");
    assert.ok(left && right);
    assert.match(fail(state, "Leo", { type: "merge", a: left.id, b: right.id }), /Theme Mapper/);
    state = act(state, "Maya", { type: "merge", a: left.id, b: right.id }, next());
    state = act(state, "Kai", { type: "review-clear" }, next());
    state = act(state, "Maya", { type: "merges-done" }, next());
    assert.equal(state.stage, "s2");

    for (const card of roots(state)) {
      const interest = card.label.includes("Cocoa") || card.label.includes("Children") ? "high" : "low";
      const power = card.label.includes("buyer") || card.label.includes("makers") || card.label.includes("inspector") ? "high" : "low";
      state = act(state, "Maya", { type: "place", id: card.id, power, interest }, next());
    }
    state = act(state, "Alex", { type: "open-vote" }, next());
    const priorities = [
      roots(state).find((card) => card.label === "Cocoa farmers")!,
      roots(state).find((card) => card.label === "Children on farms")!,
    ];
    for (const person of present(state)) {
      state = act(state, person.name, { type: "vote-card", id: priorities[0].id }, next());
      state = act(state, person.name, { type: "vote-card", id: priorities[1].id }, next());
    }
    assert.match(
      fail(state, "Maya", { type: "source", id: priorities[0].id, source: "heard" }),
      /Lead Interviewer/,
    );
    state = act(state, "Leo", { type: "source", id: priorities[0].id, source: "heard" }, next());
    state = act(state, "Leo", { type: "whose", id: priorities[0].id }, next());
    state = act(state, "Leo", { type: "harm", text: "They receive only a tiny fraction of the bar price." }, next());
    assert.equal(meter(state).ready, false);
    state = act(state, "Kai", { type: "flag-missing", flag: "blocker" }, next());
    assert.equal(meter(state).color, "green");
    state = act(state, "Alex", { type: "lock-map" }, next());
    assert.equal(state.stage, "s3");
    assert.equal(state.mapLocked, true);

    state = act(
      state,
      "Leo",
      { type: "add-incident", text: "Last Tuesday, a family's dried cocoa bag weighed less on the buyer's scale." },
      next(),
    );
    for (const person of present(state)) {
      state = act(state, person.name, { type: "vote-incident", id: state.incidents[0].id }, next());
    }
    state = act(state, "Kai", { type: "review-clear" }, next());
    state = act(state, "Alex", { type: "lock-incident" }, next());
    assert.equal(state.stage, "s4a");
    assert.match(state.incidents[0].text, /Tuesday/);

    const causes = ["Cocoa trees take years before the first harvest", "Grade is announced after weighing", "A day of cutting pods pays only a few cents", "Beans must be fermented before sale", "The scale belongs only to the buyer", "Rain spoils beans drying outside"];
    const names = present(state).map((person) => person.name);
    names.forEach((name, index) => {
      state = act(state, name, { type: "add-cause", text: causes[index] }, next());
    });
    state = act(state, "Alex", { type: "add-cause", text: "Buyers leave before farmers can check" }, next());
    state = act(state, "Leo", { type: "add-cause", text: "Market truck arrives before drying finishes", bone: "timing" }, next());
    assert.equal(state.causes.at(-1)?.bone, "timing");
    const boneIds = ["timing", "communication", "value", "process", "tools", "environment"] as const;
    state.causes.forEach((cause, index) => {
      state = act(state, "Maya", { type: "snap", id: cause.id, bone: boneIds[index] }, next());
    });
    state = act(state, "Leo", { type: "evidence", id: state.causes[0].id, quote: "We only get ten minutes once we sit." }, next());
    state = act(state, "Kai", { type: "review-clear" }, next());
    state = act(state, "Maya", { type: "bones-ready" }, next());
    assert.equal(state.stage, "s4b");

    for (const person of present(state)) {
      state = act(state, person.name, { type: "vote-bone", id: "timing" }, next());
      state = act(state, person.name, { type: "vote-bone", id: "communication" }, next());
    }
    state = act(state, "Kai", { type: "review-clear" }, next());
    state = act(state, "Alex", { type: "confirm-bones" }, next());
    assert.deepEqual(state.selectedBones.sort(), ["communication", "timing"]);

    const timing = state.causes.find((cause) => cause.bone === "timing")!;
    const communication = state.causes.find((cause) => cause.bone === "communication")!;
    state = act(state, "Asha", { type: "follow-bone", id: "timing" }, next());
    state = act(
      state,
      "Asha",
      {
        type: "add-hop",
        bone: "timing",
        parentId: timing.id,
        text: "The harvest schedule leaves no buffer before rain",
        chip: "evidence",
      },
      next(),
    );
    state = act(state, "Leo", { type: "follow-bone", id: "communication" }, next());
    state = act(
      state,
      "Asha",
      {
        type: "add-hop",
        bone: "communication",
        parentId: communication.id,
        text: "The grade is decided after beans leave the household",
        chip: "evidence",
      },
      next(),
    );
    state = act(state, "Kai", { type: "review-clear" }, next());
    state = act(state, "Alex", { type: "continue-pins" }, next());
    const line = state.hops.find((hop) => hop.text.startsWith("The harvest schedule"))!;
    assert.equal(
      suggestCandidates(state, {
        id: "tmp",
        bone: "timing",
        causeId: timing.id,
        hopId: null,
        by: "asha",
        votes: [],
        placed: false,
        blocked: false,
        obstacle: "",
        insight: "",
        obstacleSet: false,
        insightSet: false,
      }).insight,
      "",
    );
    state = act(state, "Asha", { type: "mark-root", id: line.id }, next());
    state = act(state, "Asha", { type: "nominate-pin", causeId: timing.id, hopId: null }, next());
    const pin = state.pins[0];
    assert.equal(pin.obstacle, timing.text);
    assert.equal(pin.insight, line.text);
    state = act(state, "Maya", { type: "place-pin", id: pin.id }, next());
    state = act(
      state,
      "Asha",
      {
        type: "set-candidates",
        id: pin.id,
        obstacle: timing.text,
        insight: line.text,
      },
      next(),
    );
    state = act(state, "Kai", { type: "review-clear" }, next());
    state = act(state, "Alex", { type: "lock-fishbone" }, next());
    assert.equal(state.stage, "s5");

    const carry = carryFor(state, pin.id);
    assert.equal(carry.who, "Cocoa farmers");
    assert.equal(carry.harm, "Last Tuesday, a family's dried cocoa bag weighed less on the buyer's scale.");
    assert.equal(carry.obstacle, timing.text);
    assert.equal(carry.insight, line.text);

    const needs = [
      "a fair price that covers a year of harvest work",
      "a clear grade before beans leave the farm",
      "a checked scale they can verify themselves",
      "covered drying space when rain starts",
      "payment on the day the beans are weighed",
    ];
    present(state).forEach((person, index) => {
      state = act(
        state,
        person.name,
        {
          type: "save-statement",
          pinId: pin.id,
          who: carry.who,
          need: needs[index],
          obstacle: carry.obstacle,
          harm: carry.harm,
          insight: carry.insight,
          deepen: emptyDeepen(),
          useNewVersion: false,
        },
        next(),
      );
      const draft = state.statements.find((card) => card.authorId === person.id)!;
      assert.equal(draft.need, needs[index]);
      assert.notEqual(draft.need, "");
      state = act(state, person.name, { type: "submit-statement" }, next());
    });
    assert.equal(state.stage, "s6");
    assert.equal(state.statements.length, 5);
    assert.ok(state.statements.every((card) => card.need && card.who === "Cocoa farmers"));

    state = act(state, "Kai", { type: "review-clear" }, next());
    state = act(state, "Asha", { type: "none-needed" }, next());
    state = act(state, "Maya", { type: "clusters-done" }, next());
    state = act(state, "Alex", { type: "open-pack-vote" }, next());
    const ids = state.statements.map((card) => card.id);
    const ballots: Record<string, [string, string]> = {
      Alex: [ids[0], ids[1]],
      Leo: [ids[0], ids[1]],
      Maya: [ids[0], ids[2]],
      Asha: [ids[1], ids[2]],
      Kai: [ids[0], ids[3]],
    };
    for (const person of present(state)) {
      for (const id of ballots[person.name]) state = act(state, person.name, { type: "vote-statement", id }, next());
    }
    state = act(state, "Alex", { type: "lock-pack" }, next());
    assert.equal(state.stage, "s7");
    assert.equal(state.top3.length, 3);
    assert.equal(state.packLocked, true);
  });

  it("blocks generic Who and solution words in Need", () => {
    let state = room();
    state.stage = "s5";
    state.summary = {
      open: true,
      whoseId: "who",
      confirmed: true,
      harm: "They leave hungry.",
    };
    state.stakeholders.push({
      id: "who",
      authorId: "leo",
      label: "Cocoa farmers",
      source: "heard",
      planted: false,
      authorIds: ["leo"],
      mergedLabels: [],
      mergedInto: null,
      grid: { power: "low", interest: "high" },
      talkTo: true,
      dailyPain: false,
      challenged: false,
    });
    state.pins.push({
      id: "pin",
      bone: "timing",
      causeId: "cause",
      hopId: null,
      by: "asha",
      votes: [],
      placed: true,
      blocked: false,
      obstacle: "The harvest window is tight",
      insight: "The grade is set after sale",
      obstacleSet: true,
      insightSet: true,
    });
    const base = {
      type: "save-statement" as const,
      pinId: "pin",
      who: "users",
      need: "an app that tracks cocoa prices",
      obstacle: "The harvest window is tight",
      harm: "They receive less than expected.",
      insight: "The grade is set after sale",
      deepen: emptyDeepen(),
      useNewVersion: false,
    };
    state = act(state, "Alex", base);
    assert.match(fail(state, "Alex", { type: "submit-statement" }), /generic|solution|human need/i);
    state = act(state, "Alex", { ...base, who: "Cocoa farmers", need: "a fair price they can verify" });
    state = act(state, "Alex", { type: "submit-statement" });
    assert.equal(state.statements[0].need, "a fair price they can verify");
    assert.equal(state.statements[0].submitted, true);
  });
});
