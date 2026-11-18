import { NextResponse } from "next/server";
import type { Action } from "@/lib/domain";
import { unknownRoomMessage } from "@/lib/code";
import { bearer, loadRoom, rotateSeatToken, saveRoom, seatIdForToken } from "@/lib/db";
import { applyAction } from "@/lib/game";
import { presentRoom } from "@/lib/present";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const token = bearer(request);
    const seatId = token ? await seatIdForToken(code, token) : undefined;
    if (!seatId) return NextResponse.json({ error: "Join this room on this device first." }, { status: 401 });
    const raw = await request.json().catch(() => null);
    if (!raw || typeof raw !== "object" || JSON.stringify(raw).length > 20_000) {
      return NextResponse.json({ error: "That move was too large to read." }, { status: 400 });
    }
    const action = (raw as { action?: Action }).action;
    const version = Number((raw as { version?: number }).version);
    if (!action || typeof action.type !== "string") {
      return NextResponse.json({ error: "That move is missing." }, { status: 400 });
    }
    if (action.type === "claim") {
      return NextResponse.json({ error: "Use the join screen to take a seat." }, { status: 400 });
    }
    const row = await loadRoom(code);
    if (!row) return NextResponse.json({ error: unknownRoomMessage(code) }, { status: 404 });
    const now = Date.now();
    if (row.version !== version) {
      const payload = presentRoom(row.state, seatId, row.version, now);
      return NextResponse.json({ ...payload, error: "The board changed. Look again, then retry." }, { status: 409 });
    }
    const result = applyAction(row.state, seatId, action, now);
    if (!result.ok) {
      const payload = presentRoom(result.state, seatId, row.version, now);
      return NextResponse.json({ ...payload, error: result.error }, { status: 400 });
    }
    const saved = await saveRoom(code, row.version, result.state);
    if (!saved) {
      const fresh = await loadRoom(code);
      const payload = presentRoom(fresh?.state ?? result.state, seatId, fresh?.version ?? row.version, now);
      return NextResponse.json({ ...payload, error: "The board changed. Look again, then retry." }, { status: 409 });
    }
    if (action.type === "release-seat") {
      await rotateSeatToken(action.seatId, `${Date.now()}-${Math.random()}`);
    }
    const payload = presentRoom(result.state, seatId, saved, now);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "That move did not land.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
