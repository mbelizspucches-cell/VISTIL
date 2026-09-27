if (!customElements.get('vistil-offer')) {
  customElements.define(
    'vistil-offer',
    class VistilOffer extends HTMLElement {
      connectedCallback() {
        if (!window.VistilProduct) return;

        this.tiers = Array.from(this.querySelectorAll('[data-vistil-tier]'));
        this.radios = this.tiers.map((tier) => tier.querySelector('input[type="radio"]'));
        this.atc = this.querySelector('vistil-atc-button');
        this.quantityInput = VistilProduct.getQuantityInput();

        this.onTierChange = this.onTierChange.bind(this);
        this.onQuantityChange = this.onQuantityChange.bind(this);
        this.radios.forEach((radio) => radio.addEventListener('change', this.onTierChange));
        this.quantityInput?.addEventListener('change', this.onQuantityChange);

        this.unsubscribe = VistilProduct.subscribe('variantChange', (event) => {
          if (!VistilProduct.isMainEvent(event) || !event.data.variant) return;
          this.updatePrices(String(event.data.variant.id));
          this.announce();
        });

        this.render();
        this.announce();
      }

      disconnectedCallback() {
        this.radios?.forEach((radio) => radio.removeEventListener('change', this.onTierChange));
        this.quantityInput?.removeEventListener('change', this.onQuantityChange);
        this.unsubscribe?.();
      }

      get selectedRadio() {
        return this.radios.find((radio) => radio.checked);
      }

      onTierChange() {
        const radio = this.selectedRadio;
        if (!radio) return;
        VistilProduct.setQuantity(Number(radio.value));
        this.render();
        this.announce();
      }

      // Keep the pack selection in sync when the quantity is changed in the hero.
      onQuantityChange() {
        const quantity = Number(this.quantityInput.value);
        const match = this.radios.find((radio) => Number(radio.value) === quantity);
        this.radios.forEach((radio) => {
          radio.checked = radio === match;
        });
        this.render();
        this.announce();
      }

      render() {
        const selected = this.selectedRadio;
        this.tiers.forEach((tier, index) => {
          tier.classList.toggle('is-selected', this.radios[index] === selected);
        });
        if (this.atc) {
          if (selected) this.atc.dataset.quantity = selected.value;
          else delete this.atc.dataset.quantity;
        }
      }

      updatePrices(variantId) {
        this.tiers.forEach((tier) => {
          const priceEl = tier.querySelector('[data-tier-price]');
          const json = tier.querySelector('[data-tier-prices]');
          if (!priceEl || !json) return;
          try {
            const prices = JSON.parse(json.textContent);
            if (prices[variantId]) priceEl.innerHTML = prices[variantId];
          } catch (error) {
            console.error(error);
          }
        });
      }

      announce() {
        const radio = this.selectedRadio;
        const tier = radio?.closest('[data-vistil-tier]');
        const detail = radio
          ? {
              quantity: Number(radio.value),
              label: radio.dataset.label,
              priceHtml: tier.querySelector('[data-tier-price]')?.innerHTML,
            }
          : { quantity: Number(this.quantityInput?.value) || 1, label: null, priceHtml: null };

        VistilProduct.currentPack = detail;
        document.dispatchEvent(new CustomEvent('vistil:pack-change', { detail }));
      }
    }
  );
}
