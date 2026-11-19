import { NextResponse } from "next/server";
import type { InterviewMessage, InterviewTurn } from "@/lib/domain";
import { generateGeminiInterview, generateGeminiReply } from "@/lib/gemini-interview";
import type { PersonaBrief } from "@/lib/interview";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      kind?: string;
      brief?: PersonaBrief;
      turns?: InterviewTurn[];
      history?: InterviewMessage[];
      question?: string;
    } | null;

    if (!body || !body.brief || !body.brief.label || !body.brief.harm) {
      return NextResponse.json(
        { error: "Pick who you follow, and write what goes wrong, before the interview." },
        { status: 400 },
      );
    }

    if (body.kind === "start") {
      const turns = await generateGeminiInterview(body.brief);
      return NextResponse.json({ turns });
    }

    if (body.kind === "ask") {
      const question = String(body.question ?? "").replace(/\s+/g, " ").trim().slice(0, 240);
      if (question.length < 2) {
        return NextResponse.json({ error: "Ask a real question." }, { status: 400 });
      }
      const turns = Array.isArray(body.turns) ? body.turns : [];
      const history = Array.isArray(body.history) ? body.history : [];
      const reply = await generateGeminiReply(body.brief, history, question, turns);
      return NextResponse.json({ reply });
    }

    return NextResponse.json({ error: "That interview request is missing." }, { status: 400 });
  } catch (error) {
    const { message, status } = formatGeminiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

function formatGeminiError(error: unknown): { message: string; status: number } {
  const raw = error instanceof Error ? error.message : String(error ?? "The Gemini interview request failed.");
  try {
    const parsed = JSON.parse(raw) as {
      error?: {
        code?: number;
        message?: string;
        status?: string;
        details?: { reason?: string }[];
      };
    };
    const err = parsed?.error;
    if (err) {
      const reason = err.details?.find((d) => d.reason)?.reason;
      if (reason === "API_KEY_INVALID" || err.status === "PERMISSION_DENIED" || err.code === 400 || err.code === 403) {
        if (reason === "API_KEY_INVALID" || /API key not valid/i.test(err.message ?? "")) {
          return {
            status: 400,
            message: "Gemini API key is not valid. Please check or select a valid GEMINI_API_KEY in Settings > Secrets.",
          };
        }
      }
      if (err.message) {
        return { status: err.code && err.code >= 400 && err.code < 600 ? err.code : 502, message: err.message };
      }
    }
  } catch {
    // Not JSON; fall through to raw message.
  }
  return { status: 502, message: raw };
}
