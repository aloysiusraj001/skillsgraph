"use client";

import { Component, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { testConnection } from "@/lib/firebase";

class FirebaseErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-xl p-6">
          <div className="rounded-3xl border bg-white p-5">
            <h2 className="text-xl font-semibold">Something went wrong with the room connection</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Refresh the page to continue.
            </p>
            <Button
              type="button"
              className="mt-4 h-11 px-4 text-base"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function FirebaseProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void testConnection();
  }, []);

  return <FirebaseErrorBoundary>{children}</FirebaseErrorBoundary>;
}
