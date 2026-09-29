import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-3 text-base border-2 border-white/30 dark:border-slate-700/50 shadow-lg transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-teal-400 focus-visible:bg-white/80 dark:focus-visible:bg-slate-800/90 focus-visible:shadow-[0_0_20px_rgba(77,217,192,0.3)] hover:bg-white/60 dark:hover:bg-slate-800/70 hover:border-white/50 dark:hover:border-slate-600/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-medium text-foreground dark:text-foreground",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
