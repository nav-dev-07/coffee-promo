"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Arrow } from "./brand";
import FilmPlayer from "./film-player";

const chapters = [
  {
    label: "01 — A BEAUTIFUL BEGINNING",
    title: <>WAKE<br />THE<br />BEANS</>,
    cta: "Discover the ritual",
  },
  {
    label: "02 — A LITTLE TRANSFORMATION",
    title: <>LET<br />IT<br />BLOOM</>,
    cta: "Stay in the moment",
  },
  {
    label: "03 — YOUR MOMENT IS READY",
    title: <>TIME<br />TASTES<br />BETTER</>,
    cta: "Find your coffee",
  },
];

export default function CoffeeStory() {
  const storyRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const viewport = storyRef.current?.querySelector<HTMLElement>(".story-viewport");
    const copy = viewport?.querySelector<HTMLElement>(".story-copy");
    const chapter = copy?.querySelector<HTMLElement>(".story-chapter");
    const heading = chapter?.querySelector<HTMLElement>(".story-heading");
    if (!viewport || !copy || !chapter || !heading) return;

    const alignStamp = () => {
      // Layout offsets ignore the chapter's scroll-animation transforms.
      let center = heading.offsetHeight / 2;
      let element: HTMLElement | null = heading;
      while (element && element !== viewport) {
        center += element.offsetTop;
        element = element.offsetParent as HTMLElement | null;
      }
      viewport.style.setProperty("--stamp-center-y", `${center}px`);
    };

    alignStamp();
    const observer = new ResizeObserver(alignStamp);
    [viewport, copy, chapter, heading].forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const story = storyRef.current;
    const video = videoRef.current;
    if (!story || !video) return;

    let progress = 0;
    let disposed = false;
    const seekToProgress = () => {
      if (disposed || !Number.isFinite(video.duration) || video.readyState < 1 || video.seeking) return;
      const target = progress * Math.max(0, video.duration - 1 / 24);
      // Coalesce seeks: always render the latest scroll position, rather than queueing stale frames.
      if (Math.abs(video.currentTime - target) > 1 / 48) video.currentTime = target;
    };
    const markReady = () => {
      story.dataset.ready = "true";
      seekToProgress();
    };
    const markError = () => { story.dataset.videoError = "true"; };
    video.addEventListener("loadedmetadata", seekToProgress);
    video.addEventListener("loadeddata", markReady);
    video.addEventListener("seeked", seekToProgress);
    video.addEventListener("error", markError);
    if (video.readyState >= 2) markReady();
    if (video.error) markError();

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const panels = gsap.utils.toArray<HTMLElement>(".story-chapter", story);
      const fill = story.querySelector(".story-progress-fill");
      const counter = story.querySelector(".chapter-current");
      const playhead = { value: 0 };
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: story,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.65,
          invalidateOnRefresh: true,
        },
      });
      timelineRef.current = timeline;
      timeline.to(playhead, {
        value: 1,
        duration: 1,
        ease: "none",
        onUpdate: () => {
          progress = playhead.value;
          seekToProgress();
          if (fill) (fill as HTMLElement).style.transform = `scaleX(${progress})`;
          if (counter) counter.textContent = progress < 0.3 ? "01" : progress < 0.66 ? "02" : "03";
        },
      }, 0);
      timeline.to(panels[0], { autoAlpha: 0, y: -25, duration: 0.055 }, 0.245);
      timeline.fromTo(panels[1], { autoAlpha: 0, y: 25 }, { autoAlpha: 1, y: 0, duration: 0.065 }, 0.3);
      timeline.to(panels[1], { autoAlpha: 0, y: -25, duration: 0.055 }, 0.605);
      timeline.fromTo(panels[2], { autoAlpha: 0, y: 25 }, { autoAlpha: 1, y: 0, duration: 0.065 }, 0.66);
      return () => { timelineRef.current = null; };
    });

    return () => {
      disposed = true;
      media.revert();
      video.removeEventListener("loadedmetadata", seekToProgress);
      video.removeEventListener("loadeddata", markReady);
      video.removeEventListener("seeked", seekToProgress);
      video.removeEventListener("error", markError);
    };
  }, []);

  function advanceChapter(index: number) {
    const trigger = timelineRef.current?.scrollTrigger;
    if (!trigger) {
      document.getElementById("coffee")?.scrollIntoView({ behavior: "instant" });
      return;
    }
    const nextProgress = index === 0 ? 0.42 : 0.8;
    window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * nextProgress, behavior: "smooth" });
  }

  return (
    <section ref={storyRef} className="scroll-story" id="ritual" aria-label="From bean to cup: a scroll-driven coffee ritual">
      <div className="story-viewport">
        <div className="hero-topline"><span><i /> A SLOWER KIND OF EVERYDAY</span><span>GOOD COFFEE. NO RUSH.</span></div>
        <div className="film-stage" aria-hidden="true">
          <video ref={videoRef} className="scroll-video" preload="auto" muted playsInline poster="/coffee-poster.jpg" disablePictureInPicture>
            <source src="/coffee-scroll.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="story-copy">
          {chapters.map((chapter, index) => (
            <div className="story-chapter" key={chapter.label}>
              <p className="eyebrow chapter-label">{chapter.label}</p>
              {index === 0 ? <h1 className="story-heading">{chapter.title}</h1> : <h2 className="story-heading">{chapter.title}</h2>}
              {index < 2 ? (
                <button className="pill-button" onClick={() => advanceChapter(index)}>{chapter.cta}<span className="button-arrow"><Arrow /></span></button>
              ) : (
                <a className="pill-button" href="#coffee">{chapter.cta}<span className="button-arrow"><Arrow diagonal /></span></a>
              )}
            </div>
          ))}
        </div>
        <div className="coffee-stamp" aria-hidden="true">
          <svg viewBox="0 0 120 120"><defs><path id="stamp-circle" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0" /></defs><text textLength="276"><textPath href="#stamp-circle">GOOD THINGS TAKE A LITTLE TIME · </textPath></text></svg>
          <span><span>take</span><em>it slow.</em></span>
        </div>
        <div className="story-bottom">
          <FilmPlayer />
          <div className="story-counter" aria-hidden="true"><span className="chapter-current">01</span><span className="story-progress-track"><span className="story-progress-fill" /></span><span>03</span></div>
        </div>
        <span className="media-status" role="status">Preparing your little moment…</span>
      </div>

    </section>
  );
}
