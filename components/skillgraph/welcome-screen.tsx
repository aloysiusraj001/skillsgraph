"use client";

import { motion, MotionConfig } from "motion/react";
import { RolePortrait, TeacherPortrait } from "@/components/role-token";
import { SkillGraphLogo } from "@/components/skillgraph/logo";
import type { DemoPersona } from "@/components/skillgraph/persona";
import { ROLES, SKILLGRAPH_DEMO, type RoleId } from "@/lib/domain";

const ROLE_TAGLINE: Record<RoleId, string> = {
  leader: "Keeps pace & locks steps",
  interviewer: "Asks questions & quotes",
  mapper: "Maps & merges patterns",
  insight: "Traces Why & root insight",
  devil: "Spots blame & thin guesses",
};

export function WelcomeScreen({
  onSelectPersona,
}: {
  onSelectPersona: (persona: DemoPersona) => void;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4 py-10">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[660px] rounded-[24px] border border-[#E5EAF2] bg-white px-6 py-9 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:px-10"
        >
          <div className="flex flex-col items-center text-center">
            <SkillGraphLogo />
            <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-[#1E293B]">
              Welcome to SkillGraph
            </h1>
          </div>

          <hr className="my-6 border-[#E6ECF3]" />

          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-[#64748B] uppercase">
              Choose your seat
            </p>
            <p className="mt-1 text-sm text-[#64748B]">
              Pick the teacher view or sign in as one of the five student roles.
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.14 }}
              onClick={() =>
                onSelectPersona({ kind: "teacher", name: SKILLGRAPH_DEMO.teacherName })
              }
              className="flex min-h-16 w-full items-center gap-3.5 rounded-2xl border border-[#DCE5EE] bg-[#F3F6FA] px-4 py-3 text-left transition-colors hover:border-[#B8860B]/60 hover:bg-[#FAF6EC]"
            >
              <TeacherPortrait size={44} className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-[#1E293B]">
                  View as teacher
                </span>
                <span className="block text-sm text-[#475569]">
                  Guide the class, pace stages, and watch live group progress
                </span>
              </span>
            </motion.button>

            <div className="mt-1 grid gap-3 sm:grid-cols-2">
              {SKILLGRAPH_DEMO.students.map((student, index) => {
                const roleInfo = ROLES[student.role];
                return (
                  <motion.button
                    key={student.name}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: 0.04 * index, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() =>
                      onSelectPersona({
                        kind: "student",
                        name: student.name,
                        role: student.role,
                      })
                    }
                    className="flex min-h-[72px] items-center gap-3.5 rounded-2xl border border-[#D8E2EC] bg-white px-4 py-3 text-left transition-colors hover:border-[#4650E5] hover:bg-[#F8FAFF]"
                  >
                    <RolePortrait role={student.role} size={48} className="shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold text-[#1E293B]">
                        {student.name}
                      </span>
                      <span
                        className="block text-xs font-semibold"
                        style={{ color: roleInfo.color }}
                      >
                        {roleInfo.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#64748B]">
                        {ROLE_TAGLINE[student.role]}
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.section>
      </main>
    </MotionConfig>
  );
}
