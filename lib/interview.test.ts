import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseInterviewTurns } from "./gemini-interview";
import {
  fitPersonaAnswer,
  interviewSoundsReal,
  mapInterview,
  mapReply,
  needSeed,
  presentInterviewTurns,
  replySoundsReal,
  scriptSoundsGuessed,
} from "./interview";

describe("interview persona", () => {
  const brief = {
    theme: "The chocolate challenge",
    label: "Cocoa farmers",
    harm: "They received less for their dried cocoa bag on the buyer's scale.",
    heard: true,
    others: ["Buying agents"],
  };

  it("writes a short interview from the map", () => {
    const turns = mapInterview(brief);
    assert.ok(turns.length >= 6);
    assert.match(turns.map((turn) => turn.text).join(" "), /buyer's scale/);
  });

  it("turns the first answer into a need phrase including contractions", () => {
    assert.equal(needSeed(mapInterview(brief)), "to get through the day without losing what matters to me");
    assert.equal(
      needSeed([
        { speaker: "team", text: "What are you trying to get done?" },
        { speaker: "persona", text: "I'm trying to harvest and dry enough good beans to pay school fees." },
      ]),
      "to harvest and dry enough good beans to pay school fees",
    );
  });

  it("parses fenced JSON and dialogue turns cleanly", () => {
    const fenced = [
      "```json",
      JSON.stringify([
        { speaker: "team", text: "What are you trying to get done?" },
        { speaker: "persona", text: "I'm trying to sell clean, dry cocoa beans at a fair weight." },
        { speaker: "team", text: "What gets in the way?" },
        { speaker: "persona", text: "Middlemen scales often read lower than 64 kg per bag [1]." },
      ]),
      "```",
    ].join("\n");
    const turns = parseInterviewTurns(fenced);
    assert.equal(turns.length, 4);
    assert.equal(turns[3]?.text, "Middlemen scales often read lower than 64 kg per bag.");

    const dialogue = [
      "Team: What are you trying to get done?",
      "Them: I'm trying to keep my trees healthy through the rainy season.",
      "Team: What happens?",
      "Them: Black pod spreads quickly when heavy rains hit.",
    ].join("\n");
    assert.equal(parseInterviewTurns(dialogue).length, 4);
  });

  it("refuses to pick a solution", () => {
    assert.match(mapReply("What app should we build?", brief), /will not pick your solution/);
  });

  it("answers a pay question without refusing to pick an incident", () => {
    const question = "how much money do you make in any given year? does it vary by month?";
    const reply = fitPersonaAnswer(
      question,
      "I’m just a guess and haven’t been checked with a real person, so I’m unsure of exact numbers. My pay probably changes each month, dropping low between cocoa harvests. That gap makes it really hard to afford basics and care for my family, which is my main worry. I can’t pick your team’s incident or solution, though.",
    );
    assert.match(reply, /pay probably changes each month/);
    assert.doesNotMatch(reply, /pick your team/i);
    assert.doesNotMatch(reply, /just a guess|real person/i);
    assert.equal(
      fitPersonaAnswer(
        question,
        "My pay changes each month, but I can't pick your team's incident or solution.",
      ),
      "My pay changes each month.",
    );
  });

  it("drops a scripted question that asks the persona to pick the incident", () => {
    const turns = presentInterviewTurns([
      { speaker: "team", text: "What are you trying to get done?" },
      {
        speaker: "persona",
        text: "I am trying to grow enough healthy cocoa beans to earn a steady living for my family, though I am just a class guess right now.",
      },
      { speaker: "team", text: "What tends to go wrong?" },
      {
        speaker: "persona",
        text: "I have not been checked with a real person yet, so I am uncertain, but it seems like sudden weather changes and low pay hit me the hardest.",
      },
      {
        speaker: "team",
        text: "Which problem should our group pick as our main incident, and what should we do to solve it?",
      },
      {
        speaker: "persona",
        text: "I cannot pick your team's incident or a solution for you, especially since I am still an unchecked guess and you should verify these details with a real farmer first.",
      },
    ]);
    assert.doesNotMatch(turns.map((turn) => turn.text).join(" "), /pick your team|class guess|real person|it seems like/i);
    assert.match(turns.map((turn) => turn.text).join(" "), /steady living/);
    assert.equal(turns.some((turn) => /sudden weather changes/i.test(turn.text)), false);
  });

  it("rejects a script that steps out of character", () => {
    const turns = [
      { speaker: "team" as const, text: "Hi! Thanks for talking with us. What are you trying to get done as a cocoa farmer?" },
      {
        speaker: "persona" as const,
        text: "I think I am trying to grow enough healthy cocoa beans to earn a steady living for my family, though I am just a class guess right now.",
      },
      { speaker: "team" as const, text: "Got it. What tends to go wrong or make that hardest for you?" },
      {
        speaker: "persona" as const,
        text: "I have not been checked with a real person yet, so I am uncertain, but it seems like sudden weather changes and low pay hit me the hardest.",
      },
      { speaker: "team" as const, text: "Why is that so stressful for you day to day?" },
      {
        speaker: "persona" as const,
        text: "Maybe it is because caring for cocoa trees takes so much time and effort, and when things go wrong, I worry I will not have enough money for food and school costs.",
      },
    ];
    assert.equal(scriptSoundsGuessed(turns), true);
    assert.equal(interviewSoundsReal(presentInterviewTurns(turns)), false);
  });

  it("accepts a short interview that uses real figures", () => {
    const turns = [
      { speaker: "team" as const, text: "What are you trying to get done?" },
      {
        speaker: "persona" as const,
        text: "I'm trying to dry this harvest and sell 64 kg bags before the June rains, so school fees are paid.",
      },
      { speaker: "team" as const, text: "What tends to go wrong?" },
      {
        speaker: "persona" as const,
        text: "Last month the buying agent’s scale read 58 kg on a bag I had weighed at 64 kg, and the price dropped with it.",
      },
      { speaker: "team" as const, text: "Can you give us one moment?" },
      {
        speaker: "persona" as const,
        text: "On a Thursday in March I stood at the shed while the agent marked the bag down. That gap was the week’s food money.",
      },
      { speaker: "team" as const, text: "Who else is part of that day?" },
      {
        speaker: "persona" as const,
        text: "My children turn the beans while I watch the scale, because a wet bag is rejected before it is even priced.",
      },
    ];
    assert.equal(scriptSoundsGuessed(turns), false);
    assert.equal(interviewSoundsReal(turns), true);
  });

  it("keeps a pay answer only when it includes a real figure", () => {
    const question = "how much money do you make in any given year? does it vary by month?";
    assert.equal(
      replySoundsReal(
        question,
        "Between harvests I might take home about 800 cedis in a quiet month, then closer to 2,000 cedis when the main crop sells.",
      ),
      true,
    );
    assert.equal(
      replySoundsReal(question, "My pay probably changes each month, dropping low between cocoa harvests."),
      false,
    );
  });

  it("keeps a refusal when the student asked for a solution", () => {
    const reply = fitPersonaAnswer(
      "What app should we build?",
      "I can tell you what happens to me. I will not pick your solution.",
    );
    assert.match(reply, /will not pick your solution/);
  });
});
