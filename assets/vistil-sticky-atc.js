if (!customElements.get('vistil-sticky-atc')) {
  customElements.define(
    'vistil-sticky-atc',
    class VistilStickyATC extends HTMLElement {
      connectedCallback() {
        if (!window.VistilProduct) return;

        this.priceEl = this.querySelector('[data-vistil-sticky-price]');
        this.titleEl = this.querySelector('[data-vistil-sticky-title]');
        this.imageEl = this.querySelector('.vistil-sticky-atc__thumb');
        this.productTitle = this.dataset.productTitle;
        this.unitPriceHtml = this.priceEl?.innerHTML;
        this.hasOffer = Boolean(document.querySelector('vistil-offer'));

        this.onPackChange = (event) => this.applyPack(event.detail);
        document.addEventListener('vistil:pack-change', this.onPackChange);
        if (VistilProduct.currentPack) this.applyPack(VistilProduct.currentPack);

        this.unsubscribe = VistilProduct.subscribe('variantChange', this.onVariantChange.bind(this));

        this.setVisible(false);
        this.observeCtas();
      }

      disconnectedCallback() {
        document.removeEventListener('vistil:pack-change', this.onPackChange);
        this.unsubscribe?.();
        this.observer?.disconnect();
        document.body.classList.remove('vistil-sticky-atc-active');
      }

      // Visible only after the main CTA has scrolled above the viewport,
      // and never while another VISTIL CTA is already on screen.
      observeCtas() {
        this.mainCta = VistilProduct.getSubmitButton();
        if (!this.mainCta || !('IntersectionObserver' in window)) return;

        this.otherCtas = Array.from(document.querySelectorAll('[data-vistil-cta-watch]'));
        this.states = new Map();

        this.observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => this.states.set(entry.target, entry));
          this.update();
        });
        [this.mainCta, ...this.otherCtas].forEach((el) => this.observer.observe(el));
      }

      update() {
        const main = this.states.get(this.mainCta);
        if (!main) return;
        const mainPassed = !main.isIntersecting && main.boundingClientRect.bottom < 0;
        const otherVisible = this.otherCtas.some((el) => this.states.get(el)?.isIntersecting);
        this.setVisible(mainPassed && !otherVisible);
      }

      setVisible(visible) {
        this.classList.toggle('vistil-sticky-atc--visible', visible);
        this.toggleAttribute('inert', !visible);
        this.setAttribute('aria-hidden', String(!visible));
        document.body.classList.toggle('vistil-sticky-atc-active', visible);
        if (visible) {
          document.documentElement.style.setProperty('--vistil-sticky-atc-height', `${this.offsetHeight}px`);
        }
      }

      applyPack(pack) {
        if (!pack) return;
        const isPack = Boolean(pack.label) && pack.quantity > 1;
        if (this.titleEl) this.titleEl.textContent = isPack ? pack.label : this.productTitle;
        if (this.priceEl) this.priceEl.innerHTML = pack.priceHtml || this.unitPriceHtml;
      }

      onVariantChange(event) {
        if (!VistilProduct.isMainEvent(event)) return;
        const { variant, html } = event.data;
        if (!variant) return;

        const priceText = this.extractPriceText(html?.getElementById?.(`price-${VistilProduct.getSectionId()}`));
        if (priceText) this.unitPriceHtml = priceText;
        // With an offer section on the page, the offer re-announces the pack price itself.
        if (!this.hasOffer && this.priceEl && priceText) this.priceEl.textContent = priceText;

        const previewSrc = variant.featured_media?.preview_image?.src;
        if (this.imageEl && previewSrc) {
          const separator = previewSrc.includes('?') ? '&' : '?';
          this.imageEl.src = `${previewSrc}${separator}width=160`;
          this.imageEl.removeAttribute('srcset');
        }
      }

      extractPriceText(scope) {
        if (!scope) return null;
        const sale = scope.querySelector('.price__sale:not(.hidden) .price-item--sale');
        if (sale) return sale.textContent.trim();
        const regular = scope.querySelector('.price__regular .price-item--regular');
        return regular ? regular.textContent.trim() : null;
      }
    }
  );
}
