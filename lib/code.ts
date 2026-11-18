/** Characters that stay distinct in Lexend and when read aloud. No B/8, G/6, O/0, I/1, S/5, Z/2. */
export const ROOM_CODE_ALPHABET = "ACDEFHJKLMNPRTUWXY3479";

export function makeCode() {
  let code = "";
  for (let index = 0; index < 4; index += 1) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

export function unknownRoomMessage(code: string) {
  const shown = code.toUpperCase();
  return `Room code ${shown} is not open. Check each character on the teacher's card.`;
}
