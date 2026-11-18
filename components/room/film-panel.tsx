"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { gateFilms, filmsForStage, FILMS, type Film } from "@/lib/films";
import type { Action, RoomState } from "@/lib/domain";

export function TeacherFilms({
  state,
  act,
  saving,
}: {
  state: RoomState;
  act: (action: Action) => void;
  saving: boolean;
}) {
  const films = gateFilms(state.stage);
  if (films.length === 0) return null;
  const nextLabel = state.stage === "s0" ? "Start" : "Next";
  return (
    <section className="rounded-3xl border bg-white p-4">
      <h2 className="text-xl font-semibold">Play for the class</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Play {films.length > 1 ? "these films" : "this film"} out loud, then press {nextLabel}. Student screens stay on the written notes until you mark a film as played.
      </p>
      <div className="mt-4 grid gap-4">
        {films.map((film) => (
          <FilmCard key={film.id} film={film} played={played(state, film.id)} audience="teacher" saving={saving} onPlay={() => act({ type: "play-film", id: film.id })} />
        ))}
      </div>
    </section>
  );
}

export function StudentFilms({ state }: { state: RoomState }) {
  const current = filmsForStage(state.stage);
  const earlier = FILMS.filter((film) => !current.some((item) => item.id === film.id));
  if (current.length === 0 && earlier.length === 0) return null;
  return (
    <details className="rounded-3xl border bg-white p-4">
      <summary className="cursor-pointer text-xl font-semibold">Read this step</summary>
      <p className="mt-2 text-sm text-muted-foreground">The film does not start on your screen. Open a film to read the notes. After your teacher plays it, you can open the video here.</p>
      <div className="mt-4 grid gap-3">
        {current.map((film) => (
          <FilmCard key={film.id} film={film} played={played(state, film.id)} audience="student" />
        ))}
      </div>
      {earlier.length > 0 && (
        <details className="mt-4 rounded-2xl bg-[#faf8f4] px-3 py-2">
          <summary className="cursor-pointer font-semibold">Earlier films</summary>
          <div className="mt-3 grid gap-3">
            {earlier.map((film) => (
              <FilmCard key={film.id} film={film} played={played(state, film.id)} audience="student" />
            ))}
          </div>
        </details>
      )}
    </details>
  );
}

function FilmCard({
  film,
  played,
  audience,
  saving,
  onPlay,
}: {
  film: Film;
  played: boolean;
  audience: "teacher" | "student";
  saving?: boolean;
  onPlay?: () => void;
}) {
  const [open, setOpen] = useState(audience === "teacher");
  return (
    <article className="grid gap-3">
      <div>
        <p className="text-sm text-muted-foreground">Film {film.number}</p>
        <h3 className="text-lg font-semibold">{film.title}</h3>
        {audience === "teacher" && <p className="mt-1 text-sm">{film.cue}</p>}
      </div>
      {audience === "teacher" && open && <VideoPlaceholder title={film.title} />}
      {audience === "teacher" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" className="h-11 px-4 text-base" disabled={saving || played} onClick={onPlay}>
            {played ? "Played for the class" : "Play for the class"}
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" checked={played} disabled={saving || played} onChange={() => onPlay?.()} />
            The class has seen this
          </label>
        </div>
      )}
      {audience === "student" && played && (
        <div>
          <Button type="button" variant="outline" className="h-11 px-4 text-base" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {open ? "Hide the video" : "Watch the film"}
          </Button>
          {open && (
            <div className="mt-3">
              <VideoPlaceholder title={film.title} />
            </div>
          )}
        </div>
      )}
      {audience === "student" && !played && <p className="text-sm text-muted-foreground">Your teacher plays this film for the class. The notes are here whenever you need them.</p>}
      {audience === "teacher" ? (
        <div className="grid gap-3">
          <FilmNotes film={film} />
        </div>
      ) : (
        <details className="rounded-2xl bg-[#faf8f4] px-3 py-2">
          <summary className="cursor-pointer font-semibold">Read the notes</summary>
          <div className="mt-3 grid gap-3">
            <FilmNotes film={film} />
          </div>
        </details>
      )}
    </article>
  );
}

function FilmNotes({ film }: { film: Film }) {
  return (
    <>
      {film.parts.map((part) => (
        <div key={part.heading}>
          <h4 className="font-semibold">{part.heading}</h4>
          {part.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-1 max-w-3xl">{paragraph}</p>
          ))}
        </div>
      ))}
    </>
  );
}

function VideoPlaceholder({ title }: { title: string }) {
  return (
    <div
      className="grid aspect-video place-items-center rounded-2xl bg-[#1e2a44] px-6 text-center text-white"
      role="img"
      aria-label={`Video placeholder for ${title}`}
    >
      <div>
        <span className="mx-auto flex size-14 items-center justify-center rounded-full border-2 border-white text-2xl" aria-hidden>▶</span>
        <p className="mt-3 text-xl font-semibold">Video will play here</p>
        <p className="mt-1 text-sm text-white/80">{title}</p>
      </div>
    </div>
  );
}

function played(state: RoomState, id: string) {
  return (state.filmsPlayed ?? []).includes(id);
}
