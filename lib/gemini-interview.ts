import { ThinkingLevel } from "@google/genai";
import type { InterviewMessage, InterviewTurn } from "@/lib/domain";
import { getGeminiClient } from "@/lib/gemini";
import type { PersonaBrief } from "@/lib/interview";

const MODEL = "gemini-4-hydrogen";

function systemInstructionFor(brief: PersonaBrief) {
  const othersLine = brief.others.length
    ? `Other people around your daily work: ${brief.others.join(", ")}.`
    : "";

  return [
    `You are a real ${brief.label} talking with students (ages 11 to 15) about "${brief.theme}".`,
    `What has been going wrong for you recently: ${brief.harm}`,
    othersLine,
    "Use Google Search to ground your answers in real-world data and everyday realities for someone in your role—such as real seasons, prices, harvest or work routines, weights, weather, equipment, buyers, and household costs.",
    "Speak naturally in first person like a real human being sharing your lived day. Give concrete details (times of day, seasons, places, tools, money pressures, trade-offs) instead of vague generalities.",
    "Stay completely in character at all times. NEVER say you are a guess, a class guess, an AI, or a simulation, and NEVER say you have not been checked with a real person.",
    "Do not include URLs, footnote brackets like [1], bullet lists, or academic language. Keep wording clear and natural for ages 11 to 15, with no graphic harm.",
    "Stick to your real pains, pressures, and motivations. If students ask you to design an app, pick their project, or give them a solution, answer naturally as a person who knows your own work and daily needs—leave what they decide to build or focus on up to them.",
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

export async function generateGeminiInterview(
  brief: PersonaBrief,
): Promise<InterviewTurn[]> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      `Search for real-world facts and lived details about ${brief.label} in "${brief.theme}", especially relating to: ${brief.harm}.`,
      'Then output ONLY a raw JSON array of exactly 8 objects: [{"speaker":"team","text":"..."},{"speaker":"persona","text":"..."}, ...].',
      'Alternate "team" then "persona" (4 questions and 4 answers).',
      'Turn 1 ("team"): greet them warmly and ask what they are trying to get done day to day.',
      'Turn 2 ("persona"): one spoken first-person sentence starting with "I\'m trying to ..." or "I am trying to ..." grounded in real-life goals and needs.',
      'Turn 3 ("team"): ask what tends to go wrong or hit hardest.',
      'Turn 4 ("persona"): answer in 2 to 3 crisp spoken sentences using real-world context (seasons, prices, tools, weather, buyers, or work realities).',
      'Turn 5 ("team"): ask for a specific recent moment—when, where, and what happened.',
      'Turn 6 ("persona"): tell a concrete everyday moment in 2 to 3 sentences with real details (time of year, place, what happened, and why it mattered).',
      'Turn 7 ("team"): ask about how they cope, who else is involved, or what trade-offs they face day to day.',
      'Turn 8 ("persona"): answer naturally in 2 to 3 sentences sharing what people rarely see about their week.',
    ].join("\n"),
    config: {
      systemInstruction: systemInstructionFor(brief),
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  const turns = parseInterviewTurns(response.text ?? "");
  if (turns.length < 4) {
    throw new Error("Gemini returned an incomplete interview.");
  }
  return turns;
}

export async function generateGeminiReply(
  brief: PersonaBrief,
  history: InterviewMessage[],
  question: string,
  turns: InterviewTurn[] = [],
): Promise<string> {
  const ai = getGeminiClient();
  const starterTranscript = turns
    .map((turn) => `${turn.speaker === "persona" ? "You" : "Student"}: ${turn.text}`)
    .join("\n");
  const followUpTranscript = history
    .map((item) => `${item.role === "persona" ? "You" : "Student"}: ${item.text}`)
    .join("\n");
  const transcript = [starterTranscript, followUpTranscript]
    .filter(Boolean)
    .join("\n");

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      transcript ? `Conversation so far:\n${transcript}` : "",
      `Student: ${question}`,
      "Use Google Search if helpful to ground your answer in real-world numbers, practices, or conditions. Answer directly in character in the first person, in 2 to 4 natural spoken sentences (under 85 words). Stay consistent with what you already said. No URLs or citations.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    config: {
      systemInstruction: systemInstructionFor(brief),
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  const text = cleanSpokenLine(
    (response.text ?? "").replace(/^(?:persona|them|you):\s*/i, ""),
    750,
  );
  if (!text) {
    throw new Error("Gemini returned an empty reply.");
  }
  return text;
}
