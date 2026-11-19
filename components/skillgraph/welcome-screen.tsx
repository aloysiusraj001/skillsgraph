"use client";

import { SkillGraphLogo } from "@/components/skillgraph/logo";
import type { DemoPersona } from "@/components/skillgraph/persona";
import { ROLES, SKILLGRAPH_DEMO } from "@/lib/domain";

export function WelcomeScreen({
  onSelectPersona,
}: {
  onSelectPersona: (persona: DemoPersona) => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4 py-10">
      <section className="w-full max-w-[600px] rounded-[24px] border border-[#E5EAF2] bg-white px-8 py-10 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:px-12">
        <div className="flex flex-col items-center text-center">
          <SkillGraphLogo />
          <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-[#1E293B]">
            Welcome to SkillGraph
          </h1>
        </div>

        <hr className="my-7 border-[#E6ECF3]" />

        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#64748B] uppercase">
            DEMO SHORTCUTS
          </p>
          <p className="mt-1 text-sm text-[#64748B]">
            For walk-throughs only. No account needed.
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() =>
              onSelectPersona({ kind: "teacher", name: SKILLGRAPH_DEMO.teacherName })
            }
            className="w-full rounded-full bg-[#E9EFF5] px-6 py-3.5 text-center text-[15px] font-semibold text-[#1E293B] transition hover:bg-[#DCE6F0]"
          >
            View as teacher
          </button>

          <div className="mt-1 grid gap-3 sm:grid-cols-2">
            {SKILLGRAPH_DEMO.students.map((student) => (
              <button
                key={student.name}
                type="button"
                onClick={() =>
                  onSelectPersona({
                    kind: "student",
                    name: student.name,
                    role: student.role,
                  })
                }
                className="flex flex-col items-start rounded-full border border-[#9BB7CC] bg-white px-5 py-2.5 text-left transition hover:border-[#4650E5] hover:bg-[#F5F7FF]"
              >
                <span className="text-[14px] font-medium text-[#1E293B]">
                  Login as {student.name}
                </span>
                <span className="text-[13px] font-semibold text-[#334155]">
                  {ROLES[student.role].name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
