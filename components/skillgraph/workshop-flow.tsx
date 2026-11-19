"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Info,
  LogOut,
  Play,
  RefreshCw,
  UserRound,
  Users,
} from "lucide-react";
import { RolePortrait, TeacherPortrait } from "@/components/role-token";
import { ROLE_ORDER, ROLES, SKILLGRAPH_DEMO, type Action, type RoleId, type RoomState } from "@/lib/domain";

const ROLE_CARDS: {
  id: RoleId;
  title: string;
  desc: string;
}[] = [
  {
    id: "leader",
    title: "Leader",
    desc: "You guide the group's process and keep pace through each milestone.",
  },
  {
    id: "interviewer",
    title: "Lead Interviewer",
    desc: "You anchor the group in real people, interviews, and quotes.",
  },
  {
    id: "mapper",
    title: "Theme Mapper",
    desc: "You organize cards into patterns on the map and fishbone.",
  },
  {
    id: "insight",
    title: "Insight Extractor",
    desc: "You deepen the 5 Whys and shape the root insight.",
  },
  {
    id: "devil",
    title: "Devil's Advocate",
    desc: "You challenge blame, vagueness, and unsupported guesses.",
  },
];

function TopBar({
  backLabel,
  onBack,
  personaLabel,
  personaRole,
  isTeacher,
  onLogout,
}: {
  backLabel: string;
  onBack: () => void;
  personaLabel: string;
  personaRole?: RoleId | null;
  isTeacher: boolean;
  onLogout: () => void;
}) {
  return (
    <header className="px-6 pt-5">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[#334155] transition hover:text-[#4650E5]"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#DCE5EE] bg-white px-3 py-1 text-xs font-semibold text-[#1E293B]">
            {isTeacher ? (
              <TeacherPortrait size={24} />
            ) : personaRole ? (
              <RolePortrait role={personaRole} size={24} />
            ) : null}
            {personaLabel}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-white px-3 py-1 text-xs font-medium text-[#334155] hover:border-[#4650E5] hover:text-[#4650E5]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

export function WorkshopLobbyScreen({
  state,
  isTeacher,
  personaLabel,
  personaRole,
  saving,
  onBack,
  onLogout,
  onStartSession,
}: {
  state: RoomState;
  isTeacher: boolean;
  personaLabel: string;
  personaRole?: RoleId | null;
  saving: boolean;
  onBack: () => void;
  onLogout: () => void;
  onStartSession: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const students = state.participants.filter((p) => p.kind === "student");
  const checkedSet = new Set(state.checkedInIds ?? []);
  const signedIn = students.filter((s) => s.claimed || checkedSet.has(s.id));
  const notSignedIn = students.filter((s) => !s.claimed && !checkedSet.has(s.id));
  const checkPct = students.length ? Math.round((signedIn.length / students.length) * 100) : 0;

  function copyCode() {
    void navigator.clipboard?.writeText(state.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-28">
      <TopBar
        backLabel="Leave session"
        onBack={onBack}
        personaLabel={personaLabel}
        personaRole={personaRole}
        isTeacher={isTeacher}
        onLogout={onLogout}
      />

      <main className="mx-auto mt-6 grid max-w-5xl gap-6 px-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] uppercase">
            Today&apos;s workshop
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#1E293B]">
            {SKILLGRAPH_DEMO.workshopTitle}
          </h1>
          <p className="mt-1 text-sm font-medium text-[#4650E5]">
            {state.theme}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] uppercase">
              Session code
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="font-mono text-4xl font-semibold tracking-[0.28em] text-[#1E293B] tabular-nums">
                {state.code}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#8BA8C2] bg-white px-4 py-2 text-sm font-medium text-[#1E293B] transition hover:border-[#4650E5]"
              >
                {copied ? <Check className="h-4 w-4 text-[#0E948C]" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-4 text-sm text-[#475569]">
              Students join from their own laptop with this code.
            </p>
          </section>

          <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] uppercase">
              Signed in
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Users className="h-7 w-7 text-[#4650E5]" />
              <span className="text-4xl font-semibold text-[#1E293B] tabular-nums">
                {signedIn.length} of {students.length}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EDF2F9]">
              <motion.div
                initial={false}
                animate={{ width: `${checkPct}%` }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-[#0E948C]"
              />
            </div>
            <p className="mt-3 text-sm text-[#475569]">
              You don&apos;t have to wait for everyone — latecomers can join once you&apos;ve started.
            </p>
          </section>
        </div>

        <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[#1E293B]">
              {notSignedIn.length > 0 ? "Not signed in yet" : "Everyone is signed in"}
            </h2>
            <span className="text-sm text-[#64748B] tabular-nums">
              {notSignedIn.length} of {students.length}
            </span>
          </div>
          {notSignedIn.length > 0 && (
            <>
              <p className="mt-2 flex items-center gap-2 text-sm text-[#475569]">
                <Info className="h-4 w-4 text-[#4650E5]" />
                Check these students before you start — they may need the code read out again.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {notSignedIn.map((student) => (
                  <span
                    key={student.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#EDF2F9] px-3.5 py-2 text-sm font-medium text-[#334155]"
                  >
                    <UserRound className="h-3.5 w-3.5 text-[#4650E5]" />
                    {student.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {signedIn.length > 0 && (
            <div className="mt-5 border-t border-[#E8EDF4] pt-4">
              <p className="text-xs font-semibold tracking-wider text-[#0E948C] uppercase">
                Checked in now
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {signedIn.map((student) => (
                  <motion.span
                    key={student.id}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.18 }}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#0E948C]/30 bg-[#ECFDF5] px-3.5 py-2 text-sm font-medium text-[#065F46]"
                  >
                    {student.role ? <RolePortrait role={student.role} size={22} /> : <Check className="h-3.5 w-3.5" />}
                    {student.name}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-[#E5EAF2] bg-white/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-3">
          {isTeacher ? (
            <button
              type="button"
              disabled={saving}
              onClick={onStartSession}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#4650E5] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3740D1] disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              Start session
            </button>
          ) : (
            <p className="text-sm font-medium text-[#475569]">
              Checked in. Waiting for your teacher to start the session…
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

export function RolesIntroScreen({
  isTeacher,
  personaLabel,
  personaRole,
  saving,
  onBack,
  onLogout,
  onContinue,
}: {
  isTeacher: boolean;
  personaLabel: string;
  personaRole?: RoleId | null;
  saving: boolean;
  onBack: () => void;
  onLogout: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-28">
      <TopBar
        backLabel="Session lobby"
        onBack={isTeacher ? onBack : onLogout}
        personaLabel={personaLabel}
        personaRole={personaRole}
        isTeacher={isTeacher}
        onLogout={onLogout}
      />

      <main className="mx-auto mt-6 grid max-w-5xl gap-6 px-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] uppercase">
            Roles · Step 1 of 2
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#1E293B]">
            Team Roles
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#475569]">
            Everyone&apos;s checked in. Read the roles out so the room knows what each one does, then continue to deal them.
          </p>
        </div>

        <div className="rounded-[20px] border border-[#DCE5EE] bg-white p-5 shadow-[0_4px_18px_rgba(70,80,229,0.06)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <TeacherPortrait size={30} />
              <span className="text-sm font-semibold text-[#1E293B]">Facilitator note</span>
            </div>
            <span className="text-xs text-[#64748B]">Step 1</span>
          </div>
          <p className="mt-3 text-base font-semibold text-[#0F172A]">
            Before you spin, walk the room through each role and explain what it means in your own words.
          </p>
        </div>

        <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <h2 className="text-base font-semibold text-[#1E293B]">Group roles</h2>
          <p className="mt-1.5 text-sm text-[#475569]">
            Spin and every student gets one of five roles on their own screen. Groups of four merge roles where needed so nothing gets stuck.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ROLE_CARDS.map((card, index) => {
              const info = ROLES[card.id];
              const isYours = !isTeacher && personaRole === card.id;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className={`rounded-2xl border p-4 transition-colors ${
                    isYours ? "border-2 bg-[#F8FAFF]" : "border-[#E5EAF2] bg-[#FAFBFD]"
                  }`}
                  style={isYours ? { borderColor: info.color } : undefined}
                >
                  <div className="flex items-center justify-between gap-2">
                    <RolePortrait role={card.id} size={52} />
                    {isYours && (
                      <span className="text-xs font-semibold" style={{ color: info.color }}>
                        Your role
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-[#1E293B]" style={{ color: info.color }}>
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                    {card.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-[#E5EAF2] bg-white/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-3">
          {isTeacher ? (
            <button
              type="button"
              disabled={saving}
              onClick={onContinue}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#4650E5] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3740D1] disabled:opacity-60"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <p className="text-sm font-medium text-[#475569]">
              Your teacher is walking through the roles. Next: dealing roles…
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

export function RolesDealScreen({
  state,
  isTeacher,
  personaLabel,
  personaRole,
  saving,
  onBack,
  onLogout,
  onSpinRoles,
  onStartWorkshop,
}: {
  state: RoomState;
  isTeacher: boolean;
  personaLabel: string;
  personaRole?: RoleId | null;
  saving: boolean;
  onBack: () => void;
  onLogout: () => void;
  onSpinRoles: (action: Extract<Action, { type: "spin-roles" }>) => Promise<void> | void;
  onStartWorkshop: () => void;
}) {
  const [spinning, setSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const students = state.participants.filter((p) => p.kind === "student");
  const rolesReady = Boolean(state.rolesSpun) && students.every((s) => Boolean(s.role));

  async function handleSpin() {
    if (spinning || saving) return;
    setSpinning(true);
    const nextSpin = spinCount + 1;
    setSpinCount(nextSpin);

    const offset = nextSpin === 1 ? 0 : nextSpin % ROLE_ORDER.length;
    const assignments = students.map((student, idx) => {
      const canonical = SKILLGRAPH_DEMO.students.find(
        (d) => d.name.toLowerCase() === student.name.toLowerCase(),
      )?.role;
      const role =
        nextSpin === 1 && canonical
          ? canonical
          : ROLE_ORDER[(idx + offset) % ROLE_ORDER.length];
      return { seatId: student.id, role };
    });

    await new Promise((r) => setTimeout(r, 700));
    await onSpinRoles({ type: "spin-roles", assignments });
    setSpinning(false);
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-28">
      <TopBar
        backLabel="Roles"
        onBack={isTeacher ? onBack : onLogout}
        personaLabel={personaLabel}
        personaRole={personaRole}
        isTeacher={isTeacher}
        onLogout={onLogout}
      />

      <main className="mx-auto mt-6 grid max-w-5xl gap-8 px-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] uppercase">
            Groups and roles · Step 2 of 2
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#1E293B]">
            Assign Student Roles
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#475569]">
            Read the groups out so students know where to sit, then spin the wheel to deal the roles whenever you&apos;re ready.
          </p>
        </div>

        <div className="flex flex-col items-center gap-5">
          <div className="relative flex h-48 w-48 items-center justify-center">
            <motion.div
              animate={{ rotate: spinning ? 720 : rolesReady ? 360 : 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 rounded-full p-3 shadow-sm"
              style={{
                background:
                  "conic-gradient(#2F62E0 0deg 72deg, #0E948C 72deg 144deg, #E0941A 144deg 216deg, #7A45D6 216deg 288deg, #E25B4A 288deg 360deg)",
              }}
            >
              <div className="h-full w-full rounded-full bg-[#F7F9FC]" />
            </motion.div>
            <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-center shadow-sm">
              <span className="text-[11px] font-semibold tracking-[0.12em] text-[#64748B] uppercase">
                Group roles
              </span>
              <span className="mt-1 text-sm font-semibold text-[#1E293B]">
                {spinning ? "Dealing…" : rolesReady ? "Roles ready" : "Ready to spin"}
              </span>
            </div>
          </div>

          {isTeacher && (
            <button
              type="button"
              disabled={spinning || saving}
              onClick={() => void handleSpin()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#4650E5] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3740D1] disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
              Spin the Wheel
            </button>
          )}
        </div>

        <section>
          <h2 className="text-lg font-semibold text-[#1E293B]">Groups</h2>
          <p className="mt-1 text-sm text-[#475569]">
            1 group of {students.length}. Read these out loud so students know where to sit.
          </p>

          <div className="mt-4">
            <div className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
              <h3 className="text-sm font-semibold text-[#1E293B]">{state.teamName}</h3>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                {students.map((student, index) => {
                  const assigned = student.role ? ROLES[student.role] : null;
                  return (
                    <motion.li
                      key={student.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.04 }}
                      className="flex flex-col items-center rounded-2xl border border-[#E5EAF2] bg-[#FAFBFD] px-3 py-3 text-center"
                      style={assigned ? { borderColor: `${assigned.color}40`, backgroundColor: "#FFFFFF" } : undefined}
                    >
                      {student.role ? (
                        <RolePortrait role={student.role} size={48} />
                      ) : (
                        <span className="flex size-12 items-center justify-center rounded-full bg-[#EDF2F9] text-[#64748B]">
                          <UserRound className="h-5 w-5" />
                        </span>
                      )}
                      <span className="mt-2 font-semibold text-[#1E293B]">{student.name}</span>
                      <span
                        className="mt-0.5 text-xs font-semibold"
                        style={{ color: assigned?.color ?? "#64748B" }}
                      >
                        {assigned ? assigned.name : "Waiting for spin"}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-[#E5EAF2] bg-white/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-3">
          {isTeacher ? (
            <button
              type="button"
              disabled={!rolesReady || spinning || saving}
              onClick={onStartWorkshop}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#4650E5] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3740D1] disabled:bg-[#A5B4FC]"
            >
              <ArrowRight className="h-4 w-4" />
              Start Workshop
            </button>
          ) : (
            <p className="text-sm font-medium text-[#475569]">
              {rolesReady
                ? "Roles are ready! Waiting for your teacher to click Start Workshop…"
                : "Waiting for your teacher to spin the wheel…"}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
