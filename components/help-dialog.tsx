"use client";

import { FAQ } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function HelpDialog({ label = "Ask teacher" }: { label?: string }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" className="h-11 min-h-11 px-4 text-base" />
        }
      >
        {label}
      </DialogTrigger>
      <DialogContent className="max-w-lg text-base">
        <DialogHeader>
          <DialogTitle className="text-lg">Questions the teacher can answer</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            The screen already has the steps. Ask a question, then come back to Your move.
          </DialogDescription>
        </DialogHeader>
        <ul className="grid gap-3">
          {FAQ.map((item) => (
            <li key={item.q} className="rounded-xl bg-muted px-3 py-3">
              <div className="font-semibold">{item.q}</div>
              <p className="mt-1 text-base">{item.a}</p>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
