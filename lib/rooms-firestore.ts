"use client";

import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { ROOM_CODE_ALPHABET, makeCode } from "@/lib/code";
import {
  PILOT,
  ROLE_ORDER,
  SKILLGRAPH_DEMO,
  clip,
  makeState,
  type Action,
  type Interview,
  type RoleId,
  type RoomState,
} from "@/lib/domain";
import { fillExample } from "@/lib/example";
import { OperationType, db, handleFirestoreError } from "@/lib/firebase";
import { applyAction, evolve } from "@/lib/game";

export type RoomDoc = {
  code: string;
  teamName: string;
  theme: string;
  stage: RoomState["stage"];
  version: number;
  state: RoomState;
};

function sanitizeForFirestore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function createRoomInFirestore(input: {
  example?: boolean;
  pilot?: boolean;
  teamName?: string;
  theme?: string;
  teacherName?: string;
  students?: { name?: string; role?: RoleId | null }[];
}): Promise<{ code: string; teacherId: string; seatIds: { id: string; name: string; role: RoleId | null }[] }> {
  const example = Boolean(input.example);
  const pilot = Boolean(input.pilot) || example;
  const teamName = clip(pilot ? input.teamName || PILOT.teamName : input.teamName, 40);
  const theme = clip(pilot ? input.theme || PILOT.theme : input.theme, 80);
  const teacherName = clip(example ? "Ms Rivera" : input.teacherName || PILOT.teacherName, 40) || "Teacher";

  if (!teamName || !theme) {
    throw new Error("Give the team a name and a theme before you open the room.");
  }

  const incoming = pilot
    ? PILOT.students.map((student) => ({ name: student.name, role: student.role }))
    : Array.isArray(input.students)
      ? input.students
      : [];

  if (incoming.length !== 5) {
    throw new Error("A C60 room needs five student seats.");
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
    return {
      id: `seat-${Math.random().toString(36).slice(2, 9)}`,
      name,
      role,
      claimed: example,
    };
  });

  if (new Set(students.map((seat) => seat.name.toLowerCase())).size !== 5) {
    throw new Error("Use a different first name for each seat.");
  }

  const now = Date.now();
  const teacher = { id: `teacher-${Math.random().toString(36).slice(2, 9)}`, name: teacherName };

  let code = makeCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const path = `rooms/${code}`;
    const ref = doc(db, "rooms", code);
    try {
      const existing = await getDoc(ref);
      if (existing.exists()) {
        code = makeCode();
        if (attempt === 4) {
          throw new Error("Could not allocate a unique room code. Try again.");
        }
        continue;
      }

      const state = makeState({ code, teamName, theme, now, teacher, students });
      if (example) fillExample(state);
      const cleanState = sanitizeForFirestore(state);

      await setDoc(ref, {
        code,
        teamName: cleanState.teamName,
        theme: cleanState.theme,
        stage: cleanState.stage,
        version: 1,
        state: cleanState,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        code,
        teacherId: teacher.id,
        seatIds: students.map((s) => ({ id: s.id, name: s.name, role: s.role })),
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("unique room code")) throw error;
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  throw new Error("The room could not be opened.");
}

function makeSessionCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

export async function createSkillGraphWorkshop(input?: {
  teamName?: string;
  theme?: string;
}): Promise<{ code: string; teacherId: string }> {
  const teamName = clip(input?.teamName || SKILLGRAPH_DEMO.teamName, 40);
  const theme = clip(input?.theme || SKILLGRAPH_DEMO.theme, 80);
  const now = Date.now();
  const teacher = {
    id: `teacher-${Math.random().toString(36).slice(2, 9)}`,
    name: SKILLGRAPH_DEMO.teacherName,
  };
  const students = SKILLGRAPH_DEMO.students.map((student) => ({
    id: `seat-${Math.random().toString(36).slice(2, 9)}`,
    name: student.name,
    role: null as RoleId | null,
    claimed: false,
  }));

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = makeSessionCode(6);
    const path = `rooms/${code}`;
    const ref = doc(db, "rooms", code);
    try {
      const existing = await getDoc(ref);
      if (existing.exists()) continue;
      const state = makeState({
        code,
        teamName,
        theme,
        now,
        teacher,
        students,
        workshopPhase: "lobby",
      });
      const cleanState = sanitizeForFirestore(state);
      await setDoc(ref, {
        code,
        teamName: cleanState.teamName,
        theme: cleanState.theme,
        stage: cleanState.stage,
        version: 1,
        state: cleanState,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, "demoSessions", "current"), {
        activeCode: code,
        updatedAt: serverTimestamp(),
      });
      return { code, teacherId: teacher.id };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
  throw new Error("Could not create a new workshop session.");
}

export function subscribeActiveDemoCode(
  onCode: (code: string | null) => void,
): Unsubscribe {
  const path = "demoSessions/current";
  const ref = doc(db, "demoSessions", "current");
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onCode(null);
        return;
      }
      const data = snap.data() as { activeCode?: string };
      onCode(data.activeCode ?? null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    },
  );
}

export async function getActiveDemoCode(): Promise<string | null> {
  const path = "demoSessions/current";
  const ref = doc(db, "demoSessions", "current");
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as { activeCode?: string };
    return data.activeCode ?? null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function attachDemoPersona(
  code: string,
  seatNameOrId: string,
): Promise<{ seatId: string; version: number; state: RoomState }> {
  const upper = code.toUpperCase();
  const path = `rooms/${upper}`;
  const ref = doc(db, "rooms", upper);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error(`Session code ${upper} is not open. Check the code on your teacher's screen.`);
      }
      const data = snap.data() as RoomDoc;
      const target = seatNameOrId.trim().toLowerCase();
      const state = sanitizeForFirestore(data.state);
      const seat = state.participants.find(
        (p) =>
          p.kind === "student" &&
          (p.id.toLowerCase() === target || p.name.toLowerCase() === target),
      );
      if (!seat) {
        throw new Error("That student seat is not in this workshop.");
      }

      const checked = new Set(state.checkedInIds ?? []);
      const alreadyChecked = checked.has(seat.id) && seat.claimed;
      if (alreadyChecked) {
        return { seatId: seat.id, version: data.version, state };
      }

      seat.claimed = true;
      checked.add(seat.id);
      state.checkedInIds = [...checked];
      state.log.push({
        at: Date.now(),
        actorId: seat.id,
        action: "check-in",
        detail: `${seat.name} signed in`,
      });
      if (state.log.length > 400) state.log.splice(0, state.log.length - 400);

      const nextVersion = data.version + 1;

      tx.update(ref, {
        version: nextVersion,
        state: sanitizeForFirestore(state),
        updatedAt: serverTimestamp(),
      });
      return { seatId: seat.id, version: nextVersion, state };
    });
  } catch (error) {
    if (error instanceof Error && !error.message.includes("Missing or insufficient permissions")) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeRoom(
  code: string,
  onData: (room: RoomDoc | null) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const upper = code.toUpperCase();
  const path = `rooms/${upper}`;
  const ref = doc(db, "rooms", upper);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(snap.data() as RoomDoc);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped.message : "Could not load room.");
      }
    },
  );
}

export async function joinRoomSeat(
  code: string,
  seatId: string,
): Promise<{ version: number; state: RoomState }> {
  const upper = code.toUpperCase();
  const path = `rooms/${upper}`;
  const ref = doc(db, "rooms", upper);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error(`Room code ${upper} is not open. Check each character on the teacher's card.`);
      }
      const data = snap.data() as RoomDoc;
      const seat = data.state.participants.find(
        (person) => person.id === seatId && person.kind === "student",
      );
      if (!seat) {
        throw new Error("That name is not on this room's list.");
      }
      if (seat.claimed) {
        throw new Error(
          `${seat.name} already joined on another device. Ask the teacher to release the seat if that was you.`,
        );
      }
      const now = Date.now();
      const result = applyAction(sanitizeForFirestore(data.state), seatId, { type: "claim" }, now);
      if (!result.ok) {
        throw new Error(result.error);
      }
      const cleanState = sanitizeForFirestore(result.state);
      const nextVersion = data.version + 1;

      tx.update(ref, {
        version: nextVersion,
        state: cleanState,
        updatedAt: serverTimestamp(),
      });
      return { version: nextVersion, state: cleanState };
    });
  } catch (error) {
    if (error instanceof Error && !error.message.includes("Missing or insufficient permissions")) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function actOnRoomInFirestore(
  code: string,
  expectedVersion: number,
  actorId: string,
  action: Action,
): Promise<{ ok: true; version: number; state: RoomState } | { ok: false; error: string; version?: number; state?: RoomState }> {
  const upper = code.toUpperCase();
  const path = `rooms/${upper}`;
  const ref = doc(db, "rooms", upper);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        return { ok: false, error: `Room code ${upper} is not open.` };
      }
      const data = snap.data() as RoomDoc;
      if (data.version !== expectedVersion) {
        return {
          ok: false,
          error: "The board changed. Look again, then retry.",
          version: data.version,
          state: data.state,
        };
      }
      const now = Date.now();
      const result = applyAction(sanitizeForFirestore(data.state), actorId, action, now);
      if (!result.ok) {
        return {
          ok: false,
          error: result.error,
          version: data.version,
          state: result.state,
        };
      }
      const cleanState = sanitizeForFirestore(result.state);
      const nextVersion = data.version + 1;
      tx.update(ref, {
        teamName: cleanState.teamName,
        theme: cleanState.theme,
        stage: cleanState.stage,
        version: nextVersion,
        state: cleanState,
        updatedAt: serverTimestamp(),
      });
      return { ok: true, version: nextVersion, state: cleanState };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function openPracticeSeatsInFirestore(
  code: string,
): Promise<{ seats: { id: string; name: string; role: RoleId | null }[] }> {
  const upper = code.toUpperCase();
  const path = `rooms/${upper}`;
  const ref = doc(db, "rooms", upper);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error(`Room code ${upper} is not open.`);
      }
      const data = snap.data() as RoomDoc;
      let state = sanitizeForFirestore(data.state);
      const now = Date.now();
      for (const seat of state.participants.filter((person) => person.kind === "student" && !person.claimed)) {
        const result = applyAction(state, seat.id, { type: "claim" }, now);
        if (!result.ok) throw new Error(result.error);
        state = result.state;
      }
      const cleanState = sanitizeForFirestore(state);
      tx.update(ref, {
        stage: cleanState.stage,
        version: data.version + 1,
        state: cleanState,
        updatedAt: serverTimestamp(),
      });
      const seats = cleanState.participants
        .filter((person) => person.kind === "student")
        .map((person) => ({ id: person.id, name: person.name, role: person.role }));
      return { seats };
    });
  } catch (error) {
    if (error instanceof Error && !error.message.includes("Missing or insufficient permissions")) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function evolveRoomInFirestore(code: string) {
  const upper = code.toUpperCase();
  const path = `rooms/${upper}`;
  const ref = doc(db, "rooms", upper);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const data = snap.data() as RoomDoc;
      const state = sanitizeForFirestore(data.state);
      const changed = evolve(state, Date.now());
      if (!changed) return;
      const cleanState = sanitizeForFirestore(state);
      tx.update(ref, {
        stage: cleanState.stage,
        version: data.version + 1,
        state: cleanState,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveInterviewInFirestore(
  code: string,
  expectedVersion: number,
  interview: Interview,
): Promise<{ version: number; state: RoomState }> {
  const upper = code.toUpperCase();
  const path = `rooms/${upper}`;
  const ref = doc(db, "rooms", upper);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error(`Room code ${upper} is not open.`);
      }
      const data = snap.data() as RoomDoc;
      if (data.version !== expectedVersion) {
        throw new Error("The board changed. Look again, then retry.");
      }
      const state = sanitizeForFirestore(data.state);
      state.interview = sanitizeForFirestore(interview);
      const nextVersion = data.version + 1;
      tx.update(ref, {
        version: nextVersion,
        state,
        updatedAt: serverTimestamp(),
      });
      return { version: nextVersion, state };
    });
  } catch (error) {
    if (error instanceof Error && !error.message.includes("Missing or insufficient permissions")) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
