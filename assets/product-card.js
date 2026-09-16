import VariantPicker from '@theme/variant-picker';
import { Component } from '@theme/component';
import { debounce, isDesktopBreakpoint, mediaQueryLarge, yieldToMainThread } from '@theme/utilities';
import { ThemeEvents, VariantSelectedEvent, VariantUpdateEvent, SlideshowSelectEvent } from '@theme/events';
import { morph } from '@theme/morph';

/**
 * @typedef {object} ProductCardLinkRefs
 * @property {HTMLElement} [cardGallery] - The card gallery element.
 * @property {HTMLImageElement[]} [imagesToTransition] - The images to transition.
 */

/**
 * A custom element for product links with images for transitions to PDP.
 * This is a base class that is extended by ProductCard.
 * Used directly by resource-card.liquid for non-product-card scenarios.
 *
 * @template {ProductCardLinkRefs} [T=ProductCardLinkRefs]
 * @extends {Component<T>}
 */
export class ProductCardLink extends Component {
  get productTransitionEnabled() {
    return this.getAttribute('data-product-transition') === 'true';
  }

  get featuredMediaUrl() {
    return this.getAttribute('data-featured-media-url');
  }

  /**
   * Handles the click event for view transitions.
   * @param {Event} event
   */
  handleViewTransition(event) {
    // If the event has been prevented, don't do anything, another component is handling the click
    if (event.defaultPrevented) return;

    // If the event was on an interactive element, don't do anything, this is not a navigation
    if (event.target instanceof Element) {
      const interactiveElement = event.target.closest('button, input, label, select, [tabindex="1"]');
      if (interactiveElement) return;
    }

    if (!this.productTransitionEnabled) return;

    const { cardGallery } = this.refs;
    if (!cardGallery || !cardGallery.hasAttribute('data-view-transition-to-main-product')) return;

    // Check on the current active image, whether it's a product card image or a resource card image
    const { imagesToTransition } = this.refs;
    const activeImage =
      imagesToTransition?.find(
        (/** @type {HTMLImageElement} */ image) =>
          image.closest('slideshow-slide')?.getAttribute('aria-hidden') === 'false'
      ) || imagesToTransition?.[imagesToTransition.length - 1];

    if (activeImage instanceof HTMLImageElement) this.#setImageSrcset(activeImage);

    cardGallery.setAttribute('data-view-transition-type', 'product-image-transition');
    cardGallery.setAttribute('data-view-transition-triggered', 'true');
  }

  /**
   * Sets the srcset for the image
   * @param {HTMLImageElement} image
   */
  #setImageSrcset(image) {
    if (!this.featuredMediaUrl) return;

    const currentImageUrl = new URL(image.currentSrc);

    // Deliberately not using origin, as it includes the protocol, which is usually skipped for featured media
    const currentImageRawUrl = currentImageUrl.host + currentImageUrl.pathname;

    if (!this.featuredMediaUrl.includes(currentImageRawUrl)) {
      const imageFade = image.animate([{ opacity: 0.8 }, { opacity: 1 }], {
        duration: 125,
        easing: 'ease-in-out',
      });

      imageFade.onfinish = () => {
        image.srcset = this.featuredMediaUrl ?? '';
      };
    }
  }
}

if (!customElements.get('product-card-link')) {
  customElements.define('product-card-link', ProductCardLink);
}

/**
 * A custom element that displays a product card.
 * Extends ProductCardLink to inherit view transition functionality.
 *
 * @typedef {object} ProductCardRefs
 * @property {HTMLAnchorElement} productCardLink - The product card link element.
 * @property {import('slideshow').Slideshow} [slideshow] - The slideshow component.
 * @property {import('quick-add').QuickAddComponent} [quickAdd] - The quick add component.
 * @property {HTMLElement} [cardGallery] - The card gallery component.
 * @property {HTMLImageElement[]} [imagesToTransition] - The images to transition.
 * @extends {ProductCardLink<ProductCardRefs>}
 */
export class ProductCard extends ProductCardLink {
  requiredRefs = ['productCardLink'];

  get productPageUrl() {
    return this.refs.productCardLink.href;
  }

  /**
   * Gets the currently selected variant ID from the product card
   * @returns {string | null} The variant ID or null if none selected
   */
  getSelectedVariantId() {
    const checkedInput = /** @type {HTMLInputElement | null} */ (
      this.querySelector('input[type="radio"]:checked[data-variant-id]')
    );

    return checkedInput?.dataset.variantId || null;
  }

  /**
   * Gets the product card link element
   * @returns {HTMLAnchorElement | null} The product card link or null
   */
  getProductCardLink() {
    return this.refs.productCardLink || null;
  }

  #fetchProductPageHandler = () => {
    this.refs.quickAdd?.fetchProductPage(this.productPageUrl);
  };

  /**
   * Navigates to a URL link. Respects modifier keys for opening in new tab/window.
   * @param {Event} event - The event that triggered the navigation.
   * @param {URL} url - The URL to navigate to.
   */
  #navigateToURL = (event, url) => {
    // Check for modifier keys that should open in new tab/window (only for mouse events)
    const shouldOpenInNewTab =
      event instanceof MouseEvent && (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1);

    if (shouldOpenInNewTab) {
      event.preventDefault();
      window.open(url.href, '_blank');
      return;
    } else {
      window.location.href = url.href;
    }
  };

  connectedCallback() {
    super.connectedCallback();

    const link = this.refs.productCardLink;
    if (!(link instanceof HTMLAnchorElement)) throw new Error('Product card link not found');
    this.#handleQuickAdd();

    this.addEventListener(ThemeEvents.variantUpdate, this.#handleVariantUpdate);
    this.addEventListener(ThemeEvents.variantSelected, this.#handleVariantSelected);
    this.addEventListener(SlideshowSelectEvent.eventName, this.#handleSlideshowSelect);
    mediaQueryLarge.addEventListener('change', this.#handleQuickAdd);

    this.addEventListener('click', this.navigateToProduct);

    // Preload the next image on the slideshow to avoid white flashes on previewImage
    setTimeout(() => {
      if (this.refs.slideshow?.isNested) {
        this.#preloadNextPreviewImage();
      }

      this.#captureInitialCardGalleryImage();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.navigateToProduct);
  }

  #preloadNextPreviewImage() {
    const currentSlide = this.refs.slideshow?.slides?.[this.refs.slideshow?.current];
    currentSlide?.nextElementSibling?.querySelector('img[loading="lazy"]')?.removeAttribute('loading');
  }

  /**
   * Handles the quick add event.
   */
  #handleQuickAdd = () => {
    this.removeEventListener('pointerenter', this.#fetchProductPageHandler);
    this.removeEventListener('focusin', this.#fetchProductPageHandler);

    if (isDesktopBreakpoint()) {
      this.addEventListener('pointerenter', this.#fetchProductPageHandler);
      this.addEventListener('focusin', this.#fetchProductPageHandler);
    }
  };

  /**
   * Handles the variant selected event.
   * @param {VariantSelectedEvent} event - The variant selected event.
   */
  #handleVariantSelected = (event) => {
    if (event.target !== this.variantPicker) {
      this.variantPicker?.updateSelectedOption(event.detail.resource.id);
    }
  };

  /**
   * Handles the variant update event.
   * Updates price, checks for unavailable variants, and updates product URL.
   * @param {VariantUpdateEvent} event - The variant update event.
   */
  #handleVariantUpdate = (event) => {
    // Stop the event from bubbling up to the section, variant updates triggered from product cards are fully handled
    // by this component and should not affect anything outside the card.
    event.stopPropagation();

    if (this.#usesVariantImageSwatches()) {
      this.#updatePriceForVariantImages(event);
      this.#updateProductUrlForVariantImages(event);
    } else {
      this.updatePrice(event);
      this.#updateProductUrl(event);
    }
    this.#isUnavailableVariantSelected(event);
    this.refs.quickAdd?.fetchProductPage(this.productPageUrl);

    if (event.target !== this.variantPicker) {
      this.variantPicker?.updateVariantPicker(event.detail.data.html);
    }

    if (this.#usesVariantImageSwatches()) {
      this.#updateVariantImagesForVariantImages();
    } else {
      this.#updateVariantImages();
    }
    this.#previousSlideIndex = null;

    // Remove attribute after re-rendering since a variant selection has been made
    this.removeAttribute('data-no-swatch-selected');

    // Force overflow list to reflow after variant update
    // This fixes an issue where the overflow counter doesn't update properly in some browsers
    this.#updateOverflowList();
  };

  /**
   * Forces the overflow list to recalculate by dispatching a reflow event.
   * This ensures the overflow counter displays correctly after variant updates.
   */
  #updateOverflowList() {
    // Find the overflow list in the variant picker
    const overflowList = this.querySelector('swatches-variant-picker-component overflow-list');
    const isActiveOverflowList = overflowList?.querySelector('[slot="overflow"]') ? true : false;
    if (!overflowList || !isActiveOverflowList) return;

    // Use requestAnimationFrame to ensure DOM has been updated
    requestAnimationFrame(() => {
      // Dispatch a reflow event to trigger recalculation
      overflowList.dispatchEvent(
        new CustomEvent('reflow', {
          bubbles: true,
          detail: {},
        })
      );
    });
  }

  /**
   * Updates the DOM with a new price.
   * @param {VariantUpdateEvent} event - The variant update event.
   */
  updatePrice(event) {
    const priceContainer = this.querySelectorAll(`product-price [ref='priceContainer']`)[1];
    const newPriceElement = event.detail.data.html.querySelector(`product-price [ref='priceContainer']`);

    if (newPriceElement && priceContainer) {
      morph(priceContainer, newPriceElement);
    }
  }

  /**
   * Updates price for variant-image swatch mode (display_variant_images block setting).
   * @param {VariantUpdateEvent} event - The variant update event.
   */
  #updatePriceForVariantImages(event) {
    const priceContainer = this.querySelector(`product-price [ref='priceContainer']`);
    const newPriceElement = event.detail.data.html.querySelector(`product-price [ref='priceContainer']`);

    if (newPriceElement && priceContainer) {
      morph(priceContainer, newPriceElement);
    }
  }

  /**
   * Updates the product URL based on the variant update event.
   * @param {VariantUpdateEvent} event - The variant update event.
   */
  #updateProductUrl(event) {
    const responseProductCard = event.detail.data.html?.querySelector('product-card');
    const anchorElement = responseProductCard?.querySelector('a');
    const featuredMediaUrl = responseProductCard?.getAttribute('data-featured-media-url');

    // Update the featured media URL for view transitions (inherited from ProductCardLink)
    if (featuredMediaUrl) {
      this.setAttribute('data-featured-media-url', featuredMediaUrl);
    }

    if (anchorElement instanceof HTMLAnchorElement) {
      // If the href is empty, don't update the product URL eg: unavailable variant
      if (anchorElement.getAttribute('href')?.trim() === '') return;

      const productUrl = anchorElement.href;
      const { productCardLink, productTitleLink, cardGalleryLink } = this.refs;

      productCardLink.href = productUrl;
      if (cardGalleryLink instanceof HTMLAnchorElement) {
        cardGalleryLink.href = productUrl;
      }
      if (productTitleLink instanceof HTMLAnchorElement) {
        productTitleLink.href = productUrl;
      }
    }
  }

  /**
   * Updates product URLs for variant-image swatch mode (display_variant_images block setting).
   * @param {VariantUpdateEvent} event - The variant update event.
   */
  #updateProductUrlForVariantImages(event) {
    const responseProductCard = event.detail.data.html?.querySelector('product-card');
    const anchorElement = responseProductCard?.querySelector('a');
    const featuredMediaUrl = responseProductCard?.getAttribute('data-featured-media-url');
    const { productCardLink, productTitleLink, cardGalleryLink } = this.refs;

    if (featuredMediaUrl) {
      this.setAttribute('data-featured-media-url', featuredMediaUrl);
    }

    const selectedVariantId =
      this.variantPicker?.selectedOption?.dataset.variantId || event.detail.resource?.id?.toString();

    if (anchorElement instanceof HTMLAnchorElement && anchorElement.getAttribute('href')?.trim() !== '') {
      let productUrl = anchorElement.href;

      if (selectedVariantId) {
        const url = new URL(productUrl);
        url.searchParams.set('variant', selectedVariantId);
        productUrl = url.toString();
      }

      if (productCardLink instanceof HTMLAnchorElement) {
        productCardLink.href = productUrl;
      }
      if (cardGalleryLink instanceof HTMLAnchorElement) {
        cardGalleryLink.href = productUrl;
      }
      if (productTitleLink instanceof HTMLAnchorElement) {
        productTitleLink.href = productUrl;
      }
    } else if (selectedVariantId && productCardLink instanceof HTMLAnchorElement) {
      const url = new URL(productCardLink.href, window.location.origin);
      url.searchParams.set('variant', selectedVariantId);
      const productUrl = url.toString();

      productCardLink.href = productUrl;
      if (cardGalleryLink instanceof HTMLAnchorElement) {
        cardGalleryLink.href = productUrl;
      }
      if (productTitleLink instanceof HTMLAnchorElement) {
        productTitleLink.href = productUrl;
      }
    }
  }

  /**
   * @returns {boolean} Whether this card uses variant-image swatches (display_variant_images).
   */
  #usesVariantImageSwatches() {
    return this.variantPicker?.dataset.displayVariantImages === 'true';
  }

  /**
   * Checks if an unavailable variant is selected.
   * @param {VariantUpdateEvent} event - The variant update event.
   */
  #isUnavailableVariantSelected(event) {
    const allVariants = /** @type {NodeListOf<HTMLInputElement>} */ (
      event.detail.data.html.querySelectorAll('input:checked')
    );

    for (const variant of allVariants) {
      this.#toggleAddToCartButton(variant.dataset.optionAvailable === 'true');
    }
  }

  /**
   * Toggles the add to cart button state.
   * @param {boolean} enable - Whether to enable or disable the button.
   */
  #toggleAddToCartButton(enable) {
    const addToCartButton = this.querySelector('.add-to-cart__button button');

    if (addToCartButton instanceof HTMLButtonElement) {
      addToCartButton.disabled = !enable;
    }
  }

  /**
   * Swaps the card gallery image from a variant-image swatch input (variant-image mode).
   * Uses data-swatch-image-url when present; falls back to the swatch CSS background.
   * @param {HTMLInputElement} swatchInput - The swatch radio input.
   */
  swapCardImageFromSwatch(swatchInput) {
    const imageUrl = swatchInput.dataset.swatchImageUrl;
    const img = this.#getVisibleCardGalleryImage();

    if (!(img instanceof HTMLImageElement)) return;

    if (imageUrl) {
      img.src = imageUrl;
      img.removeAttribute('srcset');
      return;
    }

    this.#swapVisibleSlideImageFromSwatch(swatchInput);
  }

  /**
   * Updates product card links to the selected variant (variant-image mode).
   * @param {string | undefined} variantId - The variant id.
   */
  updateLinksForVariantId(variantId) {
    if (!variantId) return;

    const { productCardLink, productTitleLink, cardGalleryLink } = this.refs;
    const baseLink = productCardLink instanceof HTMLAnchorElement ? productCardLink : null;

    if (!baseLink?.href) return;

    const url = new URL(baseLink.href, window.location.origin);
    url.searchParams.set('variant', variantId);
    const productUrl = url.toString();

    baseLink.href = productUrl;
    if (cardGalleryLink instanceof HTMLAnchorElement) {
      cardGalleryLink.href = productUrl;
    }
    if (productTitleLink instanceof HTMLAnchorElement) {
      productTitleLink.href = productUrl;
    }
  }

  /**
   * Updates the card image from the currently selected swatch (variant-image mode).
   */
  applySelectedSwatchImage() {
    const selectedOption = this.variantPicker?.selectedOption;
    if (selectedOption instanceof HTMLInputElement) {
      this.swapCardImageFromSwatch(selectedOption);
    }
  }

  /**
   * Updates the card image for variant-image swatch mode after AJAX.
   */
  #updateVariantImagesForVariantImages() {
    this.applySelectedSwatchImage();
  }

  /**
   * Returns the currently visible product card gallery image.
   * @returns {HTMLImageElement | null}
   */
  #getVisibleCardGalleryImage() {
    const { cardGallery, slideshow } = this.refs;

    if (slideshow?.slides?.length) {
      const visibleSlide = slideshow.slides[slideshow.current];
      const slideImg = visibleSlide?.querySelector('img');
      if (slideImg instanceof HTMLImageElement) return slideImg;
    }

    const galleryRoot = cardGallery ?? this.querySelector('[ref="cardGallery"], .card-gallery');

    return (
      galleryRoot?.querySelector(
        'slideshow-slide[aria-hidden="false"] img, slideshow-slide:not([aria-hidden="true"]) img, img'
      ) ??
      this.querySelector('slideshow-component img, .card-gallery img') ??
      null
    );
  }

  /**
   * Snapshots the page-load gallery image for variant-image hover reset (before img.src is mutated).
   */
  #captureInitialCardGalleryImage() {
    if (!this.#usesVariantImageSwatches()) return;
    if (this.#initialCardGalleryImage?.src) return;

    const img = this.#getVisibleCardGalleryImage();
    if (!(img instanceof HTMLImageElement)) return;

    const src = img.currentSrc || img.src;
    if (!src) return;

    this.#initialCardGalleryImage = {
      src,
      srcset: img.srcset || null,
    };
  }

  /**
   * Restores the gallery image captured at page load when no swatch is selected.
   */
  #restoreInitialCardGalleryImage() {
    const img = this.#getVisibleCardGalleryImage();
    if (!(img instanceof HTMLImageElement)) return;

    if (this.#initialCardGalleryImage?.src) {
      img.src = this.#initialCardGalleryImage.src;
      if (this.#initialCardGalleryImage.srcset) {
        img.srcset = this.#initialCardGalleryImage.srcset;
      } else {
        img.removeAttribute('srcset');
      }
      return;
    }

    const { cardGallery } = this.refs;
    const initialUrl = cardGallery?.dataset.initialCardImageUrl ?? this.featuredMediaUrl;

    if (initialUrl) {
      img.src = initialUrl;
      img.removeAttribute('srcset');
    }
  }

  /**
   * Swaps the visible gallery image when the variant media slide is not in the card DOM.
   * @param {HTMLInputElement} selectedOption - The selected swatch input.
   */
  #swapVisibleSlideImageFromSwatch(selectedOption) {
    const swatchEl = selectedOption.closest('label')?.querySelector('.swatch--variant-image');
    if (!swatchEl) return;

    const swatchBackground = getComputedStyle(swatchEl).getPropertyValue('--swatch-background').trim();
    const imageUrlMatch = swatchBackground.match(/url\(["']?([^"')]+)["']?\)/);
    const imageUrl = imageUrlMatch?.[1];
    if (!imageUrl) return;

    const img = this.#getVisibleCardGalleryImage();
    if (!(img instanceof HTMLImageElement)) return;

    img.src = imageUrl;
    img.removeAttribute('srcset');
  }

  /**
   * Hide the variant images that are not for the selected variant.
   */
  #updateVariantImages() {
    const { slideshow } = this.refs;
    if (!this.variantPicker?.selectedOption) {
      return;
    }

    const selectedImageId = this.variantPicker?.selectedOption.dataset.optionMediaId;

    if (slideshow && selectedImageId) {
      const { slides = [] } = slideshow.refs;

      for (const slide of slides) {
        if (slide.getAttribute('variant-image') == null) continue;

        slide.hidden = slide.getAttribute('slide-id') !== selectedImageId;
      }

      slideshow.select({ id: selectedImageId }, undefined, { animate: false });
    }
  }

  /**
   * Gets all variant inputs.
   * @returns {NodeListOf<HTMLInputElement>} All variant input elements.
   */
  get allVariants() {
    return this.querySelectorAll('input[data-variant-id]');
  }

  /**
   * Gets the variant picker component.
   * @returns {VariantPicker | null} The variant picker component.
   */
  get variantPicker() {
    return this.querySelector('swatches-variant-picker-component');
  }
  /** @type {number | null} */
  #previousSlideIndex = null;

  /** @type {{ src: string, srcset: string | null } | null} */
  #initialCardGalleryImage = null;

  /**
   * Handles the slideshow select event.
   * @param {SlideshowSelectEvent} event - The slideshow select event.
   */
  #handleSlideshowSelect = (event) => {
    if (event.detail.userInitiated) {
      this.#previousSlideIndex = event.detail.index;
    }
  };

  /**
   * Previews a variant media id from a swatch input (variant-image mode).
   * Reads data-option-media-id as a string to avoid large-ID precision loss.
   * @param {Event} event - The pointer event from the swatch input.
   */
  previewSwatchMedia(event) {
    if (!this.#usesVariantImageSwatches()) return;

    this.#captureInitialCardGalleryImage();

    const input = this.#getSwatchInputFromPointerEvent(event);
    if (input instanceof HTMLInputElement) {
      this.resetVariant.cancel();
      this.swapCardImageFromSwatch(input);
    }
  }

  /**
   * Resolves a swatch radio from a pointer event.
   * @param {Event} event - The pointer event.
   * @returns {HTMLInputElement | null}
   */
  #getSwatchInputFromPointerEvent(event) {
    if (event.target instanceof HTMLInputElement && event.target.dataset.swatchImageUrl) {
      return event.target;
    }

    if (event.target instanceof Element) {
      const input = event.target.closest('label')?.querySelector('input[data-swatch-image-url]');
      if (input instanceof HTMLInputElement) return input;
    }

    return null;
  }

  /**
   * Previews a variant.
   * @param {string | number} id - The media id to preview (kept as string for large Shopify ids).
   */
  previewVariant(id) {
    const mediaId = String(id);
    const { slideshow } = this.refs;

    if (slideshow) {
      const slideExists = slideshow.refs.slides?.some(
        (slide) => slide.getAttribute('slide-id') == mediaId
      );

      if (slideExists) {
        this.resetVariant.cancel();
        slideshow.select({ id: mediaId }, undefined, { animate: false });
        return;
      }
    }

    const swatchInput = this.querySelector(`input[data-option-media-id="${mediaId}"]`);
    if (swatchInput instanceof HTMLInputElement) {
      this.#swapVisibleSlideImageFromSwatch(swatchInput);
    }
  }

  /**
   * Previews the next image.
   * @param {PointerEvent} event - The pointer event.
   */
  previewImage(event) {
    if (event.pointerType !== 'mouse') return;

    const { slideshow } = this.refs;

    if (!slideshow) return;

    this.resetVariant.cancel();

    if (this.#previousSlideIndex != null && this.#previousSlideIndex > 0) {
      slideshow.select(this.#previousSlideIndex, undefined, { animate: false });
    } else {
      slideshow.next(undefined, { animate: false });
      setTimeout(() => this.#preloadNextPreviewImage());
    }
  }

  /**
   * Resets the image to the variant image.
   * @param {PointerEvent} event - The pointer event.
   */
  resetImage(event) {
    if (event.pointerType !== 'mouse') return;

    const { slideshow } = this.refs;

    if (!this.variantPicker) {
      if (!slideshow) return;
      slideshow.previous(undefined, { animate: false });
    } else {
      this.#resetVariant();
    }
  }

  /**
   * Resets the image to the variant image.
   */
  #resetVariant = () => {
    if (this.#usesVariantImageSwatches()) {
      const selectedOption = this.variantPicker?.selectedOption;
      if (selectedOption instanceof HTMLInputElement) {
        this.swapCardImageFromSwatch(selectedOption);
        return;
      }

      this.#restoreInitialCardGalleryImage();
      return;
    }

    const { slideshow } = this.refs;

    if (!slideshow) return;

    // If we have a selected variant, always use its image
    if (this.variantPicker?.selectedOption) {
      const id = this.variantPicker.selectedOption.dataset.optionMediaId;
      if (id) {
        slideshow.select({ id }, undefined, { animate: false });
        return;
      }
    }

    // No variant selected - use initial slide if it's valid
    const initialSlide = slideshow.initialSlide;
    const slideId = initialSlide?.getAttribute('slide-id');
    if (initialSlide && slideshow.slides?.includes(initialSlide) && slideId) {
      slideshow.select({ id: slideId }, undefined, { animate: false });
      return;
    }

    // No valid initial slide or selected variant - go to previous
    slideshow.previous(undefined, { animate: false });
  };

  /**
   * Intercepts the click event on the product card anchor, we want
   * to use this to add an intermediate state to the history.
   * This intermediate state captures the page we were on so that we
   * navigate back to the same page when the user navigates back.
   * In addition to that, it captures the product card anchor so that we
   * have the specific product card in view.
   *
   * A product card can have other interactive elements like variant picker,
   * so we do not navigate if the click was on one of those elements.
   *
   * @param {Event} event
   */
  navigateToProduct = (event) => {
    if (!(event.target instanceof Element)) return;

    // Don't navigate if this product card is marked as no-navigation (e.g., in theme editor)
    if (this.hasAttribute('data-no-navigation')) return;

    const interactiveElement = event.target.closest('button, input, label, select, [tabindex="1"]');

    // If the click was on an interactive element, do nothing.
    if (interactiveElement) {
      return;
    }

    const link = this.refs.productCardLink;
    if (!link.href) return;
    const linkURL = new URL(link.href);

    const productCardAnchor = link.getAttribute('id');
    if (!productCardAnchor) return;

    const infiniteResultsList = this.closest('results-list[infinite-scroll="true"]');
    if (!window.Shopify.designMode && infiniteResultsList) {
      const url = new URL(window.location.href);
      const parent = this.closest('li');
      url.hash = productCardAnchor;
      if (parent && parent.dataset.page) {
        url.searchParams.set('page', parent.dataset.page);
      }

      yieldToMainThread().then(() => {
        history.replaceState({}, '', url.toString());
      });
    }

    const targetLink = event.target.closest('a');
    // Let the native navigation handle the click if it was on a link.
    if (!targetLink) {
      this.#navigateToURL(event, linkURL);
    }
  };

  /**
   * Resets the variant.
   */
  resetVariant = debounce(this.#resetVariant, 100);
}

if (!customElements.get('product-card')) {
  customElements.define('product-card', ProductCard);
}

/**
 * A custom element that displays a variant picker with swatches.
 * @typedef {import('@theme/variant-picker').VariantPickerRefs & {overflowList: HTMLElement}} SwatchesRefs
 */

/**
 * @extends {VariantPicker<SwatchesRefs>}
 */
class SwatchesVariantPickerComponent extends VariantPicker {
  /** @type {AbortController | undefined} */
  #variantImagesAbortController;

  /** @type {string | null} */
  #lastVariantImageSelectId = null;

  /** @type {number} */
  #lastVariantImageSelectTime = 0;

  connectedCallback() {
    super.connectedCallback();

    // Capture clicks from swatch inputs inside overflow-list (change/bubbling is unreliable).
    this.addEventListener('click', this.#onVariantImageSwatchClick, true);

    // Listen for variant updates to apply pending URL changes
    this.addEventListener(ThemeEvents.variantUpdate, this.#handleCardVariantUrlUpdate.bind(this));
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onVariantImageSwatchClick, true);
    super.disconnectedCallback();
  }

  /**
   * Capture-phase click handler for variant-image swatches.
   * @param {Event} event - The click event.
   */
  #onVariantImageSwatchClick = (event) => {
    if (this.dataset.displayVariantImages !== 'true') return;

    const clickedSwatch = this.#getSwatchInputFromEvent(event);
    if (!(clickedSwatch instanceof HTMLInputElement)) return;
    if (!this.contains(clickedSwatch)) return;

    if (!clickedSwatch.checked) {
      clickedSwatch.checked = true;
    }

    this.#selectVariantImageSwatch(clickedSwatch);
  };

  /**
   * Updates the card URL when a variant is selected.
   */
  #handleCardVariantUrlUpdate() {
    const card = this.closest('product-card');
    if (!(card instanceof ProductCard)) return;

    if (this.dataset.displayVariantImages === 'true') {
      const variantId =
        this.pendingVariantId ||
        this.selectedOption?.dataset.variantId ||
        this.selectedOption?.dataset.firstAvailableOrFirstVariantId;

      if (variantId) {
        card.updateLinksForVariantId(variantId);
      }

      this.pendingVariantId = null;
      return;
    }

    if (this.pendingVariantId) {
      card.updateLinksForVariantId(this.pendingVariantId);
      this.pendingVariantId = null;
    }
  }

  /**
   * Builds the request URL, appending display_variant_images when that mode is active.
   * @param {HTMLElement} selectedOption - The selected option.
   * @param {string | null} [source] - The source.
   * @param {string[]} [sourceSelectedOptionsValues] - The source selected options values.
   * @returns {string} The request URL.
   */
  buildRequestUrl(selectedOption, source = null, sourceSelectedOptionsValues = []) {
    let requestUrl = super.buildRequestUrl(selectedOption, source, sourceSelectedOptionsValues);

    if (this.dataset.displayVariantImages === 'true') {
      if (!requestUrl.includes('option_values=')) {
        const optionValueId =
          selectedOption instanceof HTMLInputElement
            ? selectedOption.dataset.optionValueId
            : this.selectedOption?.dataset.optionValueId;

        if (optionValueId) {
          const separator = requestUrl.includes('?') ? '&' : '?';
          requestUrl = `${requestUrl}${separator}option_values=${optionValueId}`;
        }
      }

      if (!requestUrl.includes('display_variant_images=')) {
        const separator = requestUrl.includes('?') ? '&' : '?';
        requestUrl = `${requestUrl}${separator}display_variant_images=true`;
      }
    }

    return requestUrl;
  }

  /**
   * Resolves the swatch radio input from a change event.
   * overflow-list uses shadow DOM; event.target is retargeted to the host, not the input.
   * @param {Event} event - The variant change event.
   * @returns {HTMLInputElement | null} The swatch input, if any.
   */
  #getSwatchInputFromEvent(event) {
    const path = event.composedPath?.() ?? [];

    for (const node of path) {
      if (
        node instanceof HTMLInputElement &&
        (node.name?.includes('-swatch') || node.dataset.swatchImageUrl)
      ) {
        return node;
      }
    }

    for (const node of path) {
      if (node instanceof HTMLLabelElement && node.classList.contains('variant-option__button-label--has-swatch')) {
        const input = node.querySelector('input[name*="-swatch"]');
        if (input instanceof HTMLInputElement) return input;
      }
    }

    if (event.target instanceof HTMLInputElement && event.target.name?.includes('-swatch')) {
      return event.target;
    }

    if (event.target instanceof Element) {
      const input = event.target.closest('label.variant-option__button-label--has-swatch')?.querySelector(
        'input[name*="-swatch"]'
      );
      if (input instanceof HTMLInputElement) return input;
    }

    return null;
  }

  /**
   * Selects a variant-image swatch: update UI, image, price, and URL.
   * @param {HTMLInputElement} clickedSwatch - The swatch radio input.
   */
  #selectVariantImageSwatch(clickedSwatch) {
    const optionValueId = clickedSwatch.dataset.optionValueId ?? '';
    const now = Date.now();

    if (optionValueId && optionValueId === this.#lastVariantImageSelectId && now - this.#lastVariantImageSelectTime < 100) {
      return;
    }

    this.#lastVariantImageSelectId = optionValueId;
    this.#lastVariantImageSelectTime = now;

    this.updateSelectedOption(clickedSwatch);

    const card = this.closest('product-card');
    if (card instanceof ProductCard) {
      card.swapCardImageFromSwatch(clickedSwatch);
      card.updateLinksForVariantId(clickedSwatch.dataset.variantId);
    }

    this.dispatchEvent(
      new VariantSelectedEvent({
        id: optionValueId,
      })
    );

    this.fetchUpdatedSection(
      this.buildRequestUrl(clickedSwatch),
      undefined,
      optionValueId
    );
  }

  /**
   * Override the variantChanged method to handle unavailable swatches with available alternatives.
   * @param {Event} event - The variant change event.
   */
  variantChanged(event) {
    // Variant-image mode uses capture click (#onVariantImageSwatchClick), not change events.
    if (this.dataset.displayVariantImages === 'true') {
      return;
    }

    const clickedSwatch = this.#getSwatchInputFromEvent(event);

    if (clickedSwatch) {
      const availableCount = parseInt(clickedSwatch.dataset.availableCount || '0');
      const firstAvailableVariantId = clickedSwatch.dataset.firstAvailableOrFirstVariantId;

      if (availableCount > 0 && firstAvailableVariantId) {
        event.stopPropagation();
        this.updateSelectedOption(clickedSwatch);

        const productUrl = this.dataset.productUrl?.split('?')[0];
        if (!productUrl) return;

        const url = new URL(productUrl, window.location.origin);
        url.searchParams.set('variant', firstAvailableVariantId);
        url.searchParams.set('section_id', 'section-rendering-product-card');

        this.pendingVariantId = firstAvailableVariantId;
        this.fetchUpdatedSection(url.href);
        return;
      }
    }

    if (!(event.target instanceof HTMLElement)) return;

    super.variantChanged(event);
  }

  /**
   * Fetches updated card data for variant-image swatches without morphing the picker.
   * @param {string} requestUrl - The request URL.
   * @param {string} [morphElementSelector] - Unused; kept for signature parity.
   * @param {string} [capturedOptionValueId] - Option value id captured at click time.
   */
  fetchUpdatedSection(requestUrl, morphElementSelector, capturedOptionValueId) {
    if (this.dataset.displayVariantImages !== 'true') {
      super.fetchUpdatedSection(requestUrl, morphElementSelector);
      return;
    }

    const optionValueId = capturedOptionValueId ?? this.selectedOption?.dataset.optionValueId;

    this.#variantImagesAbortController?.abort();
    this.#variantImagesAbortController = new AbortController();

    fetch(requestUrl, { signal: this.#variantImagesAbortController.signal })
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        html.querySelector('overflow-list[defer]')?.removeAttribute('defer');

        const textContent = html
          .querySelector('variant-picker script[type="application/json"]')
          ?.textContent?.trim();
        if (!textContent) return;

        this.updateVariantPicker(html);

        const sourceId = optionValueId ?? this.selectedOption?.dataset.optionValueId;
        if (!sourceId) return;

        let variantResource = null;

        try {
          variantResource = JSON.parse(textContent);
        } catch (error) {
          console.error(error);
          return;
        }

        this.dispatchEvent(
          new VariantUpdateEvent(variantResource, sourceId, {
            html,
            productId: this.dataset.productId ?? '',
            newProduct: undefined,
          })
        );
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          console.warn('Fetch aborted by user');
        } else {
          console.error(error);
        }
      });
  }

  /**
   * Re-renders the variant picker, keeping variant-image swatches when the AJAX response is empty.
   * @param {Document | Element} newHtml - The new HTML.
   * @returns {{ id: string, url: string } | undefined}
   */
  updateVariantPicker(newHtml) {
    // Variant-image swatches are static; morphing replaces the grid and drops selection.
    if (this.dataset.displayVariantImages === 'true') {
      return undefined;
    }

    return super.updateVariantPicker(newHtml);
  }
}

if (!customElements.get('swatches-variant-picker-component')) {
  customElements.define('swatches-variant-picker-component', SwatchesVariantPickerComponent);
}
