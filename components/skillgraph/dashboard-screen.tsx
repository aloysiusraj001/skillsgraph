"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Calendar, LogOut, Plus, Users } from "lucide-react";
import { RolePortrait, TeacherPortrait } from "@/components/role-token";
import { SkillGraphLogo } from "@/components/skillgraph/logo";
import type { DemoPersona } from "@/components/skillgraph/persona";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_ORDER, ROLES, SKILLGRAPH_DEMO, type RoleId } from "@/lib/domain";
import {
  attachDemoPersona,
  createRoomInFirestore,
  createSkillGraphWorkshop,
  getActiveDemoCode,
  subscribeActiveDemoCode,
} from "@/lib/rooms-firestore";

const EMPTY_CUSTOM = ROLE_ORDER.map((role, index) => ({ name: "", role, key: index }));

export function DashboardScreen({
  persona,
  onLogout,
}: {
  persona: DemoPersona;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  const [teamName, setTeamName] = useState("Team Cocoa");
  const [theme, setTheme] = useState("The chocolate challenge");
  const [teacherName, setTeacherName] = useState("Teacher");
  const [seats, setSeats] = useState(EMPTY_CUSTOM);

  useEffect(() => {
    const unsub = subscribeActiveDemoCode((code) => {
      setActiveCode(code);
    });
    return () => unsub();
  }, []);

  async function joinWhatsTheProblem() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const currentCode = activeCode ?? (await getActiveDemoCode());

      if (persona.kind === "teacher") {
        if (currentCode) {
          sessionStorage.removeItem(`c60:${currentCode}`);
          router.push(`/room/${currentCode}`);
          return;
        }
        const created = await createSkillGraphWorkshop();
        sessionStorage.setItem(
          `c60:${created.code}`,
          JSON.stringify({
            activeId: created.teacherId,
            teacherId: created.teacherId,
            seats: [],
          }),
        );
        router.push(`/room/${created.code}`);
        return;
      }

      const targetCode = joinCode.trim().toUpperCase() || currentCode || "";
      if (!targetCode) {
        const created = await createSkillGraphWorkshop();
        const joined = await attachDemoPersona(created.code, persona.name);
        sessionStorage.setItem(
          `c60:${created.code}`,
          JSON.stringify({
            activeId: joined.seatId,
            teacherId: null,
            seats: [],
          }),
        );
        router.push(`/room/${created.code}`);
        return;
      }

      const joined = await attachDemoPersona(targetCode, persona.name);
      sessionStorage.setItem(
        `c60:${targetCode}`,
        JSON.stringify({
          activeId: joined.seatId,
          teacherId: null,
          seats: [],
        }),
      );
      router.push(`/room/${targetCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the workshop.");
    } finally {
      setBusy(false);
    }
  }

  async function startFreshTeacherWorkshop() {
    setBusy(true);
    setError(null);
    try {
      const created = await createSkillGraphWorkshop();
      sessionStorage.setItem(
        `c60:${created.code}`,
        JSON.stringify({
          activeId: created.teacherId,
          teacherId: created.teacherId,
          seats: [],
        }),
      );
      router.push(`/room/${created.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a new session.");
    } finally {
      setBusy(false);
    }
  }

  async function joinByCodeSubmit(event: FormEvent) {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setError("Enter the session code from your teacher's screen.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (persona.kind === "student") {
        const joined = await attachDemoPersona(code, persona.name);
        sessionStorage.setItem(
          `c60:${code}`,
          JSON.stringify({ activeId: joined.seatId, teacherId: null, seats: [] }),
        );
      } else {
        sessionStorage.removeItem(`c60:${code}`);
      }
      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join that session code.");
    } finally {
      setBusy(false);
    }
  }

  async function openCustomRoom(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createRoomInFirestore({
        teamName,
        theme,
        teacherName,
        students: seats.map((seat) => ({ name: seat.name, role: seat.role })),
      });
      sessionStorage.setItem(
        `c60:${created.code}`,
        JSON.stringify({
          activeId: created.teacherId,
          teacherId: created.teacherId,
          seats: [],
        }),
      );
      router.push(`/room/${created.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The room could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  async function openExample() {
    setBusy(true);
    setError(null);
    try {
      const created = await createRoomInFirestore({
        example: true,
      });
      const leader =
        created.seatIds.find((seat) => seat.role === "leader") ?? created.seatIds[0];
      sessionStorage.setItem(
        `c60:${created.code}`,
        JSON.stringify({
          activeId: leader.id,
          teacherId: created.teacherId,
          seats: created.seatIds,
        }),
      );
      router.push(`/room/${created.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The example could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <header className="border-b border-[#E5EAF2] bg-white px-6 py-3.5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <SkillGraphLogo compact />
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-sm font-medium text-[#1E293B]">
              {persona.kind === "teacher" ? (
                <TeacherPortrait size={26} />
              ) : (
                <RolePortrait role={persona.role} size={26} />
              )}
              {persona.kind === "teacher"
                ? "Teacher"
                : `${persona.name} · ${ROLES[persona.role].name}`}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#CBD5E1] bg-white px-3.5 py-1.5 text-sm font-medium text-[#334155] transition hover:border-[#4650E5] hover:text-[#4650E5]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-10">
        {error && (
          <p className="rounded-2xl border border-[#F5C2C0] bg-[#FEF2F2] px-4 py-3 text-sm text-[#C63B32]" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#334155]">
            {notice}
          </p>
        )}

        <section>
          <p className="text-[12px] font-semibold tracking-[0.12em] text-[#64748B] uppercase">
            UPCOMING WORKSHOPS
          </p>

          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <article className="relative overflow-hidden rounded-[22px] border border-[#DCE3EE] bg-white p-6 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-[#4650E5]" />
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E9F0F5] px-3 py-1 text-xs font-medium text-[#475569]">
                <Calendar className="h-3.5 w-3.5" />
                {SKILLGRAPH_DEMO.courseName}
              </div>
              <h2 className="mt-4 text-[22px] font-medium text-[#4650E5]">
                Pick your best ideas
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#64748B]">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Period 3
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Thu Sep 24 · 10:00 AM
                </span>
              </div>
              <hr className="my-5 border-[#E8EDF4]" />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setNotice(
                      "\"What's the Problem\" is the active C60 workshop today. Click Join workshop on \"What's the Problem\" to start.",
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-[#4650E5] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3740D1] disabled:opacity-60"
                >
                  Join workshop
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>

            <article className="relative overflow-hidden rounded-[22px] border-2 border-[#4650E5]/70 bg-white p-6 shadow-[0_6px_24px_rgba(70,80,229,0.08)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-[#4650E5]" />
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E9F0F5] px-3 py-1 text-xs font-medium text-[#475569]">
                  <Calendar className="h-3.5 w-3.5" />
                  {SKILLGRAPH_DEMO.courseName}
                </div>
                {activeCode && (
                  <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-semibold text-[#4650E5]">
                    Live · {activeCode}
                  </span>
                )}
              </div>
              <h2 className="mt-4 text-[22px] font-semibold text-[#0F172A]">
                {SKILLGRAPH_DEMO.workshopTitle}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#64748B]">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {SKILLGRAPH_DEMO.className}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {SKILLGRAPH_DEMO.scheduleLabel}
                </span>
              </div>
              <hr className="my-5 border-[#E8EDF4]" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                {persona.kind === "teacher" && activeCode ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void startFreshTeacherWorkshop()}
                    className="text-xs font-medium text-[#64748B] hover:text-[#4650E5]"
                  >
                    Start new session
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void joinWhatsTheProblem()}
                  className="inline-flex items-center gap-2 rounded-full bg-[#4650E5] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3740D1] disabled:opacity-60"
                >
                  {busy ? "Opening…" : "Join workshop"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#E5EAF2] bg-white p-6">
          <h3 className="text-base font-semibold text-[#1E293B]">
            Join a specific session code
          </h3>
          <p className="mt-1 text-sm text-[#64748B]">
            Enter a room or session code directly to open it as {persona.kind === "teacher" ? "Teacher" : persona.name}.
          </p>
          <form onSubmit={joinByCodeSubmit} className="mt-3 flex flex-wrap gap-2">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder={activeCode || "SVMHGT"}
              className="h-11 max-w-[220px] font-mono text-base uppercase"
            />
            <Button type="submit" disabled={busy} className="h-11 rounded-full bg-[#4650E5] px-5 text-sm hover:bg-[#3740D1]">
              Enter session
            </Button>
          </form>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] font-semibold tracking-[0.12em] text-[#64748B] uppercase">
              YOUR CLASSES
            </p>
            <button
              type="button"
              onClick={() => setShowCustomBuilder((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#8BA8C2] bg-white px-4 py-2 text-sm font-medium text-[#1E293B] transition hover:border-[#4650E5]"
            >
              <Plus className="h-4 w-4" />
              Add a class
            </button>
          </div>

          <div className="mt-4 rounded-[22px] border border-[#E5EAF2] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-[#1E293B]">
                  Class 8A · {SKILLGRAPH_DEMO.teamName}
                </h3>
                <p className="text-sm text-[#64748B]">
                  {SKILLGRAPH_DEMO.students.map((s) => s.name).join(" · ")}
                </p>
              </div>
              {persona.kind === "teacher" && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void openExample()}
                  className="rounded-full"
                >
                  Open chocolate-bar example
                </Button>
              )}
            </div>

            {showCustomBuilder && (
              <form onSubmit={openCustomRoom} className="mt-6 grid gap-3 border-t border-[#E8EDF4] pt-6">
                <h4 className="text-base font-semibold text-[#1E293B]">
                  Create a custom C60 class room
                </h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="custom-team">Team name</Label>
                    <Input id="custom-team" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="mt-1 h-10" />
                  </div>
                  <div>
                    <Label htmlFor="custom-theme">Theme</Label>
                    <Input id="custom-theme" value={theme} onChange={(e) => setTheme(e.target.value)} className="mt-1 h-10" />
                  </div>
                  <div>
                    <Label htmlFor="custom-teacher">Teacher name</Label>
                    <Input id="custom-teacher" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="mt-1 h-10" />
                  </div>
                </div>
                <div className="grid gap-2">
                  {seats.map((seat, index) => (
                    <div key={seat.key} className="grid gap-2 sm:grid-cols-[1fr_200px] sm:items-center">
                      <Input
                        aria-label={`Student ${index + 1} name`}
                        value={seat.name}
                        placeholder={`Student ${index + 1} first name`}
                        onChange={(e) =>
                          setSeats(seats.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)))
                        }
                        className="h-10"
                      />
                      <select
                        aria-label={`Student ${index + 1} role`}
                        className="h-10 rounded-xl border bg-white px-2 text-sm"
                        value={seat.role}
                        onChange={(e) =>
                          setSeats(seats.map((item, i) => (i === index ? { ...item, role: e.target.value as RoleId } : item)))
                        }
                      >
                        {ROLE_ORDER.map((role) => (
                          <option key={role} value={role}>
                            {ROLES[role].name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={busy} className="rounded-full bg-[#4650E5] hover:bg-[#3740D1]">
                    Open custom room
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-3 opacity-90">
          {ROLE_ORDER.map((role) => (
            <span key={role} className="inline-flex items-center gap-2 rounded-xl border border-[#E5EAF2] bg-white px-3 py-1.5 text-xs font-medium text-[#475569]">
              <RolePortrait role={role} size={24} />
              {ROLES[role].name}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
