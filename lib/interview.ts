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
  if (!turns?.length) return "";
  let answer = "";
  for (let index = 0; index < turns.length - 1; index += 1) {
    const ask = turns[index];
    const reply = turns[index + 1];
    if (ask.speaker === "team" && reply.speaker === "persona" && /trying to get done/i.test(ask.text)) {
      answer = reply.text.trim();
      break;
    }
  }
  if (!answer) answer = turns.find((turn) => turn.speaker === "persona")?.text.trim() ?? "";
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
