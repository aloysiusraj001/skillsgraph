"use client";

import { useEffect, useState } from "react";
import { DashboardScreen } from "@/components/skillgraph/dashboard-screen";
import {
  clearPersona,
  readPersona,
  writePersona,
  type DemoPersona,
} from "@/components/skillgraph/persona";
import { WelcomeScreen } from "@/components/skillgraph/welcome-screen";

export function SkillGraphHome() {
  const [persona, setPersona] = useState<DemoPersona | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPersona(readPersona());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] p-6 text-sm text-[#64748B]">
        Opening SkillGraph…
      </main>
    );
  }

  if (!persona) {
    return (
      <WelcomeScreen
        onSelectPersona={(next) => {
          writePersona(next);
          setPersona(next);
        }}
      />
    );
  }

  return (
    <DashboardScreen
      persona={persona}
      onLogout={() => {
        clearPersona();
        setPersona(null);
      }}
    />
  );
}
