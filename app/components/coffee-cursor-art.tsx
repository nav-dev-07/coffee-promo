import { useId } from "react";
import { resizeDirections, type CoffeeCursorState } from "./coffee-cursor-states";

function Arrow({ double = false }: { double?: boolean }) {
  return <><path d="M4 16h24m-7-7 7 7-7 7" />{double && <path d="m11 9-7 7 7 7" />}</>;
}

function Hand({ closed = false, pointing = false }: { closed?: boolean; pointing?: boolean }) {
  return (
    <g className={`coffee-cursor-hand${pointing ? " coffee-cursor-pointing" : ""}`}>
      {closed ? (
        <><path className="coffee-cursor-paper" d="M8 13c-4-2-6 1-4 5l4 8c2 4 7 5 12 3 6-2 9-7 8-12l-1-6c-1-4-5-4-6-1-1-5-6-5-7-1-2-4-7-3-6 4Z" /><path d="m9 14 4 4m3-8 1 6m5-6 1 5m-16 5 7 3" /></>
      ) : pointing ? (
        <><path className="coffee-cursor-paper" d="M11 17 8 6c-1-5 4-6 6-1l4 10c4-4 7-2 6 1 5-1 7 2 4 6 0 5-4 9-10 9-6-1-10-4-11-9-1-5 2-7 4-5Z" /><path d="m12 18 3 5m4-7 2 5m3-4 1 4m-15 3 5 2" /></>
      ) : (
        <><path className="coffee-cursor-paper" d="M9 17 5 9C3 5 7 3 9 7l4 7-2-10c-1-4 4-5 5-1l2 10 1-10c1-4 5-3 5 1l-1 10 4-7c2-3 6-1 4 3l-5 11c-2 6-5 10-11 10-6-1-9-5-12-9-3-4 0-7 3-5l5 5" /><path d="m13 21 5 1 4-2" /></>
      )}
    </g>
  );
}

function StateIcon({ state }: { state: CoffeeCursorState }) {
  const resize = resizeDirections[state];
  if (resize) {
    return (
      <g transform={`rotate(${resize.angle} 16 16)`}>
        <g className="coffee-cursor-resize-arrow">
          <Arrow double={resize.double} />
        </g>
        {resize.bars && <path className="coffee-cursor-accent" d="M0 5v22M32 5v22" />}
      </g>
    );
  }
  switch (state) {
    case "default": return <path className="coffee-cursor-ticks" d="m5 10-4-4m14 1-1-6" />;
    case "pointer": return <><Hand pointing /><path className="coffee-cursor-accent coffee-cursor-ticks" d="m2 3-4-3M21 1l2-5" /></>;
    case "pressed": return <path className="coffee-cursor-accent coffee-cursor-click-rays" d="M3 12-3 9M10 3 7-3m15 7 2-7m8 15 6-3" />;
    case "context-menu": return <g className="coffee-cursor-menu"><rect className="coffee-cursor-paper" x="2" y="1" width="28" height="30" rx="5" /><path className="coffee-cursor-accent" d="M9 10h14M9 16h14M9 22h10" /></g>;
    case "help": return <g className="coffee-cursor-help"><path className="coffee-cursor-paper" d="M4 29 5 23C-6 9 3-3 17-2c15 1 21 19 8 27-6 4-11 2-15 1Z" /><path className="coffee-cursor-accent" d="M12 8c0-6 11-6 11 0 0 5-7 5-7 10" /><circle className="coffee-cursor-accent-fill" cx="16" cy="23" r="1.8" /></g>;
    case "progress":
    case "wait": return <g className={`coffee-cursor-spinner${state === "wait" ? " coffee-cursor-spinner-slow" : ""}`}>{Array.from({ length: 8 }, (_, index) => <path className="coffee-cursor-accent" key={index} d="M16 1v4" opacity={(index + 1) / 8} transform={`rotate(${index * 45} 16 16)`} />)}</g>;
    case "text": return <path className="coffee-cursor-ibeam" d="M11 1h10M16 1v30m-5 0h10" />;
    case "vertical-text": return <path className="coffee-cursor-ibeam" d="M1 11v10m0-5h30m0-5v10" />;
    case "cell": return <><path className="coffee-cursor-cell" d="M2 14V2h28v28H18M16 2v7M2 16h7m21 0h-6M16 30v-7" /><path d="M16 10v12m-6-6h12" /></>;
    case "crosshair": return <g className="coffee-cursor-crosshair"><path d="M16-2v12m0 12v12M-2 16h12m12 0h12" /><circle cx="16" cy="16" r="5" /></g>;
    case "move":
    case "all-scroll": return <g className="coffee-cursor-directions">{state === "move" && <path d="M16 3v26M3 16h26" />}<path className="coffee-cursor-solid" d="m16-2-5 7h10ZM34 16l-7-5v10ZM16 34l5-7H11ZM-2 16l7 5V11Z" /></g>;
    case "grab": return <Hand />;
    case "grabbing": return <Hand closed />;
    case "not-allowed":
    case "no-drop": return <g className="coffee-cursor-prohibition">{state === "no-drop" && <path d="M16 5v21m-7-8 7 8 7-8" />}<circle className="coffee-cursor-accent" cx="16" cy="16" r="16" /><path className="coffee-cursor-accent" d="m5 5 22 22" /></g>;
    case "copy": return <g className="coffee-cursor-copy"><rect className="coffee-cursor-paper" x="0" y="0" width="22" height="24" rx="3" /><rect className="coffee-cursor-paper" x="9" y="9" width="22" height="24" rx="3" /><path className="coffee-cursor-accent" d="M20 15v12m-6-6h12" /></g>;
    case "alias": return <path className="coffee-cursor-accent coffee-cursor-alias" d="M2 29c2-13 10-18 25-18M18 2l10 9-10 9" />;
    case "zoom-in":
    case "zoom-out": return <g className="coffee-cursor-zoom"><circle className="coffee-cursor-paper" cx="13" cy="12" r="13" /><path d="m23 23 10 10M7 12h12" />{state === "zoom-in" && <path d="M13 6v12" />}</g>;
    default: return null;
  }
}

export default function CoffeeCursorArt({ state }: { state: CoffeeCursorState }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg className="coffee-cursor-art" viewBox="0 0 96 90" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-roast`} x1="12" y1="17" x2="55" y2="69" gradientUnits="userSpaceOnUse">
          <stop stopColor="#dfa46c" /><stop offset="0.48" stopColor="#c58a54" /><stop offset="1" stopColor="#9c5d33" />
        </linearGradient>
        <linearGradient id={`${id}-crease`} x1="25" y1="18" x2="38" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#683a23" /><stop offset="1" stopColor="#89502d" />
        </linearGradient>
      </defs>
      <g className="coffee-cursor-character">
        <g className="coffee-cursor-body-motion">
          <g className="coffee-cursor-body-pose">
            <g transform="rotate(-27 34 44)">
              <ellipse className="coffee-cursor-sticker-edge" cx="34" cy="44" rx="23" ry="31" />
              <ellipse className="coffee-cursor-bean" cx="34" cy="44" rx="21" ry="29" fill={`url(#${id}-roast)`} />
              <path className="coffee-cursor-highlight" d="M24 21c-10 9-9 28 1 40" />
              <path className="coffee-cursor-seam" fill={`url(#${id}-crease)`} d="M31 16c-12 19 10 31 3 57 15-24-11-38-3-57Z" />
              <path className="coffee-cursor-seam-light" d="M31 20c-7 18 9 31 5 47" />
            </g>
            <g className="coffee-cursor-face" transform="rotate(-8 41 41)">
              <g className="coffee-cursor-open-eyes">
                <g className="coffee-cursor-blink">
                  <g className="coffee-cursor-gaze">
                    <ellipse className="coffee-cursor-eye" cx="38" cy="37" rx="2.3" ry="3.1" />
                    <ellipse className="coffee-cursor-eye" cx="49" cy="37" rx="2.3" ry="3.1" />
                    <circle className="coffee-cursor-eye-shine" cx="38.6" cy="35.8" r="0.65" />
                    <circle className="coffee-cursor-eye-shine" cx="49.6" cy="35.8" r="0.65" />
                  </g>
                </g>
              </g>
              <path className="coffee-cursor-sleep-eyes" d="m35 37 3 2 3-2m5 0 3 2 3-2" />
              <path className="coffee-cursor-happy-eyes" d="m35 34 5 3-5 2m15-5-5 3 5 2" />
              <path className="coffee-cursor-smile" d="M40 44q4 5 8-1" />
              <path className="coffee-cursor-worried-mouth" d="M40 47q4-5 8-1" />
              <ellipse className="coffee-cursor-cheek" cx="34" cy="44" rx="2.8" ry="1.6" />
              <ellipse className="coffee-cursor-cheek" cx="52" cy="43" rx="2.8" ry="1.6" />
            </g>
          </g>
        </g>
        <g key={state} className="coffee-cursor-badge-enter" transform={state === "default" ? "translate(8 7)" : state === "pressed" ? "translate(18 3)" : "translate(61 17)"}>
          <g className="coffee-cursor-badge"><StateIcon state={state} /></g>
        </g>
      </g>
      {/* Fixed ink tip: the character can shift inward at viewport edges. */}
      <path className="coffee-cursor-pin" d="m16 18 3 9 6-6Z" />
    </svg>
  );
}
