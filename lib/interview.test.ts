import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseInterviewTurns } from "./gemini-interview";
import { mapInterview, mapReply, needSeed } from "./interview";

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
});
