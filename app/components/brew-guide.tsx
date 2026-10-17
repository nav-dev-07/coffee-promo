"use client";

import { useRef, useState } from "react";
import stickers from "../../public/stickers/manifest.json";
import { CoffeeSticker } from "./sticker-collection";

const coffeeBagSticker = stickers.find(sticker => sticker.id === "coffee-bag");

const guides = [
  {
    name: "Pour-over",
    subtitle: "A little patience. A beautifully clear cup.",
    ratio: "1 : 16",
    temperature: "94°C",
    time: "3–4 min",
    steps: [
      ["Make a little space.", "Rinse your paper filter with hot water. Add 20g of medium-ground coffee. Take a breath."],
      ["Let it come alive.", "Pour in 40g of water and wait 30 seconds. This little bloom lets your coffee open up."],
      ["Find your flow.", "Slowly pour in circles until you reach 320g of water. Let it draw down, then enjoy every sip."],
    ],
  },
  {
    name: "French press",
    subtitle: "Full-bodied comfort. Wonderfully uncomplicated.",
    ratio: "1 : 15",
    temperature: "94°C",
    time: "4–5 min",
    steps: [
      ["Start with the good stuff.", "Warm your French press. Add 30g of coarsely ground coffee and make yourself comfortable."],
      ["Give it some time.", "Add 450g of hot water, stir gently, and let it steep for four minutes. No rushing necessary."],
      ["Easy does it.", "Press the plunger slowly. Pour all the coffee into your cup or a carafe, and settle into the moment."],
    ],
  },
  {
    name: "Espresso",
    subtitle: "A small cup. A wonderfully big feeling.",
    ratio: "1 : 2",
    temperature: "93°C",
    time: "25–30 sec",
    steps: [
      ["Set the scene.", "Warm your machine and cup. Finely grind 18g of coffee into a clean, dry portafilter."],
      ["A little intention.", "Distribute the grounds evenly, then tamp level with steady pressure. Lock the portafilter in place."],
      ["The lovely part.", "Aim for 36g of espresso in 25–30 seconds. Taste, adjust your grind if needed, and make it yours."],
    ],
  },
];

export default function BrewGuide() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <section className="brew-section section-padding" id="brew-guide" aria-labelledby="brew-heading">
      <div className="brew-intro">
        <p className="eyebrow">MAKE A LITTLE TIME FOR GOOD.</p>
        <h2 id="brew-heading">Your kitchen.<br />Your café.<br /><em>Your kind of slow.</em></h2>
        <p>No fancy rituals required. Just good coffee, a little care, and a few minutes that belong to you.</p>
        <div className="brew-sticker-group">
          <span className="brew-note">A good place to begin <span aria-hidden="true">↗</span></span>
          {coffeeBagSticker && (
            <CoffeeSticker
              sticker={coffeeBagSticker}
              className="brew-bag-sticker"
              maxWidth={160}
              maxHeight={250}
              inset={16}
              dragBounds="document"
            />
          )}
        </div>
      </div>
      <div className="brew-guide">
        <div className="brew-tabs" role="tablist" aria-label="Choose a brewing method">
          {guides.map((item, index) => (
            <button key={item.name} ref={(element) => { tabs.current[index] = element; }} role="tab" id={`brew-tab-${index}`} aria-selected={active === index} aria-controls={`brew-panel-${index}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % guides.length;
              else if (event.key === "ArrowLeft") next = (index - 1 + guides.length) % guides.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = guides.length - 1;
              else return;
              event.preventDefault();
              setActive(next);
              tabs.current[next]?.focus();
            }}>{item.name}</button>
          ))}
        </div>
        {guides.map((guide, index) => <div key={guide.name} role="tabpanel" id={`brew-panel-${index}`} aria-labelledby={`brew-tab-${index}`} hidden={active !== index} tabIndex={0} className="brew-panel">
          <p className="brew-subtitle">{guide.subtitle}</p>
          <dl className="brew-stats"><div><dt>COFFEE : WATER</dt><dd>{guide.ratio}</dd></div><div><dt>WATER TEMPERATURE</dt><dd>{guide.temperature}</dd></div><div><dt>A LITTLE TIME</dt><dd>{guide.time}</dd></div></dl>
          <ol className="brew-steps">{guide.steps.map(([title, text], index) => <li key={title}><span className="step-number">0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
          <p className="brew-footnote">A starting point, not a rulebook. The best cup is the one you love.</p>
        </div>)}
      </div>
    </section>
  );
}
