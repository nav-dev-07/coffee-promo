"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import stickers from "../../public/stickers/manifest.json";
import StickerPeel from "./StickerPeel";
import "./sticker-collection.css";

type Sticker = (typeof stickers)[number];

export function CoffeeSticker({
  sticker,
  index,
  className = "",
  maxWidth = 200,
  maxHeight = 210,
  inset = 48,
  dragBounds = "parent",
}: {
  sticker: Sticker;
  index?: number;
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
  inset?: number;
  dragBounds?: "parent" | "document";
}) {
  const cellRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [width, setWidth] = useState(140);
  const aspect = sticker.height / sticker.width;

  useEffect(() => {
    const cell = cellRef.current;
    if (!cell) return;

    const resize = new ResizeObserver(([entry]) => {
      setWidth(Math.max(40, Math.min(maxWidth, entry.contentRect.width - inset, maxHeight / aspect)));
    });
    resize.observe(cell);

    // Start each sticker when its slot comes into view. Page-wide stickers stay
    // mounted so moving away from the gallery cannot reset their placement.
    const observer = new IntersectionObserver(([entry]) => {
      const inView = entry.isIntersecting && entry.intersectionRatio >= 0.55;
      // A page-wide sticker must stay mounted after it leaves its starting slot.
      setVisible(previous => dragBounds === "document" ? previous || inView : inView);
    }, { threshold: [0, 0.55] });
    observer.observe(cell);

    return () => {
      resize.disconnect();
      observer.disconnect();
    };
  }, [aspect, dragBounds, inset, maxHeight, maxWidth]);

  return (
    <div
      ref={cellRef}
      className={`sticker-cell${className ? ` ${className}` : ""}`}
      role="group"
      tabIndex={0}
      aria-label={sticker.alt}
      aria-describedby="sticker-keyboard-help"
      data-drag-bounds={dragBounds}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={() => setEngaged(false)}
      style={{
        "--sticker-ratio": aspect,
        "--sticker-max-width": `${maxWidth}px`,
        "--sticker-max-height": `${maxHeight}px`,
        "--sticker-inset": `${inset}px`,
      } as CSSProperties}
    >
      <Image
        className="sticker-fallback"
        src={sticker.src}
        alt=""
        width={sticker.width}
        height={sticker.height}
        draggable={false}
        unoptimized
      />
      {(visible || engaged) && (
        <StickerPeel
          imageSrc={sticker.src}
          width={width}
          finish="gloss"
          peelBackHoverPct={25}
          peelBackActivePct={40}
          rotate={0}
          peelDirection={0}
          curlRadius={12}
          backColor="#d4d4d8"
          lightingIntensity={0.5}
          shadowIntensity={0.6}
          followPointer
          swing={1}
          friction={0.5}
          bounce={0.35}
          draggable
          dragBounds={dragBounds}
          intro
        />
      )}
      {index !== undefined && <span className="sticker-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>}
    </div>
  );
}

export default function StickerCollection() {
  const [edition, setEdition] = useState(0);
  const collectionStickers = stickers.filter(sticker => !["coffee-first", "coffee-bag"].includes(sticker.id));

  return (
    <section className="sticker-section section-padding" id="sticker-corner" aria-labelledby="sticker-heading">
      <div className="section-heading sticker-heading">
        <div>
          <p className="eyebrow">A FEW OF OUR FAVOURITE LITTLE THINGS</p>
          <h2 id="sticker-heading">A little <em>coffee joy.</em></h2>
        </div>
        <div className="sticker-intro">
          <p className="section-intro">For the coffee lovers & the little-moment collectors.<br />Hover to peel. Drag a little joy anywhere on the site.</p>
          <a className="text-link" href="#sticker-board">Explore {collectionStickers.length} more <span aria-hidden="true">↴</span></a>
        </div>
      </div>

      <div className="sticker-board" id="sticker-board">
        <div className="sticker-board-toolbar">
          <span className="sticker-count"><span aria-hidden="true">✳</span> THE COFFEE COLLECTION <span> / {collectionStickers.length} STICKERS</span></span>
          <button type="button" className="sticker-reset" onClick={() => setEdition(current => current + 1)}>
            <span aria-hidden="true">↺</span> Start fresh
          </button>
        </div>
        <p className="sticker-screen-reader" id="sticker-keyboard-help">Press Enter or Space to peel a sticker, use the arrow keys to move it, and Escape to put it back.</p>
        <div className="sticker-grid" key={edition}>
          {collectionStickers.map((sticker, index) => <CoffeeSticker sticker={sticker} index={index} dragBounds="document" key={sticker.id} />)}
          <div className="sticker-endnote" aria-hidden="true"><span>Made for<br /><em>slow days.</em></span><span className="sticker-endnote-heart">♡</span></div>
        </div>
        <div className="sticker-board-footer"><span>{stickers.length} LITTLE REASONS TO SLOW DOWN.</span><span>Peel, play & stay awhile. ♡</span></div>
      </div>
    </section>
  );
}
