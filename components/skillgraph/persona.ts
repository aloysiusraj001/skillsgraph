"use client";

import type { RoleId } from "@/lib/domain";

export type DemoPersona =
  | { kind: "teacher"; name: string }
  | { kind: "student"; name: string; role: RoleId };

const KEY = "c60:skillgraph-persona";

export function readPersona(): DemoPersona | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DemoPersona;
    if (parsed.kind === "teacher" || parsed.kind === "student") return parsed;
    return null;
  } catch {
    return null;
  }
}

export function writePersona(persona: DemoPersona) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(persona));
}

export function clearPersona(roomCode?: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
  if (roomCode) {
    sessionStorage.removeItem(`c60:${roomCode}`);
  } else {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("c60:")) sessionStorage.removeItem(k);
    }
  }
}
