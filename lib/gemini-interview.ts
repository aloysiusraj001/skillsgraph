import { ThinkingLevel } from "@google/genai";
import type { InterviewMessage, InterviewTurn } from "@/lib/domain";
import { getGeminiClient } from "@/lib/gemini";
import {
  fitPersonaAnswer,
  interviewSoundsReal,
  presentInterviewTurns,
  replySoundsReal,
  type PersonaBrief,
} from "@/lib/interview";

const MODEL = "gemini-4-hydrogen";

function systemInstructionFor(brief: PersonaBrief) {
  const othersLine = brief.others.length
    ? `Other people around your daily work: ${brief.others.join(", ")}.`
    : "";

  return [
    `You do this work yourself: ${brief.label}. Students aged 11 to 15 are visiting you to learn about "${brief.theme}".`,
    `What has been going wrong for you: ${brief.harm}`,
    othersLine,
    "Before you speak, search for real figures for this work: seasons, prices, weights, weather, tools, buyers, and household costs. Say those figures as your own day. Do not mention searching, reports, or the web.",
    "Talk the way you would talk at work. Short spoken sentences. Every answer includes one detail a visitor could check: a number, a month, a price, a weight, a place, or a time of day.",
    "Do not mention the class, the lesson, or how you were asked to talk. If they ask you to pick their incident or a solution, say that choice is theirs in one sentence and stop. On every other question, talk only about your work.",
    "No URLs, no footnote brackets like [1], and no bullet lists. Keep the words clear for ages 11 to 15, with no graphic harm.",
  ]
    .filter(Boolean)
    .join(" ");
}

function cleanSpokenLine(text: string, maxLength = 750) {
  const cleaned = text
    .replace(/\s*\[\d+(?:\s*,\s*\d+)*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= maxLength) return cleaned;
  const slice = cleaned.slice(0, maxLength);
  const lastSentence = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
  );
  if (lastSentence > maxLength * 0.5) {
    return slice.slice(0, lastSentence + 1).trim();
  }
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trim();
}

export function parseInterviewTurns(raw: string): InterviewTurn[] {
  const trimmed = raw.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const jsonMatch = unfenced.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        speaker?: string;
        text?: string;
      }[];
      if (Array.isArray(parsed)) {
        const turns = parsed
          .map((item) => ({
            speaker:
              item.speaker?.toLowerCase() === "persona" ||
              item.speaker?.toLowerCase() === "them"
                ? ("persona" as const)
                : ("team" as const),
            text: cleanSpokenLine(String(item.text ?? ""), 750),
          }))
          .filter((item) => item.text.length > 1);
        if (turns.length >= 4) {
          return turns.slice(0, 8);
        }
      }
    } catch {
      // Fall through to dialogue-line parsing.
    }
  }

  const lineTurns: InterviewTurn[] = [];
  for (const line of unfenced.split(/\r?\n/)) {
    const match = line.match(/^(?:\*\*)?(team|student|persona|them)(?:\*\*)?:\s*(.+)$/i);
    if (!match) continue;
    const role = match[1].toLowerCase();
    const speaker = role === "persona" || role === "them" ? ("persona" as const) : ("team" as const);
    const text = cleanSpokenLine(match[2], 750);
    if (text.length > 1) {
      lineTurns.push({ speaker, text });
    }
  }
  return lineTurns.slice(0, 8);
}

function interviewPrompt(brief: PersonaBrief, attempt: number) {
  return [
    `Search for real figures about ${brief.label} and this problem: ${brief.harm}.`,
    'Then output ONLY a raw JSON array of exactly 8 objects: [{"speaker":"team","text":"..."},{"speaker":"persona","text":"..."}, ...].',
    'Alternate "team" then "persona" (4 questions and 4 answers).',
    "The persona is the worker speaking at work. Each persona answer includes a real figure from the search: a price, a weight, a month, a time, or a place.",
    'Do not begin a persona answer with "I think", "Maybe", or "It seems".',
    "The team only asks about this person's day. The team never asks which incident, problem, or solution the group should pick.",
    'Turn 1 ("team"): greet them and ask what they are trying to get done day to day.',
    'Turn 2 ("persona"): one sentence starting with "I\'m trying to" or "I am trying to", naming a real stake such as pay, a season, a weight, or someone at home.',
    'Turn 3 ("team"): ask what tends to go wrong or hit hardest.',
    'Turn 4 ("persona"): 2 or 3 sentences with a real price, weight, season, or buyer practice.',
    'Turn 5 ("team"): ask for one recent moment, with when and where.',
    'Turn 6 ("persona"): 2 or 3 sentences with the time of year, the place, what happened, and why it mattered.',
    'Turn 7 ("team"): ask how they cope, who else is involved, or what they trade off day to day.',
    'Turn 8 ("persona"): 2 or 3 sentences about the week people rarely see, with one concrete detail.',
    attempt > 0
      ? "The last draft was too vague. Rewrite it. Put a real number in at least two persona answers."
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateGeminiInterview(
  brief: PersonaBrief,
): Promise<InterviewTurn[]> {
  const ai = getGeminiClient();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: interviewPrompt(brief, attempt),
      config: {
        systemInstruction: systemInstructionFor(brief),
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    const turns = presentInterviewTurns(parseInterviewTurns(response.text ?? ""));
    if (interviewSoundsReal(turns)) return turns;
  }
  throw new Error("The interview did not come back in the person's own words. Try again.");
}

export async function generateGeminiReply(
  brief: PersonaBrief,
  history: InterviewMessage[],
  question: string,
  turns: InterviewTurn[] = [],
): Promise<string> {
  const ai = getGeminiClient();
  const starterTranscript = presentInterviewTurns(turns)
    .map((turn) => `${turn.speaker === "persona" ? "You" : "Student"}: ${turn.text}`)
    .join("\n");
  const followUpTranscript = history
    .map((item, index) => {
      if (item.role !== "persona") return `Student: ${item.text}`;
      const askedEarlier = [...history.slice(0, index)].reverse().find((entry) => entry.role === "student")?.text ?? "";
      const spoken = fitPersonaAnswer(askedEarlier, item.text);
      return spoken ? `You: ${spoken}` : "";
    })
    .filter(Boolean)
    .join("\n");
  const transcript = [starterTranscript, followUpTranscript]
    .filter(Boolean)
    .join("\n");

  let closest = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        transcript ? `Conversation so far:\n${transcript}` : "",
        `Student: ${question}`,
        "Search if you need a current price, season, weight, or practice. Answer only this question, as yourself at work, in 2 to 4 spoken sentences under 85 words. Include one real figure or a specific time and place. Do not mention their incident or a solution unless they asked you to choose one. No URLs.",
        attempt > 0
          ? "Answer again from your own work. Include a real figure or a specific time and place."
          : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      config: {
        systemInstruction: systemInstructionFor(brief),
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    const spoken = fitPersonaAnswer(
      question,
      cleanSpokenLine((response.text ?? "").replace(/^(?:persona|them|you):\s*/i, ""), 750),
    );
    if (replySoundsReal(question, spoken)) return spoken;
    if (spoken) closest = spoken;
  }
  if (closest) return closest;
  throw new Error("That answer did not stay on the question. Ask once more.");
}
