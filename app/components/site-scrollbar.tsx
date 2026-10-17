"use client";

import { useEffect, useRef } from "react";

export default function SiteScrollbar() {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    const root = document.documentElement;
    const previous = root.dataset.customScrollbar;
    root.dataset.customScrollbar = "true";
    let frame = 0;
    let drag: { pointerId: number; offset: number } | null = null;
    const metrics = { maxScroll: 0, thumbHeight: 0, travel: 0, viewport: 0 };
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    const update = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      const viewport = root.clientHeight;
      const height = Math.max(root.scrollHeight, document.body.scrollHeight);
      const maxScroll = Math.max(0, height - viewport);
      const locked = document.body.style.overflow === "hidden" || root.style.overflow === "hidden";
      track.hidden = maxScroll === 0 || locked;
      if (track.hidden) return;

      const trackHeight = track.clientHeight;
      const thumbHeight = Math.min(trackHeight, Math.max(48, trackHeight * viewport / height));
      const travel = Math.max(0, trackHeight - thumbHeight);
      const progress = clamp(window.scrollY / maxScroll, 0, 1);
      Object.assign(metrics, { maxScroll, thumbHeight, travel, viewport });
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateY(${progress * travel}px)`;
      track.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    };

    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const scrollFromPointer = (clientY: number) => {
      if (!drag || !metrics.travel) return;
      const top = track.getBoundingClientRect().top;
      const progress = clamp((clientY - top - drag.offset) / metrics.travel, 0, 1);
      window.scrollTo({ top: progress * metrics.maxScroll, behavior: "instant" });
      update();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || track.hidden) return;
      update();
      if (track.hidden) return;
      const onThumb = thumb.contains(event.target as Node);
      drag = {
        pointerId: event.pointerId,
        offset: onThumb ? event.clientY - thumb.getBoundingClientRect().top : metrics.thumbHeight / 2,
      };
      track.dataset.dragging = "true";
      track.setPointerCapture(event.pointerId);
      track.focus({ preventScroll: true });
      if (!onThumb) scrollFromPointer(event.clientY);
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (drag?.pointerId !== event.pointerId) return;
      scrollFromPointer(event.clientY);
      event.preventDefault();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (drag?.pointerId !== event.pointerId) return;
      drag = null;
      delete track.dataset.dragging;
      if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      update();
      if (track.hidden) return;
      let top = window.scrollY;
      switch (event.key) {
        case "ArrowUp": top -= 40; break;
        case "ArrowDown": top += 40; break;
        case "PageUp": top -= metrics.viewport * 0.9; break;
        case "PageDown": top += metrics.viewport * 0.9; break;
        case "Home": top = 0; break;
        case "End": top = metrics.maxScroll; break;
        case " ": top += metrics.viewport * (event.shiftKey ? -0.9 : 0.9); break;
        default: return;
      }
      event.preventDefault();
      window.scrollTo({ top: clamp(top, 0, metrics.maxScroll), behavior: "instant" });
      update();
    };

    const resize = new ResizeObserver(scheduleUpdate);
    resize.observe(root);
    resize.observe(document.body);
    const mutation = new MutationObserver(scheduleUpdate);
    mutation.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    mutation.observe(root, { attributes: true, attributeFilter: ["style"] });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointercancel", onPointerUp);
    track.addEventListener("lostpointercapture", onPointerUp);
    track.addEventListener("keydown", onKeyDown);
    update();

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointercancel", onPointerUp);
      track.removeEventListener("lostpointercapture", onPointerUp);
      track.removeEventListener("keydown", onKeyDown);
      if (drag && track.hasPointerCapture(drag.pointerId)) track.releasePointerCapture(drag.pointerId);
      if (previous === undefined) delete root.dataset.customScrollbar;
      else root.dataset.customScrollbar = previous;
    };
  }, []);

  return (
    <div
      ref={trackRef}
      className="site-scrollbar"
      role="scrollbar"
      aria-label="Page scroll"
      aria-controls="page-root"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      tabIndex={0}
      hidden
    >
      <div ref={thumbRef} className="site-scrollbar-thumb" />
    </div>
  );
}
