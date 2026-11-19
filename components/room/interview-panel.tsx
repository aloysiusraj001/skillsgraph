"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uid, type RoomState } from "@/lib/domain";
import { INTERVIEW_QUESTION_CAP, briefFrom } from "@/lib/interview";
import { saveInterviewInFirestore } from "@/lib/rooms-firestore";

export function InterviewPanel({
  code,
  version,
  state,
  youId,
  canAsk,
}: {
  code: string;
  version: number;
  state: RoomState;
  youId: string;
  canAsk: boolean;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const started = useRef<string | null>(null);
  const interview =
    state.interview && state.interview.whoseId === state.summary.whoseId
      ? state.interview
      : null;
  const asked =
    interview?.messages.filter((item) => item.role === "student").length ?? 0;

  async function runStartInterview(
    personaBrief: NonNullable<ReturnType<typeof briefFrom>>,
    whoseId: string,
  ) {
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "start", brief: personaBrief }),
      });
      const data = (await response.json()) as {
        turns?: { speaker: "team" | "persona"; text: string }[];
        error?: string;
      };
      if (!response.ok || !data.turns?.length) {
        setNote(data.error || "The interview could not be prepared.");
        return;
      }
      await saveInterviewInFirestore(code, version, {
        whoseId,
        source: "model",
        turns: data.turns,
        messages: [],
      });
    } catch (err) {
      setNote(
        err instanceof Error
          ? err.message
          : "The interview could not be prepared.",
      );
    } finally {
      setBusy(false);
    }
  }

  const hasLegacyDisclaimer = Boolean(
    interview &&
      interview.messages.length === 0 &&
      interview.turns.some((turn) =>
        /class guess|unchecked guess|checked with a real person|pick your team's incident/i.test(
          turn.text,
        ),
      ),
  );

  useEffect(() => {
    if ((interview && !hasLegacyDisclaimer) || !state.summary.whoseId || !state.summary.harm.trim()) {
      return;
    }
    if (started.current === state.summary.whoseId) return;
    const brief = briefFrom(state);
    if (!brief) return;

    started.current = state.summary.whoseId;
    void runStartInterview(brief, state.summary.whoseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, hasLegacyDisclaimer, interview, state.summary.whoseId, state.summary.harm, version]);

  async function ask() {
    const question = text.trim();
    const brief = briefFrom(state);
    if (question.length < 2 || busy || !interview || !brief) return;
    setBusy(true);
    setNote(null);
    try {
      const nextMessages = [
        ...interview.messages,
        {
          id: uid("ask"),
          by: youId,
          role: "student" as const,
          text: question,
          at: Date.now(),
        },
      ];
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "ask",
          brief,
          turns: interview.turns,
          history: nextMessages,
          question,
        }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) {
        setNote(data.error || "That question did not land.");
        return;
      }
      await saveInterviewInFirestore(code, version, {
        ...interview,
        messages: [
          ...nextMessages,
          {
            id: uid("say"),
            by: "persona",
            role: "persona",
            text: data.reply,
            at: Date.now(),
          },
        ],
      });
      setText("");
    } catch (err) {
      setNote(
        err instanceof Error
          ? err.message
          : "The room could not be reached. Stay on this page and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border bg-white p-4">
      <h2 className="text-xl font-semibold">A short interview</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {interview?.source === "model"
          ? "This is a shortened version of a longer interview powered by Gemini, so the class can move faster."
          : "This short interview is built from your map. The team asks. Only the Lead Interviewer can add a question."}
      </p>
      {!state.summary.whoseId || !state.summary.harm.trim() ? (
        <p className="mt-3">Go back to Power. Pick who you follow and write what goes wrong. Then this interview can start.</p>
      ) : !interview ? (
        note ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f5c2c0] bg-[#fef2f2] px-4 py-3 text-sm text-[#c63b32]" role="alert">
            <span>{note}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => {
                const brief = briefFrom(state);
                if (brief && state.summary.whoseId) {
                  void runStartInterview(brief, state.summary.whoseId);
                }
              }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <p className="mt-3">{busy ? "Preparing the interview…" : "The interview will appear here."}</p>
        )
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
      {note && interview && <p className="mt-2 text-[#c63b32]" role="alert">{note}</p>}
    </section>
  );
}
