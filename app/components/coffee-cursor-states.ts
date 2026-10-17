export const cursorStates = [
  "default", "pointer", "pressed", "context-menu", "help", "progress", "wait",
  "text", "vertical-text", "cell", "crosshair", "move", "grab", "grabbing",
  "not-allowed", "no-drop", "copy", "alias", "zoom-in", "zoom-out", "all-scroll",
  "col-resize", "row-resize", "n-resize", "ne-resize", "e-resize", "se-resize",
  "s-resize", "sw-resize", "w-resize", "nw-resize", "ew-resize", "ns-resize",
  "nesw-resize", "nwse-resize", "none",
] as const;

export type CoffeeCursorState = (typeof cursorStates)[number];

const knownStates = new Set<string>(cursorStates);

export function parseCursor(value: string | null | undefined): CoffeeCursorState | null {
  // Custom CSS cursor URLs can contain commas; the last entry is the keyword fallback.
  const keyword = value?.split(",").at(-1)?.trim().toLowerCase();
  return keyword && knownStates.has(keyword) ? keyword as CoffeeCursorState : null;
}

export type CursorContext = {
  cursor?: string;
  override?: string | null;
  disabled?: boolean;
  busy?: boolean;
  interactive?: boolean;
  overText?: boolean;
  verticalText?: boolean;
  pressed?: boolean;
  clickPulse?: boolean;
  dragging?: boolean;
  dragState?: CoffeeCursorState | null;
};

export function resolveCursorState(context: CursorContext): CoffeeCursorState {
  const explicit = parseCursor(context.override);
  const native = parseCursor(context.cursor);
  if (explicit === "none" || (!explicit && native === "none")) return "none";
  if (context.disabled) return "not-allowed";
  if (context.dragState) return context.dragState;
  if (context.dragging) return "grabbing";
  if (context.busy && !explicit) return "progress";

  let state = explicit ?? native;
  if (!state) {
    state = context.interactive ? "pointer" : context.overText
      ? context.verticalText ? "vertical-text" : "text"
      : "default";
  }
  if (context.pressed && state === "grab") return "grabbing";
  if ((context.pressed || context.clickPulse) && (state === "default" || state === "pointer")) return "pressed";
  return state;
}

export function movementLook(dx: number, dy: number) {
  const distance = Math.hypot(dx, dy);
  if (!distance) return { x: 0, y: 0 };
  const reach = Math.min(2.7, distance * 0.32);
  return { x: dx / distance * reach, y: dy / distance * reach };
}

export function characterOffset(x: number, y: number, viewportWidth: number, viewportHeight: number) {
  // Move the character, never the click point or the direction of its arrows.
  return { x: x > viewportWidth - 56 ? -78 : 0, y: y > viewportHeight - 44 ? -66 : 0 };
}

export const resizeDirections: Partial<Record<CoffeeCursorState, { angle: number; double?: boolean; bars?: boolean }>> = {
  "n-resize": { angle: -90 },
  "ne-resize": { angle: -45 },
  "e-resize": { angle: 0 },
  "se-resize": { angle: 45 },
  "s-resize": { angle: 90 },
  "sw-resize": { angle: 135 },
  "w-resize": { angle: 180 },
  "nw-resize": { angle: -135 },
  "ew-resize": { angle: 0, double: true },
  "ns-resize": { angle: 90, double: true },
  "nesw-resize": { angle: -45, double: true },
  "nwse-resize": { angle: 45, double: true },
  "col-resize": { angle: 0, double: true, bars: true },
  "row-resize": { angle: 90, double: true, bars: true },
};
