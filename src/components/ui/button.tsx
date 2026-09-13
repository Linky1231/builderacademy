import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-300 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-300 hover:[&_svg]:scale-110",
  {
    variants: {
      variant: {
        default:
          "bg-primary/75 text-primary-foreground backdrop-blur-md border border-white/12 shadow-lg shadow-primary/25 hover:bg-primary/90 hover:-translate-y-0.5",
        destructive:
          "bg-destructive/75 text-destructive-foreground backdrop-blur-md border border-white/12 shadow-sm hover:bg-destructive/90 hover:-translate-y-0.5",
        outline:
          "border border-white/15 bg-background/45 backdrop-blur-md shadow-sm hover:bg-accent/60 hover:text-accent-foreground hover:-translate-y-0.5",
        secondary:
          "bg-secondary/65 text-secondary-foreground backdrop-blur-md border border-white/12 shadow-sm hover:bg-secondary/80 hover:-translate-y-0.5",
        ghost: "hover:bg-accent/45 hover:text-accent-foreground hover:backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
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
