import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-400 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:from-teal-600 hover:to-cyan-600 active:shadow-md",
        destructive: "bg-destructive text-destructive-foreground shadow-lg hover:shadow-xl hover:bg-destructive/90 active:shadow-md",
        outline:
          "bg-card/60 backdrop-blur-sm border-2 border-border text-foreground shadow-sm hover:bg-muted hover:border-primary/40 active:shadow-none",
        secondary: "bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl hover:bg-secondary/90 active:shadow-md",
        ghost: "hover:bg-muted hover:text-foreground transition-colors",
        link: "text-teal-600 underline-offset-4 hover:underline hover:text-teal-700",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-12 rounded-2xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
