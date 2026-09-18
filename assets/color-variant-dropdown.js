import { Component } from '@theme/component';

/**
 * Color variant dropdown: disclosure UI for Color/Colour options.
 * Radios stay compatible with variant-picker change / morph flow.
 *
 * On large screens the list acts as a persistent picker: it is open on load
 * (set during parse in variant-main-picker.liquid) and stays open through
 * selections, morphs and outside clicks. Below the breakpoint it behaves as a
 * regular dropdown.
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

  /** @type {MediaQueryList} */
  #desktopQuery = window.matchMedia('(min-width: 750px)');

  connectedCallback() {
    super.connectedCallback();

    this.#details = this.querySelector('details');
    if (!(this.#details instanceof HTMLDetailsElement)) return;

    this.#details.addEventListener('toggle', this.#onToggle);
    this.#desktopQuery.addEventListener('change', this.#onDesktopChange);
    this.addEventListener('change', this.#onChange);

    // The variant picker morphs this markup on every variant change, and the
    // inline open-by-default script does not re-run, so re-assert it here.
    if (this.#desktopQuery.matches) this.#details.open = true;

    // Bind explicitly: when the inline script already opened it during parse,
    // setting open again is a no-op and fires no toggle event.
    this.#onToggle();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#details?.removeEventListener('toggle', this.#onToggle);
    this.#desktopQuery.removeEventListener('change', this.#onDesktopChange);
    this.removeEventListener('change', this.#onChange);
    this.#unbindDocumentListeners();
  }

  /**
   * Rebind for the new breakpoint, since outside-click only applies below it.
   */
  #onDesktopChange = () => {
    if (!this.#details) return;

    if (this.#desktopQuery.matches) this.#details.open = true;

    if (this.#details.open) {
      this.#unbindDocumentListeners();
      this.#bindDocumentListeners();
    }
  };

  #onToggle = () => {
    if (!this.#details) return;

    if (this.#details.open) {
      this.#bindDocumentListeners();
    } else {
      this.#unbindDocumentListeners();
    }
  };

  /**
   * Close after a new option is chosen, below the desktop breakpoint only
   * (morph may also replace the picker).
   * @param {Event} event
   */
  #onChange = (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (!event.target.checked) return;

    // On large screens the list stays up so the shopper can keep comparing.
    if (this.#details && !this.#desktopQuery.matches) {
      this.#details.open = false;
    }
  };

  #bindDocumentListeners() {
    if (this.#onDocumentClick || this.#onDocumentKeydown) return;

    if (!this.#desktopQuery.matches) {
      this.#onDocumentClick = (event) => {
        if (!(event.target instanceof Node)) return;
        if (this.contains(event.target)) return;

        if (this.#details) {
          this.#details.open = false;
        }
      };

      document.addEventListener('click', this.#onDocumentClick);
    }

    this.#onDocumentKeydown = (event) => {
      if (event.key !== 'Escape') return;

      if (this.#details?.open) {
        this.#details.open = false;
        this.querySelector('summary')?.focus();
      }
    };

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
