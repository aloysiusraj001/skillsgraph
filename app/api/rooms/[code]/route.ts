import { NextResponse } from "next/server";
import { unknownRoomMessage } from "@/lib/code";
import { bearer, loadRoom, saveRoom, seatIdForToken } from "@/lib/db";
import { evolve } from "@/lib/game";
import { presentRoom } from "@/lib/present";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const token = bearer(request);
    const seatId = token ? await seatIdForToken(code, token) : undefined;
    if (!seatId) return NextResponse.json({ error: "Join this room on this device first." }, { status: 401 });
    const row = await loadRoom(code);
    if (!row) return NextResponse.json({ error: unknownRoomMessage(code) }, { status: 404 });
    const now = Date.now();
    const state = row.state;
    const changed = evolve(state, now);
    let version = row.version;
    if (changed) {
      const next = await saveRoom(code, version, state);
      if (next) version = next;
    }
    const payload = presentRoom(state, seatId, version, now);
    if (!payload) return NextResponse.json({ error: "That seat is not in this room." }, { status: 401 });
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The room could not be reached.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
