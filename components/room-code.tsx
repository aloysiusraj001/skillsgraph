"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RoomCode({ code, prominent = false }: { code: string; prominent?: boolean }) {
  const [copied, setCopied] = useState(false);
  const box = prominent ? "h-12 w-10 text-2xl" : "h-9 w-8 text-lg";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1" aria-label={`Room code ${code.split("").join(" ")}`}>
        {code.split("").map((char, index) => (
          <span
            key={`${char}-${index}`}
            className={`flex items-center justify-center rounded-lg border border-[#1e2a44] bg-white font-semibold text-[#1e2a44] ${box}`}
            style={{ fontFamily: 'ui-monospace, "Cascadia Mono", "Segoe UI Mono", Menlo, Consolas, monospace' }}
          >
            {char}
          </span>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-11 px-3 text-base"
        onClick={() => {
          void navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? "Copied" : "Copy code"}
      </Button>
    </div>
  );
}
