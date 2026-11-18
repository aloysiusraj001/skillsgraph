"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RoleToken } from "@/components/role-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_ORDER, ROLES, type RoleId } from "@/lib/domain";

const EMPTY = ROLE_ORDER.map((role, index) => ({ name: "", role, key: index }));

export function HomeForm() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("Team Kestrel");
  const [theme, setTheme] = useState("School lunch waste reduction");
  const [teacherName, setTeacherName] = useState("Teacher");
  const [seats, setSeats] = useState(EMPTY);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function openExample() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ example: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "The example could not be opened.");
        return;
      }
      const practice = await fetch(`/api/rooms/${data.code}/practice`, {
        method: "POST",
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const desk = await practice.json();
      if (!practice.ok || !desk.seats?.length) {
        setError(desk.error || "The example seats could not be opened.");
        return;
      }
      const leader = desk.seats.find((seat: { role: string }) => seat.role === "leader") ?? desk.seats[0];
      sessionStorage.setItem(`c60:${data.code}`, JSON.stringify({
        active: leader.token,
        teacher: data.token,
        seats: desk.seats,
      }));
      router.push(`/room/${data.code}`);
    } catch {
      setError("The example could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  async function openPilot() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pilot: true }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "The room could not be opened.");
      return;
    }
    sessionStorage.setItem(`c60:${data.code}`, data.token);
    router.push(`/room/${data.code}`);
  }

  async function openRoom(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamName,
        theme,
        teacherName,
        students: seats.map((seat) => ({ name: seat.name, role: seat.role })),
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "The room could not be opened.");
      return;
    }
    sessionStorage.setItem(`c60:${data.code}`, data.token);
    router.push(`/room/${data.code}`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={openRoom} className="grid gap-3 rounded-3xl border bg-white p-5">
        <h2 className="text-xl font-semibold">Open a room</h2>
        <p>Assign the five roles before students join. You stay in this tab as the teacher.</p>
        <Label htmlFor="team">Team name</Label>
        <Input id="team" value={teamName} onChange={(event) => setTeamName(event.target.value)} className="h-11 text-base md:text-base" />
        <Label htmlFor="theme">Theme</Label>
        <Input id="theme" value={theme} onChange={(event) => setTheme(event.target.value)} className="h-11 text-base md:text-base" />
        <Label htmlFor="teacher">Your name on the radar</Label>
        <Input id="teacher" value={teacherName} onChange={(event) => setTeacherName(event.target.value)} className="h-11 text-base md:text-base" />
        {seats.map((seat, index) => (
          <div key={seat.key} className="grid gap-2 sm:grid-cols-[1fr_190px] sm:items-center">
            <Input
              aria-label={`Student ${index + 1} name`}
              value={seat.name}
              placeholder="First name"
              onChange={(event) => setSeats(seats.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))}
              className="h-11 text-base md:text-base"
            />
            <select
              aria-label={`Student ${index + 1} role`}
              className="h-11 rounded-xl border bg-white px-2 text-base"
              value={seat.role}
              onChange={(event) => setSeats(seats.map((item, itemIndex) => itemIndex === index ? { ...item, role: event.target.value as RoleId } : item))}
            >
              {ROLE_ORDER.map((role) => (
                <option key={role} value={role}>{ROLES[role].name}</option>
              ))}
            </select>
          </div>
        ))}
        {error && <p role="alert">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="h-11 px-4 text-base" disabled={busy}>Open room</Button>
          <Button type="button" variant="outline" className="h-11 px-4 text-base" disabled={busy} onClick={() => void openPilot()}>Open the lunch-waste pilot</Button>
          <Button type="button" variant="outline" className="h-11 px-4 text-base" disabled={busy} onClick={() => void openExample()}>Open the chocolate-bar example</Button>
        </div>
      </form>
      <form
        className="grid content-start gap-3 rounded-3xl border bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const next = code.trim().toUpperCase();
          if (next.length < 4) {
            setError("Enter the four-character room code.");
            return;
          }
          router.push(`/room/${next}`);
        }}
      >
        <h2 className="text-xl font-semibold">Join as a student</h2>
        <p>Use the code the teacher reads out. Then tap your name.</p>
        <Label htmlFor="code">Room code</Label>
        <Input id="code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} className="h-11 text-base uppercase md:text-base" placeholder="ACDE" style={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace' }} />
        <p className="text-sm text-muted-foreground">The code uses separate boxes on the teacher screen. It never uses B, 8, G, or 6.</p>
        <Button type="submit" className="h-11 px-4 text-base">Go to the room</Button>
      </form>
    </div>
  );
}

export function RoleStrip() {
  return (
    <ul className="mt-4 flex flex-wrap gap-3">
      {ROLE_ORDER.map((role) => (
        <li key={role} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2">
          <RoleToken role={role} size={32} />
          <span className="font-semibold" style={{ color: ROLES[role].color }}>{ROLES[role].name}</span>
        </li>
      ))}
    </ul>
  );
}
