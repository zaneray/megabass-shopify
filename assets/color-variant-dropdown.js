import { Component } from '@theme/component';

/**
 * Color variant dropdown: disclosure UI for Color/Colour options.
 * Radios stay compatible with variant-picker change / morph flow.
 *
 * @extends {Component}
 */
class ColorVariantDropdown extends Component {
  /** @type {HTMLDetailsElement | null} */
  #details = null;

  /** @type {((event: MouseEvent) => void) | null} */
  #onDocumentClick = null;

  /** @type {((event: KeyboardEvent) => void) | null} */
  #onDocumentKeydown = null;

  connectedCallback() {
    super.connectedCallback();

    this.#details = this.querySelector('details');
    if (!(this.#details instanceof HTMLDetailsElement)) return;

    this.#details.addEventListener('toggle', this.#onToggle);
    this.addEventListener('change', this.#onChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#details?.removeEventListener('toggle', this.#onToggle);
    this.removeEventListener('change', this.#onChange);
    this.#unbindDocumentListeners();
  }

  #onToggle = () => {
    if (!this.#details) return;

    if (this.#details.open) {
      this.#bindDocumentListeners();
    } else {
      this.#unbindDocumentListeners();
    }
  };

  /**
   * Close after a new option is chosen (morph may also replace the picker).
   * @param {Event} event
   */
  #onChange = (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (!event.target.checked) return;

    if (this.#details) {
      this.#details.open = false;
    }
  };

  #bindDocumentListeners() {
    if (this.#onDocumentClick || this.#onDocumentKeydown) return;

    this.#onDocumentClick = (event) => {
      if (!(event.target instanceof Node)) return;
      if (this.contains(event.target)) return;

      if (this.#details) {
        this.#details.open = false;
      }
    };

    this.#onDocumentKeydown = (event) => {
      if (event.key !== 'Escape') return;

      if (this.#details?.open) {
        this.#details.open = false;
        this.querySelector('summary')?.focus();
      }
    };

    document.addEventListener('click', this.#onDocumentClick);
    document.addEventListener('keydown', this.#onDocumentKeydown);
  }

  #unbindDocumentListeners() {
    if (this.#onDocumentClick) {
      document.removeEventListener('click', this.#onDocumentClick);
      this.#onDocumentClick = null;
    }

    if (this.#onDocumentKeydown) {
      document.removeEventListener('keydown', this.#onDocumentKeydown);
      this.#onDocumentKeydown = null;
    }
  }
}

if (!customElements.get('color-variant-dropdown')) {
  customElements.define('color-variant-dropdown', ColorVariantDropdown);
}
