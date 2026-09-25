if (!customElements.get('vistil-transformation')) {
  customElements.define(
    'vistil-transformation',
    class VistilTransformation extends HTMLElement {
      constructor() {
        super();
        this.slider = this.querySelector('[data-vistil-slider]');
        this.beforePanel = this.querySelector('[data-vistil-before-panel]');
        if (this.slider && this.beforePanel) {
          this.slider.addEventListener('input', this.onSlide.bind(this));
          this.onSlide();
        }
      }

      onSlide() {
        this.beforePanel.style.clipPath = `inset(0 ${100 - this.slider.value}% 0 0)`;
      }
    }
  );
}
