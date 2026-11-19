import type { InterviewTurn, RoomState } from "@/lib/domain";

export const INTERVIEW_QUESTION_CAP = 8;

export type PersonaBrief = {
  theme: string;
  label: string;
  harm: string;
  heard: boolean;
  others: string[];
};

export function briefFrom(state: RoomState): PersonaBrief | null {
  const card = state.stakeholders.find((item) => item.id === state.summary.whoseId && !item.mergedInto);
  if (!card || !state.summary.harm.trim()) return null;
  return {
    theme: state.theme,
    label: card.label,
    harm: state.summary.harm.trim(),
    heard: card.source === "heard",
    others: state.stakeholders
      .filter((item) => item.id !== card.id && !item.mergedInto)
      .map((item) => item.label)
      .slice(0, 4),
  };
}

export function mapInterview(brief: PersonaBrief): InterviewTurn[] {
  const moment = momentFor(brief);
  return [
    { speaker: "team", text: "Hi! Thanks for talking with us. What are you trying to get done?" },
    { speaker: "persona", text: `I am ${personaName(brief.label)}. I am trying to get through the day without losing what matters to me.` },
    { speaker: "team", text: "What gets in the way?" },
    { speaker: "persona", text: brief.harm },
    { speaker: "team", text: "Can you give us one moment, with a when and a where?" },
    { speaker: "persona", text: moment },
    { speaker: "team", text: "What do you wish people understood?" },
    {
      speaker: "persona",
      text: brief.others.length
        ? `I want you to picture my day, not a slogan. ${brief.others[0]} is part of that day, and so are the other people around me.`
        : "I want you to picture my day, not a slogan.",
    },
  ];
}

export function questionAsksForChoice(question: string) {
  const q = question.toLowerCase();
  if (/\b(pick|choose|decide)\b/.test(q) && /\b(incident|solution|problem|app)\b/.test(q)) return true;
  if (/\b(what|which)\s+app\b/.test(q)) return true;
  if (/\b(design an app|solve it|our solution)\b/.test(q)) return true;
  if (/\bshould we\b/.test(q) && /\b(build|solve|pick|choose|design|app|solution|incident)\b/.test(q)) return true;
  return false;
}

function tidySpoken(text: string) {
  let s = text.replace(/\s+/g, " ").trim();
  s = s.replace(/\s+([,.!?])/g, "$1");
  s = s.replace(/,\s*(?=[.!?])/g, "");
  s = s.replace(/^[,.\s]+/, "");
  s = s.replace(/(^|[.!?]\s+)(so|and|but|though)\s+/gi, "$1");
  s = s.replace(/\s{2,}/g, " ").trim();
  s = s.replace(/(^|[.!?]\s+)([a-z])/g, (_, lead: string, letter: string) => lead + letter.toUpperCase());
  s = s.replace(/\.{2,}/g, ".");
  if (s && !/[.!?]$/.test(s)) s += ".";
  return s;
}

const OUT_OF_CHARACTER =
  /\b(class guess|unchecked guess|just a guess|checked with a real person|as an ai|language model|i am an ai|i['’ʼ]m an ai)\b/i;
const HEDGE =
  /\b(it seems like|i am uncertain|i think i am trying|i think i['’ʼ]m trying|maybe it is because|i['’ʼ]m not sure|i am not sure|i cannot be sure|unsure)\b/i;

export function breaksCharacter(text: string) {
  return OUT_OF_CHARACTER.test(text) || HEDGE.test(text);
}

export function hasWorkFact(text: string) {
  return (
    /\d/.test(text) ||
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday|kg|kilogram|kilo|cedi|dollar|naira|franc|peso|percent|harvest|rainy season|dry season)\b/i.test(
      text,
    )
  );
}

export function scriptSoundsGuessed(turns: { speaker?: string; text: string }[]) {
  return turns.some(
    (turn) =>
      OUT_OF_CHARACTER.test(turn.text) ||
      /pick your team['’ʼ]s incident/i.test(turn.text) ||
      (turn.speaker === "team" && questionAsksForChoice(turn.text)),
  );
}

export function interviewSoundsReal(turns: InterviewTurn[]) {
  const answers = turns.filter((turn) => turn.speaker === "persona");
  if (answers.length < 3) return false;
  if (turns.some((turn) => breaksCharacter(turn.text))) return false;
  if (turns.some((turn) => turn.speaker === "team" && questionAsksForChoice(turn.text))) return false;
  return answers.filter((turn) => turn.text.length > 30 && /\d/.test(turn.text)).length >= 2;
}

export function questionWantsFact(question: string) {
  return /\b(how much|how many|price|paid|pay|earn|income|cost|money|a year|per month|kg|weight|when|where)\b/i.test(
    question,
  );
}

export function replySoundsReal(question: string, text: string) {
  if (text.trim().length < 20 || breaksCharacter(text)) return false;
  if (questionAsksForChoice(question)) return true;
  if (/\b(how much|how many|price|paid|pay|earn|income|cost|money)\b/i.test(question) && !/\d/.test(text)) {
    return false;
  }
  if (questionWantsFact(question) && !hasWorkFact(text)) return false;
  return true;
}

function isDisclaimer(sentence: string) {
  return OUT_OF_CHARACTER.test(sentence);
}

function refusesChoice(sentence: string) {
  return /\bpick\b/i.test(sentence)
    && /\b(incident|solution)\b/i.test(sentence)
    && /\b(can(?:not|['’ʼ]t)|will not|won['’ʼ]t|not going to)\b/i.test(sentence);
}

export function fitPersonaAnswer(question: string, text: string) {
  const asked = questionAsksForChoice(question);
  let s = text
    .replace(/,?\s*though I am just a class guess right now\.?/gi, "")
    .replace(/\bI['’ʼ]?m just a guess and haven['’ʼ]t been checked with a real person,\s*so\s+/gi, "")
    .replace(/\bI have not been checked with a real person(?: yet)?,\s*so I am uncertain,\s*but\s+/gi, "")
    .replace(/,?\s*especially since I am still an unchecked guess\b[^.!?]*/gi, "")
    .replace(/\b(?:and )?you should verify these details with a real (?:person|farmer) first\.?/gi, "");
  if (!asked) {
    s = s.replace(
      /,?\s*(?:though|but|and)?\s*I\s+(?:can(?:not|['’ʼ]t)|will not|won['’ʼ]t)\s+pick\b[^.!?]*\b(?:incident|solution)\b[^.!?]*[.!?]?/gi,
      "",
    );
  }
  const sentences = s.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [];
  const kept = sentences.map((sentence) => sentence.trim()).filter((sentence) => {
    if (!sentence) return false;
    if (isDisclaimer(sentence) || HEDGE.test(sentence)) return false;
    if (!asked && refusesChoice(sentence)) return false;
    return true;
  });
  return tidySpoken(kept.join(" "));
}

export function presentInterviewTurns(turns: InterviewTurn[]): InterviewTurn[] {
  const shown: InterviewTurn[] = [];
  for (let index = 0; index < turns.length; index += 1) {
    const turn = turns[index];
    if (turn.speaker === "team" && questionAsksForChoice(turn.text)) {
      if (turns[index + 1]?.speaker === "persona") index += 1;
      continue;
    }
    if (turn.speaker === "persona") {
      const question = [...shown].reverse().find((item) => item.speaker === "team")?.text ?? "";
      const text = fitPersonaAnswer(question, turn.text);
      if (text) shown.push({ ...turn, text });
      continue;
    }
    shown.push(turn);
  }
  return shown;
}

export function mapReply(question: string, brief: PersonaBrief): string {
  const q = question.toLowerCase();
  if (/\b(solution|solve|fix|app|should we|what should|idea)\b/.test(q)) {
    return "I can tell you what happens to me. Your team should choose the fact. I will not pick your solution.";
  }
  if (/\b(when|where|moment|example|happened|last|time|tuesday|yesterday)\b/.test(q)) {
    return momentFor(brief);
  }
  if (/\b(want|hope|wish|care|need|motivat)\b/.test(q)) {
    return `What I want is simple: get through ${brief.theme} without this getting worse. ${brief.harm}`;
  }
  if (/\b(who else|other people|involved)\b/.test(q)) {
    return brief.others.length
      ? `The people around me include ${brief.others.join(", ")}. They see parts of the same day.`
      : "Other people see parts of the same day. I only know my part for certain.";
  }
  return `${brief.harm} If you need a moment you could write down, ask me when and where it happens.`;
}

export function needSeed(turns: InterviewTurn[] | undefined) {
  const shown = turns?.length ? presentInterviewTurns(turns) : [];
  if (!shown.length) return "";
  let answer = "";
  for (let index = 0; index < shown.length - 1; index += 1) {
    const ask = shown[index];
    const reply = shown[index + 1];
    if (ask.speaker === "team" && reply.speaker === "persona" && /trying to get done/i.test(ask.text)) {
      answer = reply.text.trim();
      break;
    }
  }
  if (!answer) answer = shown.find((turn) => turn.speaker === "persona")?.text.trim() ?? "";
  return phraseNeed(answer);
}

function phraseNeed(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const trying = cleaned.match(/(?:I am|I'm|we are|we're) trying to ([^.]+)/i);
  if (trying) return `to ${trying[1].trim()}`;
  const needTo = cleaned.match(/^(?:I|we) (?:need|want) to ([^.]+)/i);
  if (needTo) return `to ${needTo[1].trim()}`;
  const need = cleaned.match(/^(?:I|we) need ([^.]+)/i);
  if (need) return need[1].trim();
  if (/^to\s/i.test(cleaned)) return cleaned.replace(/\.$/, "");
  return cleaned.replace(/\.$/, "");
}

function personaName(label: string) {
  return `one of the ${label}`;
}

function momentFor(brief: PersonaBrief) {
  return `Last week, in the middle of ${brief.theme}, this is what happened: ${brief.harm}`;
}
