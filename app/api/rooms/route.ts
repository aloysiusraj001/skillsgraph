import { NextResponse } from "next/server";
import { PILOT, ROLE_ORDER, clip, makeState, type RoleId, uid } from "@/lib/domain";
import { insertRoom, makeCode, newToken } from "@/lib/db";
import { fillExample } from "@/lib/example";
import { presentRoom } from "@/lib/present";

export const dynamic = "force-dynamic";

type SeatInput = { name?: string; role?: RoleId | null };

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const example = Boolean(body.example);
    const pilot = Boolean(body.pilot) || example;
    const teamName = clip(pilot ? body.teamName || PILOT.teamName : body.teamName, 40);
    const theme = clip(pilot ? body.theme || PILOT.theme : body.theme, 80);
    const teacherName = clip(example ? "Ms Rivera" : body.teacherName || PILOT.teacherName, 40) || "Teacher";
    if (!teamName || !theme) {
      return NextResponse.json({ error: "Give the team a name and a theme before you open the room." }, { status: 400 });
    }
    const incoming: SeatInput[] = pilot
      ? PILOT.students.map((student) => ({ name: student.name, role: student.role }))
      : Array.isArray(body.students)
        ? body.students
        : [];
    if (incoming.length !== 5) {
      return NextResponse.json({ error: "A C60 room needs five student seats." }, { status: 400 });
    }
    const used = new Set<RoleId>();
    const students = incoming.map((seat) => {
      const name = clip(seat.name, 40);
      const role = seat.role && ROLE_ORDER.includes(seat.role) ? seat.role : null;
      if (!name) throw new Error("Every seat needs a first name.");
      if (role) {
        if (used.has(role)) throw new Error(`${role} is assigned twice. Each role belongs to one person.`);
        used.add(role);
      }
      return { id: uid("seat"), name, role, claimed: false };
    });
    if (new Set(students.map((seat) => seat.name.toLowerCase())).size !== 5) {
      return NextResponse.json({ error: "Use a different first name for each seat." }, { status: 400 });
    }
    const now = Date.now();
    const teacher = { id: uid("teacher"), name: teacherName };
    let code = makeCode();
    const teacherToken = newToken();
    const seatTokens = students.map(() => newToken());
    const state = makeState({ code, teamName, theme, now, teacher, students });
    if (example) fillExample(state);
    const seats = [
      { id: teacher.id, token: teacherToken, name: teacherName, kind: "teacher" },
      ...students.map((seat, index) => ({
        id: seat.id,
        token: seatTokens[index],
        name: seat.name,
        kind: "student",
      })),
    ];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        state.code = code;
        await insertRoom(code, state, seats);
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (!message.includes("duplicate") && !message.includes("unique")) throw error;
        code = makeCode();
        if (attempt === 4) throw error;
      }
    }
    const payload = presentRoom(state, teacher.id, 1, now);
    return NextResponse.json({ ...payload, token: teacherToken, code });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The room could not be opened.";
    const status = message.includes("name") || message.includes("role") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
