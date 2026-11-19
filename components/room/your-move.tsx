"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HelpDialog } from "@/components/help-dialog";
import { RoleToken } from "@/components/role-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BONE_HINTS, FLAG_LABELS, SCREENS } from "@/lib/copy";
import {
  ROLES,
  emptyDeepen,
  sentence,
  statementIssues,
  type Action,
  type BoneId,
  type Chip,
  type FlagTag,
  type RoleId,
  type RoomState,
} from "@/lib/domain";
import { carryFor, checklistFor, person, type Meter } from "@/lib/game";
import { needSeed } from "@/lib/interview";

const CHIPS: Chip[] = ["evidence", "assumption", "need-to-check"];
const FLAGS: FlagTag[] = ["too-broad", "multi", "has-solution", "generic-who", "missing-carry", "solution-in-need"];

export function YourMove({
  state,
  youId,
  role,
  meter,
  act,
  saving,
  error,
  selected,
  onSelect,
}: {
  state: RoomState;
  youId: string;
  role: RoleId | null;
  meter: Meter;
  act: (action: Action) => void | Promise<boolean>;
  saving: boolean;
  error: string | null;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const you = person(state, youId);
  const screen = SCREENS[state.stage];
  const tone = role ? ROLES[role] : null;
  const dots = you && you.kind === "student" ? checklistFor(state, you) : [];
  return (
    <aside
      className="w-full rounded-3xl border-2 bg-[#fff6e4] p-4"
      style={{ borderColor: tone?.color ?? "#e4dcd0" }}
    >
      <div className="text-sm font-semibold" style={{ color: tone?.color ?? "#1c2430" }}>Your move</div>
      <div className="mt-2 flex items-center gap-2">
        {role && <RoleToken role={role} size={40} />}
        <div>
          <div className="font-semibold">{tone?.name ?? "Waiting for a role"}</div>
          <div className="text-sm">{you?.name}</div>
        </div>
      </div>
      <p className="mt-3 text-base">{role ? screen.move[role] : "Your role is blank. Ask your teacher to assign roles before Start."}</p>
      {dots.length > 0 && (
        <ul className="mt-3 grid gap-1">
          {dots.map((dot) => (
            <li key={dot.label} className="text-sm">
              <span aria-hidden>{dot.done ? "●" : "○"} </span>
              {dot.label}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 grid gap-2">
        <Controls state={state} role={role} act={act} saving={saving} meter={meter} selected={selected} onSelect={onSelect} youId={youId} />
      </div>
      {error && (
        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-base" role="alert">
          {error}
        </p>
      )}
      <div className="mt-4">
        <HelpDialog />
      </div>
    </aside>
  );
}

function MoveButton({
  children,
  onClick,
  disabled,
  role,
  outline,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  role: RoleId | null;
  outline?: boolean;
}) {
  const tone = role ? ROLES[role] : null;
  return (
    <Button
      type="button"
      variant={outline ? "outline" : "default"}
      className="h-11 min-h-11 w-full px-4 text-base"
      disabled={disabled}
      onClick={onClick}
      style={!outline && tone && !disabled ? { background: tone.color, color: tone.ink } : undefined}
    >
      {children}
    </Button>
  );
}

function Controls({
  state,
  role,
  act,
  saving,
  meter,
  selected,
  onSelect,
  youId,
}: {
  state: RoomState;
  role: RoleId | null;
  act: (action: Action) => void | Promise<boolean>;
  saving: boolean;
  meter: Meter;
  selected: string | null;
  onSelect: (id: string | null) => void;
  youId: string;
}) {
  const [text, setText] = useState("");
  const locked = saving;
  const stage = state.stage;

  return (
    <>
      {stage === "s0" && <p>Your teacher starts the activity. There is nothing to edit.</p>}
      {stage === "s1" && (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            act({ type: "add-stakeholder", label: text });
            setText("");
          }}
        >
          <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Cocoa farmer" className="h-11 text-base md:text-base" aria-label="Stakeholder label" />
          <MoveButton role={role} disabled={locked} onClick={() => { act({ type: "add-stakeholder", label: text }); setText(""); }}>
            Add my stakeholder
          </MoveButton>
          {state.stakeholders.filter((card) => card.authorId === youId && !card.masked).map((card) => (
            <MoveButton key={card.id} role={role} outline disabled={locked} onClick={() => act({ type: "delete-stakeholder", id: card.id })}>
              Remove {card.label}
            </MoveButton>
          ))}
        </form>
      )}
      {stage === "s1b" && role !== "mapper" && <p>Nothing for you to edit on this screen.</p>}
      {stage === "s1b" && role === "mapper" && (
        <>
          <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Renamed label" className="h-11 text-base md:text-base" aria-label="Rename label" />
          <MoveButton role={role} outline disabled={locked || !selected} onClick={() => act({ type: "rename", id: selected!, label: text })}>
            Rename label
          </MoveButton>
          {selected && (
            <MoveButton role={role} outline disabled={locked} onClick={() => act({ type: "unmerge", id: selected })}>
              Unmerge
            </MoveButton>
          )}
          <MoveButton role={role} disabled={locked || !meter.ready} onClick={() => act({ type: "merges-done" })}>
            Merges done
          </MoveButton>
        </>
      )}
      {stage === "s2" && <SummaryControls state={state} role={role} act={act} locked={locked} meter={meter} selected={selected} />}
      {stage === "s3" && <IncidentControls role={role} act={act} locked={locked} meter={meter} selected={selected} text={text} setText={setText} />}
      {stage === "s4a" && <CauseControls state={state} role={role} act={act} locked={locked} meter={meter} selected={selected} />}
      {stage === "s4b" && <BoneVote state={state} role={role} act={act} locked={locked} meter={meter} />}
      {stage === "s4c" && <WhyControls state={state} role={role} act={act} locked={locked} meter={meter} selected={selected} onSelect={onSelect} />}
      {stage === "s4d" && <PinControls state={state} role={role} act={act} locked={locked} meter={meter} selected={selected} />}
      {stage === "s5" && <StatementForm state={state} youId={youId} role={role} act={act} locked={locked} />}
      {stage === "s6" && <RedFlag state={state} youId={youId} role={role} act={act} locked={locked} meter={meter} selected={selected} />}
      {stage === "s7" && <PackActions state={state} role={role} />}
    </>
  );
}

function SummaryControls({
  state,
  role,
  act,
  locked,
}: {
  state: RoomState;
  role: RoleId | null;
  act: (action: Action) => void | Promise<boolean>;
  locked: boolean;
  meter: Meter;
  selected: string | null;
}) {
  const [harm, setHarm] = useState(state.summary.harm);
  useEffect(() => setHarm(state.summary.harm), [state.summary.harm]);
  return (
    <>
      {role === "mapper" && <p>Drag a card into a quadrant. You can also tap a card, then tap the quadrant.</p>}
      {role !== "mapper" && role !== "interviewer" && <p>You are watching. You cannot move cards.</p>}
      {role === "interviewer" && (
        <>
          <label className="text-sm">
            Whose problem we follow
            <select
              className="mt-1 h-11 w-full rounded-xl border bg-white px-3 text-base"
              value={state.summary.whoseId ?? ""}
              onChange={(event) => act({ type: "whose", id: event.target.value })}
            >
              <option value="">Choose a person</option>
              {state.stakeholders.filter((card) => !card.mergedInto && !card.masked).map((card) => (
                <option key={card.id} value={card.id}>{card.label}</option>
              ))}
            </select>
          </label>
          <Textarea value={harm} onChange={(event) => setHarm(event.target.value)} className="min-h-24 text-base" aria-label="What goes wrong" placeholder="What goes wrong for this person?" />
          <MoveButton role={role} disabled={locked} onClick={() => act({ type: "harm", text: harm })}>Write what goes wrong</MoveButton>
        </>
      )}
    </>
  );
}

function IncidentControls({
  role,
  act,
  locked,
  text,
  setText,
}: {
  role: RoleId | null;
  act: (action: Action) => void | Promise<boolean>;
  locked: boolean;
  meter: Meter;
  selected: string | null;
  text: string;
  setText: (value: string) => void;
}) {
  return (
    <>
      {role === "interviewer" ? (
        <>
          <Textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-24 text-base" aria-label="Incident" placeholder="At last week's buying station, a family's dried beans weighed less on the buyer's scale." />
          <p className="text-sm text-muted-foreground">Use a moment from the interview. A when, where, and what makes a stronger fact.</p>
          <MoveButton
            role={role}
            disabled={locked || text.trim().length < 2}
            onClick={() => {
              void Promise.resolve(act({ type: "add-incident", text })).then((ok) => {
                if (ok === false) return;
                setText("");
              });
            }}
          >
            Add the incident
          </MoveButton>
        </>
      ) : (
        <p>Vote on the board. You cannot write the incident.</p>
      )}
    </>
  );
}

function CauseControls({
  state,
  role,
  act,
  locked,
}: {
  state: RoomState;
  role: RoleId | null;
  act: (action: Action) => void | Promise<boolean>;
  locked: boolean;
  meter: Meter;
  selected: string | null;
}) {
  const [text, setText] = useState("");
  const [bone, setBone] = useState<BoneId | null>(null);
  const chosen = state.bones.find((item) => item.id === bone);
  return (
    <>
      <p>Pick one kind of cause. Then write it. The card appears on that bone of the fish.</p>
      <div className="grid grid-cols-2 gap-2">
        {state.bones.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={bone === item.id ? "default" : "outline"}
            className="h-auto min-h-11 whitespace-normal px-2 py-2 text-left text-base"
            onClick={() => setBone(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {chosen && <p className="text-sm text-muted-foreground">{BONE_HINTS[chosen.id]}</p>}
      <Textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-20 text-base" aria-label="Cause" placeholder="Rain spoiled beans drying in the open" />
      <MoveButton
        role={role}
        disabled={locked || !bone || text.trim().length < 3}
        onClick={() => {
          if (!bone) return;
          void Promise.resolve(act({ type: "add-cause", text, bone })).then((ok) => {
            if (ok === false) return;
            setText("");
          });
        }}
      >
        {chosen ? `Add it to ${chosen.label}` : "Pick a bone first"}
      </MoveButton>
      {role === "mapper" ? (
        <p>To move a card, tap it on the fish, then tap Move here on the better bone.</p>
      ) : (
        <p>Your card stays on the bone you picked. Maya can move it if it belongs somewhere else.</p>
      )}
    </>
  );
}

function BoneVote({
  state,
  role,
  act,
  locked,
}: {
  state: RoomState;
  role: RoleId | null;
  act: (action: Action) => void | Promise<boolean>;
  locked: boolean;
  meter: Meter;
}) {
  return (
    <>
      <p>Read the cause on each bone, then tap the one the team will follow. The five Whys come next.</p>
      {state.bones.map((bone) => {
        const causes = state.causes.filter((cause) => cause.bone === bone.id);
        const on = state.focusBone === bone.id;
        return (
          <button
            key={bone.id}
            type="button"
            disabled={locked}
            onClick={() => act({ type: "follow-bone", id: bone.id })}
            className={`rounded-xl border bg-white px-3 py-2 text-left ${on ? "border-[#1e2a44]" : ""}`}
          >
            <span className="block font-semibold" style={{ color: role ? ROLES[role].color : undefined }}>{bone.label}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {causes.length ? causes.map((cause) => cause.text).join(" · ") : "No cause on this bone yet"}
            </span>
            {on && <span className="mt-1 block text-sm">We follow this bone</span>}
          </button>
        );
      })}
    </>
  );
}

function whyTip(state: RoomState, bone: BoneId, selected: string | null) {
  if (selected && state.hops.some((hop) => hop.id === selected && hop.bone === bone && !hop.proposed)) return selected;
  const picked = state.causes.find((cause) => cause.id === selected && cause.bone === bone);
  const cause = picked ?? state.causes.find((item) => item.bone === bone);
  if (!cause) return "";
  return deepestWhy(state, cause.id);
}

function whyCount(state: RoomState, id: string): number {
  const cause = state.causes.find((item) => item.id === id);
  if (cause) return 0;
  const hop = state.hops.find((item) => item.id === id);
  if (!hop) return 0;
  return 1 + whyCount(state, hop.parentId);
}

function deepestWhy(state: RoomState, id: string): string {
  const children = state.hops.filter((hop) => hop.parentId === id && !hop.proposed);
  if (children.length === 0) return id;
  return deepestWhy(state, children[children.length - 1].id);
}

function cardText(state: RoomState, id: string) {
  return state.causes.find((cause) => cause.id === id)?.text ?? state.hops.find((hop) => hop.id === id)?.text ?? "";
}

function WhyControls({
  state,
  role,
  act,
  locked,
  selected,
  onSelect,
}: {
  state: RoomState;
  role: RoleId | null;
  act: (action: Action) => void | Promise<boolean>;
  locked: boolean;
  meter: Meter;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [text, setText] = useState("");
  const [chip, setChip] = useState<Chip>("evidence");
  const bone = (state.focusBone ?? state.selectedBones[0] ?? "timing") as BoneId;
  const seen = useRef(state.hops.length);
  const parentId = whyTip(state, bone, selected);
  const growingFrom = cardText(state, parentId);
  const depth = parentId ? whyCount(state, parentId) : 0;
  const choices = state.selectedBones.length > 0 ? state.bones.filter((item) => state.selectedBones.includes(item.id)) : state.bones;
  useEffect(() => {
    if (state.hops.length > seen.current) {
      const newest = state.hops[state.hops.length - 1];
      if (newest && !newest.proposed) onSelect(newest.id);
    }
    seen.current = state.hops.length;
  }, [onSelect, state.hops]);
  if (!state.focusBone) {
    return (
      <>
        <p>Tap one bone. The five Whys line up on that rib.</p>
        <div className="grid grid-cols-2 gap-2">
          {choices.map((item) => (
            <Button key={item.id} type="button" variant="outline" className="h-auto min-h-11 whitespace-normal px-2 py-2 text-left text-base" onClick={() => act({ type: "follow-bone", id: item.id })}>
              {item.label}
            </Button>
          ))}
        </div>
      </>
    );
  }
  if (role === "interviewer") return <AskWhom state={state} role={role} act={act} locked={locked} selected={selected} onSelect={onSelect} />;
  if (role !== "insight") return <p>The team is following {state.bones.find((item) => item.id === state.focusBone)?.label}. Only the Insight Extractor adds the five Whys.</p>;
  return (
    <>
      <p className="font-semibold">Following {state.bones.find((item) => item.id === bone)?.label}</p>
      <p className="text-sm">
        {state.hops.some((hop) => hop.bone === bone && hop.root)
          ? `Why ${whyCount(state, state.hops.find((hop) => hop.bone === bone && hop.root)?.id ?? "")} is the root cause. You can stop here.`
          : growingFrom
            ? `Why ${depth + 1} sits further left, past “${growingFrom}”. Stop when one Why is the root cause. That is often the third or the fourth.`
            : "Add a cause on this bone before asking Why."}
      </p>
      <Textarea value={text} onChange={(event) => setText(event.target.value)} className="min-h-20 text-base" aria-label="Why" placeholder="Why did that happen?" />
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((item) => (
          <button key={item} type="button" className="rounded-full border bg-white px-3 py-1 text-sm" onClick={() => setChip(item)} aria-pressed={chip === item}>
            {chip === item ? "● " : ""}{item === "need-to-check" ? "need to check" : item}
          </button>
        ))}
      </div>
      <MoveButton
        role={role}
        disabled={locked || !parentId || text.trim().length < 3 || depth >= 5}
        onClick={() => {
          void Promise.resolve(act({ type: "add-hop", bone, parentId, text, chip })).then((ok) => {
            if (ok === false) return;
            setText("");
          });
        }}
      >
        {depth >= 5 ? "Five Whys is the most" : `Add Why ${depth + 1}`}
      </MoveButton>
      {state.hops.some((hop) => hop.id === selected && hop.bone === bone && !hop.proposed) && (
        <MoveButton role={role} outline disabled={locked} onClick={() => act({ type: "mark-root", id: selected! })}>
          {state.hops.find((hop) => hop.id === selected)?.root ? "Clear the root mark" : "This Why is the root cause"}
        </MoveButton>
      )}
      {state.hops.filter((hop) => hop.proposed).map((hop) => (
        <MoveButton key={hop.id} role={role} outline disabled={locked} onClick={() => act({ type: "accept-hop", id: hop.id, chip })}>
          Accept: {hop.text}
        </MoveButton>
      ))}
      <p className="text-sm">Tap a Why, then mark it as the root cause if you should stop. The third or the fourth Why is often the root. You do not have to write a fifth.</p>
    </>
  );
}

function AskWhom({
  state,
  role,
  act,
  locked,
  selected,
  onSelect,
}: {
  state: RoomState;
  role: RoleId | null;
  act: (action: Action) => void | Promise<boolean>;
  locked: boolean;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const checks = state.hops.filter((hop) => hop.chip === "need-to-check" && !hop.proposed);
  const current = checks.find((hop) => hop.id === selected) ?? checks[0];
  const [whom, setWhom] = useState("");
  useEffect(() => {
    setWhom(current?.askWhom ?? "");
  }, [current?.id, current?.askWhom]);
  if (checks.length === 0) return <p>When a Why is marked Need to check, name who you would ask. There is not one yet.</p>;
  return (
    <>
      <p>Tap a Need-to-check Why, then name who you would ask.</p>
      {checks.map((hop) => (
        <button
          key={hop.id}
          type="button"
          onClick={() => onSelect(hop.id)}
          className={`rounded-xl border bg-white px-3 py-2 text-left ${current?.id === hop.id ? "border-[#1e2a44]" : ""}`}
        >
          <span className="block font-semibold">{hop.text}</span>
          <span className="text-sm text-muted-foreground">{hop.askWhom ? `Ask ${hop.askWhom}` : "No one named yet"}</span>
        </button>
      ))}
      <Input value={whom} onChange={(event) => setWhom(event.target.value)} className="h-11 text-base md:text-base" aria-label="Who to ask" placeholder="The buying agent" />
      <MoveButton
        role={role}
        disabled={locked || !current || whom.trim().length < 2}
        onClick={() => current && act({ type: "ask-whom", id: current.id, whom })}
      >
        Save who to ask
      </MoveButton>
    </>
  );
}

function PinControls({
  state,
  role,
  act,
  locked,
}: {
  state: RoomState;
  role: RoleId | null;
  act: (action: Action) => void | Promise<boolean>;
  locked: boolean;
  meter: Meter;
  selected: string | null;
}) {
  const causes = state.causes.filter((cause) => {
    if (!cause.bone) return false;
    if (state.focusBone) return cause.bone === state.focusBone;
    if (state.selectedBones.length > 0) return state.selectedBones.includes(cause.bone);
    return true;
  });
  const live = state.pins.filter((pin) => !pin.blocked);
  const [activeId, setActiveId] = useState<string | null>(live[0]?.id ?? null);
  const active = live.find((pin) => pin.id === activeId) ?? live[0];
  const [obstacle, setObstacle] = useState(active?.obstacle ?? "");
  const [insight, setInsight] = useState(active?.insight ?? "");
  useEffect(() => {
    setObstacle(active?.obstacle ?? "");
    setInsight(active?.insight ?? "");
  }, [active?.id, active?.obstacle, active?.insight]);

  if (role === "insight") {
    return (
      <>
        <p>Obstacle starts as the cause on the rib. Insight starts as the Why marked as the root cause. If that Why is blank, mark it on the fish first. Maya places the pin after you save the labels.</p>
        {causes.length === 0 && <p>There is no cause on the bone the team followed.</p>}
        {causes.map((cause) => {
          const pin = live.find((item) => item.causeId === cause.id);
          return (
            <div key={cause.id} className="rounded-xl bg-white p-2">
              <div className="font-semibold">{cause.text}</div>
              {!pin && (
                <MoveButton role={role} outline disabled={locked} onClick={() => {
                  void Promise.resolve(act({ type: "nominate-pin", causeId: cause.id, hopId: null })).then((ok) => {
                    if (ok === false) return;
                    const made = state.pins.find((item) => item.causeId === cause.id);
                    if (made) setActiveId(made.id);
                  });
                }}>
                  Choose this cause
                </MoveButton>
              )}
              {pin && (
                <button type="button" className="mt-1 text-left text-sm underline" onClick={() => setActiveId(pin.id)}>
                  {pin.obstacleSet ? "Edit the labels" : "Write the labels"}
                </button>
              )}
            </div>
          );
        })}
        {active && (
          <>
            <label className="text-sm">
              Obstacle
              <Input value={obstacle} onChange={(event) => setObstacle(event.target.value)} className="mt-1 h-11 text-base md:text-base" aria-label="Obstacle" placeholder="The cause on this rib" />
            </label>
            <label className="text-sm">
              Insight
              <Input value={insight} onChange={(event) => setInsight(event.target.value)} className="mt-1 h-11 text-base md:text-base" aria-label="Insight" placeholder="The Why marked as the root cause" />
            </label>
            <MoveButton
              role={role}
              disabled={locked || obstacle.trim().length < 3 || insight.trim().length < 3}
              onClick={() => act({ type: "set-candidates", id: active.id, obstacle, insight })}
            >
              Save labels
            </MoveButton>
            {active.obstacleSet && <p className="text-sm">Saved. Maya can place this pin.</p>}
          </>
        )}
      </>
    );
  }

  if (role === "mapper") {
    return (
      <>
        <p>Asha writes Obstacle and Insight. You place the pin on the fish.</p>
        {live.length === 0 && <p>No cause chosen yet. Switch to Asha and choose one, then come back here.</p>}
        {live.map((pin) => {
          const cause = state.causes.find((item) => item.id === pin.causeId);
          return (
            <div key={pin.id} className="rounded-xl bg-white p-2">
              <div className="font-semibold">{cause?.text ?? "Cause"}</div>
              <p className="mt-1 text-sm">Obstacle: {pin.obstacleSet ? pin.obstacle : "Not written yet"}</p>
              <p className="text-sm">Insight: {pin.insightSet ? pin.insight : "Not written yet"}</p>
              {pin.placed ? (
                <p className="mt-2 text-sm">Placed on the fish.</p>
              ) : (
                <MoveButton role={role} disabled={locked || !pin.obstacleSet} onClick={() => act({ type: "place-pin", id: pin.id })}>
                  Place pin on the fish
                </MoveButton>
              )}
            </div>
          );
        })}
      </>
    );
  }

  return <p>Asha writes the two labels. Maya places the pin. The fish shows it once it is placed.</p>;
}

function StatementForm({
  state,
  youId,
  role,
  act,
  locked,
}: {
  state: RoomState;
  youId: string;
  role: RoleId | null;
  act: (action: Action) => void | Promise<boolean>;
  locked: boolean;
}) {
  const existing = state.statements.find((card) => card.authorId === youId);
  const pins = state.pins.filter((pin) => pin.placed && !pin.blocked);
  const [pinId, setPinId] = useState(existing?.pinId ?? pins[0]?.id ?? null);
  const carry = carryFor(state, pinId);
  const seed = needSeed(state.interview?.turns);
  const [who, setWho] = useState(existing?.who || carry.who);
  const [need, setNeed] = useState(existing?.need || seed);
  const [obstacle, setObstacle] = useState(existing?.obstacle || carry.obstacle);
  const [harm, setHarm] = useState(existing?.harm || carry.harm);
  const [insight, setInsight] = useState(existing?.insight || carry.insight);
  const [whoEdited, setWhoEdited] = useState(Boolean(existing?.edited.who));
  const [needTouched, setNeedTouched] = useState(Boolean(existing?.need));
  const [obstacleEdited, setObstacleEdited] = useState(Boolean(existing?.edited.obstacle));
  const [harmEdited, setHarmEdited] = useState(Boolean(existing?.edited.harm));
  const [insightEdited, setInsightEdited] = useState(Boolean(existing?.edited.insight));
  const [deepen, setDeepen] = useState(existing?.deepen ?? emptyDeepen());
  useEffect(() => {
    if (!whoEdited) setWho(carry.who);
    if (!harmEdited) setHarm(carry.harm);
    if (!obstacleEdited) setObstacle(carry.obstacle);
    if (!insightEdited) setInsight(carry.insight);
  }, [carry.who, carry.harm, carry.obstacle, carry.insight, whoEdited, harmEdited, obstacleEdited, insightEdited]);
  useEffect(() => {
    if (!needTouched && !existing?.need) setNeed(seed);
  }, [seed, needTouched, existing?.need]);
  const issues = statementIssues({ who, need, obstacle, harm, insight });
  const stale = Boolean(existing?.carryStamp && existing.carryStamp !== carry.stamp);
  const payload = {
    type: "save-statement" as const,
    pinId,
    who,
    need,
    obstacle,
    harm,
    insight,
    deepen,
    useNewVersion: false,
  };
  return (
    <div className="grid gap-2">
      {pins.length > 1 && (
        <label className="text-sm">
          Which pin feeds this statement?
          <select className="mt-1 h-11 w-full rounded-xl border bg-white px-3 text-base" value={pinId ?? ""} onChange={(event) => setPinId(event.target.value)}>
            {pins.map((pin) => (
              <option key={pin.id} value={pin.id}>{pin.obstacle || pin.insight}</option>
            ))}
          </select>
        </label>
      )}
      <Blank label="Who — the person you followed" value={who} onChange={(value) => { setWhoEdited(true); setWho(value); }} />
      <Blank label="Need — from the interview, edit this" value={need} onChange={(value) => { setNeedTouched(true); setNeed(value); }} emphasis />
      <Blank label="Obstacle — the cause you pinned" value={obstacle} onChange={(value) => { setObstacleEdited(true); setObstacle(value); }} />
      <Blank label="Harm — the incident in the fish head" value={harm} onChange={(value) => { setHarmEdited(true); setHarm(value); }} />
      <Blank label="Insight — the Why marked as the root cause" value={insight} onChange={(value) => { setInsightEdited(true); setInsight(value); }} />
      <p className="rounded-xl bg-white px-3 py-2">{sentence({ who, need, obstacle, harm, insight })}</p>
      {issues.map((issue) => (
        <p key={issue} className="text-sm text-[#9a3412]">{issue}</p>
      ))}
      {stale && (
        <MoveButton
          role={role}
          outline
          disabled={locked}
          onClick={() => {
            setWhoEdited(false);
            setHarmEdited(false);
            setObstacleEdited(false);
            setInsightEdited(false);
            act({ ...payload, who: carry.who, harm: carry.harm, obstacle: carry.obstacle, insight: carry.insight, useNewVersion: true });
          }}
        >
          Use new version
        </MoveButton>
      )}
      <details className="rounded-xl bg-white px-3 py-2">
        <summary>Open deepen (optional)</summary>
        <p className="mt-1 text-sm text-muted-foreground">Context or Emotion makes the statement stronger for the top 3 — not required to submit.</p>
        {(["context", "emotion", "impact", "alternatives"] as const).map((field) => (
          <Input
            key={field}
            value={deepen[field]}
            onChange={(event) => setDeepen({ ...deepen, [field]: event.target.value })}
            className="mt-2 h-11 text-base md:text-base"
            aria-label={field}
            placeholder={field}
          />
        ))}
      </details>
      <MoveButton role={role} outline disabled={locked} onClick={() => act(payload)}>Save draft</MoveButton>
      <MoveButton role={role} disabled={locked || issues.length > 0 || Boolean(existing?.submitted)} onClick={() => act({ ...payload, submit: true })}>
        Submit
      </MoveButton>
    </div>
  );
}

function Blank({
  label,
  value,
  onChange,
  emphasis,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  emphasis?: boolean;
}) {
  return (
    <label className="text-sm">
      {label}
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={emphasis ? "mt-1 h-11 border-dashed bg-white text-base md:text-base" : "mt-1 h-11 bg-white text-base md:text-base"}
      />
    </label>
  );
}

function RedFlag({
  state,
  youId,
  role,
  act,
  locked,
  selected,
}: {
  state: RoomState;
  youId: string;
  role: RoleId | null;
  act: (action: Action) => void | Promise<boolean>;
  locked: boolean;
  meter: Meter;
  selected: string | null;
}) {
  const card = state.statements.find((item) => item.id === selected);
  const [fix, setFix] = useState({ who: "", need: "", obstacle: "", harm: "", insight: "" });
  const fixId = card?.id ?? "";
  const fixWho = card?.who ?? "";
  const fixNeed = card?.need ?? "";
  const fixObstacle = card?.obstacle ?? "";
  const fixHarm = card?.harm ?? "";
  const fixInsight = card?.insight ?? "";
  useEffect(() => {
    if (!fixId) return;
    setFix({ who: fixWho, need: fixNeed, obstacle: fixObstacle, harm: fixHarm, insight: fixInsight });
  }, [fixId, fixWho, fixNeed, fixObstacle, fixHarm, fixInsight]);
  return (
    <>
      {role === "devil" && card && FLAGS.map((tag) => (
        <MoveButton key={tag} role={role} outline disabled={locked} onClick={() => act(card.tags.includes(tag) ? { type: "untag", id: card.id, tag } : { type: "tag", id: card.id, tag })}>
          {card.tags.includes(tag) ? "Clear" : "Tag"} {FLAG_LABELS[tag]}
        </MoveButton>
      ))}
      {role === "insight" && card && (
        <>
          <Blank label="Proposed who" value={fix.who} onChange={(value) => setFix({ ...fix, who: value })} />
          <Blank label="Proposed need" value={fix.need} onChange={(value) => setFix({ ...fix, need: value })} />
          <Blank label="Proposed obstacle" value={fix.obstacle} onChange={(value) => setFix({ ...fix, obstacle: value })} />
          <Blank label="Proposed harm" value={fix.harm} onChange={(value) => setFix({ ...fix, harm: value })} />
          <Blank label="Proposed insight" value={fix.insight} onChange={(value) => setFix({ ...fix, insight: value })} />
          <MoveButton role={role} disabled={locked} onClick={() => act({ type: "propose-fix", id: card.id, ...fix })}>Propose fix</MoveButton>
          <MoveButton role={role} outline disabled={locked} onClick={() => act({ type: "none-needed" })}>None needed</MoveButton>
        </>
      )}
      {card?.authorId === youId && card.proposal && (
        <MoveButton role={role} disabled={locked} onClick={() => act({ type: "accept-fix", id: card.id })}>Accept fix</MoveButton>
      )}
      {state.packVoteOpen && state.statements.filter((item) => item.submitted && !item.masked).map((item) => (
        <MoveButton key={item.id} role={role} outline disabled={locked} onClick={() => act({ type: "vote-statement", id: item.id })}>
          Vote: {item.need || item.who || "this statement"}
        </MoveButton>
      ))}
    </>
  );
}

function PackActions({ state, role }: { state: RoomState; role: RoleId | null }) {
  const [note, setNote] = useState("");
  return (
    <>
      <p>{SCREENS.s7.move[role ?? "leader"]}</p>
      <MoveButton
        role={role}
        disabled={false}
        onClick={async () => {
          const { packDocument } = await import("@/lib/game");
          const text = packDocument(state);
          const blob = new Blob([text], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${state.teamName}-c60-pack.txt`;
          link.click();
          URL.revokeObjectURL(url);
          setNote("Download started on this device.");
        }}
      >
        Download pack
      </MoveButton>
      <MoveButton
        role={role}
        outline
        onClick={async () => {
          const { packDocument } = await import("@/lib/game");
          await navigator.clipboard.writeText(packDocument(state));
          setNote("Pack text copied. Paste it to the teacher or the next activity.");
        }}
      >
        Copy pack text
      </MoveButton>
      {note && <p className="text-sm">{note}</p>}
      <p className="text-sm">Suggested next: interviews (C18) or statement polish (C28).</p>
    </>
  );
}
