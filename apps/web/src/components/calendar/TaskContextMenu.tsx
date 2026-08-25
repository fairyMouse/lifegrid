"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

type Props = {
  x: number;
  y: number;
  onDelete: () => void;
  onClose: () => void;
};

const MENU_W = 112;
const MENU_H = 40;
const PAD = 8;

function clampPos(x: number, y: number) {
  return {
    left: Math.min(Math.max(PAD, x), window.innerWidth - PAD - MENU_W),
    top: Math.min(Math.max(PAD, y), window.innerHeight - PAD - MENU_H),
  };
}

export function TaskContextMenu({ x, y, onDelete, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const pos = clampPos(x, y);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    function onPointer(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      onCloseRef.current();
    }
    function onScroll() {
      onCloseRef.current();
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      role="menu"
      className="fixed z-50 w-28 rounded-md border border-white/10 bg-[#242424] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
      style={{ top: pos.top, left: pos.left }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-400 hover:bg-white/8"
        onClick={onDelete}
      >
        <Trash2 size={12} />
        删除
      </button>
    </div>
  );
}
