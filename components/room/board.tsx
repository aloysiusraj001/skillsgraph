"use client";

import { useLayoutEffect, useRef, useState, type DragEvent as ReactDragEvent } from "react";
import { Compass, Flag, MessagesSquare, Pencil, Shapes } from "lucide-react";
import { RoleToken } from "@/components/role-token";
import {
  PLANTED_LABEL,
  ROLES,
  formatMs,
  quadrantName,
  sentence,
  type Action,
  type Quadrant,
  type RoleId,
  type RoomState,
  type Stakeholder,
} from "@/lib/domain";
import { BONE_HINTS } from "@/lib/copy";
import { authorNames, lockedIncident, person, roots } from "@/lib/game";
import { cn } from "cn";

const PHASES = [
  { label: "Explore", hint: "Understanding the landscape", icon: Compass, stages: ["s0"] },
  { label: "Gather", hint: "Hearing from stakeholders", icon: MessagesSquare, stages: ["s1", "s1b"] },
  { label: "Make sense", hint: "Finding patterns", icon: Shapes, stages: ["s2", "s3", "s4a", "s4b", "s4c", "s4d"] },
  { label: "Define", hint: "Trying and checking", icon: Pencil, stages: ["s5"] },
  { label: "Decide & act", hint: "Choosing what's next", icon: Flag, stages: ["s6", "s7"] },
];

const QUADS: { power: "high" | "low"; interest: "high" | "low"; hint: string }[] = [
  { power: "low", interest: "high", hint: "Keep involved" },
  { power: "high", interest: "high", hint: "Work closely" },
  { power: "low", interest: "low", hint: "Monitor" },
  { power: "high", interest: "low", hint: "Keep satisfied" },
];

export function Board({
  state,
  role,
  selected,
  onSelect,
  act,
  readOnly,
  now,
}: {
  state: RoomState;
  role: RoleId | null;
  selected: string | null;
  onSelect: (id: string | null) => void;
  act: (action: Action) => void;
  readOnly: boolean;
  now: number;
}) {
  return (
    <section className="min-w-0 rounded-3xl border bg-white p-4 shadow-none">
      <StageTrack stage={state.stage} />
      <div className="mt-4">
        {state.stage === "s0" && <Orbit state={state} />}
        {state.stage === "s1" && <SilentPile state={state} selected={selected} onSelect={onSelect} />}
        {state.stage === "s1b" && (
          <Pile state={state} selected={selected} onSelect={onSelect} act={act} role={role} readOnly={readOnly} />
        )}
        {state.stage === "s2" && (
          <PowerMap state={state} selected={selected} onSelect={onSelect} act={act} role={role} readOnly={readOnly} />
        )}
        {state.stage === "s3" && <Incidents state={state} act={act} role={role} readOnly={readOnly} />}
        {(state.stage === "s4a" || state.stage === "s4b" || state.stage === "s4c" || state.stage === "s4d") && (
          <Fish state={state} selected={selected} onSelect={onSelect} act={act} role={role} readOnly={readOnly} />
        )}
        {(state.stage === "s5" || state.stage === "s6") && (
          <Statements state={state} selected={selected} onSelect={onSelect} />
        )}
        {state.stage === "s7" && <Pack state={state} />}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {state.timer.running && state.timer.endsAt
          ? `Timer ${formatMs(state.timer.endsAt - now)}`
          : state.timer.expired
            ? "Timer ended"
            : "Timer is waiting for the teacher"}
      </p>
    </section>
  );
}

function StageTrack({ stage }: { stage: string }) {
  return (
    <ol className="grid min-w-0 gap-2 sm:grid-cols-5">
      {PHASES.map((phase) => {
        const on = phase.stages.includes(stage);
        const Icon = phase.icon;
        return (
          <li
            key={phase.label}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-2",
              on ? "border-[#1e2a44] bg-[#1e2a44] text-white" : "bg-[#faf8f4] text-[#1c2430]",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span>
              <span className="block font-semibold">{phase.label}</span>
              <span className={cn("block text-sm", on ? "text-white/80" : "text-muted-foreground")}>{phase.hint}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Orbit({ state }: { state: RoomState }) {
  const seats = [
    { role: "leader" as const, className: "left-[4%] top-[8%]" },
    { role: "interviewer" as const, className: "right-[4%] top-[8%]" },
    { role: "mapper" as const, className: "left-[2%] bottom-[12%]" },
    { role: "insight" as const, className: "right-[2%] top-[42%]" },
    { role: "devil" as const, className: "left-[36%] bottom-[4%]" },
  ];
  return (
    <div className="relative mx-auto h-[460px] max-w-[760px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 460" aria-hidden>
        <circle cx="380" cy="210" r="150" fill="none" stroke="#e4dcd0" strokeDasharray="6 8" />
        <circle cx="380" cy="210" r="92" fill="none" stroke="#efeae1" />
      </svg>
      <div className="absolute left-1/2 top-[168px] w-48 -translate-x-1/2 rounded-3xl border border-[#d9c8f5] bg-[#f6f1ff] px-4 py-4 text-center">
        <div className="text-sm text-[#5c6570]">Our problem hub</div>
        <div className="font-semibold">{state.theme}</div>
        <div className="mt-1 text-sm text-[#5c6570]">{state.teamName}</div>
      </div>
      {seats.map((spot) => {
        const personSeat = state.participants.find((item) => item.role === spot.role);
        const role = ROLES[spot.role];
        return (
          <article key={spot.role} className={cn("absolute w-52 rounded-2xl border bg-white p-3", spot.className)} style={{ borderColor: role.color }}>
            <div className="flex items-center gap-2">
              <RoleToken role={spot.role} size={36} />
              <div>
                <div className="font-semibold" style={{ color: role.color }}>{role.name}</div>
                <div className="text-sm">{personSeat?.name ?? "Empty seat"}</div>
              </div>
            </div>
            <p className="mt-2 text-sm text-[#3c4654]">{role.job}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {personSeat?.claimed ? (personSeat.ready ? "Ready" : "Joined") : "Waiting to join"}
            </p>
          </article>
        );
      })}
    </div>
  );
}

function CardFace({
  state,
  card,
  selected,
  onSelect,
  draggable,
  onDropOnto,
}: {
  state: RoomState;
  card: Stakeholder;
  selected: boolean;
  onSelect?: (id: string) => void;
  draggable?: boolean;
  onDropOnto?: (draggedId: string) => void;
}) {
  const [over, setOver] = useState(false);
  const owner = person(state, card.authorId);
  const role = owner?.role;
  const className = cn(
    "min-w-40 rounded-2xl border-2 bg-white p-3 text-left",
    draggable && "cursor-grab active:cursor-grabbing",
    (selected || over) && "ring-2 ring-[#1e2a44]",
  );
  const style = { borderColor: role ? ROLES[role].color : "#e4dcd0" };
  const dragProps = {
    draggable: Boolean(draggable),
    onDragStart: (event: ReactDragEvent) => {
      event.dataTransfer.setData("text/plain", card.id);
      event.dataTransfer.effectAllowed = "move";
    },
    onDragOver: onDropOnto
      ? (event: ReactDragEvent) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          setOver(true);
        }
      : undefined,
    onDragLeave: () => setOver(false),
    onDrop: onDropOnto
      ? (event: ReactDragEvent) => {
          event.preventDefault();
          setOver(false);
          const draggedId = event.dataTransfer.getData("text/plain");
          if (draggedId && draggedId !== card.id) onDropOnto(draggedId);
        }
      : undefined,
  };
  const body = (
    <>
      <div className="flex items-start gap-2">
        {role && <RoleToken role={role} size={28} />}
        <div>
          <div className="font-semibold">{card.masked ? "Hidden until the timer ends" : card.label}</div>
          {!card.masked && (
            <div className="text-sm" style={{ color: card.source === "heard" ? "#0E948C" : "#8A5A08" }}>
              {card.source === "heard" ? "Heard from" : "Our guess"}
              {card.planted ? " · pilot claim" : ""}
            </div>
          )}
          <div className="text-sm text-muted-foreground">{card.masked ? "Private card" : authorNames(state, card)}</div>
        </div>
      </div>
      {!card.masked && (
        <div className="mt-2 flex flex-wrap gap-1 text-sm">
          {card.talkTo && <span className="rounded-full bg-[#e7f6f4] px-2 py-0.5 text-[#0E948C]">Talk-to</span>}
          {card.dailyPain && <span className="rounded-full bg-[#f3eefe] px-2 py-0.5 text-[#7A45D6]">Daily pain</span>}
          {card.challenged && <span className="rounded-full bg-[#fdeceb] px-2 py-0.5 text-[#E25B4A]">Challenged</span>}
          {card.mergedLabels.length > 0 && <span className="rounded-full bg-muted px-2 py-0.5">Stack ×{card.mergedLabels.length + 1}</span>}
        </div>
      )}
    </>
  );
  if (draggable || !onSelect) {
    return (
      <div
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={onSelect ? () => onSelect(card.id) : undefined}
        onKeyDown={
          onSelect
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") onSelect(card.id);
              }
            : undefined
        }
        className={className}
        style={style}
        {...dragProps}
      >
        {body}
      </div>
    );
  }
  return (
    <button type="button" onClick={() => onSelect(card.id)} className={className} style={style}>
      {body}
    </button>
  );
}

function SilentPile({
  state,
  selected,
  onSelect,
}: {
  state: RoomState;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const groups = state.participants.filter((person) => person.kind === "student");
  return (
    <div>
      <p className="mb-3 text-base">
        {state.s1Revealed
          ? "The timer ended. Finish any missing cards, then the merge pile opens."
          : "Your cards stay private. You can see how many cards each person has, not what they wrote."}
      </p>
      {!state.stakeholders.some((card) => !card.planted) && (
        <p className="mb-3 rounded-2xl bg-[#faf8f4] px-3 py-3">
          Stuck? Think: who uses it, who pays, who decides, who blocks, who is quietly hurt.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((member) => {
          const cards = state.stakeholders.filter((card) => card.authorId === member.id);
          return (
            <div key={member.id} className="rounded-2xl bg-[#faf8f4] p-3">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                {member.role && <RoleToken role={member.role} size={28} />}
                {member.name}
                <span className="text-sm font-normal text-muted-foreground">{cards.length} cards</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {cards.map((card) => (
                  <CardFace key={card.id} state={state} card={card} selected={selected === card.id} onSelect={onSelect} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Pile({
  state,
  selected,
  onSelect,
  act,
  role,
  readOnly,
}: {
  state: RoomState;
  selected: string | null;
  onSelect: (id: string | null) => void;
  act: (action: Action) => void;
  role: RoleId | null;
  readOnly: boolean;
}) {
  const cards = roots(state);
  const planted = cards.some((card) => card.planted && card.label === PLANTED_LABEL && !card.challenged);
  return (
    <div>
      {planted && (
        <p className="mb-3 rounded-2xl bg-[#fff6e4] px-3 py-3">One claim on this board started as Our guess. Check it.</p>
      )}
      <p className="mb-3">{role === "mapper" ? "Drag one card onto another to merge them." : "You are watching. Only the Theme Mapper merges."}</p>
      <div className="flex flex-wrap gap-3">
        {cards.map((card) => (
          <CardFace
            key={card.id}
            state={state}
            card={card}
            selected={role === "mapper" && selected === card.id}
            draggable={role === "mapper" && !readOnly}
            onDropOnto={
              role === "mapper" && !readOnly
                ? (draggedId) => {
                    act({ type: "merge", a: card.id, b: draggedId });
                    onSelect(null);
                  }
                : undefined
            }
            onSelect={
              role === "mapper" && !readOnly
                ? (id) => onSelect(selected === id ? null : id)
                : undefined
            }
          />
        ))}
      </div>
      {state.suggestions.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {state.suggestions.map((item) => {
            const a = state.stakeholders.find((card) => card.id === item.a);
            const b = state.stakeholders.find((card) => card.id === item.b);
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#faf8f4] px-3 py-2">
                <span>Suggest same: {a?.label} and {b?.label}</span>
                {role === "mapper" && !readOnly && (
                  <>
                    <button type="button" className="underline" onClick={() => act({ type: "merge", a: item.a, b: item.b })}>Merge</button>
                    <button type="button" className="underline" onClick={() => act({ type: "dismiss-suggestion", id: item.id })}>Dismiss</button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-sm text-muted-foreground">Careful: an end user and a payer are often different people.</p>
    </div>
  );
}

function PowerMap({
  state,
  selected,
  onSelect,
  act,
  role,
  readOnly,
}: {
  state: RoomState;
  selected: string | null;
  onSelect: (id: string | null) => void;
  act: (action: Action) => void;
  role: RoleId | null;
  readOnly: boolean;
}) {
  const [hotQuad, setHotQuad] = useState<string | null>(null);
  const cards = roots(state);
  const unplaced = cards.filter((card) => !card.grid);
  const whose = cards.find((card) => card.id === state.summary.whoseId);
  const canPlace = role === "mapper" && !readOnly;
  function placeCard(id: string, grid: Quadrant) {
    act({ type: "place", id, ...grid });
    onSelect(null);
  }
  return (
    <div>
      <FollowPick state={state} act={act} role={role} readOnly={readOnly} />
      <p className="mb-3">{canPlace ? "Drag a card into a quadrant. Then choose who we follow." : "You are watching. Only the Theme Mapper moves cards."}</p>
      <div className="mb-2 flex justify-between text-sm text-muted-foreground">
        <span>Low power</span>
        <span>High power</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {QUADS.map((quad) => {
          const key = `${quad.power}-${quad.interest}`;
          const inside = cards.filter((card) => card.grid?.power === quad.power && card.grid.interest === quad.interest);
          const grid = { power: quad.power, interest: quad.interest };
          return (
            <div
              key={key}
              onClick={() => {
                if (!canPlace || !selected) return;
                placeCard(selected, grid);
              }}
              onDragOver={(event) => {
                if (!canPlace) return;
                event.preventDefault();
                setHotQuad(key);
              }}
              onDragLeave={() => setHotQuad((current) => (current === key ? null : current))}
              onDrop={(event) => {
                if (!canPlace) return;
                event.preventDefault();
                setHotQuad(null);
                const id = event.dataTransfer.getData("text/plain");
                if (id) placeCard(id, grid);
              }}
              className={cn("min-h-48 rounded-2xl border bg-[#faf8f4] p-3 text-left", hotQuad === key && "ring-2 ring-[#1e2a44]")}
            >
              <div className="text-sm text-muted-foreground">{quad.interest === "high" ? "High interest" : "Low interest"}</div>
              <div className="font-semibold">{quad.hint}</div>
              {quad.power === "high" && quad.interest === "low" && inside.length === 0 && (
                <p className="mt-1 text-sm text-muted-foreground">High power / low interest is often a quiet sponsor or blocker — don&apos;t leave it empty if one exists.</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {inside.map((card) => (
                  <div key={card.id} className="grid gap-1">
                    <CardFace state={state} card={card} selected={canPlace && selected === card.id} draggable={canPlace} onSelect={canPlace ? onSelect : undefined} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3">
        <div className="mb-2 font-semibold">Not placed yet</div>
        <div className="flex flex-wrap gap-2">
          {unplaced.map((card) => (
            <CardFace key={card.id} state={state} card={card} selected={canPlace && selected === card.id} draggable={canPlace} onSelect={canPlace ? onSelect : undefined} />
          ))}
          {unplaced.length === 0 && <p className="text-sm text-muted-foreground">Every card has a place.</p>}
        </div>
      </div>
      {state.moves.length > 0 && role === "mapper" && !readOnly && (
        <ul className="mt-3 grid gap-2">
          {state.moves.map((move) => {
            const card = state.stakeholders.find((item) => item.id === move.cardId);
            return (
              <li key={move.id} className="flex flex-wrap gap-2 rounded-2xl bg-[#fff6e4] px-3 py-2">
                <span>Move {card?.label} to {quadrantName(move.grid)}?</span>
                <button type="button" className="underline" onClick={() => act({ type: "resolve-move", id: move.id, accept: true })}>Accept move</button>
                <button type="button" className="underline" onClick={() => act({ type: "resolve-move", id: move.id, accept: false })}>Reject move</button>
              </li>
            );
          })}
        </ul>
      )}
      {(state.summary.open || whose) && (
        <div className="mt-4 rounded-2xl border border-[#d9c8f5] bg-[#f6f1ff] p-3">
          <div className="text-sm text-[#5c6570]">Summary carry</div>
          <div className="font-semibold">Whose problem we follow: {whose?.label ?? "Not chosen yet"}</div>
          <div>What goes wrong: {state.summary.harm || "Not written yet"}</div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {state.missingFlags.payer && <span className="rounded-full bg-[#fdeceb] px-2 py-1">Missing payer</span>}
        {state.missingFlags.sponsor && <span className="rounded-full bg-[#fdeceb] px-2 py-1">Missing sponsor</span>}
        {state.missingFlags.blocker && <span className="rounded-full bg-[#fdeceb] px-2 py-1">Missing blocker</span>}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Our guess means the team invented this — the Interviewer should verify it, or Devil&apos;s Advocate should challenge it.</p>
    </div>
  );
}

function FollowPick({
  state,
  act,
  role,
  readOnly,
}: {
  state: RoomState;
  act: (action: Action) => void;
  role: RoleId | null;
  readOnly: boolean;
}) {
  const people = roots(state);
  const canChoose = role === "interviewer" && !readOnly;
  const chosen = people.find((card) => card.id === state.summary.whoseId);
  return (
    <div className="mb-4 rounded-2xl border border-[#1e2a44] bg-white p-3">
      <div className="font-semibold">Who we follow</div>
      <p className="mt-1 text-sm text-muted-foreground">
        {canChoose
          ? "Tap one person. The incident and the fish are about them."
          : chosen
            ? "This is the person the incident and the fish are about."
            : "The Lead Interviewer taps the person the rest of the activity follows."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {people.map((card) => {
          const on = card.id === state.summary.whoseId;
          return (
            <button
              key={card.id}
              type="button"
              disabled={!canChoose}
              onClick={() => act({ type: "whose", id: card.id })}
              className={cn("rounded-2xl border-2 px-3 py-2 text-left text-base", on ? "border-[#1e2a44] bg-[#1e2a44] text-white" : "border-[#e4dcd0] bg-[#faf8f4]")}
            >
              {on ? "Following " : ""}
              {card.label}
            </button>
          );
        })}
      </div>
      {state.summary.harm && <p className="mt-3">What goes wrong: {state.summary.harm}</p>}
    </div>
  );
}

function Incidents({
  state,
  act,
  role,
  readOnly,
}: {
  state: RoomState;
  act: (action: Action) => void;
  role: RoleId | null;
  readOnly: boolean;
}) {
  const head = lockedIncident(state) ?? state.incidents[0];
  const who = roots(state).find((card) => card.id === state.summary.whoseId);
  return (
    <div className="grid gap-4">
      <FollowPick state={state} act={act} role={role} readOnly={readOnly} />
      <p className="rounded-2xl bg-[#1e2a44] px-3 py-3 text-white">
        {who ? `This incident is about ${who.label}.` : "Choose who we follow above before you write the incident."}
        {state.summary.harm ? ` What goes wrong: ${state.summary.harm}` : ""}
      </p>
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
      <div className="grid gap-3">
        {state.incidents.length === 0 && (
          <p className="rounded-2xl bg-[#faf8f4] px-3 py-3">No incident yet. Leo writes a fact on the right, then it appears here and in the fish head.</p>
        )}
        {state.incidents.map((card) => {
          const owner = person(state, card.authorId);
          const isHead = head?.id === card.id;
          return (
            <article
              key={card.id}
              className={cn("rounded-2xl border-2 bg-white p-3 text-left", isHead && "ring-2 ring-[#1e2a44]")}
              style={{ borderColor: owner?.role ? ROLES[owner.role].color : "#e4dcd0" }}
            >
              <div className="flex items-center gap-2">
                {owner?.role && <RoleToken role={owner.role} size={28} />}
                <span className="font-semibold">{owner?.name}</span>
                <span className="text-sm text-muted-foreground">{card.votes.length} {card.votes.length === 1 ? "vote" : "votes"}</span>
                {isHead && <span className="rounded-full bg-[#1e2a44] px-2 py-0.5 text-sm text-white">Fish head</span>}
              </div>
              <p className="mt-2">{card.text}</p>
              {card.blame && <p className="mt-1 text-sm text-[#E25B4A]">Blame wording — rewrite without blaming people.</p>}
              {!readOnly && (
                <button type="button" className="mt-3 h-11 rounded-xl border bg-[#faf8f4] px-3 text-base" onClick={() => act({ type: "vote-incident", id: card.id })}>
                  Vote for this
                </button>
              )}
            </article>
          );
        })}
      </div>
      <div className="flex items-center">
        <div className="w-0 border-y-[52px] border-y-transparent border-r-[26px] border-r-[#1b2a4a]" />
        <div className="max-w-[220px] rounded-r-2xl bg-[#1b2a4a] p-3 text-white">
          <div className="text-sm text-white/75">Fish head{who ? ` · ${who.label}` : ""}</div>
          <div>{head ? head.text : "Add a fact and it shows here."}</div>
        </div>
      </div>
      </div>
    </div>
  );
}

function Fish({
  state,
  selected,
  onSelect,
  act,
  role,
  readOnly,
}: {
  state: RoomState;
  selected: string | null;
  onSelect: (id: string | null) => void;
  act: (action: Action) => void;
  role: RoleId | null;
  readOnly: boolean;
}) {
  const incident = lockedIncident(state);
  const following = roots(state).find((card) => card.id === state.summary.whoseId);
  const top = state.bones.slice(0, 3);
  const bottom = state.bones.slice(3);
  const tray = state.causes.filter((cause) => !cause.bone);
  const canMove = role === "mapper" && !readOnly && state.stage === "s4a";
  const rootRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [ribLines, setRibLines] = useState<{ id: string; x1: number; y1: number; x2: number; y2: number; stroke: string }[]>([]);
  const ribKey = useRef("");
  useLayoutEffect(() => {
    const root = rootRef.current;
    const spine = spineRef.current;
    if (!root || !spine) return;
    const measure = () => {
      const rootBox = root.getBoundingClientRect();
      const spineBox = spine.getBoundingClientRect();
      const spineY = spineBox.top + spineBox.height / 2 - rootBox.top;
      const spineLeft = spineBox.left - rootBox.left;
      const spineRight = spineBox.right - rootBox.left;
      const next = state.bones.flatMap((bone) => {
        const label = labelRefs.current[bone.id];
        if (!label) return [];
        const box = label.getBoundingClientRect();
        const followed = state.focusBone === bone.id;
        const glow = followed || (!state.focusBone && state.selectedBones.includes(bone.id));
        const x2 = box.right - rootBox.left;
        const y2 = box.top + box.height / 2 - rootBox.top;
        const x1 = Math.max(spineLeft + 12, Math.min(spineRight - 8, x2 + 36));
        return [{
          id: bone.id,
          x1: Math.round(x1),
          y1: Math.round(spineY),
          x2: Math.round(x2),
          y2: Math.round(y2),
          stroke: glow ? "#0E948C" : "#1b2a4a",
        }];
      });
      const key = next.map((rib) => `${rib.id}:${rib.x1}:${rib.y1}:${rib.x2}:${rib.y2}:${rib.stroke}`).join("|");
      if (key === ribKey.current) return;
      ribKey.current = key;
      setRibLines(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [state.bones, state.causes, state.focusBone, state.hops, state.selectedBones, state.stage]);
  return (
    <div>
      <p className="mb-3 rounded-2xl bg-[#faf8f4] px-3 py-3">
        {following ? `We are following ${following.label}. ` : ""}
        {state.stage === "s4b"
          ? "These are the six bones. Tap one. The five Whys start on the next screen, on that rib only."
          : state.stage === "s4d"
            ? "The Whys are on the rib you followed. Asha writes Obstacle and Insight. Maya places the pin."
            : state.focusBone
              ? `The five Whys grow on ${state.bones.find((bone) => bone.id === state.focusBone)?.label}. Each Why is the next card to the left.`
              : "Tap one bone. The five Whys will line up on that rib, and the rib meets the backbone."}
      </p>
      <div className="rounded-[2rem] border border-[#e4dcd0] bg-[#f6f1e8] p-3">
        <div className="overflow-x-auto">
        <div ref={rootRef} className="relative min-w-[54rem]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {ribLines.map((rib) => (
            <g key={rib.id}>
              <path
                d={`M ${rib.x1} ${rib.y1} L ${rib.x2} ${rib.y2}`}
                fill="none"
                stroke={rib.stroke}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx={rib.x1} cy={rib.y1} r="5" fill={rib.stroke} />
            </g>
          ))}
        </svg>
        <div className="relative grid items-center gap-y-4">
          {top.map((bone, index) => (
            <FishRib key={bone.id} fromHead={top.length - 1 - index} state={state} bone={bone} selected={selected} onSelect={onSelect} act={act} canMove={canMove} readOnly={readOnly} labelRef={(node) => { labelRefs.current[bone.id] = node; }} />
          ))}
          <div className="flex min-w-0 items-center">
            <FishTail />
            <div ref={spineRef} className="relative mx-1 h-4 min-w-0 flex-1">
              <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#1b2a4a]" />
              <div className="absolute inset-0 flex items-center justify-between px-1">
                {Array.from({ length: 7 }, (_, index) => (
                  <span key={index} className="size-2.5 rounded-full border-2 border-[#1b2a4a] bg-[#f6f1e8]" />
                ))}
              </div>
            </div>
            <FishHead title={following ? `Fish head · ${following.label}` : "Fish head"} text={incident?.text ?? "Incident lands here"} />
          </div>
          {bottom.map((bone, index) => (
            <FishRib key={bone.id} fromHead={index} state={state} bone={bone} selected={selected} onSelect={onSelect} act={act} canMove={canMove} readOnly={readOnly} labelRef={(node) => { labelRefs.current[bone.id] = node; }} />
          ))}
        </div>
        </div>
        </div>
      </div>
      {tray.length > 0 && (
        <div className="mt-3">
          <div className="mb-2 font-semibold">Not on a bone yet</div>
          <div className="flex flex-wrap gap-2">
            {tray.map((cause) => (
              <button
                key={cause.id}
                type="button"
                onClick={() => onSelect(selected === cause.id ? null : cause.id)}
                className={cn("rounded-xl border-2 bg-white px-3 py-2 text-left", selected === cause.id && "ring-2 ring-[#1e2a44]")}
              >
                {cause.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function whyChain(state: RoomState, causeId: string) {
  const line: RoomState["hops"] = [];
  let id = causeId;
  while (line.length < 5) {
    const children = state.hops.filter((hop) => hop.parentId === id && !hop.proposed);
    if (children.length === 0) break;
    const next = children[children.length - 1];
    line.push(next);
    id = next.id;
  }
  return line;
}

function FishRib({
  state,
  bone,
  fromHead,
  selected,
  onSelect,
  act,
  canMove,
  readOnly,
  labelRef,
}: {
  state: RoomState;
  bone: RoomState["bones"][number];
  fromHead: number;
  selected: string | null;
  onSelect: (id: string | null) => void;
  act: (action: Action) => void;
  canMove: boolean;
  readOnly: boolean;
  labelRef: (node: HTMLDivElement | null) => void;
}) {
  const causes = state.causes.filter((cause) => cause.bone === bone.id);
  const followed = state.focusBone === bone.id;
  const glow = followed || (!state.focusBone && state.selectedBones.includes(bone.id));
  const dim = Boolean(state.focusBone) && !followed && (state.stage === "s4c" || state.stage === "s4d");
  const stroke = glow ? "#0E948C" : "#1b2a4a";
  const canFollow = !readOnly && (state.stage === "s4b" || state.stage === "s4c");
  const chainCause = causes.find((cause) => state.hops.some((hop) => hop.bone === bone.id && hop.parentId === cause.id)) ?? causes[0];
  const chain = chainCause && followed ? whyChain(state, chainCause.id) : [];
  const placedPin = state.pins.find((pin) => pin.bone === bone.id && pin.placed && !pin.blocked);
  const placedCause = placedPin ? state.causes.find((cause) => cause.id === placedPin.causeId) : undefined;
  return (
    <div className={cn("flex min-w-0 items-center", dim && "opacity-40")} style={{ paddingRight: `calc(13rem + ${fromHead * 12}rem)` }}>
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="flex w-max min-w-full items-center justify-end">
            {causes.length === 0 && <p className="text-sm leading-none text-muted-foreground">Nothing on this bone yet.</p>}
            {causes.map((cause) => (
              <div key={cause.id} className="flex flex-nowrap items-center">
                {(!followed || cause.id !== chainCause?.id) && (
                  <WhyTrail state={state} parentId={cause.id} selected={selected} onSelect={onSelect} />
                )}
                {followed && cause.id === chainCause?.id &&
                  [...chain].reverse().map((hop) => (
                    <div key={hop.id} className="flex items-center">
                      <BranchCard
                        title={hop.text}
                        meta={[hop.chip ? CHIP_LABEL[hop.chip] : "Why", hop.root ? "Root cause" : "", hop.askWhom ? `Ask ${hop.askWhom}` : ""].filter(Boolean).join(" · ")}
                        selected={selected === hop.id}
                        onClick={() => onSelect(selected === hop.id ? null : hop.id)}
                        pinned={Boolean(placedPin && (hop.root || hop.id === placedPin.hopId))}
                      />
                      <span className="mx-1 flex shrink-0 items-center" aria-hidden>
                        <span className="h-0.5 w-4 rounded-full bg-[#1b2a4a]" />
                        <span className="size-2.5 rounded-full border-2 border-[#1b2a4a] bg-[#fffdf8]" />
                      </span>
                    </div>
                  ))}
                <BranchCard
                  title={cause.text}
                  meta={[person(state, cause.authorId)?.name, state.pins.find((pin) => pin.causeId === cause.id && pin.placed) ? "Pin placed" : ""].filter(Boolean).join(" · ")}
                  selected={selected === cause.id}
                  onClick={() => onSelect(selected === cause.id ? null : cause.id)}
                  pinned={state.pins.some((pin) => pin.causeId === cause.id && pin.placed && !pin.blocked)}
                />
              </div>
            ))}
          </div>
        </div>
      <div className="h-0.5 w-5 shrink-0 rounded-full" style={{ background: stroke }} aria-hidden />
      <div ref={labelRef} className="w-36 shrink-0 text-right">
        {canFollow ? (
          <button type="button" className="text-right" onClick={() => act({ type: "follow-bone", id: bone.id })}>
            <div className={cn("font-semibold leading-none", glow && "text-[#0E948C]")}>{bone.label}</div>
            <p className="pt-1 text-sm leading-tight text-[#5c6570]">{followed ? "We follow this bone" : "Tap to follow"}</p>
          </button>
        ) : (
          <>
            <div className={cn("font-semibold leading-none", glow && "text-[#0E948C]")}>{bone.label}</div>
            <p className="pt-1 text-sm leading-tight text-[#5c6570]">{BONE_HINTS[bone.id]}</p>
          </>
        )}
        {placedPin && (
          <div className="mt-2 rounded-xl bg-[#7A45D6] px-2 py-1 text-left text-sm text-white">
            <div className="font-semibold">Pin on {placedCause?.text ?? bone.label}</div>
            {placedPin.insight && <div>Root: {placedPin.insight}</div>}
          </div>
        )}
        {canMove && selected && (
          <button type="button" className="mt-2 h-11 rounded-xl bg-[#1e2a44] px-3 text-sm text-white" onClick={() => act({ type: "snap", id: selected, bone: bone.id })}>
            Move here
          </button>
        )}
      </div>
    </div>
  );
}

const CHIP_LABEL = { evidence: "Evidence", assumption: "Assumption", "need-to-check": "Need to check" } as const;

function WhyTrail({
  state,
  parentId,
  selected,
  onSelect,
}: {
  state: RoomState;
  parentId: string;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const hops = state.hops.filter((hop) => hop.parentId === parentId && !hop.proposed);
  if (hops.length === 0) return null;
  const line = [...hops].reverse();
  return (
    <div className="flex flex-nowrap items-center gap-2">
      {line.map((hop) => (
        <div key={hop.id} className="flex flex-nowrap items-center gap-2">
          <WhyTrail state={state} parentId={hop.id} selected={selected} onSelect={onSelect} />
          <BranchCard
            title={hop.text}
            meta={hop.chip ? `${CHIP_LABEL[hop.chip]}${hop.askWhom ? ` · Ask ${hop.askWhom}` : ""}` : "Why"}
            selected={selected === hop.id}
            onClick={() => onSelect(selected === hop.id ? null : hop.id)}
          />
          <span className="mx-1 flex shrink-0 items-center self-center" aria-hidden>
            <span className="h-0.5 w-4 rounded-full bg-[#1b2a4a]" />
            <span className="size-2.5 rounded-full border-2 border-[#1b2a4a] bg-[#fffdf8]" />
          </span>
        </div>
      ))}
    </div>
  );
}

function BranchCard({
  title,
  meta,
  selected,
  onClick,
  pinned,
}: {
  title: string;
  meta: string;
  selected: boolean;
  onClick: () => void;
  pinned?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("w-44 shrink-0 rounded-2xl border bg-[#fffdf8] px-3 py-2 text-left shadow-[2px_2px_0_rgba(30,42,68,0.08)]", pinned ? "border-[#7A45D6] ring-2 ring-[#7A45D6]" : "border-[#e4dcd0]", selected && "border-[#1e2a44] ring-2 ring-[#1e2a44]")}
    >
      {pinned && <span className="mb-1 inline-block rounded-full bg-[#7A45D6] px-2 py-0.5 text-sm text-white">Pin</span>}
      <span className="block font-semibold">{title}</span>
      <span className="mt-1 block text-sm text-muted-foreground">{meta}</span>
      {selected && <span className="mt-1 block text-sm">Next Why grows from here</span>}
    </button>
  );
}

function FishTail() {
  return (
    <svg width="72" height="78" viewBox="0 0 72 78" aria-hidden className="shrink-0">
      <path d="M64,39 C46,39 28,22 8,6 C24,24 26,34 10,39 C26,44 24,54 8,72 C28,56 46,39 64,39 Z" fill="#1b2a4a" />
      <path d="M58,39 C46,32 40,26 34,18" fill="none" stroke="#f6f1e8" strokeWidth="1.5" opacity="0.45" />
      <path d="M58,39 C46,46 40,52 34,60" fill="none" stroke="#f6f1e8" strokeWidth="1.5" opacity="0.45" />
    </svg>
  );
}

function FishHead({ title, text }: { title: string; text: string }) {
  return (
    <div className="relative w-40 shrink-0">
      <svg viewBox="0 0 288 156" className="h-24 w-full" aria-hidden>
        <path d="M6,78 C6,26 78,6 156,14 C214,20 262,48 278,78 C262,108 214,136 156,142 C78,150 6,130 6,78 Z" fill="#1b2a4a" />
        <path d="M34,46 C86,62 86,94 34,110" fill="none" stroke="#d5dceb" strokeWidth="2" opacity="0.75" />
        <circle cx="214" cy="62" r="10" fill="#f6f1e8" />
        <circle cx="217" cy="62" r="4.5" fill="#1b2a4a" />
        <circle cx="218.5" cy="60.5" r="1.5" fill="#f6f1e8" />
      </svg>
      <div className="absolute inset-y-0 left-5 right-24 flex flex-col justify-center text-white">
        <div className="text-xs text-white/70">{title}</div>
        <div className="line-clamp-4 text-sm leading-snug">{text}</div>
      </div>
    </div>
  );
}

function Statements({
  state,
  selected,
  onSelect,
}: {
  state: RoomState;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const people = state.participants.filter((person) => person.kind === "student" && person.claimed);
  return (
    <div className="grid gap-3">
      <p>
        The sentence is [who] needs [need], but [obstacle], so [harm], because [insight]. Need is typed by each person. The other blanks carry from the map and the fishbone.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {people.map((member) => {
          const card = state.statements.find((item) => item.authorId === member.id);
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => card && !card.masked && onSelect(selected === card.id ? null : card.id)}
              className={cn("rounded-2xl border-2 bg-white p-3 text-left", card && selected === card.id && "ring-2 ring-[#1e2a44]")}
              style={{ borderColor: member.role ? ROLES[member.role].color : "#e4dcd0" }}
            >
              <div className="flex items-center gap-2">
                {member.role && <RoleToken role={member.role} size={28} />}
                <span className="font-semibold">{member.name}</span>
                {card?.recognizable && <span className="text-sm text-[#0E948C]">Recognizable</span>}
              </div>
              {card?.submitted && !card.masked ? (
                <p className="mt-2">{sentence(card)}</p>
              ) : card && !card.masked ? (
                <p className="mt-2 text-muted-foreground">Your draft stays in Your move until you submit.</p>
              ) : (
                <p className="mt-2 text-muted-foreground">Still writing</p>
              )}
              {card && card.tags.length > 0 && (
                <p className="mt-2 text-sm text-[#E25B4A]">{card.tags.join(" · ")}</p>
              )}
              {card?.clusterId && <p className="mt-1 text-sm text-[#8A5A08]">In a cluster</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Pack({ state }: { state: RoomState }) {
  const top = state.top3.map((id) => state.statements.find((card) => card.id === id)).filter((card) => card);
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <article className="rounded-2xl border p-3">
        <h3 className="font-semibold text-[#E0941A]">Artifact A</h3>
        <p>Stakeholder map, priority groups, whose problem, and harm.</p>
        <p className="mt-2 text-sm">{roots(state).map((card) => card.label).join(" · ")}</p>
      </article>
      <article className="rounded-2xl border p-3">
        <h3 className="font-semibold text-[#7A45D6]">Artifact B</h3>
        <p>Fishbone, Why hops, and pins.</p>
        <p className="mt-2 text-sm">{lockedIncident(state)?.text}</p>
      </article>
      <article className="rounded-2xl border p-3">
        <h3 className="font-semibold text-[#E25B4A]">Artifact C</h3>
        <ol className="mt-2 grid gap-2">
          {top.map((card) => (
            <li key={card!.id}>{sentence(card!)}</li>
          ))}
        </ol>
      </article>
    </div>
  );
}
