if (!customElements.get('vistil-sticky-atc')) {
  customElements.define(
    'vistil-sticky-atc',
    class VistilStickyATC extends HTMLElement {
      connectedCallback() {
        this.priceEl = this.querySelector('[data-vistil-sticky-price]');
        this.imageEl = this.querySelector('.vistil-sticky-atc__thumb');
        this.ctaLabelEl = this.querySelector('[data-vistil-sticky-cta-label]');
        this.submitButton = this.querySelector('[data-vistil-sticky-submit]');
        this.defaultLabel = this.ctaLabelEl?.textContent.trim();
        this.soldOutLabel = this.dataset.soldOutLabel || 'Sold out';

        this.mainInfo = document.querySelector('product-info[id^="MainProduct-"]');
        this.mainSectionId = this.mainInfo?.dataset.section;

        this.submitButton?.addEventListener('click', this.onSubmit.bind(this));

        if (window.subscribe && window.PUB_SUB_EVENTS) {
          this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, this.onVariantChange.bind(this));
        }

        this.observeHero();
      }

      disconnectedCallback() {
        this.unsubscribe?.();
        this.observer?.disconnect();
      }

      observeHero() {
        const target = this.mainInfo;
        if (!target || !('IntersectionObserver' in window)) return;

        this.observer = new IntersectionObserver(
          (entries) => {
            const heroVisible = entries[0].isIntersecting;
            this.classList.toggle('vistil-sticky-atc--visible', !heroVisible);
          },
          { rootMargin: '0px 0px -70% 0px' }
        );
        this.observer.observe(target);
      }

      extractPriceText(scope) {
        if (!scope) return null;
        const sale = scope.querySelector('.price__sale:not(.hidden) .price-item--sale');
        if (sale) return sale.textContent.trim();
        const regular = scope.querySelector('.price__regular .price-item--regular');
        if (regular) return regular.textContent.trim();
        return null;
      }

      onVariantChange(event) {
        if (event.data.sectionId !== this.mainSectionId) return;
        const variant = event.data.variant;

        if (!variant) {
          this.setAvailability(false);
          return;
        }

        const priceScope = event.data.html?.getElementById?.(`price-${this.mainSectionId}`);
        const priceText = this.extractPriceText(priceScope);
        if (priceText && this.priceEl) this.priceEl.textContent = priceText;

        const previewSrc = variant.featured_media?.preview_image?.src;
        if (this.imageEl && previewSrc) {
          const separator = previewSrc.includes('?') ? '&' : '?';
          this.imageEl.src = `${previewSrc}${separator}width=160`;
        }

        this.setAvailability(variant.available);
      }

      setAvailability(available) {
        if (!this.submitButton) return;
        this.submitButton.toggleAttribute('aria-disabled', !available);
        if (this.ctaLabelEl) {
          this.ctaLabelEl.textContent = available ? this.defaultLabel : this.soldOutLabel;
        }
      }

      onSubmit(event) {
        event.preventDefault();
        if (this.submitButton?.getAttribute('aria-disabled') === 'true') return;
        const realSubmitButton = this.mainInfo?.querySelector('[type="submit"]');
        realSubmitButton?.click();
      }
    }
  );
}
