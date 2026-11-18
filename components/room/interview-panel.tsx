"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INTERVIEW_QUESTION_CAP } from "@/lib/interview";
import type { RoomState } from "@/lib/domain";

type Payload = {
  version: number;
  serverNow: number;
  state: RoomState;
  error?: string;
};

export function InterviewPanel({
  code,
  token,
  version,
  state,
  canAsk,
  onResult,
}: {
  code: string;
  token: string;
  version: number;
  state: RoomState;
  canAsk: boolean;
  onResult: (payload: Payload) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const started = useRef<string | null>(null);
  const interview = state.interview && state.interview.whoseId === state.summary.whoseId ? state.interview : null;
  const asked = interview?.messages.filter((item) => item.role === "student").length ?? 0;

  useEffect(() => {
    if (interview || !state.summary.whoseId || !state.summary.harm.trim()) return;
    const key = `${state.summary.whoseId}:${version}`;
    if (started.current === state.summary.whoseId) return;
    started.current = state.summary.whoseId;
    void send("start", undefined, key);
    async function send(kind: "start" | "ask", question?: string, guard?: string) {
      setBusy(true);
      setNote(null);
      try {
        const response = await fetch(`/api/rooms/${code}/interview`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ version, kind, text: question }),
        });
        const data = (await response.json()) as Payload;
        if (data.state) onResult(data);
        if (!response.ok) {
          if (guard) started.current = null;
          setNote(data.error || "The interview could not be prepared.");
        }
      } catch {
        if (guard) started.current = null;
        setNote("The room could not be reached. Stay on this page and try again.");
      } finally {
        setBusy(false);
      }
    }
  }, [code, interview, onResult, state.summary.harm, state.summary.whoseId, token, version]);

  async function ask() {
    const question = text.trim();
    if (question.length < 2 || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch(`/api/rooms/${code}/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ version, kind: "ask", text: question }),
      });
      const data = (await response.json()) as Payload;
      if (data.state) onResult(data);
      if (!response.ok) setNote(data.error || "That question did not land.");
      else setText("");
    } catch {
      setNote("The room could not be reached. Stay on this page and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border bg-white p-4">
      <h2 className="text-xl font-semibold">A short interview</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {interview?.source === "model"
          ? "This is a shortened version of a longer interview, so the class can move faster."
          : "This short interview is built from your map. The team asks. Only the Lead Interviewer can add a question."}
      </p>
      {!state.summary.whoseId || !state.summary.harm.trim() ? (
        <p className="mt-3">Go back to Power. Pick who you follow and write what goes wrong. Then this interview can start.</p>
      ) : !interview ? (
        <p className="mt-3">{busy ? "Preparing the interview…" : note || "The interview will appear here."}</p>
      ) : (
        <div className="mt-3 grid gap-2">
          {interview.turns.map((turn, index) => (
            <p key={index} className={turn.speaker === "persona" ? "rounded-2xl bg-[#f6f1ff] px-3 py-2" : "px-3 text-sm text-muted-foreground"}>
              <span className="font-semibold">{turn.speaker === "persona" ? "Them" : "Team"}: </span>
              {turn.text}
            </p>
          ))}
          {interview.messages.map((message) => (
            <p key={message.id} className={message.role === "persona" ? "rounded-2xl bg-[#f6f1ff] px-3 py-2" : "rounded-2xl bg-[#faf8f4] px-3 py-2"}>
              <span className="font-semibold">{message.role === "persona" ? "Them" : state.participants.find((person) => person.id === message.by)?.name || "Student"}: </span>
              {message.text}
            </p>
          ))}
          {canAsk && asked < INTERVIEW_QUESTION_CAP && (
            <form
              className="mt-2 flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void ask();
              }}
            >
              <Input value={text} onChange={(event) => setText(event.target.value)} className="h-11 min-w-0 flex-1 text-base md:text-base" aria-label="Ask the person" placeholder="Ask one more question" />
              <Button type="submit" className="h-11 px-4 text-base" disabled={busy || text.trim().length < 2}>Ask</Button>
            </form>
          )}
          <p className="text-sm text-muted-foreground">
            {canAsk
              ? asked >= INTERVIEW_QUESTION_CAP
                ? "Eight questions is enough. Use a moment from this interview in the incident."
                : `${INTERVIEW_QUESTION_CAP - asked} questions left.`
              : "Only the Lead Interviewer asks. You will see each answer here."}
          </p>
        </div>
      )}
      {note && interview && <p className="mt-2" role="alert">{note}</p>}
    </section>
  );
}
