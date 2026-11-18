import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapInterview, mapReply, needSeed } from "./interview";

describe("interview persona", () => {
  const brief = {
    theme: "School lunch waste",
    label: "First-year students",
    harm: "They leave with trays still full and skip the meal.",
    heard: true,
    others: ["Kitchen staff"],
  };

  it("writes a short interview from the map", () => {
    const turns = mapInterview(brief);
    assert.ok(turns.length >= 6);
    assert.match(turns.map((turn) => turn.text).join(" "), /trays still full/);
  });

  it("turns the first answer into a need phrase", () => {
    assert.equal(needSeed(mapInterview(brief)), "to get through the day without losing what matters to me");
  });

  it("refuses to pick a solution", () => {
    assert.match(mapReply("What app should we build?", brief), /will not pick your solution/);
  });
});
