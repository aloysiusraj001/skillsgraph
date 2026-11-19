"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Copy,
  Info,
  LayoutGrid,
  Lightbulb,
  LogOut,
  Mic,
  Play,
  RefreshCw,
  ShieldQuestion,
  UserRound,
  Users,
} from "lucide-react";
import { ROLE_ORDER, ROLES, SKILLGRAPH_DEMO, type Action, type RoleId, type RoomState } from "@/lib/domain";

const ROLE_CARDS: {
  id: RoleId;
  title: string;
  desc: string;
  Icon: typeof ClipboardList;
}[] = [
  {
    id: "leader",
    title: "Leader",
    desc: "You guide the group's process and write down what matters.",
    Icon: ClipboardList,
  },
  {
    id: "interviewer",
    title: "Lead Interviewer",
    desc: "You lead the conversation and ask the deep \"why\" questions.",
    Icon: Mic,
  },
  {
    id: "mapper",
    title: "Theme Mapper",
    desc: "You sort what people said into clear pattern groups.",
    Icon: LayoutGrid,
  },
  {
    id: "insight",
    title: "Insight Extractor",
    desc: "You explain why the patterns matter and shape the insight.",
    Icon: Lightbulb,
  },
  {
    id: "devil",
    title: "Devil's Advocate",
    desc: "You challenge the group's assumptions and guesses.",
    Icon: ShieldQuestion,
  },
];

function TopBar({
  backLabel,
  onBack,
  personaLabel,
  onLogout,
}: {
  backLabel: string;
  onBack: () => void;
  personaLabel: string;
  onLogout: () => void;
}) {
  return (
    <header className="px-6 pt-5">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#334155] transition hover:text-[#4650E5]"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#E9EFF5] px-3 py-1 text-xs font-semibold text-[#1E293B]">
            {personaLabel}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#CBD5E1] bg-white px-3 py-1 text-xs font-medium text-[#334155] hover:border-[#4650E5] hover:text-[#4650E5]"
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
  saving,
  onBack,
  onLogout,
  onStartSession,
}: {
  state: RoomState;
  isTeacher: boolean;
  personaLabel: string;
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
        onLogout={onLogout}
      />

      <main className="mx-auto mt-6 grid max-w-5xl gap-6 px-6">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.12em] text-[#64748B] uppercase">
            TODAY&apos;S WORKSHOP
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
            <p className="text-[12px] font-semibold tracking-[0.12em] text-[#64748B] uppercase">
              SESSION CODE
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="font-mono text-4xl font-semibold tracking-[0.28em] text-[#1E293B]">
                {state.code}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#8BA8C2] bg-white px-4 py-2 text-sm font-medium text-[#1E293B] transition hover:border-[#4650E5]"
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
            <p className="text-[12px] font-semibold tracking-[0.12em] text-[#64748B] uppercase">
              SIGNED IN
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Users className="h-7 w-7 text-[#4650E5]" />
              <span className="text-4xl font-semibold text-[#1E293B]">
                {signedIn.length} of {students.length}
              </span>
            </div>
            <p className="mt-4 text-sm text-[#475569]">
              You don&apos;t have to wait for everyone — latecomers can join once you&apos;ve started.
            </p>
          </section>
        </div>

        <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[#1E293B]">
              {notSignedIn.length > 0 ? "Not signed in yet" : "Everyone is signed in"}
            </h2>
            <span className="text-sm text-[#64748B]">
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF2F9] px-3.5 py-1.5 text-sm font-medium text-[#334155]"
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
                  <span
                    key={student.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#0E948C]/30 bg-[#ECFDF5] px-3.5 py-1.5 text-sm font-medium text-[#065F46]"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {student.name}
                  </span>
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
              className="inline-flex items-center gap-2 rounded-full bg-[#4650E5] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3740D1] disabled:opacity-60"
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
  saving,
  onBack,
  onLogout,
  onContinue,
}: {
  isTeacher: boolean;
  personaLabel: string;
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
        onLogout={onLogout}
      />

      <main className="mx-auto mt-6 grid max-w-5xl gap-6 px-6">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.12em] text-[#64748B] uppercase">
            ROLES · STEP 1 OF 2
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#1E293B]">
            Student&apos;s Roles
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#475569]">
            Everyone&apos;s checked in. Read the roles out so the room knows what each one does, then continue to deal them.
          </p>
        </div>

        <div className="rounded-[20px] bg-gradient-to-r from-[#5B6CF9] via-[#7DD3FC] to-[#86EFAC] p-[1.5px] shadow-[0_4px_18px_rgba(70,80,229,0.08)]">
          <div className="rounded-[18.5px] bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-full bg-gradient-to-br from-[#93C5FD] via-[#6366F1] to-[#3B82F6] shadow-inner" />
                <span className="text-sm font-semibold text-[#1E293B]">Co-pilot</span>
              </div>
              <span className="text-xs text-[#64748B]">Just now</span>
            </div>
            <p className="mt-3 text-base font-semibold text-[#0F172A]">
              Before you spin, walk the room through each role and explain what it means in your own words.
            </p>
          </div>
        </div>

        <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <h2 className="text-base font-semibold text-[#1E293B]">Group roles</h2>
          <p className="mt-1.5 text-sm text-[#475569]">
            Spin and every student gets one of five roles on their own screen. The Leader &amp; Scribe holds the device. Groups of four merge the two Data Analysts into one, and groups of six get a second Devil&apos;s Advocate.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ROLE_CARDS.map((card) => {
              const Icon = card.Icon;
              return (
                <div
                  key={card.id}
                  className="rounded-2xl border border-[#E5EAF2] bg-[#FAFBFD] p-4"
                >
                  <Icon className="h-5 w-5 text-[#4650E5]" />
                  <h3 className="mt-3 text-sm font-semibold text-[#1E293B]">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                    {card.desc}
                  </p>
                </div>
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
              className="inline-flex items-center gap-2 rounded-full bg-[#4650E5] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3740D1] disabled:opacity-60"
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
  saving,
  onBack,
  onLogout,
  onSpinRoles,
  onStartWorkshop,
}: {
  state: RoomState;
  isTeacher: boolean;
  personaLabel: string;
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

    // Canonical order on first spin so Amara=Leader, Ben=Lead Interviewer, Chloe=Theme Mapper, Diego=Insight Extractor, Elif=Devil's Advocate; rotate on re-spin
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
        onLogout={onLogout}
      />

      <main className="mx-auto mt-6 grid max-w-5xl gap-8 px-6">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.12em] text-[#64748B] uppercase">
            GROUPS AND ROLES · STEP 2 OF 2
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#1E293B]">
            Assign Student a Role
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#475569]">
            Read the groups out so students know where to sit, then spin the wheel to deal the roles whenever you&apos;re ready.
          </p>
        </div>

        <div className="flex flex-col items-center gap-5">
          <div className="relative flex h-44 w-44 items-center justify-center">
            <motion.div
              animate={{ rotate: spinning ? 360 * 2 : 0 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border-[14px] border-transparent border-t-[#4650E5] border-r-[#94A3B8]/40"
            />
            <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-center shadow-sm">
              <span className="text-[11px] font-semibold tracking-[0.12em] text-[#64748B] uppercase">
                GROUP ROLES
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
              className="inline-flex items-center gap-2 rounded-full bg-[#4650E5] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3740D1] disabled:opacity-60"
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

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
              <h3 className="text-sm font-semibold text-[#1E293B]">Group 1</h3>
              <ul className="mt-3 grid gap-2">
                {students.map((student) => (
                  <li
                    key={student.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-full bg-[#EFF4FA] px-3 py-1.5 text-sm"
                  >
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#1E293B]">
                      <UserRound className="h-3.5 w-3.5 text-[#4650E5]" />
                      {student.name}
                    </span>
                    {student.role && (
                      <span className="rounded-full border border-[#DBE4F0] bg-white px-2.5 py-0.5 text-xs font-medium text-[#4650E5]">
                        {ROLES[student.role].name}
                      </span>
                    )}
                  </li>
                ))}
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
              className="inline-flex items-center gap-2 rounded-full bg-[#4650E5] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3740D1] disabled:bg-[#A5B4FC]"
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
