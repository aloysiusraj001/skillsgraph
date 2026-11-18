"use client";

import { HelpDialog } from "@/components/help-dialog";
import { RoomCode } from "@/components/room-code";
import { RoleToken } from "@/components/role-token";
import { Button } from "@/components/ui/button";
import { SCREENS, STEP_PURPOSE } from "@/lib/copy";
import { TeacherFilms } from "@/components/room/film-panel";
import { formatMs, NEXT_STAGE, previousStage, ROLE_ORDER, ROLES, type Action, type RoleId, type RoomState } from "@/lib/domain";
import type { RadarCue } from "@/lib/game";

const TONE = {
  green: { label: "On track", chip: "bg-[#e7f6ee] text-[#166534]", card: "border-[#1f8a4c]" },
  amber: { label: "Check in", chip: "bg-[#fff6e4] text-[#92400e]", card: "border-[#d97706]" },
  red: { label: "Help requested", chip: "bg-[#fdeceb] text-[#9f1239]", card: "border-[#e11d48]" },
};

export function TeacherView({
  state,
  radar,
  act,
  saving,
  showBoard,
  onToggleBoard,
  onPractice,
  practicing,
  now,
}: {
  state: RoomState;
  radar: RadarCue;
  act: (action: Action) => void;
  saving: boolean;
  showBoard: boolean;
  onToggleBoard: () => void;
  onPractice: () => void;
  practicing: boolean;
  now: number;
}) {
  const tone = TONE[radar.color];
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav className="rounded-3xl border bg-white p-3">
        <div className="px-2 text-sm text-muted-foreground">C60 coaching</div>
        <div className="px-2 font-semibold">Class radar</div>
        <ul className="mt-3 grid gap-1 text-base">
          <li className="rounded-xl bg-[#e8eefc] px-3 py-2 font-semibold text-[#1e3a8a]">Overview</li>
          <li className="px-3 py-2 text-[#3c4654]">One team in this room</li>
        </ul>
        <p className="mt-4 px-2 text-sm text-muted-foreground">Stay distant on green. Walk over on amber or red. The student screen already has the steps.</p>
      </nav>
      <div className="grid gap-4">
        <section className="rounded-3xl border-2 border-[#2f62e0] bg-white p-4">
          <h2 className="text-xl font-semibold">Run it on this screen</h2>
          <p className="mt-2 max-w-2xl">
            You do not need five other people to join. Open the five seats here, then switch among the roles. Start as the Leader. Add each person&apos;s cards by switching to their name.
          </p>
          <Button type="button" className="mt-3 h-11 px-4 text-base" disabled={saving} onClick={onPractice}>
            {practicing ? "Open the five seats again" : "Open the five seats"}
          </Button>
        </section>
        <TeacherFilms state={state} act={act} saving={saving} />
        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold">Class overview</h2>
            <p className="text-sm text-muted-foreground">One short card per team. You run every clock.</p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <article className={`rounded-3xl border-2 bg-white p-4 ${tone.card}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{state.teamName}</h3>
                  <p className="text-sm text-muted-foreground">{SCREENS[state.stage].title}</p>
                  {STEP_PURPOSE[state.stage] && <p className="mt-2 max-w-xl text-sm">{STEP_PURPOSE[state.stage]}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone.chip}`}>{tone.label}</span>
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums">{clockLabel(state, now)}</p>
              <div className="mt-3 grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 text-base"
                    disabled={saving || !previousStage(state.stage)}
                    onClick={() => act({ type: "previous-step" })}
                  >
                    Back
                  </Button>
                  <Button type="button" className="h-12 text-base" disabled={saving || !NEXT_STAGE[state.stage]} onClick={() => act({ type: "next-step" })}>
                    {state.stage === "s0" ? "Start" : "Next"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {previousStage(state.stage) ? `Back opens ${SCREENS[previousStage(state.stage)!].title}. ` : ""}
                  {NEXT_STAGE[state.stage] ? `Next opens ${SCREENS[NEXT_STAGE[state.stage]!].title}.` : "This is the last screen."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 text-base"
                  disabled={saving}
                  onClick={() => {
                    if (window.confirm("Clear the cards, fishbone, and statements, and return to the start? The room code and roles stay.")) {
                      act({ type: "reset-board" });
                    }
                  }}
                >
                  Reset board
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="h-11 text-base" disabled={saving || state.stage === "s0" || state.stage === "s7"} onClick={() => act({ type: "timer", op: "start" })}>Start time</Button>
                  <Button type="button" variant="outline" className="h-11 text-base" disabled={saving} onClick={() => act({ type: "timer", op: "pause" })}>Pause</Button>
                  <Button type="button" variant="outline" className="h-11 text-base" disabled={saving} onClick={() => act({ type: "timer", op: "nudge", delta: -1 })}>−1 min</Button>
                  <Button type="button" variant="outline" className="h-11 text-base" disabled={saving} onClick={() => act({ type: "timer", op: "nudge", delta: 1 })}>+1 min</Button>
                </div>
              </div>
              <p className="mt-3">{radar.reason}</p>
              {radar.blocker && <p className="mt-1 text-sm font-semibold">{radar.blocker}</p>}
              {radar.color !== "green" && <p className="mt-2 text-sm text-muted-foreground">{radar.say}</p>}
            </article>
          </div>
        </section>
        <details className="rounded-3xl border bg-white p-4">
          <summary className="cursor-pointer font-semibold">Team details</summary>
          <div className="mt-3">
            <RoomCode code={state.code} />
          </div>
          <h3 className="mt-4 font-semibold">Checklist</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {radar.checklist.map((row) => (
              <div key={row.id} className="rounded-2xl bg-[#faf8f4] p-3">
                <div className="flex items-center gap-2 font-semibold">
                  {studentRoleToken(state, row.id)}
                  {row.name}
                  <span className="text-sm font-normal text-muted-foreground">{row.role ?? "No role"}</span>
                </div>
                <ul className="mt-2">
                  {row.dots.length === 0 && <li className="text-sm text-muted-foreground">No required mark on this step yet.</li>}
                  {row.dots.map((dot) => (
                    <li key={dot.label} className="text-sm">{dot.done ? "●" : "○"} {dot.label}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <h3 className="mt-4 font-semibold">Unstick</h3>
          <p className="mt-1 text-sm text-muted-foreground">Reassign a role, allow a team of 4, or clear a stuck veto. The clock stays on the overview card.</p>
          <div className="mt-3 grid gap-3">
            {state.participants.filter((person) => person.kind === "student").map((person) => (
              <label key={person.id} className="grid gap-1 text-sm sm:grid-cols-[1fr_180px_auto] sm:items-center">
                <span>{person.name} · {person.claimed ? "Joined" : "Not joined yet"}</span>
                <select
                  className="h-11 rounded-xl border bg-white px-2 text-base"
                  value={person.role ?? ""}
                  onChange={(event) => act({ type: "assign-role", seatId: person.id, role: (event.target.value || null) as RoleId | null })}
                  disabled={saving}
                >
                  <option value="">No role</option>
                  {ROLE_ORDER.map((role) => (
                    <option key={role} value={role}>{ROLES[role].name}</option>
                  ))}
                </select>
                <Button type="button" variant="outline" className="h-11 text-base" disabled={saving || !person.claimed} onClick={() => act({ type: "release-seat", seatId: person.id })}>
                  Release seat
                </Button>
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="h-11 text-base" disabled={saving} onClick={() => act({ type: "allow-four", value: !state.allowFour })}>
              {state.allowFour ? "Require all 5" : "Allow start with 4"}
            </Button>
            <Button type="button" variant="outline" className="h-11 text-base" disabled={saving || !state.veto} onClick={() => act({ type: "clear-veto" })}>
              Clear veto
            </Button>
            <Button type="button" className="h-11 text-base" onClick={onToggleBoard}>
              {showBoard ? "Hide board" : "View board"}
            </Button>
            <HelpDialog label="Question chips" />
          </div>
        </details>
      </div>
    </div>
  );
}

function clockLabel(state: RoomState, now: number) {
  if (state.stage === "s0" || state.stage === "s7") return "No clock";
  if (state.timer.running && state.timer.endsAt) return formatMs(Math.max(0, state.timer.endsAt - now));
  if (state.timer.expired) return "Ended";
  return formatMs(state.timer.remainingMs);
}

function studentRoleToken(state: RoomState, id: string) {
  const role = state.participants.find((person) => person.id === id)?.role;
  if (!role) return null;
  return <RoleToken role={role} size={28} />;
}
