// Single bridge between VISTIL sections and Dawn's real <product-form>.
// Every VISTIL CTA delegates to the main product form's own submit button,
// so cart, variant, inventory and error logic stay entirely in Dawn.
(() => {
  if (window.VistilProduct) return;

  // PUB_SUB_EVENTS is a top-level `const` in constants.js: global, but not on window.
  const events = () => (typeof PUB_SUB_EVENTS !== 'undefined' ? PUB_SUB_EVENTS : null);

  const VistilProduct = {
    getInfo() {
      return document.querySelector('product-info[id^="MainProduct-"]');
    },
    getSectionId() {
      return this.getInfo()?.dataset.section;
    },
    getSubmitButton() {
      return this.getInfo()?.querySelector('product-form [type="submit"]');
    },
    getQuantityInput() {
      const sectionId = this.getSectionId();
      return sectionId ? document.getElementById(`Quantity-${sectionId}`) : null;
    },
    isAvailable() {
      const button = this.getSubmitButton();
      return Boolean(button) && !button.hasAttribute('disabled');
    },
    setQuantity(quantity) {
      const input = this.getQuantityInput();
      if (!input || !quantity) return;
      if (Number(input.value) === Number(quantity)) return;
      input.value = quantity;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    submit() {
      this.getSubmitButton()?.click();
    },
    subscribe(eventKey, callback) {
      const map = events();
      if (!map || typeof subscribe !== 'function') return () => {};
      return subscribe(map[eventKey], callback);
    },
    isMainEvent(event) {
      return event?.data?.sectionId === this.getSectionId();
    },
  };

  window.VistilProduct = VistilProduct;

  if (customElements.get('vistil-atc-button')) return;

  customElements.define(
    'vistil-atc-button',
    class VistilAtcButton extends HTMLElement {
      connectedCallback() {
        this.button = this.querySelector('button');
        this.labelEl = this.querySelector('[data-atc-label]');
        this.errorEl = this.querySelector('[data-atc-error]');
        if (!this.button) return;

        this.defaultLabel = this.dataset.label || this.labelEl?.textContent.trim();
        this.soldOutLabel = this.dataset.soldOutLabel || window.variantStrings?.soldOut || 'Agotado';
        this.onClick = this.onClick.bind(this);
        this.button.addEventListener('click', this.onClick);

        this.unsubscribers = [
          VistilProduct.subscribe('variantChange', (event) => {
            if (!VistilProduct.isMainEvent(event)) return;
            this.setAvailability(Boolean(event.data.variant?.available));
          }),
          VistilProduct.subscribe('cartError', (data) => {
            if (!this.pending) return;
            const message = typeof data?.errors === 'string' ? data.errors : data?.message;
            this.showError(message);
            this.finish();
          }),
          VistilProduct.subscribe('cartUpdate', () => {
            if (this.pending) this.finish();
          }),
        ];

        this.setAvailability(VistilProduct.isAvailable());
      }

      disconnectedCallback() {
        this.button?.removeEventListener('click', this.onClick);
        this.unsubscribers?.forEach((unsubscribe) => unsubscribe());
        this.loadingObserver?.disconnect();
        clearTimeout(this.fallbackTimer);
      }

      onClick(event) {
        event.preventDefault();
        if (this.pending || this.button.getAttribute('aria-disabled') === 'true') return;

        const realButton = VistilProduct.getSubmitButton();
        if (!realButton) return;

        const quantity = Number(this.dataset.quantity);
        if (quantity) VistilProduct.setQuantity(quantity);

        this.showError('');
        this.pending = true;
        this.button.setAttribute('aria-busy', 'true');
        this.watchRealButton(realButton);
        realButton.click();
      }

      // Dawn removes `loading` from its own button when the request settles,
      // including network failures that publish no pub/sub event.
      watchRealButton(realButton) {
        this.loadingObserver?.disconnect();
        this.loadingObserver = new MutationObserver(() => {
          if (!realButton.classList.contains('loading')) this.finish();
        });
        this.loadingObserver.observe(realButton, { attributes: true, attributeFilter: ['class'] });
        clearTimeout(this.fallbackTimer);
        this.fallbackTimer = setTimeout(() => this.finish(), 10000);
      }

      finish() {
        this.pending = false;
        this.button.removeAttribute('aria-busy');
        this.loadingObserver?.disconnect();
        clearTimeout(this.fallbackTimer);
      }

      setAvailability(available) {
        this.button.toggleAttribute('disabled', !available);
        if (available) this.button.removeAttribute('aria-disabled');
        else this.button.setAttribute('aria-disabled', 'true');
        if (this.labelEl) this.labelEl.textContent = available ? this.defaultLabel : this.soldOutLabel;
      }

      showError(message) {
        if (!this.errorEl) return;
        this.errorEl.textContent = message || '';
        this.errorEl.hidden = !message;
      }
    }
  );
})();
