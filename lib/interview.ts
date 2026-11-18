import type { InterviewMessage, InterviewTurn, RoomState } from "@/lib/domain";

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
  const note = brief.heard
    ? "This short interview is a classroom persona built from your map. The team asks. This person answers."
    : "Your map marked this person as a guess, so this interview is less certain. Check it with someone real before you treat it as fact.";
  return [
    { speaker: "team", text: `${note} What are you trying to get done?` },
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
  const trying = cleaned.match(/I am trying to ([^.]+)/i);
  if (trying) return `to ${trying[1].trim()}`;
  const needTo = cleaned.match(/^(?:I |we )?(?:need|want) to ([^.]+)/i);
  if (needTo) return `to ${needTo[1].trim()}`;
  const need = cleaned.match(/^(?:I |we )?need ([^.]+)/i);
  if (need) return need[1].trim();
  if (/^to\s/i.test(cleaned)) return cleaned.replace(/\.$/, "");
  return cleaned.replace(/\.$/, "");
}

export async function modelInterview(brief: PersonaBrief): Promise<InterviewTurn[] | null> {
  const raw = await complete(systemPrompt(brief), "Write the short interview as JSON: an array of 8 objects with speaker \"team\" or \"persona\" and text. Alternate team then persona. The first team line asks what they are trying to get done. The first persona answer is one spoken sentence a student can turn into the Need blank. The team is the student group. No solutions.");
  return parseTurns(raw);
}

export async function modelReply(brief: PersonaBrief, history: InterviewMessage[], question: string): Promise<string | null> {
  const transcript = history.map((item) => `${item.role === "persona" ? "Persona" : "Student"}: ${item.text}`).join("\n");
  const raw = await complete(
    systemPrompt(brief),
    `Interview so far:\n${transcript}\nStudent: ${question}\nReply in the first person, in under 70 words. Do not choose their incident or offer a solution.`,
  );
  const text = raw?.replace(/^persona:\s*/i, "").trim();
  return text ? text.slice(0, 500) : null;
}

function systemPrompt(brief: PersonaBrief) {
  return [
    `You are one ${personaName(brief.label)} in a classroom activity about ${brief.theme}.`,
    `What goes wrong for you: ${brief.harm}`,
    brief.heard
      ? "The class marked you as heard from someone. Sound specific, and do not invent statistics."
      : "The class marked you as a guess. Sound uncertain, and say you have not been checked with a real person.",
    "You are a short version of a longer interview. Stay on pains and motives. Refuse to pick the team's incident or solution.",
    "Ages 11 to 15 will read this. No blame, no graphic harm.",
  ].join(" ");
}

async function complete(system: string, user: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

function parseTurns(raw: string | null): InterviewTurn[] | null {
  if (!raw) return null;
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start < 0 || end < start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as { speaker?: string; text?: string }[];
    const turns = parsed
      .map((item) => ({
        speaker: item.speaker === "persona" ? "persona" as const : "team" as const,
        text: String(item.text ?? "").replace(/\s+/g, " ").trim().slice(0, 400),
      }))
      .filter((item) => item.text.length > 1);
    return turns.length >= 4 ? turns.slice(0, 8) : null;
  } catch {
    return null;
  }
}

function personaName(label: string) {
  return `one of the ${label}`;
}

function momentFor(brief: PersonaBrief) {
  if (brief.heard) {
    return `Last week, in the middle of ${brief.theme}, this is what I saw: ${brief.harm}`;
  }
  return `We have not checked this with them. A moment that would match the guess is: ${brief.harm}`;
}
