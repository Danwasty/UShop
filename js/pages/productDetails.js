/* ======================================================
   IMPORTS
====================================================== */
import { productItems } from "../core/utils.js";
import { getAPIData } from "../core/api.js";
import { getRatingStars, getPriceInfo } from "../core/utils.js";
import { addToCart } from "../services/cartService.js";
import { toggleWishlist } from "../services/wishlistService.js";
import { updateHeaderFooter, updateHeaderUI } from "../services/sharedUI.js";
import { fillMainNav } from "../services/sharedUI.js";

/* ======================================================
   URL & PRODUCT ID HELPERS
====================================================== */
function getProductIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

/* ======================================================
   PAGE ENTRY POINT
====================================================== */
export function renderProductDetails() {
  const productId = getProductIdFromUrl();
  if (!productId) {
    window.location.href = "index.html";
    return;
  }

  const product = productItems.find(
    (p) => p.id.toString() === productId.toString(),
  );

  if (!product) {
    document.querySelector(".grid-container").innerHTML =
      '<p class="no-results">Product not found</p>';
    return;
  }

  addToRecentlyViewed(productId);
  updateProductPage(product);
}

/* ======================================================
   RECENTLY VIEWED
====================================================== */
function addToRecentlyViewed(productId) {
  let recentIds = JSON.parse(localStorage.getItem("recent")) || [];
  const strId = productId.toString();

  recentIds = recentIds.filter((item) => item !== strId);
  recentIds.push(strId);

  const MAX_LENGTH = 4;
  while (recentIds.length > MAX_LENGTH) {
    recentIds.shift();
  }

  localStorage.setItem("recent", JSON.stringify(recentIds));
}

/* ======================================================
   MAIN PAGE UPDATE CONTROLLER
====================================================== */
function updateProductPage(product) {
  document.title = `${product.title} | Product Details`;

  document.querySelector("h1").textContent = product.title;

  const brandLink = document.querySelector(".brand-line a");
  if (brandLink) {
    brandLink.textContent = product.brand || "Unknown Brand";
  }

  const minimumOrder = document.querySelector(".moq-tag");
  minimumOrder.textContent = `Minimum order: ${
    product.minimumOrderQuantity
  } units`;

  updateRating(product.rating, product || Math.floor(Math.random() * 5000));
  updatePrice(product.price, product.discountPercentage);

  const descSection = document.querySelector(".desc-section p");
  if (descSection) {
    descSection.innerHTML = `<strong>Description</strong> · ${
      product.description || "No description available"
    }`;
  }

  updateFeatures(product);
  updateSpecifications(product);
  updateShippingInfo(product);
  updateMainImage(product.thumbnail);
  updateThumbnails(product.images || [product.thumbnail]);
  updateMetaMicro(product);
  updateBarcodeImage(product);
}

/* ======================================================
   RATING & PRICE
====================================================== */
function updateRating(rating, product) {
  const starsContainer = document.querySelector(".stars");
  if (starsContainer) {
    starsContainer.innerHTML = getRatingStars(rating);
  }

  const ratingCountEl = document.querySelector(".review-count");
  if (ratingCountEl) {
    ratingCountEl.textContent = `${rating.toLocaleString()} ratings`;
  }

  document.querySelector(".total-reviews").innerHTML =
    `<a href="">${product.reviews.length} Reviews</a>`;
}

function updatePrice(price, discountPercentage) {
  const priceInfo = getPriceInfo(price, discountPercentage);

  const priceContainer = document.querySelector(".price-large");
  if (priceContainer) {
    const [dollars, cents] = priceInfo.currentPrice.split(".");
    priceContainer.innerHTML = `<sup>$</sup>${dollars}<sup>${cents}</sup>`;
  }

  const originalPrice = document.querySelector(".original-price");
  if (originalPrice) {
    const [dollars, cents] = priceInfo.originalPrice.split(".");
    originalPrice.innerHTML = `<sup>$</sup>${dollars}<sup>${cents}</sup>`;
  }

  const dealBadge = document.querySelector(".deal-badge");
  if (dealBadge) {
    if (priceInfo.isOnSale) {
      dealBadge.textContent = `${discountPercentage}% OFF`;
      dealBadge.style.display = "inline-block";
    } else {
      dealBadge.style.display = "none";
    }
  }
}

/* ======================================================
   FEATURES & SPECIFICATIONS
====================================================== */
function updateFeatures(product) {
  const featuresList = document.querySelector(".feature-bullets");
  if (!featuresList) return;

  featuresList.innerHTML = "";

  const { width = null, height = null, depth = null } =
    product.dimensions || {};

  const dimensionsText =
    width && height && depth
      ? `Product Dimesions: Width: ${width} X Height: ${height} X Depth: ${depth}`
      : "Product Dimensions: Standard Size";

  const features = [
    `Brand: ${product.brand || "Premium"} Quality`,
    dimensionsText,
    `Weight: ${product.weight || "Lightweight"}`,
    `${product.warrantyInformation || "1 year warranty"}`,
  ];

  features.forEach((feature) => {
    const li = document.createElement("li");
    li.textContent = feature;
    featuresList.appendChild(li);
  });
}

function updateSpecifications(product) {
  const skuValue = document.querySelector(".spec-item:first-child .spec-value");
  if (skuValue) {
    skuValue.textContent = product.sku || `PRD-${product.id}`;
  }

  const stockValue = document.querySelector(
    ".spec-item:nth-child(2) .spec-value",
  );
  if (stockValue) {
    const stockStatus = product.availabilityStatus || "In Stock";
    const stockClass = stockStatus.toLowerCase().replace(" ", "-");
    stockValue.innerHTML = `${product.stock || "50"} units 
      <span class="stock-badge ${stockClass}">${stockStatus}</span>`;
  }

  const warrantyValue = document.querySelector(
    ".spec-item:nth-child(3) .spec-value",
  );
  if (warrantyValue) {
    warrantyValue.innerHTML =
      `<span class="warranty-chip">${
        product.warrantyInformation || "1 year limited"
      }</span>`;
  }

  const minOrderValue = document.querySelector(
    ".spec-item:nth-child(4) .spec-value",
  );
  if (minOrderValue) {
    const minOrder = product.minimumOrderQuantity || 1;
    minOrderValue.innerHTML = `${minOrder} units 
      <span style="font-weight:400;font-size:0.8rem;margin-left:6px;"></span>`;
  }
}

/* ======================================================
   SHIPPING
====================================================== */
function updateShippingInfo(product) {
  const shippingInfo = document.querySelector(".shipping-info");
  if (!shippingInfo) return;

  const shippingText = shippingInfo.querySelector(".shipping-text");
  if (shippingText) {
    const shippingCost =
      product.shippingInformation || "FREE express shipping";
    const deliveryTime = product.returnPolicy || "2–4 business days";

    shippingText.innerHTML = `
      <strong>${shippingCost}</strong> · ${deliveryTime}.<br />
      <span>International shipping available</span>
    `;
  }
}

/* ======================================================
   IMAGES & THUMBNAILS
====================================================== */
function updateMainImage(imageSrc) {
  const mainImage = document.querySelector(".main-image svg");
  if (!mainImage) return;

  const img = document.createElement("img");
  img.src = imageSrc;
  img.alt = "Product Image";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";

  mainImage.parentNode.replaceChild(img, mainImage);
}

function updateThumbnails(images) {
  const thumbnailStrip = document.querySelector(".thumbnail-strip");
  if (!thumbnailStrip) return;

  thumbnailStrip.innerHTML = "";

  images.slice(0, 4).forEach((image, index) => {
    const thumbDiv = document.createElement("div");
    thumbDiv.classList.add("thumb");

    const img = document.createElement("img");
    img.src = image;
    img.alt = `Thumbnail ${index + 1}`;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.borderRadius = "4px";

    img.addEventListener("click", () => {
      const mainImageContainer = document.querySelector(".main-image");
      const currentMainImg = mainImageContainer?.querySelector("img");
      if (currentMainImg) currentMainImg.src = image;
    });

    thumbDiv.appendChild(img);
    thumbnailStrip.appendChild(thumbDiv);
  });
}

/* ======================================================
   META / BARCODE
====================================================== */
function updateBarcodeImage(product) {
  const meta = product.meta || {};
  const { barcode = "N/A", qrCode = "" } = meta;

  const barcodeEl = document.querySelector(".barcode-img");
  if (!barcodeEl) return;

  barcodeEl.innerHTML = "";

  const codeTitle = document.createElement("p");
  codeTitle.innerText = "Scan Product";

  const image = document.createElement("img");
  image.src = qrCode || "";
  image.alt = product.title;

  const barcodeText = document.createElement("p");
  barcodeText.textContent = `Barcode: ${barcode}`;

  barcodeEl.append(codeTitle, image, barcodeText);
}

function updateMetaMicro(product) {
  const meta = product.meta || {};
  const { createdAt = "Unknown", updatedAt = "Unknown" } = meta;
  const productTags = Array.isArray(product.tags) ? product.tags : [];

  const metaMicro = document.querySelector(".meta-micro");
  if (!metaMicro) return;

  metaMicro.innerHTML = "";

  const ul = document.createElement("ul");
  const dateCreated = document.createElement("li");
  dateCreated.textContent = `Product Created: ${createdAt}`;

  const dateUpdated = document.createElement("li");
  dateUpdated.textContent = `Product Updated: ${updatedAt}`;

  const tags = document.createElement("li");
  tags.textContent = `tags: ${productTags.join(", ") || "None"}`;

  ul.append(dateCreated, dateUpdated, tags);
  metaMicro.appendChild(ul);
}

/* ======================================================
   PAGE INITIALIZATION & EVENTS
====================================================== */
export async function initProductDetailsPage() {
  await getAPIData();
  await updateHeaderFooter();
  renderProductDetails();
  updateHeaderUI();
  fillMainNav();

  const addToCartBtn = document.querySelector(".add-to-cart-btn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      addToCart(getProductIdFromUrl());
    });
  }

  const wishlistBtn = document.querySelector(".wishlist-btn");
  if (wishlistBtn) {
    wishlistBtn.addEventListener("click", () => {
      toggleWishlist(getProductIdFromUrl());
    });
  }
}