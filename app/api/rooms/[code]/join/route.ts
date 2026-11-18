import { NextResponse } from "next/server";
import { unknownRoomMessage } from "@/lib/code";
import { loadRoom, newToken, rotateSeatToken, saveRoom } from "@/lib/db";
import { applyAction } from "@/lib/game";
import { presentRoom } from "@/lib/present";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const body = await request.json().catch(() => ({}));
    const seatId = String(body.seatId ?? "");
    const row = await loadRoom(code);
    if (!row) return NextResponse.json({ error: unknownRoomMessage(code) }, { status: 404 });
    const seat = row.state.participants.find((person) => person.id === seatId && person.kind === "student");
    if (!seat) return NextResponse.json({ error: "That name is not on this room's list." }, { status: 404 });
    if (seat.claimed) {
      return NextResponse.json(
        { error: `${seat.name} already joined on another device. Ask the teacher to release the seat if that was you.` },
        { status: 409 },
      );
    }
    const now = Date.now();
    const result = applyAction(row.state, seatId, { type: "claim" }, now);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    const saved = await saveRoom(code, row.version, result.state);
    if (!saved) {
      return NextResponse.json({ error: "Someone else just took that seat. Refresh and try again." }, { status: 409 });
    }
    const token = newToken();
    await rotateSeatToken(seatId, token);
    const payload = presentRoom(result.state, seatId, saved, now);
    return NextResponse.json({ ...payload, token, code: code.toUpperCase() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not join the room.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
