if (!customElements.get('vistil-offer')) {
  customElements.define(
    'vistil-offer',
    class VistilOffer extends HTMLElement {
      constructor() {
        super();
        this.selectedQuantity = null;
        this.tiers = Array.from(this.querySelectorAll('[data-vistil-tier]'));
        this.submitButton = this.querySelector('[data-vistil-offer-submit]');

        this.tiers.forEach((tier) => tier.addEventListener('click', this.onTierClick.bind(this)));
        this.submitButton?.addEventListener('click', this.onSubmit.bind(this));
      }

      getMainProduct() {
        const info = document.querySelector('product-info[id^="MainProduct-"]');
        if (!info) return {};
        return {
          form: info.querySelector('form'),
          quantityInput: document.getElementById(`Quantity-${info.dataset.section}`),
          submitButton: info.querySelector('[type="submit"]'),
        };
      }

      onTierClick(event) {
        const tier = event.currentTarget;
        this.tiers.forEach((t) => {
          t.classList.remove('is-selected');
          t.setAttribute('aria-checked', 'false');
        });
        tier.classList.add('is-selected');
        tier.setAttribute('aria-checked', 'true');
        this.selectedQuantity = Number(tier.dataset.quantity) || 1;
      }

      onSubmit(event) {
        event.preventDefault();
        const quantity = this.selectedQuantity || Number(this.tiers[0]?.dataset.quantity) || 1;
        const { quantityInput, submitButton } = this.getMainProduct();

        if (!submitButton) return;

        if (quantityInput) {
          quantityInput.value = quantity;
          quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        submitButton.click();
      }
    }
  );
}
