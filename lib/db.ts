import { createHash, randomBytes } from "crypto";
import { Pool } from "pg";
import type { RoomState } from "@/lib/domain";

type MemoryRoom = { version: number; state: RoomState };
type MemorySeat = {
  id: string;
  roomCode: string;
  tokenHash: string;
  name: string;
  kind: string;
};
type MemoryStore = {
  rooms: Map<string, MemoryRoom>;
  seats: Map<string, MemorySeat>;
};

const globalForDb = globalThis as typeof globalThis & {
  __c60MemoryStore?: MemoryStore;
};

function getMemoryStore(): MemoryStore {
  if (!globalForDb.__c60MemoryStore) {
    globalForDb.__c60MemoryStore = {
      rooms: new Map(),
      seats: new Map(),
    };
  }
  return globalForDb.__c60MemoryStore;
}

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let pool: Pool | null = null;
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 8,
    });
  } catch {
    console.warn("[AI Studio] Database not connected — using in-memory store");
    pool = null;
  }
} else {
  console.warn("[AI Studio] DATABASE_URL not set — using in-memory store");
}

let ready: Promise<void> | null = null;

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function ensureSchema() {
  if (!pool) return;
  if (!ready) {
    ready = (async () => {
      await pool!.query(`
        CREATE TABLE IF NOT EXISTS rooms (
          code TEXT PRIMARY KEY,
          version INTEGER NOT NULL DEFAULT 1,
          state JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await pool!.query(`
        CREATE TABLE IF NOT EXISTS seats (
          id TEXT PRIMARY KEY,
          room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
          token_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          kind TEXT NOT NULL
        )
      `);
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

export function newToken() {
  return randomBytes(24).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export { makeCode } from "@/lib/code";

export async function insertRoom(code: string, state: RoomState, seats: { id: string; token: string; name: string; kind: string }[]) {
  const upper = code.toUpperCase();
  if (!pool) {
    const store = getMemoryStore();
    if (store.rooms.has(upper)) {
      throw new Error("duplicate key value violates unique constraint");
    }
    store.rooms.set(upper, { version: 1, state: cloneState(state) });
    for (const seat of seats) {
      store.seats.set(seat.id, {
        id: seat.id,
        roomCode: upper,
        tokenHash: hashToken(seat.token),
        name: seat.name,
        kind: seat.kind,
      });
    }
    return;
  }
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`INSERT INTO rooms (code, version, state) VALUES ($1, 1, $2::jsonb)`, [upper, JSON.stringify(state)]);
    for (const seat of seats) {
      await client.query(
        `INSERT INTO seats (id, room_code, token_hash, name, kind) VALUES ($1, $2, $3, $4, $5)`,
        [seat.id, upper, hashToken(seat.token), seat.name, seat.kind],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function loadRoom(code: string) {
  const upper = code.toUpperCase();
  if (!pool) {
    const row = getMemoryStore().rooms.get(upper);
    return row ? { version: row.version, state: cloneState(row.state) } : undefined;
  }
  await ensureSchema();
  const result = await pool.query<{ version: number; state: RoomState }>(
    `SELECT version, state FROM rooms WHERE code = $1`,
    [upper],
  );
  return result.rows[0];
}

export async function saveRoom(code: string, version: number, state: RoomState) {
  const upper = code.toUpperCase();
  if (!pool) {
    const store = getMemoryStore();
    const row = store.rooms.get(upper);
    if (!row || row.version !== version) return undefined;
    const nextVersion = row.version + 1;
    store.rooms.set(upper, { version: nextVersion, state: cloneState(state) });
    return nextVersion;
  }
  const result = await pool.query<{ version: number }>(
    `UPDATE rooms SET state = $1::jsonb, version = version + 1, updated_at = now()
     WHERE code = $2 AND version = $3 RETURNING version`,
    [JSON.stringify(state), upper, version],
  );
  return result.rows[0]?.version;
}

export async function seatIdForToken(code: string, token: string) {
  const upper = code.toUpperCase();
  const tokenHash = hashToken(token);
  if (!pool) {
    for (const seat of getMemoryStore().seats.values()) {
      if (seat.roomCode === upper && seat.tokenHash === tokenHash) {
        return seat.id;
      }
    }
    return undefined;
  }
  await ensureSchema();
  const result = await pool.query<{ id: string }>(
    `SELECT id FROM seats WHERE room_code = $1 AND token_hash = $2`,
    [upper, tokenHash],
  );
  return result.rows[0]?.id;
}

export async function rotateSeatToken(seatId: string, token: string) {
  const tokenHash = hashToken(token);
  if (!pool) {
    const seat = getMemoryStore().seats.get(seatId);
    if (seat) seat.tokenHash = tokenHash;
    return;
  }
  await pool.query(`UPDATE seats SET token_hash = $1 WHERE id = $2`, [tokenHash, seatId]);
}

export function bearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+([a-f0-9]+)$/i);
  return match?.[1] ?? "";
}
