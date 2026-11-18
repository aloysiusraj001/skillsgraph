import type { RoomState } from "@/lib/domain";
import { meter, project, radar } from "@/lib/game";

export function presentRoom(state: RoomState, viewerId: string, version: number, now: number) {
  const you = state.participants.find((person) => person.id === viewerId);
  if (!you) return null;
  return {
    version,
    serverNow: now,
    you: { id: you.id, name: you.name, role: you.role, kind: you.kind },
    meter: meter(state),
    radar: you.kind === "teacher" ? radar(state, now) : null,
    state: project(state, viewerId),
  };
}
