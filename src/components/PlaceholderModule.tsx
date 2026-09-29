import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";

function makePlaceholder(title: string, subtitle: string) {
  return function Placeholder() {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-muted-foreground">{subtitle}</p>
        <div className="mt-8 rounded-2xl border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
          <Construction className="mx-auto h-10 w-10 text-primary" />
          <div className="mt-4 font-semibold">Coming in the next phase</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your foundation is ready. Ask to build out this module next and I'll layer in all the rich features.
          </p>
        </div>
      </div>
    );
  };
}

export const placeholderFor = makePlaceholder;
