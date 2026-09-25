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

| Spec item | Implementation |
| --- | --- |
| Announcement bar | Dawn stock `sections/announcement-bar.liquid` (in `sections/header-group.json`) |
| Clean header | Dawn stock `sections/header.liquid` |
| Product hero | Dawn stock `sections/main-product.liquid` — gallery + title/price/variant picker/buy buttons, configured via the `main` blocks |
| Social proof strip | `sections/vistil-social-proof.liquid` — stat counters and/or press logos |
| Value proposition | `sections/vistil-value-proposition.liquid` — icon + heading + text grid |
| Benefits | `sections/vistil-benefits.liquid` — alternating image/text rows with bullet points |
| Product offer / pricing | `sections/vistil-offer.liquid` — quantity-tier bundle picker |
| Main Add to Cart CTA | Dawn's `buy_buttons` block inside the Product hero |
| Objection-handling accordions | Dawn stock `sections/collapsible-content.liquid`, preset as an FAQ |
| Product demonstration / transformation | `sections/vistil-transformation.liquid` — draggable before/after image slider |
| Trust and guarantee | `sections/vistil-trust-guarantee.liquid` |
| Reviews | `sections/vistil-reviews.liquid` — manually curated, no review-app dependency |
| Sticky Add to Cart | `sections/vistil-sticky-atc.liquid` — mobile-first fixed bar |

All of the above are reusable: add any `vistil-*` section to any other JSON
template from the Theme Editor and it will just work.

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
