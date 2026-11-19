"use client";

export function SkillGraphLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div className="relative flex h-6 w-9 items-center" aria-hidden="true">
        <span className="h-4 w-4 rotate-45 rounded-[3px] border-[2.5px] border-[#6DA4A8]" />
        <span className="-ml-1.5 h-4 w-4 rotate-45 rounded-[3px] border-[2.5px] border-[#4650E5]" />
      </div>
      <span
        className={`${compact ? "text-base" : "text-xl"} font-bold tracking-[0.06em]`}
      >
        <span className="text-[#6B8BA4]">SKILLS</span>
        <span className="text-[#4650E5]">GRAPH</span>
      </span>
    </div>
  );
}
