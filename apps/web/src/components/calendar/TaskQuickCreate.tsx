"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  dateKey: string;
  top: number;
  left: number;
  width: number;
  onSubmit: (title: string) => void;
  onCancel: () => void;
};

export function TaskQuickCreate({
  dateKey,
  top,
  left,
  width,
  onSubmit,
  onCancel,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [dateKey]);

  return (
    <form
      className="fixed z-30 px-1"
      style={{ top, left, width }}
      onSubmit={(event) => {
        event.preventDefault();
        const title = ref.current?.value.trim() ?? "";
        if (title) onSubmit(title);
        else onCancel();
      }}
    >
      <Input
        ref={ref}
        placeholder="+ 添加任务"
        className="h-7 border-[#365299] bg-[#1c1c1c] text-[12px]"
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
        onBlur={(event) => {
          const title = event.target.value.trim();
          if (title) onSubmit(title);
          else onCancel();
        }}
      />
    </form>
  );
}
