/**
 *  Adds a "Read more" / "Show less" toggle to the product description.
 *
 *  The description can be rendered by either the dedicated `product-description`
 *  block or a generic `text` block, so this script doesn't depend on either
 *  one's markup - it scans the page for the description's `rte-formatter`
 *  element inside `.product-details` and, if it overflows the 4-line clamp
 *  (see the CSS in blocks/_product-details.liquid, which applies
 *  unconditionally - not gated behind any class this script adds), wraps it
 *  together with a toggle button in a plain div. The clamp is already active
 *  from the very first paint (this script only measures it, never applies
 *  it), so there's no flicker - the wrapping only happens for descriptions
 *  that actually need a button, to keep the parent layout's own `gap` from
 *  also landing between the description and its button.
 */

/**
 *  Owns the read more / show less behavior for one product description's
 *  rte-formatter: measuring whether it overflows the clamp, and - only if
 *  it does - building the toggle button and wrapping it together with the
 *  description.
 */
class ProductDescriptionReadmore {
  #rte;
  #productDetails;
  #button = null;

  /**
   *  @param {Element} rte - The description's rte-formatter element.
   */
  constructor(rte) {
    this.#rte = rte;
    this.#productDetails = rte.closest('.product-details');
  }

  /**
   *  Checks whether the description overflows its 4-line clamp and, if
   *  so, builds the toggle button and wraps it together with the
   *  description. Does nothing for descriptions that already fit.
   */
  init() {
    if (!this.#productDetails || !this.#isClamped()) return;

    this.#button = this.#createToggleButton();
    this.#bindToggleButton();
    this.#wrap();
  }

  /**
   *  rte-formatter carries the .text-block class (and the clamp CSS)
   *  itself - it's not a wrapper around a separate content element -
   *  so its own scrollHeight/clientHeight reflect the clamped state.
   *  @returns {boolean}
   */
  #isClamped() {
    return this.#rte.scrollHeight > this.#rte.clientHeight + 1;
  }

  /**
   *  The read more label, read from the data attribute rendered onto
   *  .product-details so the text stays translated.
   *  @returns {string}
   */
  get #moreText() {
    return this.#productDetails?.getAttribute('data-readmore-more-text') || 'Read more';
  }

  /**
   *  The show less label, read the same way as #moreText.
   *  @returns {string}
   */
  get #lessText() {
    return this.#productDetails?.getAttribute('data-readmore-less-text') || 'Show less';
  }

  /**
   *  Creates the toggle button, initially showing the read more label.
   *  @returns {HTMLButtonElement}
   */
  #createToggleButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'product-description-readmore__toggle button link';
    button.setAttribute('aria-expanded', 'false');
    button.textContent = this.#moreText;
    return button;
  }

  /**
   *  Wires up the click handler that expands/collapses the description.
   *  The `expanded` attribute lives on the rte-formatter itself (no
   *  wrapper involved), matched by the CSS that removes the line clamp.
   */
  #bindToggleButton() {
    this.#button?.addEventListener('click', () => {
      const expanded = this.#rte.toggleAttribute('expanded');
      this.#button?.setAttribute('aria-expanded', String(expanded));
      if (this.#button) this.#button.textContent = expanded ? this.#lessText : this.#moreText;
    });
  }

  /**
   *  Wraps the rte-formatter together with the toggle button in a plain
   *  div, so the parent layout's own `gap` doesn't also apply between
   *  the description and its button.
   */
  #wrap() {
    if (!this.#button) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'product-description-readmore';

    this.#rte.replaceWith(wrapper);
    wrapper.append(this.#rte, this.#button);
  }
}

/**
 *  Finds every not-yet-checked product description on the page and
 *  initializes its read more / show less behavior.
 */
function initProductDescriptionReadmore() {
  document.querySelectorAll('.product-details rte-formatter:not([data-readmore-initialized])').forEach((rte) => {
    rte.dataset.readmoreInitialized = 'true';
    new ProductDescriptionReadmore(rte).init();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductDescriptionReadmore);
} else {
  initProductDescriptionReadmore();
}

/**
 *  Re-scan when the theme editor or Section Rendering API replaces
 *  section markup, since that can render a fresh, unchecked description.
 */
document.addEventListener('shopify:section:load', initProductDescriptionReadmore);
