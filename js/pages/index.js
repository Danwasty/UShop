/* ======================================================
   IMPORTS
====================================================== */
import {
  productItems,
  currentPage,
  itemsPerPage,
  currentList,
  wishlistIds,
  productIds,
  randomIds,
  MAX_LENGTH,
  setCurrentList,
  setCurrentPage,
} from "../core/utils.js";

import { categoryGroups } from "../core/constants.js";
import { getAPIData } from "../core/api.js";
import {
  getRatingStars,
  getPriceInfo,
  getParentCategories,
  generateRandomProductId,
} from "../core/utils.js";

import { addToCart } from "../services/cartService.js";
import { toggleWishlist } from "../services/wishlistService.js";
import { updateHeaderUI } from "../services/sharedUI.js";
import { fillMainNav } from "../services/sharedUI.js";

/* ======================================================
   INDEX PAGE STATE
====================================================== */
let scrollX = 0;
let speed = 0.5;
let isPaused = false;
let track = null;

/* ======================================================
   CATEGORY DATA & DISPLAY
====================================================== */
export function shopByCategory() {
  const parentCategories = getParentCategories();
  return parentCategories.map((parentCat) => {
    const subCategories = categoryGroups[parentCat];
    const matchedProducts = productItems.filter((product) =>
      subCategories.includes(product.category),
    );

    return {
      title: parentCat,
      count: matchedProducts.length,
      thumbnail: matchedProducts.length ? matchedProducts[0]?.thumbnail : null,
    };
  });
}

export function createCategoryCards() {
  track = document.querySelector(".category-track");
  if (!track) return;

  const categories = shopByCategory();
  track.innerHTML = "";

  categories.forEach((cat) => {
    const link = document.createElement("a");
    link.href = "#";
    link.dataset.category = cat.title;

    link.innerHTML = `
      <div class="card">
        <div class="image">
          <img src="${cat.thumbnail}" alt="${cat.title}">
        </div>
        <div class="category-info">
          <h2>${cat.title}</h2>
          <p><span>${cat.count}+</span> Products</p>
        </div>
      </div>
    `;
    track.appendChild(link);
  });

  track.innerHTML += track.innerHTML;
}

export function filterCategoryBanner(categoryId) {
  const subCategories = categoryGroups[categoryId];
  if (!subCategories) {
    console.warn("Unknown category:", categoryId);
    return;
  }

  const list = productItems.filter((product) =>
    subCategories.includes(product.category),
  );

  setCurrentList(list);
  fillProductCards();
}

/* ======================================================
   CATEGORY TRACK ANIMATION
====================================================== */
function animate() {
  if (!track) return;

  if (!isPaused) {
    scrollX -= speed;
    track.style.transform = `translateX(${scrollX}px)`;

    if (Math.abs(scrollX) >= track.scrollWidth / 2) {
      scrollX = 0;
    }
  }

  requestAnimationFrame(animate);
}

/* ======================================================
   FILTER UI CREATION
====================================================== */
export function filterCategoryOptions() {
  const parentCategories = getParentCategories();
  const filterOptions = document.querySelector(".filter-options");
  if (!filterOptions) return;

  filterOptions.innerHTML = "";

  parentCategories.forEach((parent) => {
    const option = document.createElement("div");
    option.classList.add("filter-option");

    option.innerHTML = `
      <input type="checkbox" id="${parent}" value="${parent}">
      <label for="${parent}">${parent}</label>
    `;

    filterOptions.appendChild(option);
  });
}

export function getProductBrands() {
  const productBrand = [
    ...new Set(productItems.map((item) => item.brand).filter(Boolean)),
  ];

  const brandCompany = document.querySelector(".brand");
  if (!brandCompany) return;

  brandCompany.innerHTML = "";

  productBrand.forEach((brand) => {
    const div = document.createElement("div");
    div.classList.add("filter-option");

    div.innerHTML = ` 
      <input type="checkbox" id="${brand}" name="brand" value="${brand}" />
      <label for="${brand}">${brand}</label>
    `;

    brandCompany.appendChild(div);
  });
}

/* ======================================================
   FILTER HELPERS
====================================================== */
function filterProductsByParent(selectedParents) {
  const childCategories = selectedParents.flatMap(
    (parent) => categoryGroups[parent] || [],
  );

  return productItems.filter((product) =>
    childCategories.includes(product.category),
  );
}

function getSelectedParents() {
  return [
    ...document.querySelectorAll(
      ".filter-option input[type='checkbox']:checked",
    ),
  ]
    .map((input) => input.value)
    .filter((value) => categoryGroups[value]);
}

function getRatingValue() {
  const selected = document.querySelector('input[name="rating"]:checked');
  return selected ? Number(selected.value) : null;
}

function filterbyBrand() {
  return [...document.querySelectorAll('input[name="brand"]:checked')].map(
    (input) => input.value,
  );
}

/* ======================================================
   SEARCH
====================================================== */
export function searchProducts(searchTerm) {
  const term = searchTerm.toLowerCase().trim();

  if (!term) {
    setCurrentList(productItems);
    fillProductCards();
    return;
  }

  const searchedItems = productItems.filter((item) => {
    return (
      item.title?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    );
  });

  if (searchedItems.length === 0) {
    const prdtGrid = document.querySelector(".products-grid");
    if (prdtGrid) {
      prdtGrid.innerHTML = `<p class="no-results">Sorry! Your search did not match any item.</p>`;
    }
    setCurrentList([]);
    return;
  }

  setCurrentList(searchedItems);
  setCurrentPage(1);
  fillProductCards();
}

/* ======================================================
   PRODUCT CARD
====================================================== */
export function createProductCard(product) {
  const {
    id = "",
    title = "No title",
    category = "Unknown",
    price = 0,
    rating = 0,
    thumbnail = "",
    discountPercentage = 0,
  } = product;

  const safeRating = Number(rating) || 0;
  const safePrice = Number(price) || 0;

  const priceInfo = getPriceInfo(safePrice, discountPercentage);
  const starsHTML = getRatingStars(safeRating);

  const card = document.createElement("div");
  card.dataset.id = id;
  card.classList.add("product-card");

  card.innerHTML = `
    <a href="product-details.html?id=${id}" class="product-link">
      ${priceInfo.isOnSale ? '<div class="product-badge">Sale</div>' : ""}
      <div class="product-image">
        <img src="${thumbnail}" alt="${title}" />
      </div>
      <div class="product-info">
        <div class="product-category">${category}</div>
        <div class="product-name">
          <small>${title}</small>
        </div>
        <div class="product-rating">
          ${starsHTML}
          <span>(${safeRating.toFixed(1)})</span>
        </div>
        <div class="product-price">
          <span class="current-price">$${priceInfo.currentPrice}</span>
          ${
            priceInfo.originalPrice
              ? `<span class="original-price">$${priceInfo.originalPrice}</span>`
              : ""
          }
          ${
            priceInfo.discountLabel
              ? `<span class="discount">${priceInfo.discountLabel}</span>`
              : ""
          }
        </div>
        <div class="product-actions">
          <a href="#" class="btn addBtn" data-id='${id}'>Add to Cart</a>
          <a href="#" class="btn btn-primary">Buy Now</a>
          <div class="wishlist-icon">
            <i class="fas fa-heart ${
              wishlistIds.includes(id.toString()) ? "selected" : ""
            }" data-id='${id}'></i>
          </div>
        </div>
      </div>
    </a>
  `;
  return card;
}

/* ======================================================
   PRODUCT GRID & PAGINATION
====================================================== */
export function fillProductCards() {
  const productsGrid = document.querySelector(".products-grid");
  if (!productsGrid) return;

  productsGrid.innerHTML = "";

  if (currentList.length === 0) {
    productsGrid.innerHTML = '<p class="no-results">No products found</p>';
    updatePaginationControls();
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = currentList.slice(startIndex, endIndex);

  pageItems.forEach((product) => {
    productsGrid.appendChild(createProductCard(product));
  });

  updatePaginationControls();
}

function updatePaginationControls() {
  const pageNumber = document.getElementById("pageNumber");
  if (!pageNumber) return;

  const totalPages = Math.ceil(currentList.length / itemsPerPage);
  pageNumber.textContent = `Page ${currentPage} of ${totalPages || 1}`;

  const prevBtns = document.querySelectorAll(
    ".fa-angles-left, .fa-chevron-left",
  );
  prevBtns.forEach((btn) => {
    btn.disabled = currentPage === 1;
  });

  const isLastPage = currentPage >= totalPages;

  const nextBtns = document.querySelectorAll(
    ".fa-chevron-right, .fa-angles-right",
  );
  nextBtns.forEach((btn) => {
    btn.disabled = isLastPage;
  });
}

/* ======================================================
   APPLY ALL FILTERS
====================================================== */
export function applyAllFilters() {
  let filteredList = [...productItems];

  const selectedParents = getSelectedParents();
  if (selectedParents.length > 0) {
    filteredList = filterProductsByParent(selectedParents);
  }

  const minPriceInput = document.getElementById("min");
  const maxPriceInput = document.getElementById("max");

  if (minPriceInput && maxPriceInput) {
    const low = Number(minPriceInput.value);
    const high = Number(maxPriceInput.value);

    if (!isNaN(low) && !isNaN(high) && (low > 0 || high > 0)) {
      filteredList = filteredList.filter(
        (product) => product.price >= low && product.price <= high,
      );
    }
  }

  const rating = getRatingValue();
  if (rating !== null) {
    filteredList = filteredList.filter((p) => p.rating >= rating);
  }

  const selectedBrands = filterbyBrand();
  if (selectedBrands.length > 0) {
    filteredList = filteredList.filter((p) => selectedBrands.includes(p.brand));
  }

  if (filteredList.length === 0) {
    const productsGrid = document.querySelector(".products-grid");
    if (productsGrid) {
      productsGrid.innerHTML = `<p class='no-results'>Sorry, Your search did not match any product</p>`;
    }
    setCurrentList([]);
    setCurrentPage(1);
    updatePaginationControls();
    return;
  }

  setCurrentList(filteredList);
  setCurrentPage(1);
  fillProductCards();
}

/* ======================================================
   RECENTLY VIEWED
====================================================== */
function RecentlyViewedProductIds(id) {
  let recentIds = JSON.parse(localStorage.getItem("recent")) || [];
  const strId = id.toString();

  recentIds = recentIds.filter((item) => item !== strId);
  recentIds.push(strId);

  while (recentIds.length > MAX_LENGTH) {
    recentIds.shift();
  }

  localStorage.setItem("recent", JSON.stringify(recentIds));
}

export function renderRecentlyViewedItems() {
  let recentIds = JSON.parse(localStorage.getItem("recent")) || [];
  const recentProductGrid = document.querySelector(
    ".recently-viewed .products-grid",
  );

  if (!recentProductGrid) return;

  recentProductGrid.innerHTML = "";

  if (recentIds.length === 0) {
    recentProductGrid.innerHTML =
      '<p class="no-results">No recently viewed items</p>';
    return;
  }

  for (let i = recentIds.length - 1; i >= 0; i--) {
    const id = recentIds[i];
    const product = productItems.find((item) => item.id.toString() === id);
    if (product) {
      recentProductGrid.appendChild(createProductCard(product));
    }
  }
}

/* ======================================================
   SUGGESTED PRODUCTS
====================================================== */
function SuggestedProduct() {
  const ids = [...randomIds];
  return ids.map((id) => productItems.find((p) => p.id === id));
}

function createSuggestedProducts() {
  const suggestedProducts = SuggestedProduct();
  const suggestedProductEl = document.querySelector(
    ".suggested-products .grid",
  );

  if (!suggestedProductEl) return;

  suggestedProductEl.innerHTML = "";

  suggestedProducts.forEach((product) => {
    suggestedProductEl.appendChild(createProductCard(product));
  });
}

/* ======================================================
   HERO BACKGROUND
====================================================== */
function initHeroBackground() {
  const heroBg = [
    { src: "images/bg_1.png", color: "rgb(12, 12, 12)" },
    { src: "images/bg_2.png", color: "rgb(255, 255, 255)" },
    { src: "images/bg_3.png", color: "white" },
  ];

  preloadImages(heroBg);

  const hero = document.querySelector(".hero");
  if (!hero) return;

  let currentIndex = 0;

  hero.style.backgroundImage = `url('${heroBg[currentIndex].src}')`;
  hero.style.color = heroBg[currentIndex].color;

  setInterval(() => {
    currentIndex = (currentIndex + 1) % heroBg.length;
    hero.style.backgroundImage = `url('${heroBg[currentIndex].src}')`;
    hero.style.color = heroBg[currentIndex].color;
  }, 10000);
}

/* ======================================================
   PAGE INITIALIZATION + EVENTS
====================================================== */
export async function initIndexPage() {
  await getAPIData();

  generateRandomProductId();
  fillMainNav();
  fillProductCards();
  filterCategoryOptions();
  getProductBrands();
  // initHeroBackground();
  createCategoryCards();
  renderRecentlyViewedItems();
  updateHeaderUI();
  createSuggestedProducts();

  animate();

  const brandContainer = document.querySelector(".brand");
  if (brandContainer) {
    brandContainer.addEventListener("change", applyAllFilters);
  }

  const filterOptions = document.querySelector(".filter-options");
  if (filterOptions) {
    filterOptions.addEventListener("change", applyAllFilters);
  }

  const minPriceInput = document.getElementById("min");
  if (minPriceInput) {
    minPriceInput.addEventListener("input", applyAllFilters);
  }

  const maxPriceInput = document.getElementById("max");
  if (maxPriceInput) {
    maxPriceInput.addEventListener("input", applyAllFilters);
  }

  const ratingOptions = document.querySelector(".rating-options");
  if (ratingOptions) {
    ratingOptions.addEventListener("change", applyAllFilters);
  }

  const searchBox = document.querySelector(".search-box input");
  if (searchBox) {
    searchBox.addEventListener("input", (e) => {
      searchProducts(e.target.value.trim());
    });
  }

  const prevBtn = document.getElementById("prev-btn");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
        fillProductCards();
      }
    });
  }

  const nextBtn = document.getElementById("next-btn");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const totalPages = Math.ceil(currentList.length / itemsPerPage);
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
        fillProductCards();
      }
    });
  }

  const firstPageBtn = document.getElementById("first-pg-btn");
  if (firstPageBtn) {
    firstPageBtn.addEventListener("click", () => {
      setCurrentPage(1);
      fillProductCards();
    });
  }

  const lastPageBtn = document.getElementById("last-pg-btn");
  if (lastPageBtn) {
    lastPageBtn.addEventListener("click", () => {
      const totalPages = Math.ceil(currentList.length / itemsPerPage);
      setCurrentPage(totalPages);
      fillProductCards();
    });
  }

  const productsGrid = document.querySelector(".products-grid");
  if (productsGrid) {
    productsGrid.addEventListener("click", (e) => {
      const wishlistIcon = e.target.closest(".fa-heart");
      if (wishlistIcon) {
        e.preventDefault();
        toggleWishlist(wishlistIcon.dataset.id);
        return;
      }

      const addBtn = e.target.closest(".addBtn");
      if (addBtn) {
        e.preventDefault();
        if (!productIds.includes(addBtn.dataset.id)) {
          addToCart(addBtn.dataset.id);
        }
        return;
      }

      if (e.target.closest(".addBtn, .wishlist-icon, .btn")) return;

      const clickedProduct = e.target.closest(".product-card");
      if (!clickedProduct) return;

      RecentlyViewedProductIds(clickedProduct.dataset.id);
      renderRecentlyViewedItems();
    });
  }

  if (track) {
    track.addEventListener("mouseenter", () => (isPaused = true));
    track.addEventListener("mouseleave", () => (isPaused = false));

    track.addEventListener("click", (e) => {
      const card = e.target.closest("a");
      if (!card) return;

      e.preventDefault();
      filterCategoryBanner(card.dataset.category);
    });
  }

  const grid = document.querySelector(".products-grid .grid");
  const leftArrow = document.querySelector(".products-grid .fa-chevron-left");
  const rightArrow = document.querySelector(".products-grid .fa-chevron-right");

  leftArrow.addEventListener("click", () => {
    grid.scrollBy({ left: -290, behavior: "smooth" });
  });

  rightArrow.addEventListener("click", () => {
    grid.scrollBy({ left: 290, behavior: "smooth" });
  });
}
