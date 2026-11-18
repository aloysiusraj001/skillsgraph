import { NextResponse } from "next/server";
import { unknownRoomMessage } from "@/lib/code";
import { bearer, loadRoom, newToken, rotateSeatToken, saveRoom, seatIdForToken } from "@/lib/db";
import { applyAction } from "@/lib/game";
import { presentRoom } from "@/lib/present";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const token = bearer(request);
    const seatId = token ? await seatIdForToken(code, token) : undefined;
    if (!seatId) return NextResponse.json({ error: "Open the room as the teacher first." }, { status: 401 });
    const row = await loadRoom(code);
    if (!row) return NextResponse.json({ error: unknownRoomMessage(code) }, { status: 404 });
    const teacher = row.state.participants.find((person) => person.id === seatId);
    if (!teacher || teacher.kind !== "teacher") {
      return NextResponse.json({ error: "Only the teacher can open the practice seats." }, { status: 403 });
    }

    let state = row.state;
    let version = row.version;
    const now = Date.now();
    for (const seat of state.participants.filter((person) => person.kind === "student" && !person.claimed)) {
      const result = applyAction(state, seat.id, { type: "claim" }, now);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      const saved = await saveRoom(code, version, result.state);
      if (!saved) {
        return NextResponse.json({ error: "The board changed. Try opening the seats again." }, { status: 409 });
      }
      state = result.state;
      version = saved;
    }

    const seats = [];
    for (const seat of state.participants.filter((person) => person.kind === "student")) {
      const seatToken = newToken();
      await rotateSeatToken(seat.id, seatToken);
      seats.push({ id: seat.id, name: seat.name, role: seat.role, token: seatToken });
    }

    const payload = presentRoom(state, teacher.id, version, now);
    return NextResponse.json({ ...payload, seats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The seats could not be opened.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
