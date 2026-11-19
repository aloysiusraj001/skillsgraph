"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { LogOut } from "lucide-react";
import { RolePortrait, RoleToken, TeacherPortrait } from "@/components/role-token";
import { RoomCode } from "@/components/room-code";
import { Board } from "@/components/room/board";
import { InterviewPanel } from "@/components/room/interview-panel";
import { TeacherView } from "@/components/room/teacher-view";
import { WindingCanvas } from "@/components/room/winding-canvas";
import { YourMove } from "@/components/room/your-move";
import {
  clearPersona,
  readPersona,
  writePersona,
  type DemoPersona,
} from "@/components/skillgraph/persona";
import { WelcomeScreen } from "@/components/skillgraph/welcome-screen";
import {
  RolesDealScreen,
  RolesIntroScreen,
  WorkshopLobbyScreen,
} from "@/components/skillgraph/workshop-flow";
import { Button } from "@/components/ui/button";
import { unknownRoomMessage } from "@/lib/code";
import { SCREENS, STEP_PURPOSE } from "@/lib/copy";
import { ROLES, type Action, type RoleId } from "@/lib/domain";
import { editBanner } from "@/lib/editing";
import { presentRoom } from "@/lib/present";
import {
  actOnRoomInFirestore,
  attachDemoPersona,
  evolveRoomInFirestore,
  joinRoomSeat,
  subscribeRoom,
  type RoomDoc,
} from "@/lib/rooms-firestore";

type SeatPass = { id: string; name: string; role: RoleId | null };
type Desk = { activeId: string; teacherId: string | null; seats: SeatPass[] };

function readDesk(code: string): Desk | null {
  const raw = sessionStorage.getItem(`c60:${code}`);
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as Partial<Desk>;
      if (parsed.activeId) {
        return {
          activeId: parsed.activeId,
          teacherId: parsed.teacherId ?? null,
          seats: Array.isArray(parsed.seats) ? parsed.seats : [],
        };
      }
      return null;
    } catch {
      return null;
    }
  }
  return null;
}

function writeDesk(code: string, desk: Desk) {
  sessionStorage.setItem(`c60:${code}`, JSON.stringify(desk));
}

const PILLS = [
  ["s0", "Start"],
  ["s1", "People"],
  ["s1b", "Merge"],
  ["s2", "Power"],
  ["s3", "Incident"],
  ["s4a", "Causes"],
  ["s4b", "Choose"],
  ["s4c", "Why"],
  ["s4d", "Pin"],
  ["s5", "Statement"],
  ["s6", "Choose 3"],
  ["s7", "Pack"],
] as const;

export function RoomApp({ code }: { code: string }) {
  const router = useRouter();
  const [persona, setPersona] = useState<DemoPersona | null>(null);
  const [desk, setDesk] = useState<Desk | null>(null);
  const [deskReady, setDeskReady] = useState(false);
  const [roomDoc, setRoomDoc] = useState<RoomDoc | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setDesk(readDesk(code));
    setPersona(readPersona());
    setDeskReady(true);
  }, [code]);

  useEffect(() => {
    setError(null);
    const unsub = subscribeRoom(
      code,
      (docData) => {
        setRoomDoc(docData);
      },
      (errMessage) => {
        setError(errMessage);
      },
    );
    return () => unsub();
  }, [code]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!roomDoc) return;
    const timer = roomDoc.state.timer;
    if (timer.running && timer.endsAt && now >= timer.endsAt) {
      void evolveRoomInFirestore(code);
    }
  }, [code, now, roomDoc]);

  useEffect(() => {
    if (!roomDoc || !persona || desk) return;
    let cancelled = false;
    async function attach() {
      if (!roomDoc || !persona) return;
      if (persona.kind === "teacher") {
        const teacherSeat = roomDoc.state.participants.find((p) => p.kind === "teacher");
        if (teacherSeat && !cancelled) {
          const nextDesk = { activeId: teacherSeat.id, teacherId: teacherSeat.id, seats: [] };
          writeDesk(code, nextDesk);
          setDesk(nextDesk);
        }
        return;
      }
      const match = roomDoc.state.participants.find(
        (p) => p.kind === "student" && p.name.toLowerCase() === persona.name.toLowerCase(),
      );
      if (!match) return;
      try {
        const joined = await attachDemoPersona(code, match.id);
        if (!cancelled) {
          const nextDesk = { activeId: joined.seatId, teacherId: null, seats: [] };
          writeDesk(code, nextDesk);
          setDesk(nextDesk);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not join seat.");
        }
      }
    }
    void attach();
    return () => {
      cancelled = true;
    };
  }, [code, desk, persona, roomDoc]);

  const act = useCallback(
    async (action: Action) => {
      if (!desk?.activeId || !roomDoc) return false;
      setSaving(true);
      setError(null);
      try {
        const result = await actOnRoomInFirestore(
          code,
          roomDoc.version,
          desk.activeId,
          action,
        );
        if (!result.ok) {
          setError(result.error || "That move did not land.");
          return false;
        }
        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "The room could not be reached. Stay on this page and try again.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [code, desk?.activeId, roomDoc],
  );

  function sitAs(nextId: string, nextDesk: Desk) {
    const updated = { ...nextDesk, activeId: nextId };
    writeDesk(code, updated);
    setDesk(updated);
    setSelected(null);
    setError(null);
  }

  function handleLogout() {
    clearPersona();
    setPersona(null);
    setDesk(null);
    router.push("/");
  }

  if (!deskReady) {
    return <p className="p-6">Opening the room…</p>;
  }

  if (!persona && !desk) {
    return (
      <WelcomeScreen
        onSelectPersona={(next) => {
          writePersona(next);
          setPersona(next);
        }}
      />
    );
  }

  if (roomDoc === undefined) {
    return <p className="p-6">{error || "Opening the room…"}</p>;
  }
  if (roomDoc === null) {
    return <p className="p-6">{unknownRoomMessage(code)}</p>;
  }

  const activeSeat = desk?.activeId
    ? roomDoc.state.participants.find((p) => p.id === desk.activeId)
    : undefined;

  if (!desk || !activeSeat) {
    return (
      <JoinScreen
        code={code}
        roomDoc={roomDoc}
        onSeatJoined={(nextDesk) => {
          writeDesk(code, nextDesk);
          setDesk(nextDesk);
        }}
      />
    );
  }

  const presented = presentRoom(roomDoc.state, activeSeat.id, roomDoc.version, now);
  if (!presented) {
    return <p className="p-6">That seat is not in this room.</p>;
  }

  const { state, you, meter, radar } = presented;
  const teacher = you.kind === "teacher";
  const workshopPhase = state.workshopPhase ?? "live";
  const personaLabel = teacher
    ? "Teacher"
    : `${you.name}${you.role ? ` · ${ROLES[you.role].name}` : ""}`;

  const stepIndex = Math.max(0, PILLS.findIndex(([id]) => id === state.stage));
  const stepLabel = PILLS[stepIndex]?.[1] ?? "";
  const screen = SCREENS[state.stage];
  const purpose = STEP_PURPOSE[state.stage];

  function choose(id: string | null) {
    if (
      id &&
      selected &&
      teacher === false &&
      you.role === "mapper" &&
      state.stage === "s6" &&
      id !== selected
    ) {
      void act({ type: "cluster", a: selected, b: id });
      setSelected(null);
      return;
    }
    setSelected(id);
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {workshopPhase === "lobby" && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <WorkshopLobbyScreen
              state={state}
              isTeacher={teacher}
              personaLabel={personaLabel}
              personaRole={you.role}
              saving={saving}
              onBack={() => router.push("/")}
              onLogout={handleLogout}
              onStartSession={() => void act({ type: "workshop-phase", phase: "roles-intro" })}
            />
          </motion.div>
        )}

        {workshopPhase === "roles-intro" && (
          <motion.div
            key="roles-intro"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <RolesIntroScreen
              isTeacher={teacher}
              personaLabel={personaLabel}
              personaRole={you.role}
              saving={saving}
              onBack={() => void act({ type: "workshop-phase", phase: "lobby" })}
              onLogout={handleLogout}
              onContinue={() => void act({ type: "workshop-phase", phase: "roles-deal" })}
            />
          </motion.div>
        )}

        {workshopPhase === "roles-deal" && (
          <motion.div
            key="roles-deal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <RolesDealScreen
              state={state}
              isTeacher={teacher}
              personaLabel={personaLabel}
              personaRole={you.role}
              saving={saving}
              onBack={() => void act({ type: "workshop-phase", phase: "roles-intro" })}
              onLogout={handleLogout}
              onSpinRoles={async (spinAction) => {
                await act(spinAction);
              }}
              onStartWorkshop={() => void act({ type: "workshop-phase", phase: "live" })}
            />
          </motion.div>
        )}

        {workshopPhase === "live" && (
          <motion.div
            key="live"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen overflow-x-hidden"
          >
            <header className="sticky top-0 z-20 border-b border-[#e4dcd0] bg-[#f3efe7]/95 px-4 py-2.5 backdrop-blur">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-[#1e2a44] text-sm font-semibold text-white">C60</span>
                  <div>
                    <div className="font-semibold leading-tight text-[#1c2430]">What&apos;s the problem</div>
                    <div className="text-xs text-[#5c6570]">
                      {state.teamName} · {state.theme}
                    </div>
                  </div>
                </div>
                {["s2", "s3", "s4a", "s4b", "s4c", "s4d", "s5", "s6", "s7"].includes(state.stage) && (
                  <div className={`rounded-xl border px-3 py-1 text-xs font-medium ${state.summary.whoseId ? "border-[#0E948C]/40 bg-[#f1fbf9] text-[#0c6b65]" : "border-[#e4dcd0] bg-[#fff6e4] text-[#8A5A08]"}`}>
                    {state.summary.whoseId
                      ? `Following ${state.stakeholders.find((card) => card.id === state.summary.whoseId)?.label ?? "someone"}`
                      : "No one chosen yet"}
                  </div>
                )}
                <RoomCode code={state.code} />
                <div className="ml-auto flex items-center gap-2.5">
                  <span className="hidden text-xs font-semibold text-[#1e2a44] tabular-nums sm:inline">
                    Step {stepIndex + 1} of {PILLS.length} · {stepLabel}
                  </span>
                  <div className="flex items-center gap-2 rounded-xl border border-[#e4dcd0] bg-white px-2.5 py-1 text-xs font-medium text-[#1c2430]">
                    {teacher ? (
                      <TeacherPortrait size={24} />
                    ) : you.role ? (
                      <RolePortrait role={you.role} size={24} />
                    ) : null}
                    <span className="max-w-[140px] truncate">{teacher ? "Teacher" : you.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 rounded-xl bg-white"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log out
                  </Button>
                </div>
              </div>
              {desk.seats.length > 0 && (
                <div className="mx-auto mt-2.5 flex max-w-6xl flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#5c6570]">Move as</span>
                  {desk.seats.map((seat) => (
                    <Button
                      key={seat.id}
                      type="button"
                      variant={desk.activeId === seat.id ? "default" : "outline"}
                      className="h-10 gap-2 px-3 text-sm"
                      onClick={() => sitAs(seat.id, desk)}
                    >
                      {seat.role && <RoleToken role={seat.role} size={22} />}
                      {seat.name}
                    </Button>
                  ))}
                  {desk.teacherId && (
                    <Button
                      type="button"
                      variant={desk.activeId === desk.teacherId ? "default" : "outline"}
                      className="h-10 px-3 text-sm"
                      onClick={() => desk.teacherId && sitAs(desk.teacherId, desk)}
                    >
                      Teacher radar
                    </Button>
                  )}
                </div>
              )}
            </header>
            {!teacher ? (
              <main className="min-w-0">
                {error && (
                  <div className="mx-auto max-w-6xl px-4 pt-3">
                    <p className="rounded-2xl bg-white px-3 py-2 text-[#c63b32]" role="alert">
                      {error}
                    </p>
                  </div>
                )}
                <WindingCanvas
                  code={code}
                  version={presented.version}
                  state={state}
                  youId={you.id}
                  role={you.role}
                  selected={selected}
                  onSelect={choose}
                  act={(action) => void act(action)}
                  readOnly={false}
                  now={now}
                  sidebar={
                    <YourMove
                      state={state}
                      youId={you.id}
                      role={you.role}
                      meter={meter}
                      act={(action) => act(action)}
                      saving={saving}
                      error={error}
                      selected={selected}
                      onSelect={choose}
                    />
                  }
                />
              </main>
            ) : (
              <main className="mx-auto grid max-w-6xl gap-4 p-4">
                {error && <p className="rounded-2xl bg-white px-3 py-2 text-[#c63b32]" role="alert">{error}</p>}
                {radar && (
                  <TeacherView
                    state={state}
                    radar={radar}
                    act={(action) => void act(action)}
                    saving={saving}
                    showBoard={showBoard}
                    onToggleBoard={() => setShowBoard((value) => !value)}
                    now={now}
                  />
                )}
                {showBoard && (
                  <div className="grid min-w-0 gap-3 overflow-x-hidden">
                    <div>
                      <h1 className="text-2xl font-semibold">{screen.title}</h1>
                      {purpose && <p className="mt-2 max-w-3xl rounded-2xl bg-white px-3 py-3">{purpose}</p>}
                      <p className="mt-2 max-w-3xl font-semibold">{editBanner(state, you.role).you}</p>
                      <p className="mt-1 max-w-3xl text-[#3c4654]">{editBanner(state, you.role).board}</p>
                    </div>
                    {state.stage === "s3" && (
                      <InterviewPanel
                        code={code}
                        version={presented.version}
                        state={state}
                        youId={you.id}
                        canAsk={false}
                      />
                    )}
                    <Board
                      state={state}
                      role={you.role}
                      youId={you.id}
                      selected={selected}
                      onSelect={choose}
                      act={(action) => void act(action)}
                      readOnly
                      now={now}
                    />
                  </div>
                )}
              </main>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

function JoinScreen({
  code,
  roomDoc,
  onSeatJoined,
}: {
  code: string;
  roomDoc: RoomDoc;
  onSeatJoined: (desk: Desk) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const studentSeats = roomDoc.state.participants.filter((person) => person.kind === "student");
  const teacherSeat = roomDoc.state.participants.find((person) => person.kind === "teacher");

  async function claim(seatId: string) {
    setBusy(true);
    setError(null);
    try {
      await joinRoomSeat(code, seatId);
      onSeatJoined({
        activeId: seatId,
        teacherId: teacherSeat?.id ?? null,
        seats: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-3xl gap-4 p-6">
      <h1 className="text-2xl font-semibold">Join {roomDoc.teamName}</h1>
      <RoomCode code={code} prominent />
      <p>Theme: {roomDoc.theme}. Tap your name. This device keeps your seat if you refresh.</p>
      {error && <p className="rounded-2xl bg-white px-3 py-2 text-[#c63b32]" role="alert">{error}</p>}
      <div className="grid gap-2">
        {studentSeats.map((seat) => (
          <Button
            key={seat.id}
            type="button"
            className="h-12 justify-between px-4 text-base"
            disabled={busy || seat.claimed}
            onClick={() => void claim(seat.id)}
          >
            <span className="flex items-center gap-2">
              {seat.role && <RoleToken role={seat.role} size={28} />}
              {seat.name}
            </span>
            <span>{seat.claimed ? "Already joined" : seat.role ? ROLES[seat.role].name : "No role yet"}</span>
          </Button>
        ))}
      </div>
      {teacherSeat && (
        <Button
          type="button"
          variant="outline"
          className="h-11 justify-center px-4 text-base"
          onClick={() =>
            onSeatJoined({
              activeId: teacherSeat.id,
              teacherId: teacherSeat.id,
              seats: [],
            })
          }
        >
          Open Teacher radar
        </Button>
      )}
    </main>
  );
}
