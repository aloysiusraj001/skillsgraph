import { createHash, randomBytes } from "crypto";
import { Pool } from "pg";
import type { RoomState } from "@/lib/domain";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 8,
});

let ready: Promise<void> | null = null;

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function ensureSchema() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }
  if (!ready) {
    ready = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS rooms (
          code TEXT PRIMARY KEY,
          version INTEGER NOT NULL DEFAULT 1,
          state JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await pool.query(`
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
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`INSERT INTO rooms (code, version, state) VALUES ($1, 1, $2::jsonb)`, [code, JSON.stringify(state)]);
    for (const seat of seats) {
      await client.query(
        `INSERT INTO seats (id, room_code, token_hash, name, kind) VALUES ($1, $2, $3, $4, $5)`,
        [seat.id, code, hashToken(seat.token), seat.name, seat.kind],
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
  await ensureSchema();
  const result = await pool.query<{ version: number; state: RoomState }>(
    `SELECT version, state FROM rooms WHERE code = $1`,
    [code.toUpperCase()],
  );
  return result.rows[0];
}

export async function saveRoom(code: string, version: number, state: RoomState) {
  const result = await pool.query<{ version: number }>(
    `UPDATE rooms SET state = $1::jsonb, version = version + 1, updated_at = now()
     WHERE code = $2 AND version = $3 RETURNING version`,
    [JSON.stringify(state), code.toUpperCase(), version],
  );
  return result.rows[0]?.version;
}

export async function seatIdForToken(code: string, token: string) {
  await ensureSchema();
  const result = await pool.query<{ id: string }>(
    `SELECT id FROM seats WHERE room_code = $1 AND token_hash = $2`,
    [code.toUpperCase(), hashToken(token)],
  );
  return result.rows[0]?.id;
}

export async function rotateSeatToken(seatId: string, token: string) {
  await pool.query(`UPDATE seats SET token_hash = $1 WHERE id = $2`, [hashToken(token), seatId]);
}

export function bearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+([a-f0-9]+)$/i);
  return match?.[1] ?? "";
}
