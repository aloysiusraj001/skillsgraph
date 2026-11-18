"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RoleToken } from "@/components/role-token";
import { RoomCode } from "@/components/room-code";
import { Board } from "@/components/room/board";
import { StudentFilms } from "@/components/room/film-panel";
import { InterviewPanel } from "@/components/room/interview-panel";
import { TeacherView } from "@/components/room/teacher-view";
import { YourMove } from "@/components/room/your-move";
import { Button } from "@/components/ui/button";
import { SCREENS, STEP_PURPOSE } from "@/lib/copy";
import { editBanner } from "@/lib/editing";
import { ROLES, type Action, type RoleId, type RoomState } from "@/lib/domain";
import type { Meter, RadarCue } from "@/lib/game";

type SeatPass = { id: string; name: string; role: RoleId | null; token: string };
type Desk = { active: string; teacher: string | null; seats: SeatPass[] };
type You = { id: string; name: string; role: RoleId | null; kind: "teacher" | "student" };

function readDesk(code: string): Desk | null {
  const raw = sessionStorage.getItem(`c60:${code}`);
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      return JSON.parse(raw) as Desk;
    } catch {
      return null;
    }
  }
  return { active: raw, teacher: null, seats: [] };
}

function writeDesk(code: string, desk: Desk) {
  sessionStorage.setItem(`c60:${code}`, JSON.stringify(desk));
}
type Payload = {
  version: number;
  serverNow: number;
  you: You;
  meter: Meter;
  radar: RadarCue | null;
  state: RoomState;
  error?: string;
  token?: string;
};

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
  const [token, setToken] = useState<string | null>(null);
  const [desk, setDesk] = useState<Desk | null>(null);
  const [ready, setReady] = useState(false);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  const [now, setNow] = useState(Date.now());
  const versionRef = useRef(0);

  useEffect(() => {
    const stored = readDesk(code);
    setDesk(stored);
    setToken(stored?.active ?? null);
    setReady(true);
  }, [code]);

  useEffect(() => {
    if (!payload || payload.you.kind !== "teacher" || !token) return;
    setDesk((current) => {
      if (current?.teacher === token) return current;
      if (current?.seats.some((seat) => seat.token === token)) return current;
      const next = { active: token, teacher: token, seats: current?.seats ?? [] };
      writeDesk(code, next);
      return next;
    });
  }, [payload, token, code]);

  useEffect(() => {
    if (!token) return;
    let stop = false;
    async function pull() {
      try {
        const response = await fetch(`/api/rooms/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (response.status === 401) {
          const stored = readDesk(code);
          if (stored?.teacher && stored.teacher !== token) {
            const next = { ...stored, active: stored.teacher };
            writeDesk(code, next);
            if (!stop) {
              setDesk(next);
              setToken(stored.teacher);
            }
            return;
          }
          sessionStorage.removeItem(`c60:${code}`);
          if (!stop) {
            setToken(null);
            setDesk(null);
            setPayload(null);
          }
          return;
        }
        if (!response.ok) {
          if (!stop) setOffline(true);
          return;
        }
        const data = (await response.json()) as Payload;
        if (stop || data.version < versionRef.current) return;
        versionRef.current = data.version;
        setOffline(false);
        setPayload(data);
        setNow(data.serverNow);
      } catch {
        if (!stop) setOffline(true);
      }
    }
    void pull();
    const timer = setInterval(() => {
      if (!saving) void pull();
    }, 1500);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [code, token, saving]);

  useEffect(() => {
    const timer = setInterval(() => setNow((value) => value + 1000), 1000);
    return () => clearInterval(timer);
  }, []);

  const act = useCallback(
    async (action: Action) => {
      if (!token || !payload) return false;
      setSaving(true);
      setError(null);
      try {
        const response = await fetch(`/api/rooms/${code}/act`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ version: payload.version, action }),
        });
        const data = (await response.json()) as Payload;
        if (data.version) versionRef.current = Math.max(versionRef.current, data.version);
        if (data.state) setPayload(data);
        if (data.serverNow) setNow(data.serverNow);
        if (!response.ok) setError(data.error || "That move did not land.");
        return response.ok;
      } catch {
        setError("The room could not be reached. Stay on this page and try again.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [code, payload, token],
  );

  function sitAs(nextToken: string, nextDesk: Desk) {
    const updated = { ...nextDesk, active: nextToken };
    writeDesk(code, updated);
    setDesk(updated);
    versionRef.current = 0;
    setSelected(null);
    setError(null);
    setPayload(null);
    setToken(nextToken);
  }

  async function openSeats() {
    const teacherToken = desk?.teacher || token;
    if (!teacherToken) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/rooms/${code}/practice`, {
        method: "POST",
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      const data = (await response.json()) as Payload & { seats?: SeatPass[] };
      if (!response.ok || !data.seats?.length) {
        setError(data.error || "The seats could not be opened.");
        return;
      }
      const leader = data.seats.find((seat) => seat.role === "leader") ?? data.seats[0];
      sitAs(leader.token, { active: leader.token, teacher: teacherToken, seats: data.seats });
    } catch {
      setError("The room could not be reached. Stay on this page and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <p className="p-6">Opening the room…</p>;
  if (!token) return <JoinScreen code={code} onToken={setToken} />;
  if (!payload) {
    return (
      <p className="p-6">
        {offline ? "Can't reach the room. Check the connection and stay on this page." : "Opening the room…"}
      </p>
    );
  }

  const { state, you, meter, radar } = payload;
  const screen = SCREENS[state.stage];
  const pill = state.stage;
  const purpose = STEP_PURPOSE[state.stage];
  const teacher = you.kind === "teacher";

  function choose(id: string | null) {
    if (id && selected && teacher === false && you.role === "mapper" && state.stage === "s6" && id !== selected) {
      void act({ type: "cluster", a: selected, b: id });
      setSelected(null);
      return;
    }
    setSelected(id);
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-20 border-b bg-[#f3efe7]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#1e2a44] text-sm font-semibold text-white">C60</span>
            <div>
              <div className="font-semibold">What&apos;s the problem</div>
              <div className="text-sm text-muted-foreground">{state.teamName}</div>
            </div>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-sm">{state.theme}</div>
          {["s2", "s3", "s4a", "s4b", "s4c", "s4d", "s5", "s6", "s7"].includes(state.stage) && (
            <div className={`rounded-full px-3 py-1 text-sm ${state.summary.whoseId ? "bg-[#1e2a44] text-white" : "bg-[#fff6e4]"}`}>
              {state.summary.whoseId
                ? `Following ${state.stakeholders.find((card) => card.id === state.summary.whoseId)?.label ?? "someone"}`
                : "No one chosen yet"}
            </div>
          )}
          <RoomCode code={state.code} />
          <div className="ml-auto flex gap-1 overflow-x-auto">
            {PILLS.map(([id, label]) => (
              <span
                key={id}
                className={`rounded-full px-2 py-1 text-sm ${pill === id ? "bg-[#1e2a44] text-white" : "bg-white text-[#5c6570]"}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        {desk && desk.seats.length > 0 && (
          <div className="mx-auto mt-3 flex max-w-6xl flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Move as</span>
            {desk.seats.map((seat) => (
              <Button
                key={seat.id}
                type="button"
                variant={token === seat.token ? "default" : "outline"}
                className="h-11 gap-2 px-3 text-base"
                onClick={() => sitAs(seat.token, desk)}
              >
                {seat.role && <RoleToken role={seat.role} size={22} />}
                {seat.name}
              </Button>
            ))}
            {desk.teacher && (
              <Button type="button" variant={token === desk.teacher ? "default" : "outline"} className="h-11 px-3 text-base" onClick={() => desk.teacher && sitAs(desk.teacher, desk)}>
                Teacher radar
              </Button>
            )}
          </div>
        )}
      </header>
      <main className="mx-auto grid max-w-6xl gap-4 p-4">
        {offline && <p className="rounded-2xl bg-white px-3 py-2">Can&apos;t reach the room. Check the connection and stay on this page.</p>}
        {error && <p className="rounded-2xl bg-white px-3 py-2" role="alert">{error}</p>}
        {teacher && radar && (
          <TeacherView
            state={state}
            radar={radar}
            act={(action) => void act(action)}
            saving={saving}
            showBoard={showBoard}
            onToggleBoard={() => setShowBoard((value) => !value)}
            onPractice={() => void openSeats()}
            practicing={Boolean(desk?.seats.length)}
            now={now}
          />
        )}
        {(!teacher || showBoard) && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            {!teacher && (
              <div className="min-w-0 lg:order-2 lg:self-start">
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
              </div>
            )}
            <div className="grid min-w-0 gap-3 overflow-x-hidden lg:order-1">
              <div>
                <h1 className="text-2xl font-semibold">{screen.title}</h1>
                {purpose && <p className="mt-2 max-w-3xl rounded-2xl bg-white px-3 py-3">{purpose}</p>}
                <p className="mt-2 max-w-3xl font-semibold">{editBanner(state, you.role).you}</p>
                <p className="mt-1 max-w-3xl text-[#3c4654]">{editBanner(state, you.role).board}</p>
              </div>
              {!teacher && <StudentFilms state={state} />}
              {state.stage === "s3" && token && (
                <InterviewPanel
                  code={code}
                  token={token}
                  version={payload.version}
                  state={state}
                  canAsk={you.role === "interviewer"}
                  onResult={(data) => {
                    if (!data.version || !data.state) return;
                    versionRef.current = Math.max(versionRef.current, data.version);
                    setPayload((current) => {
                      if (!current || data.version < current.version) return current;
                      return { ...current, ...data, you: current.you };
                    });
                    if (data.serverNow) setNow(data.serverNow);
                  }}
                />
              )}
              <Board
                state={state}
                role={you.role}
                selected={selected}
                onSelect={choose}
                act={(action) => void act(action)}
                readOnly={teacher}
                now={now}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function JoinScreen({ code, onToken }: { code: string; onToken: (token: string) => void }) {
  const [lobby, setLobby] = useState<{ teamName: string; theme: string; seats: { id: string; name: string; role: RoleId | null; claimed: boolean }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stop = false;
    async function load() {
      const response = await fetch(`/api/rooms/${code}/lobby`, { cache: "no-store" });
      const data = await response.json();
      if (stop) return;
      if (!response.ok) setError(data.error || "This room code is not open.");
      else setLobby(data);
    }
    void load();
    const timer = setInterval(() => void load(), 2000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [code]);

  async function claim(seatId: string) {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatId }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not join.");
      return;
    }
    sessionStorage.setItem(`c60:${code}`, data.token);
    onToken(data.token);
  }

  if (!lobby && !error) return <p className="p-6">Opening the room…</p>;
  return (
    <main className="mx-auto grid max-w-3xl gap-4 p-6">
      <h1 className="text-2xl font-semibold">Join {lobby?.teamName ?? "the room"}</h1>
      <RoomCode code={code} prominent />
      <p>Theme: {lobby?.theme ?? "Waiting for the room"}. Tap your name. This device keeps your seat if you refresh.</p>
      {error && <p className="rounded-2xl bg-white px-3 py-2" role="alert">{error}</p>}
      <div className="grid gap-2">
        {lobby?.seats.map((seat) => (
          <Button key={seat.id} type="button" className="h-12 justify-between px-4 text-base" disabled={busy || seat.claimed} onClick={() => void claim(seat.id)}>
            <span className="flex items-center gap-2">
              {seat.role && <RoleToken role={seat.role} size={28} />}
              {seat.name}
            </span>
            <span>{seat.claimed ? "Already joined" : seat.role ? ROLES[seat.role].name : "No role yet"}</span>
          </Button>
        ))}
      </div>
    </main>
  );
}
