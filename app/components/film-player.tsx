"use client";

import { useEffect, useRef, useState } from "react";

export default function FilmPlayer() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const restoreOverflowRef = useRef("");
  const expandedRequestedRef = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const [mediaCursor, setMediaCursor] = useState<"pointer" | "progress" | "wait">("pointer");

  useEffect(() => {
    const dialog = dialogRef.current;
    const surface = surfaceRef.current;
    const video = videoRef.current;
    let wasFullscreen = false;

    const onFullscreenChange = () => {
      if (surface && document.fullscreenElement === surface) {
        wasFullscreen = true;
        // A fullscreen request may finish after the user minimizes or closes.
        if (!expandedRequestedRef.current || !dialog?.open) {
          void document.exitFullscreen().catch(() => {});
        }
      } else if (wasFullscreen) {
        wasFullscreen = false;
        expandedRequestedRef.current = false;
        setExpanded(false);
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      expandedRequestedRef.current = false;
      video?.pause();
      if (dialog?.open) document.body.style.overflow = restoreOverflowRef.current;
      if (surface && document.fullscreenElement === surface) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  function expandFilm() {
    const dialog = dialogRef.current;
    const surface = surfaceRef.current;
    if (!dialog?.open || !surface) return;
    expandedRequestedRef.current = true;
    setExpanded(true);
    // Keep this request directly in the click handler to retain user activation.
    // The viewport-sized dialog also covers browsers without the Fullscreen API.
    // Fullscreen the content wrapper: the Fullscreen API excludes <dialog>.
    if (surface.requestFullscreen && document.fullscreenElement !== surface) {
      void surface.requestFullscreen().catch(() => {});
    }
  }

  function openFilm() {
    const dialog = dialogRef.current;
    const video = videoRef.current;
    if (!dialog || dialog.open) return;
    restoreOverflowRef.current = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    expandFilm();
    if (video) {
      video.currentTime = 0;
      void video.play().catch(() => { /* Native playback controls remain available. */ });
    }
  }

  function minimizeFilm() {
    expandedRequestedRef.current = false;
    setExpanded(false);
    if (surfaceRef.current && document.fullscreenElement === surfaceRef.current) {
      void document.exitFullscreen().catch(() => {});
    }
  }

  function onFilmClose() {
    minimizeFilm();
    videoRef.current?.pause();
    document.body.style.overflow = restoreOverflowRef.current;
    triggerRef.current?.focus({ preventScroll: true });
  }

  function closeFilm() {
    // Stop playback immediately, including when fullscreen exit is asynchronous.
    videoRef.current?.pause();
    expandedRequestedRef.current = false;
    dialogRef.current?.close();
  }

  return (
    <>
      <button ref={triggerRef} type="button" className="watch-film" onClick={openFilm} aria-haspopup="dialog">
        <span className="play-icon" aria-hidden="true">▶</span> Watch the film <span className="film-duration">00:10</span>
      </button>
      <dialog
        ref={dialogRef}
        className="film-dialog"
        data-expanded={expanded}
        onClose={onFilmClose}
        onCancel={(event) => { event.preventDefault(); closeFilm(); }}
        onClick={(event) => { if (event.target === event.currentTarget) closeFilm(); }}
        aria-labelledby="film-title"
      >
        <div ref={surfaceRef} className="film-dialog-content">
          <div className="film-dialog-heading">
            <h2 id="film-title">A little ritual. A better day.</h2>
            <div className="film-dialog-actions">
              <button
                type="button"
                className="film-size-toggle"
                data-cursor={expanded ? "zoom-out" : "zoom-in"}
                onClick={expanded ? minimizeFilm : expandFilm}
                aria-label={expanded ? "Minimize film" : "Fullscreen film"}
                title={expanded ? "Minimize film" : "Fullscreen film"}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                  <path d={expanded ? "M4 9h5V4m11 5h-5V4M4 15h5v5m11-5h-5v5" : "M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"} />
                </svg>
                <span>{expanded ? "Minimize" : "Fullscreen"}</span>
              </button>
              <button type="button" className="film-close" onClick={closeFilm} aria-label="Close film">✕</button>
            </div>
          </div>
          <video
            ref={videoRef}
            controls
            controlsList="nofullscreen"
            playsInline
            preload="none"
            poster="/coffee-latte.webp"
            data-cursor={mediaCursor}
            aria-busy={mediaCursor !== "pointer"}
            onLoadStart={() => setMediaCursor("progress")}
            onWaiting={() => setMediaCursor("wait")}
            onCanPlay={() => setMediaCursor("pointer")}
            onPlaying={() => setMediaCursor("pointer")}
            onPause={() => setMediaCursor("pointer")}
            onError={() => setMediaCursor("pointer")}
            aria-label="Ten-second coffee commercial, from a roasted bean to a freshly made latte"
          >
            <source src="/coffee-commercial.mp4" type="video/mp4" />
            Your browser does not support embedded video. <a href="/coffee-commercial.mp4">Watch the coffee film.</a>
          </video>
          <p>A roasted coffee bean falls into a cup of milk, swirls into coffee, and becomes a warm latte with leaf-shaped foam art.</p>
        </div>
      </dialog>
    </>
  );
}
