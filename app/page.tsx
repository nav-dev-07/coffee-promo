import Image from "next/image";
import coffeeCupPhoto from "../public/coffee-latte-full-cup.webp";
import { Arrow, BeanMark, Wordmark } from "./components/brand";
import BrewGuide from "./components/brew-guide";
import CoffeeStory from "./components/coffee-story";
import StickerCollection, { CoffeeSticker } from "./components/sticker-collection";
import stickers from "../public/stickers/manifest.json";

const manifestoSticker = stickers.find(sticker => sticker.id === "coffee-first");

const coffees = [
  {
    number: "01",
    name: "Daybreak",
    mood: "FOR THE EARLY LITTLE MOMENTS",
    notes: "Milk chocolate · Caramel · Orange",
    origin: "Brazil & Colombia",
    roast: "Medium roast",
    color: "terracotta",
    label: "Your everyday, elevated.",
  },
  {
    number: "02",
    name: "Sunday Kind",
    mood: "FOR TAKING THE LONG WAY HOME",
    notes: "Stone fruit · Honey · Bergamot",
    origin: "Ethiopia",
    roast: "Light roast",
    color: "olive",
    label: "A brighter state of mind.",
  },
  {
    number: "03",
    name: "After Hours",
    mood: "FOR ONE MORE CHAPTER",
    notes: "Dark chocolate · Hazelnut · Brown sugar",
    origin: "Colombia",
    roast: "Decaf, full of character",
    color: "cocoa",
    label: "All the feeling. Less caffeine.",
  },
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <a href="#" className="brand-link" aria-label="Slow coffee home">
          <Wordmark />
          <span className="brand-descriptor">COFFEE &<br />LITTLE MOMENTS</span>
        </a>
        <a className="header-cta" href="#coffee">Find your coffee <Arrow diagonal /></a>
      </header>

      <main id="main-content">
        <CoffeeStory />

        <section className="manifesto section-padding" id="our-way" aria-labelledby="manifesto-heading">
          <div className="eyebrow"><span className="little-star">✳</span> LESS HURRY. MORE HAPPY.</div>
          <h2 id="manifesto-heading">The world moves fast.<br />Your coffee <em>doesn’t have to.</em></h2>
          <div className="manifesto-sticker-group">
            {manifestoSticker && (
              <CoffeeSticker
                sticker={manifestoSticker}
                className="manifesto-sticker"
                maxWidth={150}
                maxHeight={230}
                inset={16}
                dragBounds="document"
              />
            )}
            <span className="handwritten">Stay a little longer. <span aria-hidden="true">↴</span></span>
          </div>
          <div className="manifesto-bottom">
            <p>We believe the best part of your day might just be the part where you pause. So we make coffee worth pausing for.</p>
          </div>
        </section>

        <section className="coffee-section section-padding" id="coffee" aria-labelledby="coffee-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">GOOD COFFEE. YOUR WAY.</p>
              <h2 id="coffee-heading">Meet your <em>daily ritual.</em></h2>
            </div>
            <p className="section-intro">Different personalities. The same lovely intention.<br />Find the one that feels like you.</p>
          </div>
          <div className="coffee-grid">
            {coffees.map((coffee) => (
              <article className={`coffee-card ${coffee.color}`} key={coffee.number}>
                <div className="coffee-card-art">
                  <span className="card-edition">THE EVERYDAY COLLECTION</span>
                  <span className="card-number">Nº {coffee.number}</span>
                  <div className="coffee-bag" aria-hidden="true">
                    <div className="bag-seam" />
                    <div className="bag-label">
                      <span className="bag-brand">slow.</span>
                      <BeanMark className="bag-bean" />
                      <span className="bag-coffee-name">{coffee.name}</span>
                      <span className="bag-origin">{coffee.origin}</span>
                      <span className="bag-footer">A LITTLE RITUAL. A BETTER DAY.<br />250g — WHOLE BEAN</span>
                    </div>
                  </div>
                  <span className="card-art-caption">{coffee.label}</span>
                </div>
                <div className="coffee-card-details">
                  <p className="eyebrow">{coffee.mood}</p>
                  <div className="coffee-name-row"><h3>{coffee.name}</h3><a href="#brew-guide" aria-label={`Explore brewing methods for ${coffee.name}`}><Arrow diagonal /></a></div>
                  <p className="tasting-notes">{coffee.notes}</p>
                  <div className="coffee-meta"><span>{coffee.origin}</span><span>{coffee.roast}</span></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="moment-section" aria-labelledby="moment-heading">
          <div className="moment-image">
            <Image src={coffeeCupPhoto} alt="A complete white ceramic cup of coffee with leaf-shaped latte art, its handle and saucer visible on a warm wooden table" fill sizes="(max-width: 760px) 100vw, 50vw" quality={90} />
          </div>
          <div className="moment-copy">
            <BeanMark className="moment-bean" />
            <p className="eyebrow">IT’S NEVER JUST COFFEE.</p>
            <h2 id="moment-heading">It’s the first sip.<br />The deep breath.<br />The <em>here and now.</em></h2>
            <p>Before the inbox. Between the big things. Over a conversation that runs a little long. There’s a little good in slowing down.</p>
            <a className="text-link light-link" href="#brew-guide">Make a moment of it <Arrow diagonal /></a>
          </div>
        </section>

        <BrewGuide />
        <StickerCollection />
      </main>

      <footer className="site-footer section-padding">
        <div className="footer-top"><p>Good days.<br /><em>One cup at a time.</em></p><a className="back-to-top" href="#ritual" aria-label="Back to the top"><Arrow /></a></div>
        <div className="footer-bottom"><a href="#" aria-label="Slow coffee home"><Wordmark /></a><span>A LITTLE RITUAL. A BETTER DAY.</span><span>© 2026 SLOW COFFEE</span></div>
      </footer>
    </>
  );
}
