import { NextResponse } from "next/server";
import { unknownRoomMessage } from "@/lib/code";
import { bearer, loadRoom, saveRoom, seatIdForToken } from "@/lib/db";
import { uid } from "@/lib/domain";
import {
  INTERVIEW_QUESTION_CAP,
  briefFrom,
  mapInterview,
  mapReply,
  modelInterview,
  modelReply,
} from "@/lib/interview";
import { presentRoom } from "@/lib/present";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const token = bearer(request);
    const seatId = token ? await seatIdForToken(code, token) : undefined;
    if (!seatId) return NextResponse.json({ error: "Join this room on this device first." }, { status: 401 });
    const raw = await request.json().catch(() => null);
    const kind = raw && typeof raw === "object" ? (raw as { kind?: string }).kind : "";
    const version = Number(raw && typeof raw === "object" ? (raw as { version?: number }).version : NaN);
    const row = await loadRoom(code);
    if (!row) return NextResponse.json({ error: unknownRoomMessage(code) }, { status: 404 });
    const now = Date.now();
    if (row.version !== version) {
      const payload = presentRoom(row.state, seatId, row.version, now);
      return NextResponse.json({ ...payload, error: "The board changed. Look again, then retry." }, { status: 409 });
    }
    if (row.state.stage !== "s3") {
      return NextResponse.json({ error: "The interview is on the Incident step." }, { status: 400 });
    }
    const brief = briefFrom(row.state);
    if (!brief || !row.state.summary.whoseId) {
      return NextResponse.json({ error: "Pick who you follow, and write what goes wrong, before the interview." }, { status: 400 });
    }

    if (kind === "start") {
      const current = row.state.interview;
      if (current && current.whoseId === row.state.summary.whoseId && current.turns.length > 0) {
        return NextResponse.json(presentRoom(row.state, seatId, row.version, now));
      }
      const modeled = await modelInterview(brief);
      row.state.interview = {
        whoseId: row.state.summary.whoseId,
        source: modeled ? "model" : "map",
        turns: modeled ?? mapInterview(brief),
        messages: [],
      };
    } else if (kind === "ask") {
      const interview = row.state.interview;
      if (!interview || interview.whoseId !== row.state.summary.whoseId) {
        return NextResponse.json({ error: "The short interview is not ready yet." }, { status: 400 });
      }
      const asked = interview.messages.filter((item) => item.role === "student").length;
      if (asked >= INTERVIEW_QUESTION_CAP) {
        return NextResponse.json({ error: "Eight questions is enough. Use what you heard to write the incident." }, { status: 400 });
      }
      const text = String((raw as { text?: string }).text ?? "").replace(/\s+/g, " ").trim().slice(0, 240);
      if (text.length < 2) return NextResponse.json({ error: "Ask a real question." }, { status: 400 });
      const actor = row.state.participants.find((person) => person.id === seatId);
      if (!actor || actor.role !== "interviewer") {
        return NextResponse.json({ error: "Only the Lead Interviewer asks the extra questions." }, { status: 400 });
      }
      interview.messages.push({ id: uid("ask"), by: actor.id, role: "student", text, at: now });
      const reply = (await modelReply(brief, interview.messages, text)) ?? mapReply(text, brief);
      interview.messages.push({ id: uid("say"), by: "persona", role: "persona", text: reply, at: now });
    } else {
      return NextResponse.json({ error: "That interview request is missing." }, { status: 400 });
    }

    const saved = await saveRoom(code, row.version, row.state);
    if (!saved) {
      const fresh = await loadRoom(code);
      const payload = presentRoom(fresh?.state ?? row.state, seatId, fresh?.version ?? row.version, now);
      return NextResponse.json({ ...payload, error: "The board changed. Look again, then retry." }, { status: 409 });
    }
    return NextResponse.json(presentRoom(row.state, seatId, saved, now));
  } catch (error) {
    const message = error instanceof Error ? error.message : "The interview could not be prepared.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
