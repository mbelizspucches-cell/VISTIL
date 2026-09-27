# VISTIL — Shopify theme

A conversion-focused DTC storefront theme for **VISTIL**, built on top of
[Shopify Dawn](https://github.com/Shopify/dawn) (Liquid, JSON templates,
Online Store 2.0 sections). Mobile-first, fully editable from the Shopify
Theme Editor, minimal vanilla JavaScript, no build step, minimal app
dependency.

## Architecture

Dawn's own sections/snippets/assets are kept untouched so the theme can still
pull upstream Dawn fixes. All new, brand-specific work lives in files
prefixed `vistil-`:

| Layer | Files |
| --- | --- |
| Sections | `sections/vistil-*.liquid` |
| Section styles | `assets/section-vistil-*.css` |
| Shared styles | `assets/vistil-theme.css` |
| Behaviour (vanilla JS, custom elements) | `assets/vistil-*.js` |

Every `vistil-*` section follows Dawn's own conventions: a `color_scheme`
setting, `padding_top`/`padding_bottom` range settings, and (where relevant)
`scroll-trigger animate--slide-in` classes, which Dawn's existing
`animations.js` already animates for free — no extra JS needed.

### The product page (`templates/product.json`)

The section order follows a conversion-funnel anatomy — capture → convince →
close — not just an arbitrary stack of blocks. Every section answers a
specific customer question or removes a specific objection:

| # | Section (in page order) | Funnel phase | Implementation |
| --- | --- | --- | --- |
| 1 | Announcement bar | Capture | Dawn stock `sections/announcement-bar.liquid` (`sections/header-group.json`) |
| 2 | Header | Capture | Dawn stock `sections/header.liquid` (VISTIL wordmark fallback) |
| 3 | Product hero | Capture | Dawn `sections/main-product.liquid` + VISTIL blocks: `vistil_urgency` (urgency bar), `vistil_text` (eyebrow / subheadline / body / microcopy), `vistil_heading` (the page h1 — product title block set to h2), `vistil_checklist` (quick benefits). A disabled alternative headline block is kept for A/B tests |
| 4 | Value proposition | Convince | `sections/vistil-value-proposition.liquid` — 4 benefits with VISTIL icons (`assets/icon-suction.svg`, `icon-uv-light.svg`, `icon-filter-grid.svg`, `icon-handheld.svg`) |
| 5 | Central statement | Convince | Dawn stock `sections/rich-text.liquid` (`characteristics`) |
| 6–8 | Pack selector + CTA + microcopy | Convince | `sections/vistil-offer.liquid` — 1× / 2× packs, prices computed from the real variant price |
| 9 | FAQ / objections | Convince | Dawn stock `sections/collapsible-content.liquid` (8 questions) |
| 10 | Demonstration | Convince | `sections/vistil-transformation.liquid` — optional looping video, before/after slider and usage images (nothing renders until real media is uploaded) |
| 11 | Trust | Close | `sections/vistil-trust-guarantee.liquid` — 4 trust items, the approved guarantee + shipping photos, closing line |
| 12 | Proof | Close | `sections/vistil-reviews.liquid` — factual proof cards until real reviews exist (add `review` blocks later, no app needed) |
| 13 | What's in the box | Close | `sections/vistil-benefits.liquid` (`unboxing`) |
| 14 | Final CTA | Close | `sections/vistil-final-cta.liquid` |
| — | Disclosures, related products | (Dawn utility) | Dawn stock `disclosures` / `related-products` |
| 15 | Sticky Add to Cart | Close | `sections/vistil-sticky-atc.liquid` — shows once the hero CTA has scrolled away, hides while another VISTIL CTA is on screen |

`templates/product.json` is the default template for every product. When a
second VISTIL product arrives (Glass, Air…), duplicate it as
`templates/product.<name>.json` and assign it to that product, since the hero
and section copy are VISTIL Fabric-specific. Product names in pack labels and
the sticky bar come from `product.title`.

The brand palette (Warm White, Charcoal, Deep Green, Sage, Soft Grey, Stone
Beige) is applied through Dawn's color schemes (`config/settings_data.json`)
and exposed as `--vistil-*` tokens in `layout/theme.liquid`.

All `vistil-*` sections are reusable: add any of them to any other JSON
template from the Theme Editor and it will just work.

### Pack pricing

A pack only sets the quantity on Dawn's product form, so the cart always
charges `quantity × variant price`. To sell the 2× pack at a real discount,
first create an automatic discount in Shopify (Discounts → minimum quantity 2),
then enter the same amount in the pack's "Pack discount (€)" field: the page
then shows the struck-through price and an "Ahorra X" badge. Leave it empty
until that discount exists.

### No fabricated content

Per the brief, nothing in this repo invents reviews, ratings, sale counts,
discounts, guarantee terms, or medical/certification claims. Every setting
that would otherwise show a concrete number or claim ships with either a
real, generic, always-true statement (e.g. "Secure checkout") or a
`[PLACEHOLDER: ...]` value and an editor `info` hint — both in the
`templates/product.json` preset content and in each section's own schema
defaults (so a merchant dragging in a fresh block never sees fake data
either). Search the repo for `PLACEHOLDER` before launch and replace every
instance with real copy, or delete the block/section if it doesn't apply.

### How the custom sections talk to Dawn's cart logic

Dawn's real add-to-cart logic lives entirely inside `sections/main-product.liquid`
(the `<product-form>` custom element in `assets/product-form.js`, which
already handles the fetch call, cart drawer/notification, and error states).
Every VISTIL CTA (offer, sticky bar, final CTA) is a `<vistil-atc-button>`
(`snippets/vistil-atc-button.liquid` + `assets/vistil-product-bridge.js`) that:

1. Locates the real product form: `product-info[id^="MainProduct-"]`.
2. Sets its quantity input when a pack is selected, then clicks its real submit button.
3. Mirrors availability from Dawn's `variant-change` pub/sub event (filtered by
   `event.data.sectionId`), and shows Dawn's `cart-error` message next to the
   button that was clicked.

Cart behaviour, error handling and cart-drawer integration stay in one place
(Dawn's own code); the VISTIL sections are presentation + delegation only.

## Local development

This theme has no build step. Use the [Shopify CLI](https://shopify.dev/docs/themes/tools/cli):

```bash
npm install -g @shopify/cli
shopify theme dev --store your-store.myshopify.com
```

`shopify theme dev` serves the theme locally with hot reload against a real
store, so the Theme Editor, cart, and checkout all work as they would in
production.

## Deploying via GitHub → Shopify

This repository is meant to be connected directly to a Shopify store's theme,
not deployed to Vercel or any other host — Liquid templates only render
inside Shopify.

1. In the Shopify admin, go to **Online Store → Themes → Add theme → Connect from GitHub**.
2. Select this repository (`mbelizspucches-cell/VISTIL`) and the branch to track (e.g. `main`).
3. Shopify creates a theme that auto-updates on every push to that branch.
   Use a separate branch (e.g. `staging`) connected to an unpublished theme
   for review before merging to `main`/production.

Alternatively, push directly from the CLI:

```bash
shopify theme push --store your-store.myshopify.com
```

## Adding a new VISTIL section

1. Copy the closest existing `sections/vistil-*.liquid` file as a starting point.
2. Reuse `assets/vistil-theme.css` classes (`.vistil-eyebrow`, `.vistil-heading`,
   `.vistil-grid`, `.vistil-button`, etc.) before writing new CSS.
3. Reuse Dawn's built-in icon set via `{% render 'icon-accordion', icon: '...' %}`
   (see `assets/icon-*.svg` for the full list) instead of adding new SVGs.
4. Keep all copy/settings editable — no hardcoded marketing copy in Liquid.
