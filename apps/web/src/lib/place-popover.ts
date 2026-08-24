export type PopoverPos = { top: number; left: number };

const PAD = 12;
const GAP = 6;
const DATE_ROW = 26;

export function placePopover(
  anchor: DOMRect,
  width: number,
  height: number,
): PopoverPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = anchor.left + 4;
  if (left + width > vw - PAD) left = anchor.right - width - 4;
  if (left < PAD) left = PAD;
  if (left + width > vw - PAD) left = Math.max(PAD, vw - PAD - width);

  let top = anchor.top + DATE_ROW;
  const fitsBelow = top + height <= vh - PAD;
  const above = anchor.top - height - GAP;
  const fitsAbove = above >= PAD;

  if (!fitsBelow && fitsAbove) top = above;
  else if (!fitsBelow && !fitsAbove) {
    top = Math.max(PAD, Math.min(top, vh - PAD - height));
  }

  return { top, left };
}
