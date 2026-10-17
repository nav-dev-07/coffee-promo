This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Coffee-bean cursor

The global `CoffeeCursor` component implements the approved **Roasted Original** family as layered SVG: 36 states, movement-directed eyes, blinking, click squashes, animated hands, loading rings, and directional indicators. Its position follows the mouse exactly; only the gaze and character lean are eased. It portals into open dialogs / fullscreen surfaces so it also works in the film player.

Standard CSS `cursor` keywords are detected automatically, including inline changes. Links, selectable text, disabled controls, `aria-busy`, sticker dragging, and the page scrollbar also resolve automatically. To specify an interaction explicitly:

```tsx
<button data-cursor="help">Help</button>
<div data-cursor="nwse-resize">Resize handle</div>
<div data-cursor="none">Intentionally hide the cursor here</div>
```

Use any standard CSS cursor keyword, or `pressed`, in `data-cursor`. `auto` follows the element's normal semantics. A `data-dragging="true"` ancestor selects the grabbing state. `data-native-cursor` provides an opt-out for embedded/native interaction surfaces.

The native cursor is hidden only while a working mouse-driven custom cursor is present. Touch input, leaving the page, and embedded documents retain their normal behavior. Reduced-motion preferences disable decorative animation. Browser chrome, operating-system menus, and native popup UI remain controlled by the browser.

Run the non-browser state and gaze tests with `npm run test:cursor` (Node.js 22.18+).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
