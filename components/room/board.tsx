"use client";

import { useState, type DragEvent as ReactDragEvent } from "react";
import { CheckCircle2, Compass, CornerDownRight, Flag, MessageSquareQuote, MessagesSquare, Pencil, Pin as PinIcon, Shapes, Target } from "lucide-react";
import { RoleToken } from "@/components/role-token";
import {
  PLANTED_LABEL,
  ROLES,
  formatMs,
  quadrantName,
  sentence,
  type Action,
  type BoneLabel,
  type Hop,
  type Pin,
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

const CHIP_LABEL = { evidence: "Evidence", assumption: "Assumption", "need-to-check": "Need to check" } as const;

const TOP_RIB_ANCHORS = [24, 58, 92] as const;
const BOTTOM_RIB_ANCHORS = [20, 54, 88] as const;
const COL_CENTERS = [144, 450, 756] as const;

function countDescendantHops(hops: Hop[], parentId: string): number {
  const direct = hops.filter((hop) => hop.parentId === parentId && !hop.proposed);
  return direct.reduce((total, hop) => total + 1 + countDescendantHops(hops, hop.id), 0);
}

function hasDescendantRoot(hops: Hop[], parentId: string): boolean {
  const direct = hops.filter((hop) => hop.parentId === parentId && !hop.proposed);
  return direct.some((hop) => Boolean(hop.root) || hasDescendantRoot(hops, hop.id));
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
  const bottom = state.bones.slice(3, 6);
  const tray = state.causes.filter((cause) => !cause.bone);
  const canMove = role === "mapper" && !readOnly && state.stage === "s4a";
  const focusBone = state.bones.find((bone) => bone.id === state.focusBone) ?? null;

  function isGlowing(boneId: BoneLabel["id"]) {
    return state.focusBone === boneId || (!state.focusBone && state.selectedBones.includes(boneId));
  }

  function isDimmed(boneId: BoneLabel["id"]) {
    return Boolean(state.focusBone) && state.focusBone !== boneId && (state.stage === "s4c" || state.stage === "s4d");
  }

  return (
    <div className="grid gap-4">
      <p className="rounded-2xl border border-[#e4dcd0] bg-[#faf8f4] px-3.5 py-3 text-sm leading-relaxed text-[#1c2430] sm:text-base">
        {following ? `Following ${following.label}. ` : ""}
        {state.stage === "s4a"
          ? "Each bone is one kind of cause leading to the incident in the fish head. Pick a bone on the right and add a cause."
          : state.stage === "s4b"
            ? "Review the causes on all six bones, then tap the one bone the team will follow into the five Whys."
            : state.stage === "s4d"
              ? "Carry 1 to 3 causes forward into problem statements: Obstacle (cause) + Insight (root Why) + Harm (fish head)."
              : focusBone
                ? `Digging into ${focusBone.label}. Select a cause or Why below to grow the next Why, or mark one Why as the root cause.`
                : "Tap one bone on the fish to open the five Whys branch below."}
      </p>

      <div className="rounded-[2rem] border border-[#e4dcd0] bg-[#f6f1e8] p-3 sm:p-4">
        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[700px] grid-cols-[44px_minmax(0,1fr)_232px] items-center gap-x-0">
            {/* Top bone cards (Timing, Communication, Perceived value) */}
            <div className="col-start-2 row-start-1 grid grid-cols-3 items-end gap-3">
              {top.map((bone) => (
                <FishBoneCard
                  key={bone.id}
                  state={state}
                  bone={bone}
                  position="top"
                  glow={isGlowing(bone.id)}
                  dim={isDimmed(bone.id)}
                  selected={selected}
                  onSelect={onSelect}
                  act={act}
                  canMove={canMove}
                  readOnly={readOnly}
                />
              ))}
            </div>

            {/* Top diagonal ribs SVG */}
            <div className="col-start-2 row-start-2">
              <svg viewBox="0 0 900 44" preserveAspectRatio="none" className="block h-11 w-full" aria-hidden>
                {top.map((bone, index) => {
                  const glow = isGlowing(bone.id);
                  const dim = isDimmed(bone.id);
                  const xTop = COL_CENTERS[index];
                  const xSpine = TOP_RIB_ANCHORS[index] * 9;
                  return (
                    <line
                      key={bone.id}
                      x1={xTop}
                      y1={0}
                      x2={xSpine}
                      y2={44}
                      stroke={glow ? "#0E948C" : "#1b2a4a"}
                      strokeWidth={glow ? 3 : 2.25}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      opacity={dim ? 0.35 : 1}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Fish tail */}
            <div className="col-start-1 row-start-3 flex items-center justify-end">
              <FishTail />
            </div>

            {/* Central spine */}
            <div className="relative col-start-2 row-start-3 flex h-5 items-center">
              <div className="h-1.5 w-full rounded-full bg-[#1b2a4a]" />
              {top.map((bone, index) => {
                const glow = isGlowing(bone.id);
                const dim = isDimmed(bone.id);
                return (
                  <span
                    key={bone.id}
                    style={{ left: `${TOP_RIB_ANCHORS[index]}%` }}
                    className={cn(
                      "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors",
                      glow ? "border-[#0E948C] bg-[#0E948C]" : "border-[#1b2a4a] bg-[#f6f1e8]",
                      dim && "opacity-45",
                    )}
                    aria-hidden
                  />
                );
              })}
              {bottom.map((bone, index) => {
                const glow = isGlowing(bone.id);
                const dim = isDimmed(bone.id);
                return (
                  <span
                    key={bone.id}
                    style={{ left: `${BOTTOM_RIB_ANCHORS[index]}%` }}
                    className={cn(
                      "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors",
                      glow ? "border-[#0E948C] bg-[#0E948C]" : "border-[#1b2a4a] bg-[#f6f1e8]",
                      dim && "opacity-45",
                    )}
                    aria-hidden
                  />
                );
              })}
            </div>

            {/* Fish head (spanning the spine corridor cleanly without text clipping) */}
            <div className="col-start-3 row-start-2 row-end-5 -ml-1 flex items-center">
              <FishHead
                title={following ? `Following ${following.label}` : "Incident"}
                text={incident?.text ?? "Incident lands here"}
              />
            </div>

            {/* Bottom diagonal ribs SVG */}
            <div className="col-start-2 row-start-4">
              <svg viewBox="0 0 900 44" preserveAspectRatio="none" className="block h-11 w-full" aria-hidden>
                {bottom.map((bone, index) => {
                  const glow = isGlowing(bone.id);
                  const dim = isDimmed(bone.id);
                  const xBottom = COL_CENTERS[index];
                  const xSpine = BOTTOM_RIB_ANCHORS[index] * 9;
                  return (
                    <line
                      key={bone.id}
                      x1={xBottom}
                      y1={44}
                      x2={xSpine}
                      y2={0}
                      stroke={glow ? "#0E948C" : "#1b2a4a"}
                      strokeWidth={glow ? 3 : 2.25}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      opacity={dim ? 0.35 : 1}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Bottom bone cards (Process, Tools, Environment) */}
            <div className="col-start-2 row-start-5 grid grid-cols-3 items-start gap-3">
              {bottom.map((bone) => (
                <FishBoneCard
                  key={bone.id}
                  state={state}
                  bone={bone}
                  position="bottom"
                  glow={isGlowing(bone.id)}
                  dim={isDimmed(bone.id)}
                  selected={selected}
                  onSelect={onSelect}
                  act={act}
                  canMove={canMove}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {tray.length > 0 && (
        <div className="rounded-2xl border border-[#e4dcd0] bg-[#faf8f4] p-3">
          <div className="mb-2 text-sm font-semibold text-[#1c2430]">Not on a bone yet</div>
          <div className="flex flex-wrap gap-2">
            {tray.map((cause) => (
              <button
                key={cause.id}
                type="button"
                onClick={() => onSelect(selected === cause.id ? null : cause.id)}
                className={cn(
                  "min-h-10 rounded-xl border bg-white px-3 py-2 text-left text-sm font-medium text-[#1c2430] transition-colors",
                  selected === cause.id ? "border-[#1e2a44] ring-2 ring-[#1e2a44]" : "border-[#e4dcd0] hover:border-[#1e2a44]/50",
                )}
              >
                {cause.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {state.stage === "s4b" && focusBone && (
        <div className="rounded-2xl border border-[#0E948C]/40 bg-[#f1fbf9] px-4 py-3 text-sm text-[#0c6b65]">
          <span className="font-semibold">Following {focusBone.label}</span> · {BONE_HINTS[focusBone.id]} The five Whys open on this bone in the next step.
        </div>
      )}

      {(state.stage === "s4c" || state.stage === "s4d") && (
        <RootCauseWorkspace
          state={state}
          selected={selected}
          onSelect={onSelect}
          act={act}
          role={role}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

function FishBoneCard({
  state,
  bone,
  position,
  glow,
  dim,
  selected,
  onSelect,
  act,
  canMove,
  readOnly,
}: {
  state: RoomState;
  bone: BoneLabel;
  position: "top" | "bottom";
  glow: boolean;
  dim: boolean;
  selected: string | null;
  onSelect: (id: string | null) => void;
  act: (action: Action) => void;
  canMove: boolean;
  readOnly: boolean;
}) {
  const causes = state.causes.filter((cause) => cause.bone === bone.id);
  const followed = state.focusBone === bone.id;
  const followAllowed = state.selectedBones.length === 0 || state.selectedBones.includes(bone.id);
  const canFollow = !readOnly && (state.stage === "s4b" || state.stage === "s4c") && followAllowed;
  const placedPins = state.pins.filter((pin) => pin.bone === bone.id && pin.placed && !pin.blocked);
  const draftPins = state.pins.filter((pin) => pin.bone === bone.id && !pin.placed && !pin.blocked);

  const stem = (
    <div className="flex justify-center" aria-hidden>
      <span className={cn("h-2.5 w-0.5 transition-colors", glow ? "bg-[#0E948C]" : "bg-[#1b2a4a]")} />
    </div>
  );

  return (
    <div className={cn("flex min-w-0 flex-col transition-opacity", dim && "opacity-55 hover:opacity-90")}>
      {position === "bottom" && stem}
      <div
        className={cn(
          "rounded-2xl border bg-white p-3 transition-colors",
          followed
            ? "border-2 border-[#0E948C] bg-[#f4fbfa]"
            : placedPins.length > 0
              ? "border-2 border-[#7A45D6]"
              : glow
                ? "border-[#0E948C]"
                : "border-[#e4dcd0]",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className={cn("text-sm font-semibold leading-snug", glow ? "text-[#0E948C]" : "text-[#1c2430]")}>
              {bone.label}
            </div>
            <p className="mt-0.5 text-xs leading-snug text-[#5c6570]">{BONE_HINTS[bone.id]}</p>
          </div>
          {placedPins.length > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#f3eefe] px-2 py-0.5 text-xs font-semibold text-[#7A45D6]">
              <PinIcon className="size-3" aria-hidden />
              Pinned
            </span>
          )}
          {placedPins.length === 0 && draftPins.length > 0 && state.stage === "s4d" && (
            <span className="shrink-0 rounded-lg bg-[#faf8f4] px-2 py-0.5 text-xs font-medium text-[#7A45D6]">
              Draft pin
            </span>
          )}
        </div>

        <div className="mt-2.5 grid gap-1.5">
          {causes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#e4dcd0] bg-[#faf8f4] px-2.5 py-2 text-xs text-[#64748b]">
              No causes yet
            </p>
          ) : (
            causes.map((cause) => {
              const owner = person(state, cause.authorId);
              const ownerColor = owner?.role ? ROLES[owner.role].color : "#94a3b8";
              const hopCount = countDescendantHops(state.hops, cause.id);
              const rootFound = hasDescendantRoot(state.hops, cause.id);
              const isPinned = state.pins.some((pin) => pin.causeId === cause.id && pin.placed && !pin.blocked);
              const isSelected = selected === cause.id;

              return (
                <button
                  key={cause.id}
                  type="button"
                  onClick={() => onSelect(isSelected ? null : cause.id)}
                  className={cn(
                    "w-full rounded-xl border bg-[#fffdf8] px-2.5 py-2 text-left transition-colors",
                    isPinned
                      ? "border-[#7A45D6] bg-[#faf7ff]"
                      : isSelected
                        ? "border-[#1e2a44] ring-2 ring-[#1e2a44]"
                        : "border-[#e4dcd0] hover:border-[#1e2a44]/40",
                  )}
                >
                  <span className="block text-xs font-medium leading-snug text-[#1c2430] sm:text-sm">{cause.text}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#5c6570]">
                    <span className="inline-flex items-center gap-1">
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: ownerColor }} aria-hidden />
                      {owner?.name ?? "Team"}
                    </span>
                    {cause.evidence && <span className="text-[#0E948C]">· Quote</span>}
                    {cause.dailyPain && <span className="text-[#7A45D6]">· Daily pain</span>}
                    {cause.blame && <span className="text-[#E25B4A]">· Blame</span>}
                    {cause.vague && <span className="text-[#E25B4A]">· Vague</span>}
                    {hopCount > 0 && (
                      <span className="font-medium text-[#0E948C]">
                        · {hopCount} {hopCount === 1 ? "Why" : "Whys"}
                      </span>
                    )}
                    {rootFound && <span className="font-semibold text-[#0E948C]">· Root</span>}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {canFollow && (
          <button
            type="button"
            onClick={() => act({ type: "follow-bone", id: bone.id })}
            aria-pressed={followed}
            className={cn(
              "mt-2.5 min-h-10 w-full rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors",
              followed
                ? "border-[#0E948C] bg-[#0E948C] text-white"
                : "border-[#d8d0c3] bg-[#faf8f4] text-[#1c2430] hover:border-[#0E948C] hover:text-[#0E948C]",
            )}
          >
            {followed ? "Following this bone" : "Follow this bone"}
          </button>
        )}

        {canMove && selected && (
          <button
            type="button"
            onClick={() => act({ type: "snap", id: selected, bone: bone.id })}
            className="mt-2.5 min-h-10 w-full rounded-xl bg-[#1e2a44] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2a3b5e]"
          >
            Move selected here
          </button>
        )}
      </div>
      {position === "top" && stem}
    </div>
  );
}

function RootCauseWorkspace({
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
  const focusBone = state.bones.find((bone) => bone.id === state.focusBone) ?? null;
  const incident = lockedIncident(state);
  const stageIsWhy = state.stage === "s4c";

  if (!focusBone) {
    const candidateBones = state.bones.filter((bone) =>
      state.selectedBones.length > 0 ? state.selectedBones.includes(bone.id) : state.causes.some((cause) => cause.bone === bone.id),
    );
    return (
      <div className="rounded-3xl border-2 border-dashed border-[#0E948C]/40 bg-[#faf8f4] p-5 text-center">
        <div className="text-base font-semibold text-[#1c2430]">Pick one bone above to open the five Whys</div>
        <p className="mt-1 text-sm text-[#5c6570]">
          Tap any bone on the fishbone (or choose one below) so the team can trace causes to a root cause.
        </p>
        {!readOnly && candidateBones.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {candidateBones.map((bone) => (
              <button
                key={bone.id}
                type="button"
                onClick={() => act({ type: "follow-bone", id: bone.id })}
                className="min-h-10 rounded-xl border border-[#0E948C] bg-white px-3.5 py-2 text-sm font-semibold text-[#0E948C] hover:bg-[#0E948C] hover:text-white"
              >
                Follow {bone.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const boneCauses = state.causes.filter((cause) => cause.bone === focusBone.id);
  const boneHops = state.hops.filter((hop) => hop.bone === focusBone.id && !hop.proposed);
  const pendingProposals = state.hops.filter((hop) => hop.bone === focusBone.id && hop.proposed);
  const markedRoot = boneHops.find((hop) => hop.root);
  const activePins = state.pins.filter((pin) => !pin.blocked);
  const extraPins = activePins.filter((pin) => pin.bone !== focusBone.id);

  return (
    <div className="relative">
      <div className="mx-auto h-4 w-0.5 bg-[#0E948C]" aria-hidden />
      <section className="rounded-3xl border-2 border-[#0E948C]/50 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#efeae1] pb-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#0E948C]">
              {stageIsWhy ? "5 Whys · Root cause analysis" : "Carry forward · Pins & root cause"}
            </div>
            <h3 className="mt-0.5 text-lg font-semibold text-[#1c2430]">
              Following: {focusBone.label}
            </h3>
            <p className="text-sm text-[#5c6570]">{BONE_HINTS[focusBone.id]}</p>
          </div>
          <div className="text-right text-sm text-[#5c6570]">
            <div>
              {boneCauses.length} {boneCauses.length === 1 ? "cause" : "causes"} · {boneHops.length}{" "}
              {boneHops.length === 1 ? "Why" : "Whys"}
            </div>
            <div className={cn("font-medium", markedRoot ? "text-[#0E948C]" : "text-[#8A5A08]")}>
              {markedRoot ? "Root cause marked" : "No root cause marked yet"}
            </div>
          </div>
        </div>

        {boneCauses.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-[#faf8f4] px-4 py-3 text-sm text-[#5c6570]">
            No causes sit on {focusBone.label} yet. Tap a different bone that has causes, or add one first.
          </p>
        ) : (
          <div className="mt-4 grid gap-5">
            {boneCauses.map((cause, causeIndex) => {
              const owner = person(state, cause.authorId);
              const ownerColor = owner?.role ? ROLES[owner.role].color : "#94a3b8";
              const isCauseSelected = selected === cause.id;
              const directHops = state.hops.filter((hop) => hop.parentId === cause.id && !hop.proposed);
              const pinForCause = activePins.find((pin) => pin.causeId === cause.id);
              const blockedPin = state.pins.find((pin) => pin.causeId === cause.id && pin.blocked);

              return (
                <div key={cause.id} className="rounded-2xl border border-[#e4dcd0] bg-[#faf8f4] p-3.5 sm:p-4">
                  <button
                    type="button"
                    onClick={() => onSelect(isCauseSelected ? null : cause.id)}
                    className={cn(
                      "w-full rounded-xl border bg-white p-3 text-left transition-colors",
                      pinForCause?.placed
                        ? "border-[#7A45D6] bg-[#faf7ff]"
                        : isCauseSelected
                          ? "border-[#1e2a44] ring-2 ring-[#1e2a44]"
                          : "border-[#e4dcd0] hover:border-[#1e2a44]/50",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#5c6570]">
                        Cause {boneCauses.length > 1 ? causeIndex + 1 : ""} on {focusBone.label}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-[#5c6570]">
                        <span className="inline-flex items-center gap-1">
                          <span className="size-2 rounded-full" style={{ backgroundColor: ownerColor }} aria-hidden />
                          {owner?.name ?? "Team"}
                        </span>
                        {pinForCause?.placed && (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#7A45D6]">
                            <PinIcon className="size-3.5" aria-hidden />
                            Pinned
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 text-base font-semibold text-[#1c2430]">{cause.text}</div>
                    {cause.evidence && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-[#f1fbf9] px-2.5 py-1.5 text-sm text-[#0c6b65]">
                        <MessageSquareQuote className="mt-0.5 size-4 shrink-0" aria-hidden />
                        <span>“{cause.evidence}”</span>
                      </div>
                    )}
                    {(cause.dailyPain || cause.blame || cause.vague) && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                        {cause.dailyPain && <span className="text-[#7A45D6]">Daily pain</span>}
                        {cause.blame && <span className="text-[#E25B4A]">Marked as blame</span>}
                        {cause.vague && <span className="text-[#E25B4A]">Marked as vague</span>}
                      </div>
                    )}
                    {isCauseSelected && stageIsWhy && (
                      <div className="mt-2 text-xs font-semibold text-[#1e2a44]">
                        Selected — Why 1 grows from this cause
                      </div>
                    )}
                  </button>

                  {directHops.length > 0 ? (
                    <div className="mt-3 pl-2 sm:pl-4">
                      <WhyBranchList
                        state={state}
                        parentId={cause.id}
                        depth={1}
                        selected={selected}
                        onSelect={onSelect}
                        role={role}
                        stage={state.stage}
                        pinForCause={pinForCause}
                      />
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 pl-3 text-sm text-[#5c6570]">
                      <CornerDownRight className="size-4 shrink-0 text-[#0E948C]" aria-hidden />
                      <span>
                        {stageIsWhy
                          ? "No Why hops on this cause yet. Tap this cause, then write Why 1 on the right."
                          : "No Why hops added under this cause."}
                      </span>
                    </div>
                  )}

                  {state.stage === "s4d" && (pinForCause || blockedPin) && (
                    <PinCarryCard
                      pin={pinForCause ?? blockedPin!}
                      causeText={cause.text}
                      harmText={incident?.text ?? "Incident in the fish head"}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {pendingProposals.length > 0 && (
          <div className="mt-4 rounded-2xl border border-[#e4dcd0] bg-[#faf8f4] px-3.5 py-2.5 text-sm text-[#5c6570]">
            <span className="font-semibold text-[#1c2430]">Waiting for Insight Extractor:</span>{" "}
            {pendingProposals.map((hop) => `“${hop.text}”`).join(" · ")}
          </div>
        )}

        {state.stage === "s4d" && extraPins.length > 0 && (
          <div className="mt-4 grid gap-3 border-t border-[#efeae1] pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#7A45D6]">
              Pins from other bones
            </div>
            {extraPins.map((pin) => {
              const cause = state.causes.find((item) => item.id === pin.causeId);
              return (
                <PinCarryCard
                  key={pin.id}
                  pin={pin}
                  causeText={cause?.text ?? "Cause"}
                  harmText={incident?.text ?? "Incident in the fish head"}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function WhyBranchList({
  state,
  parentId,
  depth,
  selected,
  onSelect,
  role,
  stage,
  pinForCause,
}: {
  state: RoomState;
  parentId: string;
  depth: number;
  selected: string | null;
  onSelect: (id: string | null) => void;
  role: RoleId | null;
  stage: RoomState["stage"];
  pinForCause?: Pin;
}) {
  const hops = state.hops.filter((hop) => hop.parentId === parentId && !hop.proposed);
  if (hops.length === 0) return null;

  return (
    <div className="grid gap-2.5 border-l-2 border-[#0E948C]/40 pl-3 sm:pl-4">
      {hops.map((hop) => {
        const isSelected = selected === hop.id;
        const isRoot = Boolean(hop.root);
        const isPinnedHop = Boolean(pinForCause?.placed && (isRoot || pinForCause.hopId === hop.id));
        const children = state.hops.filter((item) => item.parentId === hop.id && !item.proposed);

        return (
          <div key={hop.id} className="grid gap-2">
            <button
              type="button"
              onClick={() => onSelect(isSelected ? null : hop.id)}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition-colors",
                isRoot
                  ? "border-2 border-[#0E948C] bg-[#eefaf8]"
                  : isPinnedHop
                    ? "border-2 border-[#7A45D6] bg-[#faf7ff]"
                    : "border-[#e4dcd0] bg-white hover:border-[#0E948C]/60",
                isSelected && "ring-2 ring-[#1e2a44]",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span className={cn("font-semibold", isRoot ? "text-[#0c6b65]" : "text-[#0E948C]")}>
                    Why {depth}
                  </span>
                  {hop.chip && <span className="text-[#5c6570]">· {CHIP_LABEL[hop.chip]}</span>}
                  {hop.askWhom && <span className="font-medium text-[#1c2430]">· Ask {hop.askWhom}</span>}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {isRoot && (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#0c6b65]">
                      <Target className="size-3.5" aria-hidden />
                      Root cause
                    </span>
                  )}
                  {isPinnedHop && (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#7A45D6]">
                      <CheckCircle2 className="size-3.5" aria-hidden />
                      Carried to statement
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-1 text-sm font-semibold leading-snug text-[#1c2430] sm:text-base">{hop.text}</div>

              {isSelected && stage === "s4c" && (
                <div className="mt-2 text-xs font-semibold text-[#1e2a44]">
                  {depth >= 5
                    ? "Selected — 5 Whys reached"
                    : `Selected — Why ${depth + 1} grows from here`}
                  {role === "insight" ? (isRoot ? " (marked as root cause)" : " · or mark as root cause on the right") : ""}
                </div>
              )}
            </button>

            {children.length > 0 && (
              <WhyBranchList
                state={state}
                parentId={hop.id}
                depth={depth + 1}
                selected={selected}
                onSelect={onSelect}
                role={role}
                stage={stage}
                pinForCause={pinForCause}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PinCarryCard({
  pin,
  causeText,
  harmText,
}: {
  pin: Pin;
  causeText: string;
  harmText: string;
}) {
  return (
    <div
      className={cn(
        "mt-3 rounded-xl border p-3 text-sm",
        pin.blocked
          ? "border-[#E25B4A] bg-[#fdeceb]"
          : pin.placed
            ? "border-[#7A45D6] bg-[#faf7ff]"
            : "border-[#d9c8f5] bg-white",
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
        <PinIcon
          className={cn("size-3.5", pin.blocked ? "text-[#E25B4A]" : "text-[#7A45D6]")}
          aria-hidden
        />
        <span className={pin.blocked ? "text-[#E25B4A]" : "text-[#7A45D6]"}>
          {pin.blocked
            ? "Pin blocked — replace or override"
            : pin.placed
              ? "Pinned to carry forward"
              : "Draft pin — waiting for Theme Mapper to place"}
        </span>
      </div>
      <dl className="mt-2 grid gap-1.5 sm:grid-cols-3">
        <div className="rounded-lg bg-white/80 px-2.5 py-2">
          <dt className="text-xs font-medium text-[#5c6570]">Obstacle (from cause)</dt>
          <dd className="mt-0.5 text-sm font-medium text-[#1c2430]">
            {pin.obstacle || causeText}
            {!pin.obstacleSet && <span className="ml-1 text-xs text-[#8A5A08]">(unsaved)</span>}
          </dd>
        </div>
        <div className="rounded-lg bg-white/80 px-2.5 py-2">
          <dt className="text-xs font-medium text-[#5c6570]">Insight (from root Why)</dt>
          <dd className="mt-0.5 text-sm font-medium text-[#1c2430]">
            {pin.insight || "Mark a root Why and save labels"}
            {!pin.insightSet && pin.insight && <span className="ml-1 text-xs text-[#8A5A08]">(unsaved)</span>}
          </dd>
        </div>
        <div className="rounded-lg bg-white/80 px-2.5 py-2">
          <dt className="text-xs font-medium text-[#5c6570]">Harm (from fish head)</dt>
          <dd className="mt-0.5 text-sm font-medium text-[#1c2430]">{harmText}</dd>
        </div>
      </dl>
    </div>
  );
}

function FishTail() {
  return (
    <svg width="44" height="58" viewBox="0 0 44 58" aria-hidden className="shrink-0">
      <path d="M44,29 C32,29 19,17 4,4 C15,17 17,24 6,29 C17,34 15,41 4,54 C19,41 32,29 44,29 Z" fill="#1b2a4a" />
      <path d="M40,29 C31,24 27,19 22,13" fill="none" stroke="#f6f1e8" strokeWidth="1.5" opacity="0.4" />
      <path d="M40,29 C31,34 27,39 22,45" fill="none" stroke="#f6f1e8" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

function FishHead({ title, text }: { title: string; text: string }) {
  return (
    <div className="relative min-h-[120px] w-full shrink-0">
      <svg viewBox="0 0 240 128" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <path
          d="M2,64 C2,18 68,4 134,10 C186,15 224,40 238,64 C224,88 186,113 134,118 C68,124 2,110 2,64 Z"
          fill="#1b2a4a"
        />
        <path d="M22,36 C56,52 56,76 22,92" fill="none" stroke="#d5dceb" strokeWidth="2" opacity="0.28" />
      </svg>
      <svg width="20" height="20" viewBox="0 0 20 20" className="absolute right-5 top-5 z-10" aria-hidden>
        <circle cx="10" cy="10" r="8" fill="#f6f1e8" />
        <circle cx="11.5" cy="10" r="3.8" fill="#1b2a4a" />
        <circle cx="12.5" cy="8.8" r="1.3" fill="#f6f1e8" />
      </svg>
      <div className="relative z-10 flex min-h-[120px] flex-col justify-center pl-6 pr-11 py-3.5 text-white">
        <div className="text-xs font-medium text-white/75">{title}</div>
        <div className="mt-1 text-sm font-semibold leading-snug">{text}</div>
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
