import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-8 w-full rounded-md border border-white/10 bg-[#242424] px-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[88px] w-full resize-none rounded-md border border-transparent bg-transparent px-0 py-1 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-transparent",
        className,
      )}
      {...props}
    />
  );
});

