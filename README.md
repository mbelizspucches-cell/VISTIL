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
| 2 | Header | Capture | Dawn stock `sections/header.liquid` |
| 3 | Product hero | Capture | Dawn stock `sections/main-product.liquid` — gallery/video, title, price, variant picker, quick benefits (`icon_with_text` block available), buy buttons |
| 4 | Social proof (initial) | Capture | `sections/vistil-social-proof.liquid` — stats and/or press logos |
| 5 | What it is / what it does | Capture | Dawn stock `sections/rich-text.liquid`, presets as `characteristics` |
| 6 | Quick scannable benefits | Convince | `sections/vistil-value-proposition.liquid` — icon + heading + text grid |
| 7–9 | Offer/pricing + main CTA + micro-proof | Convince | `sections/vistil-offer.liquid` — quantity tiers, its own Add to Cart button, and a reassurance line right under it |
| 10 | Objection-handling accordion | Convince | Dawn stock `sections/collapsible-content.liquid`, presets an 8-row FAQ (usage, shipping, contents, materials, size, guarantee, returns, other) |
| 11 | Demonstration / transformation | Convince | `sections/vistil-transformation.liquid` — draggable before/after image slider |
| 12 | Trust + guarantee | Close | `sections/vistil-trust-guarantee.liquid` |
| 13 | Final reviews | Close | `sections/vistil-reviews.liquid` — manually curated, no review-app dependency |
| — | Shipping/returns disclosures, related products | (Dawn utility, not part of the funnel) | Dawn stock `disclosures` / `related-products`, kept as-is |
| 14 | Sticky Add to Cart | Close (always present) | `sections/vistil-sticky-atc.liquid` — mobile-first fixed bar |

`sections/vistil-benefits.liquid` (alternating image/text rows) was built as
part of the original component library and is still available to drag into
any template from the Theme Editor, but it isn't part of the default
product-page flow above, since it isn't one of the funnel's required steps.

All `vistil-*` sections are reusable: add any of them to any other JSON
template from the Theme Editor and it will just work.

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
Rather than duplicating that logic, `vistil-offer` and `vistil-sticky-atc`:

1. Locate the real product form at runtime: `document.querySelector('product-info[id^="MainProduct-"]')`.
2. Set its quantity input (if relevant) and click its real submit button.
3. Listen for Dawn's own `variant-change` pub/sub event (`assets/constants.js`,
   `assets/pubsub.js`) to mirror price/availability, filtering by
   `event.data.sectionId` so quick-add modals for other products never leak in.

This keeps cart behaviour, error handling, and cart-drawer integration in one
place (Dawn's own code) and the custom sections are pure presentation +
delegation.

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
