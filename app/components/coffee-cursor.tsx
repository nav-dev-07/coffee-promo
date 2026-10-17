"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import CoffeeCursorArt from "./coffee-cursor-art";
import { characterOffset, movementLook, parseCursor, resolveCursorState, type CoffeeCursorState } from "./coffee-cursor-states";
import "./coffee-cursor.css";

// A normal z-index cannot paint above a modal dialog or a fullscreen element.
// Portal into the active surface instead, including when it opens under a still mouse.
function cursorSurface(): Element | null {
  if (typeof document === "undefined") return null;
  return document.fullscreenElement ?? Array.from(document.querySelectorAll("dialog[open]")).at(-1) ?? document.body;
}

function subscribeToSurfaceChange(update: () => void) {
  const observer = new MutationObserver((records) => {
    if (records.some(record => record.type === "attributes" || [...record.addedNodes, ...record.removedNodes]
      .some(node => node instanceof Element && (node.matches("dialog") || node.querySelector("dialog"))))) update();
  });
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open"] });
  document.addEventListener("fullscreenchange", update);
  return () => {
    observer.disconnect();
    document.removeEventListener("fullscreenchange", update);
  };
}

const serverSurface = () => null;
const interactiveSelector = "a[href],area[href],button,summary,label[for],select,input[type='button'],input[type='submit'],input[type='reset'],input[type='checkbox'],input[type='radio'],input[type='range'],[role='button'],[role='link'],[role='tab'],video[controls]";

type CaretDocument = Document & {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

function overText(target: Element, x: number, y: number, range: Range) {
  const doc = document as CaretDocument;
  const position = doc.caretPositionFromPoint?.(x, y);
  const fallback = position ? null : doc.caretRangeFromPoint?.(x, y);
  const node = position?.offsetNode ?? fallback?.startContainer;
  const offset = position?.offset ?? fallback?.startOffset ?? 0;
  if (!node || node.nodeType !== Node.TEXT_NODE || !target.contains(node)) return false;
  const length = node.textContent?.length ?? 0;
  if (!length) return false;
  range.setStart(node, Math.max(0, offset - 1));
  range.setEnd(node, Math.min(length, offset + 1));
  return Array.from(range.getClientRects()).some(rect => x >= rect.left && x <= rect.right && y >= rect.top - 1 && y <= rect.bottom + 1);
}

export default function CoffeeCursor() {
  const surface = useSyncExternalStore(subscribeToSurfaceChange, cursorSurface, serverSurface);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CoffeeCursorState>("default");
  const stateRef = useRef<CoffeeCursorState>("default");
  const motionRef = useRef({ x: 0, y: 0, inside: false, movedAt: 0, lookX: 0, lookY: 0, eyeX: 0, eyeY: 0 });

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!surface || !cursor) return;
    const root = document.documentElement;
    const previousActive = root.dataset.coffeeCursorActive;
    const finePointer = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = motionRef.current;
    const textRange = document.createRange();
    const cursorDeclarations = new WeakMap<Element, string>();
    let frame = 0;
    let lastFrame = 0;
    let pressed = false;
    let clickUntil = 0;
    let captureTarget: Element | null = null;
    let cachedTarget: Element | null = null;
    let stylesDirty = true;
    let nativeDrag = false;
    let dragState: CoffeeCursorState | null = null;
    let contextMenu = false;
    let nativeStyle = { cursor: "auto", writingMode: "horizontal-tb", userSelect: "auto", resize: "none", direction: "ltr" };

    function hide() {
      cursor!.dataset.visible = "false";
      delete root.dataset.coffeeCursorActive;
    }

    function readNativeStyle(target: Element) {
      // Read the author's actual cursor before applying our native-cursor mask.
      // Both changes happen in one JS task, so no native cursor is painted between them.
      root.dataset.coffeeCursorProbe = "true";
      try {
        const style = getComputedStyle(target);
        nativeStyle = { cursor: style.cursor, writingMode: style.writingMode, userSelect: style.userSelect, resize: style.resize, direction: style.direction };
        for (let element: Element | null = target; element; element = element.parentElement) {
          cursorDeclarations.set(element, (element as HTMLElement).style?.cursor ?? "");
        }
      } finally {
        delete root.dataset.coffeeCursorProbe;
      }
      cachedTarget = target;
      stylesDirty = false;
    }

    function resolve(target: Element): CoffeeCursorState {
      if (target !== cachedTarget || stylesDirty) readNativeStyle(target);
      const explicit = target.closest("[data-cursor]")?.getAttribute("data-cursor");
      const dragging = Boolean(target.closest("[data-dragging='true']"));
      const disabled = Boolean(target.closest(":disabled,[aria-disabled='true'],[inert]"));
      const interactive = Boolean(target.closest(interactiveSelector));
      let actualCursor = nativeStyle.cursor;
      // The UA's textarea resize handle isn't represented by its computed cursor.
      if (nativeStyle.resize !== "none") {
        const box = target.getBoundingClientRect();
        const nearEdge = nativeStyle.direction === "rtl" ? motion.x - box.left < 14 : box.right - motion.x < 14;
        if (nearEdge && box.bottom - motion.y < 14) {
          actualCursor = nativeStyle.resize === "horizontal" ? "ew-resize" : nativeStyle.resize === "vertical" ? "ns-resize"
            : nativeStyle.direction === "rtl" ? "nesw-resize" : "nwse-resize";
        }
      }
      const text = !interactive && nativeStyle.userSelect !== "none" && !parseCursor(actualCursor)
        && overText(target, motion.x, motion.y, textRange);
      return resolveCursorState({
        cursor: actualCursor,
        override: contextMenu ? "context-menu" : explicit,
        disabled,
        busy: Boolean(target.closest("[aria-busy='true']")),
        interactive,
        overText: text,
        verticalText: nativeStyle.writingMode.startsWith("vertical") || nativeStyle.writingMode.startsWith("sideways"),
        pressed,
        clickPulse: performance.now() < clickUntil,
        dragging,
        dragState: nativeDrag ? dragState : null,
      });
    }

    function render(now: number) {
      frame = 0;
      if (!motion.inside || !finePointer.matches || document.hidden || document.pointerLockElement) {
        hide();
        return;
      }
      const target = captureTarget?.isConnected ? captureTarget : document.elementFromPoint(motion.x, motion.y);
      // Embedded documents own their pointer events; restore their native cursor.
      if (!target || target.closest("iframe,object,embed,[data-native-cursor]")) {
        hide();
        return;
      }
      const next = resolve(target);
      cursor!.dataset.state = next;
      if (next !== stateRef.current) {
        stateRef.current = next;
        setState(next);
      }
      const delta = lastFrame ? Math.min(40, now - lastFrame) : 16;
      lastFrame = now;
      const looking = now - motion.movedAt < 220 && !reducedMotion.matches;
      const eyeX = looking ? motion.lookX : 0;
      const eyeY = looking ? motion.lookY : 0;
      const smoothing = reducedMotion.matches ? 1 : 1 - Math.exp(-delta / 55);
      motion.eyeX += (eyeX - motion.eyeX) * smoothing;
      motion.eyeY += (eyeY - motion.eyeY) * smoothing;
      // Position is exact, not interpolated: only the bean's gaze and lean ease.
      cursor!.style.transform = `translate3d(${motion.x - 16 * 2 / 3}px, ${motion.y - 12}px, 0)`;
      cursor!.style.setProperty("--coffee-look-x", `${motion.eyeX.toFixed(2)}px`);
      cursor!.style.setProperty("--coffee-look-y", `${motion.eyeY.toFixed(2)}px`);
      cursor!.style.setProperty("--coffee-lean", `${(motion.eyeX * 1.8).toFixed(2)}deg`);
      const offset = characterOffset(motion.x, motion.y, window.innerWidth, window.innerHeight);
      cursor!.style.setProperty("--coffee-offset-x", `${offset.x}px`);
      cursor!.style.setProperty("--coffee-offset-y", `${offset.y}px`);
      cursor!.dataset.visible = "true";
      root.dataset.coffeeCursorActive = "true";
      if (looking || now < clickUntil || Math.abs(eyeX - motion.eyeX) + Math.abs(eyeY - motion.eyeY) > 0.02) schedule();
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    function point(x: number, y: number) {
      const now = performance.now();
      if (motion.inside) {
        const elapsed = Math.max(8, now - motion.movedAt);
        const look = movementLook((x - motion.x) * 16 / elapsed, (y - motion.y) * 16 / elapsed);
        if (look.x || look.y) {
          motion.lookX = look.x;
          motion.lookY = look.y;
        }
      }
      motion.x = x;
      motion.y = y;
      motion.movedAt = now;
      motion.inside = x >= 0 && y >= 0 && x < window.innerWidth && y < window.innerHeight;
      schedule();
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") { leave(); return; }
      contextMenu = false;
      if (event.buttons === 0) { pressed = false; nativeDrag = false; dragState = null; }
      point(event.clientX, event.clientY);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") { motion.inside = false; hide(); return; }
      pressed = event.button === 0;
      if (pressed) clickUntil = performance.now() + 160;
      stylesDirty = true;
      contextMenu = false;
      point(event.clientX, event.clientY);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pressed = false;
      captureTarget = null;
      stylesDirty = true;
      point(event.clientX, event.clientY);
    };
    const onPointerCancel = () => { pressed = false; captureTarget = null; leave(); };
    const onCapture = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      captureTarget = event.target instanceof Element ? event.target : null;
      schedule();
    };
    const onReleaseCapture = () => { captureTarget = null; schedule(); };
    const onPointerOut = (event: PointerEvent) => { if (!event.relatedTarget) leave(); };
    const onContextMenu = () => { contextMenu = true; schedule(); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") leave();
      if (event.key === "Escape") { pressed = false; nativeDrag = false; dragState = null; contextMenu = false; schedule(); }
    };
    const onDragStart = () => { nativeDrag = true; dragState = "grabbing"; schedule(); };
    const onDragOver = (event: DragEvent) => {
      if (!nativeDrag) return;
      const effect = event.dataTransfer?.dropEffect;
      dragState = effect === "copy" ? "copy" : effect === "link" ? "alias" : effect === "move" ? "move" : "no-drop";
      point(event.clientX, event.clientY);
    };
    const onDragEnd = () => { nativeDrag = false; dragState = null; pressed = false; schedule(); };

    function leave() {
      motion.inside = false;
      pressed = false;
      clickUntil = 0;
      captureTarget = null;
      hide();
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
    }

    const onVisibility = () => { if (document.hidden) leave(); else schedule(); };
    const onMediaChange = () => { if (!finePointer.matches) leave(); else schedule(); };
    const onResize = () => { stylesDirty = true; schedule(); };
    const mutation = new MutationObserver((records) => {
      if (!cachedTarget) return;
      for (const record of records) {
        const element = record.target;
        if (!(element instanceof Element) || !element.contains(cachedTarget)) continue;
        if (record.attributeName === "style") {
          const declaration = (element as HTMLElement).style?.cursor ?? "";
          // Scroll/video/sticker transforms must not cause a document-wide style probe.
          if (cursorDeclarations.get(element) === declaration) continue;
          cursorDeclarations.set(element, declaration);
        }
        stylesDirty = true;
        schedule();
        break;
      }
    });
    mutation.observe(root, { subtree: true, attributes: true, attributeFilter: ["style", "class", "disabled", "inert", "aria-disabled", "aria-busy", "data-cursor", "data-dragging"] });
    document.addEventListener("pointermove", onPointerMove, { capture: true, passive: true });
    document.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
    document.addEventListener("pointerup", onPointerUp, { capture: true, passive: true });
    document.addEventListener("pointercancel", onPointerCancel, true);
    document.addEventListener("pointerout", onPointerOut, true);
    document.addEventListener("gotpointercapture", onCapture, true);
    document.addEventListener("lostpointercapture", onReleaseCapture, true);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onResize);
    document.addEventListener("focusout", onResize);
    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("pointerlockchange", schedule);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragend", onDragEnd);
    document.addEventListener("drop", onDragEnd);
    window.addEventListener("blur", leave);
    window.addEventListener("resize", onResize, { passive: true });
    finePointer.addEventListener("change", onMediaChange);
    reducedMotion.addEventListener("change", schedule);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      mutation.disconnect();
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onPointerCancel, true);
      document.removeEventListener("pointerout", onPointerOut, true);
      document.removeEventListener("gotpointercapture", onCapture, true);
      document.removeEventListener("lostpointercapture", onReleaseCapture, true);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onResize);
      document.removeEventListener("focusout", onResize);
      document.removeEventListener("scroll", schedule, true);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerlockchange", schedule);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragend", onDragEnd);
      document.removeEventListener("drop", onDragEnd);
      window.removeEventListener("blur", leave);
      window.removeEventListener("resize", onResize);
      finePointer.removeEventListener("change", onMediaChange);
      reducedMotion.removeEventListener("change", schedule);
      delete root.dataset.coffeeCursorProbe;
      if (previousActive === undefined) delete root.dataset.coffeeCursorActive;
      else root.dataset.coffeeCursorActive = previousActive;
    };
  }, [surface]);

  return surface ? createPortal(
    <div ref={cursorRef} className="coffee-cursor" data-state={state} data-visible="false" aria-hidden="true">
      <CoffeeCursorArt state={state} />
    </div>,
    surface,
  ) : null;
}
