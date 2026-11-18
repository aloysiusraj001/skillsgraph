import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ROOM_CODE_ALPHABET, makeCode } from "@/lib/code";

const LOOKALIKES = ["B", "8", "G", "6", "O", "0", "I", "1", "S", "5", "Z", "2", "Q"];

describe("room codes", () => {
  it("uses only characters that do not look like each other", () => {
    for (const char of LOOKALIKES) assert.equal(ROOM_CODE_ALPHABET.includes(char), false);
    for (let index = 0; index < 300; index += 1) {
      const code = makeCode();
      assert.equal(code.length, 4);
      for (const char of code) assert.ok(ROOM_CODE_ALPHABET.includes(char));
    }
  });
});
