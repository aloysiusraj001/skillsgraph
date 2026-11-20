"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  GitBranch,
  HelpCircle,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  PackageCheck,
  Pencil,
  Pin as PinIcon,
  Sparkles,
  Target,
  Users,
  Vote,
  X,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";
import { RolePortrait } from "@/components/role-token";
import {
  Fish,
  Incidents,
  Orbit,
  Pack,
  Pile,
  PowerMap,
  SilentPile,
  Statements,
} from "@/components/room/board";
import { StudentFilms } from "@/components/room/film-panel";
import { InterviewPanel } from "@/components/room/interview-panel";
import { Button } from "@/components/ui/button";
import { SCREENS, STEP_PURPOSE } from "@/lib/copy";
import {
  ROLES,
  formatMs,
  type Action,
  type RoleId,
  type RoomState,
  type StageId,
} from "@/lib/domain";
import { editBanner } from "@/lib/editing";
import { lockedIncident, roots } from "@/lib/game";
import { cn } from "cn";

function initialsFor(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type StopDef = {
  id: StageId;
  label: string;
  phaseIndex: number;
  icon: LucideIcon;
  color: string;
  tint: string;
  lip: string;
  x: number;
  y: number;
  shelfBelow: boolean;
};

type PhaseDef = {
  label: string;
  hint: string;
  color: string;
  stages: StageId[];
};

const PHASES: PhaseDef[] = [
  { label: "Explore", hint: "Meet the team", color: "#2F62E0", stages: ["s0"] },
  { label: "Gather", hint: "Stakeholders", color: "#0E948C", stages: ["s1", "s1b"] },
  {
    label: "Make sense",
    hint: "Power & root cause",
    color: "#7A45D6",
    stages: ["s2", "s3", "s4a", "s4b", "s4c", "s4d"],
  },
  { label: "Define", hint: "Problem statements", color: "#E0941A", stages: ["s5"] },
  { label: "Decide & act", hint: "Top 3 & Pack", color: "#E25B4A", stages: ["s6", "s7"] },
];

const STOP_BASE: Array<{
  id: StageId;
  label: string;
  phaseIndex: number;
  icon: LucideIcon;
  color: string;
  tint: string;
  lip: string;
}> = [
  { id: "s0", label: "Start", phaseIndex: 0, icon: Compass, color: "#2F62E0", tint: "#E8EEFC", lip: "#B5C8FA" },
  { id: "s1", label: "People", phaseIndex: 1, icon: Users, color: "#0E948C", tint: "#E3F4EE", lip: "#9FDCD0" },
  { id: "s1b", label: "Merge", phaseIndex: 1, icon: Layers, color: "#0E948C", tint: "#E3F4EE", lip: "#9FDCD0" },
  { id: "s2", label: "Power", phaseIndex: 2, icon: LayoutGrid, color: "#E0941A", tint: "#FDF3DC", lip: "#F2CF88" },
  { id: "s3", label: "Incident", phaseIndex: 2, icon: AlertTriangle, color: "#1E2A44", tint: "#EAEEF5", lip: "#BFC9DB" },
  { id: "s4a", label: "Causes", phaseIndex: 2, icon: GitBranch, color: "#7A45D6", tint: "#F3EEFE", lip: "#D2BEF9" },
  { id: "s4b", label: "Choose", phaseIndex: 2, icon: Target, color: "#7A45D6", tint: "#F3EEFE", lip: "#D2BEF9" },
  { id: "s4c", label: "Why", phaseIndex: 2, icon: HelpCircle, color: "#7A45D6", tint: "#F3EEFE", lip: "#D2BEF9" },
  { id: "s4d", label: "Pin", phaseIndex: 2, icon: PinIcon, color: "#7A45D6", tint: "#F3EEFE", lip: "#D2BEF9" },
  { id: "s5", label: "Statement", phaseIndex: 3, icon: Pencil, color: "#E0941A", tint: "#FDF3DC", lip: "#F2CF88" },
  { id: "s6", label: "Choose 3", phaseIndex: 4, icon: Vote, color: "#E25B4A", tint: "#FDECEB", lip: "#F5B8B0" },
  { id: "s7", label: "Pack", phaseIndex: 4, icon: PackageCheck, color: "#0E948C", tint: "#E3F4EE", lip: "#9FDCD0" },
];

const FIRST_STOP_X = 320;
const STOP_GAP_X = 320;
const SVG_OFFSET = 2000;

const STOPS: StopDef[] = STOP_BASE.map((item, idx) => {
  const y = Math.round(Math.sin(idx * 0.72) * 110);
  return {
    ...item,
    x: FIRST_STOP_X + idx * STOP_GAP_X,
    y,
    shelfBelow: y < -20 || (Math.abs(y) <= 20 && idx % 2 === 1),
  };
});

type Point = { x: number; y: number };

function buildSplineSegments(points: Point[]) {
  const segments: Array<{
    p0: Point;
    c1: Point;
    c2: Point;
    p1: Point;
    length: number;
  }> = [];

  for (let i = 0; i < points.length - 1; i++) {
    const prev = points[Math.max(0, i - 1)];
    const p0 = points[i];
    const p1 = points[i + 1];
    const next = points[Math.min(points.length - 1, i + 2)];
    const c1 = { x: p0.x + (p1.x - prev.x) / 6, y: p0.y + (p1.y - prev.y) / 6 };
    const c2 = { x: p1.x - (next.x - p0.x) / 6, y: p1.y - (next.y - p0.y) / 6 };

    // 16-step chord length approximation for smooth pathLength progress
    let length = 0;
    let lx = p0.x;
    let ly = p0.y;
    for (let step = 1; step <= 16; step++) {
      const t = step / 16;
      const mt = 1 - t;
      const x =
        mt * mt * mt * p0.x +
        3 * mt * mt * t * c1.x +
        3 * mt * t * t * c2.x +
        t * t * t * p1.x;
      const y =
        mt * mt * mt * p0.y +
        3 * mt * mt * t * c1.y +
        3 * mt * t * t * c2.y +
        t * t * t * p1.y;
      length += Math.hypot(x - lx, y - ly);
      lx = x;
      ly = y;
    }
    segments.push({ p0, c1, c2, p1, length });
  }
  return segments;
}

const ROAD_POINTS: Point[] = [{ x: 96, y: 0 }, ...STOPS.map((s) => ({ x: s.x, y: s.y }))];
const ROAD_SEGMENTS = buildSplineSegments(ROAD_POINTS);
const TOTAL_ROAD_LENGTH = ROAD_SEGMENTS.reduce((sum, seg) => sum + seg.length, 0);
const FULL_ROAD_PATH = ROAD_SEGMENTS.reduce((acc, seg, idx) => {
  const start = idx === 0 ? `M ${seg.p0.x + SVG_OFFSET} ${seg.p0.y + SVG_OFFSET}` : "";
  return `${acc}${start} C ${seg.c1.x + SVG_OFFSET} ${seg.c1.y + SVG_OFFSET}, ${seg.c2.x + SVG_OFFSET} ${seg.c2.y + SVG_OFFSET}, ${seg.p1.x + SVG_OFFSET} ${seg.p1.y + SVG_OFFSET}`;
}, "");

function progressFractionForStop(stopIndex: number): number {
  const segCount = Math.min(ROAD_SEGMENTS.length, stopIndex + 1);
  let covered = 0;
  for (let i = 0; i < segCount; i++) {
    covered += ROAD_SEGMENTS[i].length;
  }
  return TOTAL_ROAD_LENGTH > 0 ? Math.min(1, covered / TOTAL_ROAD_LENGTH) : 0;
}

export function WindingCanvas({
  code,
  version,
  state,
  youId,
  role,
  selected,
  onSelect,
  act,
  readOnly,
  now,
  sidebar,
}: {
  code: string;
  version: number;
  state: RoomState;
  youId: string;
  role: RoleId | null;
  selected: string | null;
  onSelect: (id: string | null) => void;
  act: (action: Action) => void;
  readOnly: boolean;
  now: number;
  sidebar?: ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [vpSize, setVpSize] = useState({ width: 1000, height: 680 });
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<"canvas" | "move">("canvas");

  // Camera transform in world space
  const [cam, setCam] = useState({ x: 180, y: 320, k: 0.92, animate: false });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    camX: number;
    camY: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Which stop station card is currently open (null = pure overview road exploration)
  const [openStage, setOpenStage] = useState<StageId | null>(state.stage);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStopIndex = Math.max(
    0,
    STOPS.findIndex((s) => s.id === state.stage),
  );
  const currentStop = STOPS[currentStopIndex] ?? STOPS[0];

  const showToast = useCallback((message: string) => {
    setToastMsg(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Measure canvas viewport cleanly
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setVpSize({ width: rect.width, height: rect.height });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const flyToPoint = useCallback(
    (wx: number, wy: number, targetK: number, dyOffset = 0, animate = true) => {
      setCam({
        x: vpSize.width / 2 - wx * targetK,
        y: vpSize.height / 2 - wy * targetK + dyOffset,
        k: targetK,
        animate: animate && !prefersReducedMotion,
      });
    },
    [prefersReducedMotion, vpSize.height, vpSize.width],
  );

  const fitAllRoad = useCallback(
    (animate = true) => {
      const minX = -150;
      const maxX = STOPS[STOPS.length - 1].x + 190;
      const minY = -280;
      const maxY = 280;
      const k = Math.max(
        0.24,
        Math.min(0.95, (vpSize.width - 72) / (maxX - minX), (vpSize.height - 140) / (maxY - minY)),
      );
      setCam({
        x: vpSize.width / 2 - ((minX + maxX) / 2) * k,
        y: vpSize.height / 2 - ((minY + maxY) / 2) * k,
        k,
        animate: animate && !prefersReducedMotion,
      });
    },
    [prefersReducedMotion, vpSize.height, vpSize.width],
  );

  // Smoothly glide camera & open the newly active stop whenever state.stage changes
  useEffect(() => {
    const stop = STOPS.find((s) => s.id === state.stage) ?? STOPS[0];
    setOpenStage(stop.id);
    const targetK = vpSize.width < 640 ? 0.72 : 0.92;
    flyToPoint(stop.x, stop.y, targetK, -40, true);
  }, [state.stage, flyToPoint, vpSize.width]);

  // Escape key closes open station back onto the road overview
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && openStage) {
        setOpenStage(null);
        fitAllRoad(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openStage, fitAllRoad]);

  function zoomAt(factor: number, px: number, py: number, animate: boolean) {
    setCam((prev) => {
      const nextK = Math.min(1.65, Math.max(0.24, prev.k * factor));
      const ratio = nextK / prev.k;
      return {
        x: px - (px - prev.x) * ratio,
        y: py - (py - prev.y) * ratio,
        k: nextK,
        animate: animate && !prefersReducedMotion,
      };
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, input, textarea, select, [data-no-pan='true']")) return;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      camX: cam.x,
      camY: cam.y,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    setCam((prev) => ({
      ...prev,
      x: drag.camX + dx,
      y: drag.camY + dy,
      animate: false,
    }));
  }

  function handlePointerUp() {
    dragRef.current = null;
    setDragging(false);
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-no-pan='true']")) return;
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const factor = Math.exp(-event.deltaY * 0.0014);
    zoomAt(factor, event.clientX - rect.left, event.clientY - rect.top, false);
  }

  function handleStopClick(stop: StopDef, index: number) {
    if (index > currentStopIndex) {
      const prevStop = STOPS[Math.max(0, index - 1)];
      showToast(`${stop.label} opens after ${prevStop.label} when the teacher advances.`);
      return;
    }
    setOpenStage(stop.id);
    flyToPoint(stop.x, stop.y, vpSize.width < 640 ? 0.72 : 0.92, -40, true);
  }

  function jumpToPhase(phaseIndex: number) {
    const firstStageId = PHASES[phaseIndex]?.stages[0];
    const stopIdx = STOPS.findIndex((s) => s.id === firstStageId);
    if (stopIdx < 0) return;
    const stop = STOPS[stopIdx];
    flyToPoint(stop.x, stop.y, 0.85, 0, true);
    if (stopIdx <= currentStopIndex) {
      setOpenStage(stop.id);
    } else {
      setOpenStage(null);
    }
  }

  const roadProgress = progressFractionForStop(currentStopIndex);
  const farView = cam.k < 0.72;

  // Carry-forward thread visibility based on real room data + progress
  const whoseCard = useMemo(
    () => roots(state).find((c) => c.id === state.summary.whoseId) ?? null,
    [state],
  );
  const headIncident = useMemo(
    () => lockedIncident(state) ?? state.incidents[0] ?? null,
    [state],
  );
  const carryThreads = useMemo(
    () => [
      {
        id: "who",
        from: STOPS[3], // s2 Power
        to: STOPS[4], // s3 Incident
        label: whoseCard ? `Following ${whoseCard.label}` : "Who we follow",
        color: "#0E948C",
        curveOffset: -195,
        active: currentStopIndex >= 4 || Boolean(whoseCard),
      },
      {
        id: "harm",
        from: STOPS[4], // s3 Incident
        to: STOPS[5], // s4a Causes
        label: "Fish head harm",
        color: "#1E2A44",
        curveOffset: 190,
        active: currentStopIndex >= 5 || Boolean(headIncident),
      },
      {
        id: "pin",
        from: STOPS[8], // s4d Pin
        to: STOPS[9], // s5 Statement
        label: "Obstacle & Insight",
        color: "#7A45D6",
        curveOffset: -200,
        active: currentStopIndex >= 9 || state.pins.some((p) => p.placed),
      },
      {
        id: "top3",
        from: STOPS[9], // s5 Statement
        to: STOPS[11], // s7 Pack
        label: "Top 3 statements",
        color: "#E25B4A",
        curveOffset: 200,
        active: currentStopIndex >= 11 || state.top3.length > 0,
      },
    ],
    [currentStopIndex, headIncident, state.pins, state.top3.length, whoseCard],
  );

  // Claimed students for the hopping team token cluster
  const teamTokens = useMemo(() => {
    const claimed = state.participants.filter((p) => p.kind === "student" && p.claimed && p.role);
    // Put current student last so they appear on top/front of the overlap
    return [...claimed].sort((a, b) => (a.id === youId ? 1 : b.id === youId ? -1 : 0));
  }, [state.participants, youId]);

  const openStopMeta = openStage ? STOPS.find((s) => s.id === openStage) ?? null : null;
  const openStopIndex = openStopMeta ? STOPS.findIndex((s) => s.id === openStopMeta.id) : -1;
  const inspectingPast = Boolean(openStopMeta && openStopMeta.id !== state.stage);

  const openStageScreen = openStopMeta ? SCREENS[openStopMeta.id] : null;
  const openStagePurpose = openStopMeta ? STEP_PURPOSE[openStopMeta.id] : undefined;

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] flex-col lg:h-[calc(100vh-64px)] lg:flex-row lg:overflow-hidden">
      {/* Mobile switcher between Canvas & Your move */}
      {sidebar && (
        <div className="flex items-center gap-2 border-b border-[#e4dcd0] bg-[#faf8f4] px-4 py-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileTab("canvas")}
            className={cn(
              "h-10 flex-1 rounded-xl text-sm font-semibold transition-colors",
              mobileTab === "canvas" ? "bg-[#1e2a44] text-white" : "bg-white text-[#3c4654] border border-[#e4dcd0]",
            )}
          >
            Road canvas
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("move")}
            className={cn(
              "h-10 flex-1 rounded-xl text-sm font-semibold transition-colors",
              mobileTab === "move" ? "bg-[#1e2a44] text-white" : "bg-white text-[#3c4654] border border-[#e4dcd0]",
            )}
          >
            Your move
          </button>
        </div>
      )}

      {/* Infinite Canvas Viewport */}
      <div
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className={cn(
          "relative flex-1 overflow-hidden select-none touch-none",
          mobileTab === "move" ? "hidden lg:block" : "min-h-[620px] flex-1",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{
          background:
            "radial-gradient(circle at 1px 1px, #d6cdbe 1.25px, transparent 1.75px) 0 0 / 26px 26px, #f5f1e8",
        }}
      >
        {/* Top Floating Phase Wayfinder Bar */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-wrap items-center justify-between gap-2">
          <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-2xl border border-[#e4dcd0] bg-white/95 p-1 shadow-[0_10px_24px_-16px_rgba(28,36,48,0.3)] backdrop-blur">
            {PHASES.map((phase, idx) => {
              const done = idx < currentStop.phaseIndex;
              const active = idx === currentStop.phaseIndex;
              return (
                <button
                  key={phase.label}
                  type="button"
                  onClick={() => jumpToPhase(idx)}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-colors whitespace-nowrap",
                    active
                      ? "bg-[#1e2a44] text-white"
                      : done
                        ? "bg-[#eefaf8] text-[#0c6b65] hover:bg-[#dff4f0]"
                        : "text-[#5c6570] hover:bg-[#faf8f4]",
                  )}
                >
                  {done && <Check className="size-3.5 text-[#0E948C]" aria-hidden />}
                  <span>{phase.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            {openStage ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-xl border-[#d4ccc0] bg-white/95 font-semibold text-[#1e2a44] shadow-sm"
                onClick={() => {
                  setOpenStage(null);
                  fitAllRoad(true);
                }}
              >
                <MapIcon className="size-4 text-[#0E948C]" aria-hidden />
                Explore full road
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="h-9 gap-1.5 rounded-xl bg-[#0E948C] font-semibold text-white shadow-sm hover:bg-[#0b7a73]"
                onClick={() => {
                  setOpenStage(state.stage);
                  flyToPoint(currentStop.x, currentStop.y, vpSize.width < 640 ? 0.72 : 0.92, -40, true);
                }}
              >
                <Sparkles className="size-4" aria-hidden />
                Open {currentStop.label}
              </Button>
            )}
          </div>
        </div>

        {/* World Transform Layer */}
        <div
          className={cn(
            "absolute left-0 top-0 origin-top-left will-change-transform",
            cam.animate && "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          )}
          style={{
            transform: `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.k})`,
          }}
        >
          {/* SVG Winding Road + Progress Fill + Carry-Forward Threads */}
          <svg
            className="pointer-events-none absolute overflow-visible"
            style={{ left: -SVG_OFFSET, top: -SVG_OFFSET, width: 8000, height: 4000 }}
            aria-hidden
          >
            {/* Base road */}
            <path
              d={FULL_ROAD_PATH}
              fill="none"
              stroke="#e3dbd0"
              strokeWidth={28}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Animated teal completed progress road */}
            <motion.path
              d={FULL_ROAD_PATH}
              fill="none"
              stroke="#7ACDB4"
              strokeWidth={28}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: roadProgress }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Highway dashed center line */}
            <motion.path
              d={FULL_ROAD_PATH}
              fill="none"
              stroke="#ffffff"
              strokeWidth={3}
              strokeDasharray="10 16"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />

            {/* Carry-forward data threads connecting artifacts across stages */}
            {carryThreads.map((thread) => {
              const x1 = thread.from.x + SVG_OFFSET;
              const y1 = thread.from.y + SVG_OFFSET;
              const x2 = thread.to.x + SVG_OFFSET;
              const y2 = thread.to.y + SVG_OFFSET;
              const cx = (x1 + x2) / 2;
              const cy = (y1 + y2) / 2 + thread.curveOffset;
              const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
              return (
                <g key={thread.id} opacity={thread.active ? 0.9 : 0.25}>
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={thread.color}
                    strokeWidth={2.5}
                    strokeDasharray="6 7"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: thread.active ? 1 : 0.15 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Carry-forward thread labels */}
          {!farView &&
            carryThreads.map((thread) => {
              const mx = (thread.from.x + thread.to.x) / 2;
              const my = (thread.from.y + thread.to.y) / 2 + thread.curveOffset * 0.52;
              return (
                <div
                  key={`lbl-${thread.id}`}
                  className={cn(
                    "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold shadow-sm transition-opacity",
                    thread.active ? "opacity-100" : "opacity-45",
                  )}
                  style={{ left: mx, top: my, borderColor: thread.color, color: thread.color }}
                >
                  {thread.label}
                </div>
              );
            })}

          {/* Origin Problem Hub Medallion */}
          <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
            <div className="relative flex size-[164px] flex-col items-center justify-center rounded-full border-2 border-[#d9c8f5] bg-white p-4 text-center shadow-[0_14px_30px_-18px_rgba(28,36,48,0.3)]">
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -inset-3 rounded-full border border-dashed border-[#c9b8ea]"
                animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7A45D6]">
                Problem hub
              </span>
              <span className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-[#1e2a44]">
                {state.theme}
              </span>
              <span className="mt-0.5 truncate text-xs text-[#5c6570]">{state.teamName}</span>
            </div>
          </div>

          {/* 5 Phase Milestone Waymarkers */}
          {PHASES.map((phase, pIdx) => {
            const phaseStops = STOPS.filter((s) => s.phaseIndex === pIdx);
            const first = phaseStops[0];
            const last = phaseStops[phaseStops.length - 1];
            if (!first || !last) return null;
            const cx = (first.x + last.x) / 2;
            const doneCount = phase.stages.filter(
              (sid) => STOPS.findIndex((s) => s.id === sid) < currentStopIndex,
            ).length;
            const pct = Math.round((doneCount / phase.stages.length) * 100);
            const isActivePhase = pIdx === currentStop.phaseIndex;

            return (
              <button
                key={phase.label}
                type="button"
                onClick={() => jumpToPhase(pIdx)}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 rounded-full border bg-white px-3.5 py-1.5 text-left shadow-[0_10px_24px_-16px_rgba(28,36,48,0.28)] transition-transform hover:-translate-y-[54%]",
                  isActivePhase ? "border-[#0E948C] ring-2 ring-[#0E948C]/20" : "border-[#e4dcd0]",
                )}
                style={{ left: cx, top: -220 }}
              >
                <span
                  className="grid size-6 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(#0E948C ${pct}%, #e4dcd0 0)`,
                  }}
                >
                  <span className="size-3.5 rounded-full bg-white" />
                </span>
                <span className="whitespace-nowrap">
                  <span className="block text-xs font-bold text-[#1e2a44]">{phase.label}</span>
                  <span className="block text-[11px] text-[#5c6570]">{phase.hint}</span>
                </span>
              </button>
            );
          })}

          {/* 12 Tactile Stop Tiles + Floating Artifact Shelves */}
          {STOPS.map((stop, idx) => {
            const Icon = stop.icon;
            const status =
              idx < currentStopIndex ? "done" : idx === currentStopIndex ? "current" : "locked";
            const isSelected = openStage === stop.id;

            return (
              <div
                key={stop.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: stop.x, top: stop.y }}
              >
                {/* Live Mini Artifact Shelf connected above or below the stop */}
                {!farView && (
                  <div
                    className={cn(
                      "pointer-events-none absolute left-1/2 -translate-x-1/2 w-[216px] rounded-2xl border bg-white/95 p-2.5 shadow-[0_12px_26px_-18px_rgba(28,36,48,0.35)] transition-opacity",
                      status === "locked" ? "border-[#e4dcd0] opacity-55" : "border-[#d8cfc0] opacity-100",
                      stop.shelfBelow ? "top-[106px]" : "bottom-[104px]",
                    )}
                  >
                    {/* Hairline stem linking shelf to stop */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-1/2 h-4 w-[2px] -translate-x-1/2 bg-[#cfc6b8]",
                        stop.shelfBelow ? "-top-4" : "-bottom-4",
                      )}
                    />
                    <StopArtifactPreview stopId={stop.id} state={state} />
                  </div>
                )}

                {/* Tactile Wayfinder Tile */}
                <motion.button
                  type="button"
                  onClick={() => handleStopClick(stop, idx)}
                  whileHover={status === "locked" ? undefined : { y: -3, scale: 1.03 }}
                  whileTap={status === "locked" ? undefined : { scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                  aria-label={`${stop.label} (${status})`}
                  className={cn(
                    "relative mx-auto flex size-[82px] items-center justify-center rounded-[24px] transition-shadow focus-visible:outline-2 focus-visible:outline-[#1e2a44]",
                    status === "locked"
                      ? "bg-[#eef2f0] text-[#9ea8a4] shadow-[0_6px_0_0_#d5deda]"
                      : "bg-white",
                    status === "current" &&
                      "ring-4 ring-[#0E948C] ring-offset-4 ring-offset-[#f5f1e8]",
                    isSelected && status !== "current" && "ring-4 ring-[#1e2a44] ring-offset-4 ring-offset-[#f5f1e8]",
                  )}
                  style={
                    status === "locked"
                      ? undefined
                      : {
                          boxShadow: `0 7px 0 0 ${stop.lip}, 0 18px 26px -14px rgba(28, 36, 48, 0.3)`,
                          color: stop.color,
                        }
                  }
                >
                  <span
                    className="flex size-12 items-center justify-center rounded-2xl"
                    style={{ background: status === "locked" ? "transparent" : stop.tint }}
                  >
                    <Icon className="size-6" aria-hidden />
                  </span>

                  {status === "done" && (
                    <span className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full border-2 border-[#f5f1e8] bg-[#0E948C] text-white shadow-sm">
                      <Check className="size-3.5 stroke-[3]" aria-hidden />
                    </span>
                  )}
                </motion.button>

                {/* Stop Label Pill */}
                <div
                  className={cn(
                    "mt-2.5 text-center transition-transform",
                    farView && "scale-125",
                  )}
                >
                  <span className="inline-block whitespace-nowrap rounded-full border border-[#e4dcd0] bg-white px-3 py-0.5 text-xs font-bold text-[#1e2a44] shadow-sm">
                    {idx + 1}. {stop.label}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Hopping Student Team Token Cluster */}
          {teamTokens.length > 0 && (
            <motion.div
              className="pointer-events-none absolute z-10 -translate-x-1/2"
              initial={false}
              animate={{
                left: currentStop.x,
                top: currentStop.y - 60,
              }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : 0.75,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <motion.div
                key={state.stage}
                initial={prefersReducedMotion ? false : { y: 0, scale: 1 }}
                animate={prefersReducedMotion ? { y: 0, scale: 1 } : { y: [0, -24, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                <div className="flex items-center -space-x-2 rounded-full border-2 border-white bg-white/95 p-1 shadow-[0_12px_22px_-10px_rgba(14,148,140,0.55)]">
                  {teamTokens.map((member) =>
                    member.role ? (
                      <div key={member.id} className={member.id === youId ? "z-10 scale-110" : "opacity-90"}>
                        <RolePortrait
                          role={member.role}
                          size={member.id === youId ? 34 : 28}
                          initials={initialsFor(member.name)}
                          title={`${member.name} · ${ROLES[member.role].name}`}
                        />
                      </div>
                    ) : null,
                  )}
                </div>
                <div className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-white" />
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Focused Interactive Station Pop-Out Card */}
        <AnimatePresence>
          {openStopMeta && openStageScreen && (
            <motion.div
              key={openStopMeta.id}
              data-no-pan="true"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-3 bottom-14 top-16 z-30 mx-auto flex max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#d8cfc0] bg-white shadow-[0_30px_70px_-30px_rgba(24,49,63,0.45)]"
            >
              {/* Station Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ece4d8] bg-[#faf8f4] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: openStopMeta.tint, color: openStopMeta.color }}
                  >
                    <openStopMeta.icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#5c6570] tabular-nums">
                      <span>
                        Step {openStopIndex + 1} of {STOPS.length}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{PHASES[openStopMeta.phaseIndex]?.label}</span>
                      {inspectingPast && (
                        <>
                          <span aria-hidden>·</span>
                          <span className="text-[#8A5A08]">Reviewing earlier step</span>
                        </>
                      )}
                    </div>
                    <h2 className="truncate text-lg font-bold text-[#1e2a44]">
                      {openStageScreen.title}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {inspectingPast && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 rounded-xl bg-[#0E948C] text-white hover:bg-[#0b7a73]"
                      onClick={() => {
                        setOpenStage(state.stage);
                        flyToPoint(currentStop.x, currentStop.y, vpSize.width < 640 ? 0.72 : 0.92, -40, true);
                      }}
                    >
                      Back to {currentStop.label}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 rounded-xl bg-white"
                    onClick={() => {
                      setOpenStage(null);
                      fitAllRoad(true);
                    }}
                    aria-label="Minimize station to explore the road"
                  >
                    <Minimize2 className="size-3.5" aria-hidden />
                    <span className="hidden sm:inline">Road view</span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenStage(null);
                      fitAllRoad(true);
                    }}
                    aria-label="Close station"
                    className="grid size-9 place-items-center rounded-xl text-[#5c6570] hover:bg-[#ece4d8]"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Interactive Station Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid gap-3">
                  {openStagePurpose && (
                    <p className="rounded-2xl border border-[#ece4d8] bg-[#faf8f4] px-3.5 py-2.5 text-sm leading-relaxed text-[#1c2430]">
                      {openStagePurpose}
                    </p>
                  )}
                  <div className="text-sm">
                    <p className="font-semibold text-[#1e2a44]">
                      {editBanner(state, role).you}
                    </p>
                    <p className="text-[#4a5564]">{editBanner(state, role).board}</p>
                  </div>

                  {!readOnly && openStopMeta.id === state.stage && <StudentFilms state={state} />}

                  {openStopMeta.id === "s3" && (
                    <InterviewPanel
                      code={code}
                      version={version}
                      state={state}
                      youId={youId}
                      canAsk={!inspectingPast && !readOnly && role === "interviewer"}
                    />
                  )}

                  {openStopMeta.id === "s0" && <Orbit state={state} youId={youId} />}
                  {openStopMeta.id === "s1" && (
                    <SilentPile state={state} selected={selected} onSelect={onSelect} />
                  )}
                  {openStopMeta.id === "s1b" && (
                    <Pile
                      state={state}
                      selected={selected}
                      onSelect={onSelect}
                      act={act}
                      role={role}
                      readOnly={readOnly || inspectingPast}
                    />
                  )}
                  {openStopMeta.id === "s2" && (
                    <PowerMap
                      state={state}
                      selected={selected}
                      onSelect={onSelect}
                      act={act}
                      role={role}
                      readOnly={readOnly || inspectingPast}
                    />
                  )}
                  {openStopMeta.id === "s3" && (
                    <Incidents
                      state={state}
                      act={act}
                      role={role}
                      readOnly={readOnly || inspectingPast}
                    />
                  )}
                  {(openStopMeta.id === "s4a" ||
                    openStopMeta.id === "s4b" ||
                    openStopMeta.id === "s4c" ||
                    openStopMeta.id === "s4d") && (
                    <Fish
                      state={state}
                      selected={selected}
                      onSelect={onSelect}
                      act={act}
                      role={role}
                      readOnly={readOnly || inspectingPast}
                      stageOverride={openStopMeta.id}
                    />
                  )}
                  {(openStopMeta.id === "s5" || openStopMeta.id === "s6") && (
                    <Statements state={state} selected={selected} onSelect={onSelect} />
                  )}
                  {openStopMeta.id === "s7" && <Pack state={state} />}
                </div>
              </div>

              {/* Station Footer Timer */}
              <div className="flex items-center justify-between border-t border-[#ece4d8] bg-[#faf8f4] px-4 py-2 text-xs text-[#5c6570] tabular-nums">
                <span>
                  {state.timer.running && state.timer.endsAt
                    ? `Timer ${formatMs(state.timer.endsAt - now)}`
                    : state.timer.expired
                      ? "Timer ended"
                      : "Timer is waiting for the teacher"}
                </span>
                <span>Press Esc to zoom out to the road</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Canvas Controls: Pan Hint + Zoom Controls */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-2">
          <div className="pointer-events-auto hidden items-center gap-3 rounded-xl border border-[#e4dcd0] bg-white/95 px-3 py-1.5 text-xs text-[#5c6570] shadow-sm sm:flex">
            <span>Drag canvas to pan</span>
            <span aria-hidden>·</span>
            <span>Scroll to zoom</span>
            <span aria-hidden>·</span>
            <span>Tap any unlocked stop</span>
          </div>

          <div className="pointer-events-auto ml-auto flex items-center gap-1 rounded-2xl border border-[#e4dcd0] bg-white/95 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => zoomAt(0.82, vpSize.width / 2, vpSize.height / 2, true)}
              aria-label="Zoom out"
              className="grid size-8 place-items-center rounded-xl text-[#3c4654] hover:bg-[#faf8f4]"
            >
              <ZoomOut className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenStage(null);
                fitAllRoad(true);
              }}
              aria-label="Fit entire road"
              className="flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-semibold text-[#1e2a44] hover:bg-[#faf8f4]"
            >
              <Maximize2 className="size-3.5" aria-hidden />
              Fit road
            </button>
            <button
              type="button"
              onClick={() => zoomAt(1.22, vpSize.width / 2, vpSize.height / 2, true)}
              aria-label="Zoom in"
              className="grid size-8 place-items-center rounded-xl text-[#3c4654] hover:bg-[#faf8f4]"
            >
              <ZoomIn className="size-4" />
            </button>
          </div>
        </div>

        {/* Toast feedback for locked future stops */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              role="status"
              className="pointer-events-none absolute left-1/2 top-16 z-40 -translate-x-1/2 rounded-xl bg-[#1e2a44] px-3.5 py-2 text-xs font-medium text-white shadow-lg"
            >
              {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapsible Docked "Your move" Edge Drawer */}
      {sidebar && (
        <>
          {/* Desktop edge toggle handle */}
          <div className="relative hidden lg:flex">
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label={drawerOpen ? "Collapse Your move panel" : "Expand Your move panel"}
              aria-expanded={drawerOpen}
              className="absolute -left-7 top-1/2 z-30 flex h-16 w-7 -translate-y-1/2 items-center justify-center rounded-l-2xl border border-r-0 border-[#d8cfc0] bg-[#1e2a44] text-white shadow-md transition-colors hover:bg-[#2a3b5e]"
            >
              {drawerOpen ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>

            <aside
              className={cn(
                "h-full overflow-y-auto border-l border-[#e4dcd0] bg-[#f8f5ee] transition-[width,padding] duration-200",
                drawerOpen ? "w-[360px] p-4" : "w-0 overflow-hidden border-l-0 p-0",
              )}
            >
              {drawerOpen && sidebar}
            </aside>
          </div>

          {/* Mobile Your move tab */}
          {mobileTab === "move" && (
            <div className="p-4 lg:hidden">{sidebar}</div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Live Mini Artifact Shelves on the Winding Road ---------- */

function StopArtifactPreview({ stopId, state }: { stopId: StageId; state: RoomState }) {
  const students = state.participants.filter((p) => p.kind === "student");
  const rootCards = roots(state);
  const head = lockedIncident(state) ?? state.incidents[0];
  const whose = rootCards.find((c) => c.id === state.summary.whoseId);

  if (stopId === "s0") {
    const readyCount = students.filter((s) => s.ready).length;
    return (
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#5c6570]">
          Team · {readyCount}/{students.length} ready
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          {students.map((s) =>
            s.role ? (
              <div key={s.id} className={s.claimed ? "opacity-100" : "opacity-35"}>
                <RolePortrait
                  role={s.role}
                  size={28}
                  initials={initialsFor(s.name)}
                  title={`${s.name} · ${ROLES[s.role].name}`}
                />
              </div>
            ) : null,
          )}
        </div>
      </div>
    );
  }

  if (stopId === "s1") {
    return (
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#0E948C]">
          Stakeholder pile · {state.stakeholders.length} cards
        </div>
        <div className="mt-1.5 grid grid-cols-5 gap-1">
          {students.map((s) => {
            const count = state.stakeholders.filter((c) => c.authorId === s.id).length;
            return (
              <div key={s.id} className="rounded bg-[#faf8f4] px-1 py-1 text-center text-[10px] font-semibold text-[#1e2a44] tabular-nums">
                {count}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (stopId === "s1b") {
    return (
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#0E948C]">
          Merged groups · {rootCards.length}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {rootCards.slice(0, 3).map((c) => (
            <span key={c.id} className="max-w-[92px] truncate rounded bg-[#eefaf8] px-1.5 py-0.5 text-[10px] font-medium text-[#0c6b65]">
              {c.masked ? "Hidden" : c.label}
            </span>
          ))}
          {rootCards.length === 0 && <span className="text-[11px] text-[#5c6570]">Waiting for cards</span>}
        </div>
      </div>
    );
  }

  if (stopId === "s2") {
    const qCounts = [
      rootCards.filter((c) => c.grid?.power === "high" && c.grid.interest === "low").length,
      rootCards.filter((c) => c.grid?.power === "high" && c.grid.interest === "high").length,
      rootCards.filter((c) => c.grid?.power === "low" && c.grid.interest === "low").length,
      rootCards.filter((c) => c.grid?.power === "low" && c.grid.interest === "high").length,
    ];
    return (
      <div>
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-[#8A5A08]">
          <span>Power 2×2</span>
          {whose && <span className="truncate max-w-[95px] normal-case text-[#0E948C]">{whose.label}</span>}
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1">
          {qCounts.map((count, i) => (
            <div key={i} className="flex h-6 items-center justify-between rounded bg-[#faf8f4] px-1.5 text-[10px] font-bold text-[#1e2a44] tabular-nums">
              <span className="text-[#838b95]">{["Sat", "Work", "Mon", "Inv"][i]}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stopId === "s3") {
    return (
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#1e2a44]">
          Fish head incident
        </div>
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[#1c2430]">
          {head ? head.text : "Waiting for a real fact..."}
        </p>
      </div>
    );
  }

  if (stopId === "s4a" || stopId === "s4b" || stopId === "s4c" || stopId === "s4d") {
    const causeCount = state.causes.length;
    const hopCount = state.hops.filter((h) => !h.proposed).length;
    const pinCount = state.pins.filter((p) => p.placed).length;
    const focusLabel = state.bones.find((b) => b.id === state.focusBone)?.label;
    return (
      <div>
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-[#7A45D6]">
          <span>
            {stopId === "s4a" && `${causeCount} causes`}
            {stopId === "s4b" && (focusLabel ? `Focus: ${focusLabel}` : "Pick 1 bone")}
            {stopId === "s4c" && `${hopCount} Why hops`}
            {stopId === "s4d" && `${pinCount} pins placed`}
          </span>
        </div>
        {/* Mini SVG Fishbone */}
        <svg viewBox="0 0 180 42" className="mt-1 h-9 w-full" aria-hidden>
          <path d="M18,21 L6,10 L11,21 L6,32 Z" fill="#1e2a44" />
          <line x1="18" y1="21" x2="146" y2="21" stroke="#1e2a44" strokeWidth="2.5" />
          <path d="M144,21 C152,9 168,9 175,21 C168,33 152,33 144,21 Z" fill="#1e2a44" />
          {[42, 78, 114].map((rx, i) => {
            const topBone = state.bones[i];
            const botBone = state.bones[i + 3];
            const topOn = Boolean(topBone && state.focusBone === topBone.id);
            const botOn = Boolean(botBone && state.focusBone === botBone.id);
            return (
              <g key={rx}>
                <line
                  x1={rx}
                  y1="21"
                  x2={rx - 14}
                  y2="6"
                  stroke={topOn ? "#0E948C" : "#9aa2ad"}
                  strokeWidth={topOn ? 2.5 : 1.6}
                />
                <line
                  x1={rx}
                  y1="21"
                  x2={rx - 14}
                  y2="36"
                  stroke={botOn ? "#0E948C" : "#9aa2ad"}
                  strokeWidth={botOn ? 2.5 : 1.6}
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  if (stopId === "s5" || stopId === "s6") {
    const submitted = state.statements.filter((s) => s.submitted).length;
    return (
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#8A5A08]">
          {stopId === "s5" ? `${submitted}/5 statements` : `${state.top3.length}/3 top picks`}
        </div>
        <div className="mt-1.5 flex gap-1">
          {students.map((s) => {
            const st = state.statements.find((item) => item.authorId === s.id);
            const picked = Boolean(st && state.top3.includes(st.id));
            return (
              <span
                key={s.id}
                className={cn(
                  "h-2.5 flex-1 rounded-full",
                  picked ? "bg-[#E25B4A]" : st?.submitted ? "bg-[#0E948C]" : "bg-[#e4dcd0]",
                )}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#0E948C]">
        C60 Export Pack
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#1e2a44]">
        <span>Map</span>
        <span aria-hidden>·</span>
        <span>Fishbone</span>
        <span aria-hidden>·</span>
        <span>Top 3</span>
      </div>
    </div>
  );
}
