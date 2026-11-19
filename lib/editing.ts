import { ROLES, type RoleId, type RoomState } from "@/lib/domain";

function holder(state: RoomState, role: RoleId) {
  const person = state.participants.find((seat) => seat.role === role && seat.kind === "student");
  return person ? `${person.name} (${ROLES[role].name})` : ROLES[role].name;
}

export function editBanner(state: RoomState, role: RoleId | null): { you: string; board: string } {
  const stage = state.stage;
  const you = role ? ROLES[role].name : "You";
  if (stage === "s0") {
    return { you: "Nothing to edit yet. Your teacher starts the activity.", board: "No one edits the board on this screen." };
  }
  if (stage === "s1") {
    return { you: "Add your own people cards. You cannot change anyone else's.", board: "Each person edits only their own cards." };
  }
  if (stage === "s1b") {
    return role === "mapper"
      ? { you: "You merge cards that mean the same person.", board: "Only you can change this pile." }
      : { you: "Nothing for you to edit.", board: `Only ${holder(state, "mapper")} changes this pile.` };
  }
  if (stage === "s2") {
    if (role === "mapper") return { you: "Drag each card into a quadrant. Then the Lead Interviewer chooses who we follow.", board: "Only you can move cards." };
    if (role === "interviewer") return { you: "Choose one person on the map. That is who the incident and the fish are about.", board: `Only ${holder(state, "mapper")} moves cards. You choose who we follow.` };
    return { you: "You are watching. You cannot move cards or choose who we follow.", board: `${holder(state, "mapper")} moves cards. ${holder(state, "interviewer")} chooses who we follow.` };
  }
  if (stage === "s3") {
    const who = state.stakeholders.find((card) => card.id === state.summary.whoseId)?.label;
    return role === "interviewer"
      ? { you: who ? `Write one fact that happened to ${who}.` : "Choose who we follow, then write one fact that happened to them.", board: "Only you add the incident. Others vote." }
      : { you: who ? `Vote for a fact about ${who}.` : "Wait until the person we follow is chosen.", board: `Only ${holder(state, "interviewer")} writes the incident.` };
  }
  if (stage === "s4a") {
    return role === "mapper"
      ? { you: "Pick a bone, write a cause, and it appears on the fish. You can also move a card to a better bone.", board: "Everyone adds onto a bone. Only you move a card after that." }
      : { you: "Pick a bone, write a cause, and it appears on the fish.", board: `Only ${holder(state, "mapper")} can move a card to a different bone.` };
  }
  if (stage === "s4b") {
    return { you: "Read the cause on each bone, then tap the one bone the team will follow.", board: "The five Whys start on the next screen, and only on that bone." };
  }
  if (stage === "s4c") {
    if (!state.focusBone) return { you: "Tap one bone on the fish. The five Whys will grow on that rib.", board: "The whole team follows the same bone." };
    if (role === "insight") return { you: "Add Whys, then mark the one that is the root cause. Stop at the third or fourth if that is the root.", board: "Only you add Whys and mark the root cause." };
    if (role === "interviewer") return { you: "On a Need-to-check Why, name who you would ask.", board: `Only ${holder(state, "insight")} adds Whys.` };
    return { you: "The team is following one bone. You can tap a different bone before the Whys begin.", board: `Only ${holder(state, "insight")} adds Whys.` };
  }
  if (stage === "s4d") {
    if (role === "insight") return { you: "Choose a cause. Obstacle is that cause. Insight is the Why you marked as the root cause.", board: "You write the labels. The Theme Mapper places the pin." };
    if (role === "mapper") return { you: "Place the pin after the labels are saved.", board: `${holder(state, "insight")} writes the labels. You place the pin.` };
    return { you: "Nothing for you to edit.", board: `${holder(state, "insight")} and ${holder(state, "mapper")} handle the pins.` };
  }
  if (stage === "s5") {
    return { you: "Edit Need so it says what they are trying to get done. The other blanks come from the person, the pinned cause, the incident, and the root Why.", board: "No one can edit your statement." };
  }
  if (stage === "s6") {
    if (role === "devil") return { you: "You flag weak statements.", board: "Only you add flags." };
    if (role === "insight") return { you: "You propose a fix. The author decides.", board: "You cannot change a statement until its author accepts." };
    if (role === "mapper") return { you: "You can mark the pile as tidy.", board: "You do not rewrite statements." };
    return { you: "Vote for the statements you want to keep.", board: "Only the author accepts a fix on their own card." };
  }
  return { you: `${you} can read the pack.`, board: "The pack is locked." };
}
