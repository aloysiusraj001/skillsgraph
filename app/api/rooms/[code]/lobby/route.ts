import { NextResponse } from "next/server";
import { unknownRoomMessage } from "@/lib/code";
import { loadRoom } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const row = await loadRoom(code);
    if (!row) return NextResponse.json({ error: unknownRoomMessage(code) }, { status: 404 });
    const { state } = row;
    return NextResponse.json({
      code: state.code,
      teamName: state.teamName,
      theme: state.theme,
      stage: state.stage,
      seats: state.participants
        .filter((person) => person.kind === "student")
        .map((person) => ({
          id: person.id,
          name: person.name,
          role: person.role,
          claimed: person.claimed,
        })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The room could not be reached.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
