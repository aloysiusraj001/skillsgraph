/**
 * Security Rules Verification Specification for Demo Firestore Rules
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const rulesPath = path.resolve(process.cwd(), "firestore.rules");

test("firestore.rules enforces schema, no-list, and monotonic version invariants", () => {
  assert.ok(fs.existsSync(rulesPath), "firestore.rules must exist");
  const rules = fs.readFileSync(rulesPath, "utf8");
  const normalized = rules.replace(/\s+/g, " ");

  assert.match(rules, /rules_version\s*=\s*'2'/);
  assert.match(rules, /match \/\{document=\*\*\}\s*\{\s*allow read, write:\s*if false;/);
  assert.match(rules, /function isValidId\(id\)/);
  assert.match(rules, /function isValidRoomCode\(code\)/);
  assert.match(rules, /function isValidRoom\(data,\s*roomCode\)/);
  assert.match(rules, /function isValidDemoPointer\(data,\s*sessionId\)/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(/);
  assert.match(rules, /incoming\(\)\.version == existing\(\)\.version \+ 1/);
  assert.match(normalized, /match \/rooms\/\{roomCode\}.*?allow list:\s*if false;/);
  assert.match(normalized, /match \/demoSessions\/\{sessionId\}.*?allow list:\s*if false;/);
});
