import { productItems, wishlistIds, productIds, MAX_LENGTH } from '../core/utils.js';
import { toggleWishlist, createWishListCard } from '../services/wishlistService.js';
import { addToCart } from '../services/cartService.js';
import { updateHeaderUI } from '../services/sharedUI.js';
import { createProductCard } from './index.js'; 
import { fillMainNav } from '../services/sharedUI.js';

export function renderWishlistItems() {
  const wishlistContainer = document.querySelector(".wishlist-grid");
  if (!wishlistContainer) return;

  wishlistContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading your wishlist...</p>
    </div>
  `;

  setTimeout(() => {
    if (wishlistIds.length === 0) {
      wishlistContainer.innerHTML = '<p class="no-results">Your wishlist is empty</p>';
      return;
    }

    wishlistContainer.innerHTML = "";

    wishlistIds.forEach((productId) => {
      const product = productItems.find(
        (p) => p.id.toString() === productId.toString(),
      );
      if (!product) return;

      const card = createWishListCard(product);
      wishlistContainer.appendChild(card);
    });

    // Add event listeners to the newly created cards
    addWishlistEventListeners();
  }, 300);
}

function addWishlistEventListeners() {
  const wishlistGrid = document.querySelector(".wishlist-grid");
  if (!wishlistGrid) return;

  // Remove existing listeners by cloning and replacing (to avoid duplicates)
  const newWishlistGrid = wishlistGrid.cloneNode(true);
  wishlistGrid.parentNode.replaceChild(newWishlistGrid, wishlistGrid);

  // Add fresh event listeners
  newWishlistGrid.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".remove-wishlist");
    if (removeBtn) {
      const card = removeBtn.closest(".wishlist-item");
      if (card) {
        const productId = card.dataset.id;
        toggleWishlist(productId);
      }
    }
  });

  newWishlistGrid.addEventListener("click", (e) => {
    const addCartBtn = e.target.closest(".add-to-cart-btn");
    if (addCartBtn) {
      const card = addCartBtn.closest(".wishlist-item");
      if (card) {
        const productId = card.dataset.id;
        addToCart(productId);
        toggleWishlist(productId);
      }
    }
  });
}

// Function to handle recently viewed items
function addToRecentlyViewed(productId) {
  let recentIds = JSON.parse(localStorage.getItem("recent")) || [];
  const strId = productId.toString();
  
  // Remove if already exists
  recentIds = recentIds.filter((item) => item !== strId);
  
  // Add to the end (most recent)
  recentIds.push(strId);

  // Keep only MAX_LENGTH items
  while (recentIds.length > MAX_LENGTH) {
    recentIds.shift();
  }

  localStorage.setItem("recent", JSON.stringify(recentIds));
  return recentIds;
}

// Function to render recently viewed items on wishlist page
export function renderWishlistRecentlyViewed() {
  const recentIds = JSON.parse(localStorage.getItem("recent")) || [];
  const recentProductGrid = document.querySelector(".recently-viewed .products-grid");
  
  if (!recentProductGrid) return;
  
  recentProductGrid.innerHTML = "";

  if (recentIds.length === 0) {
    recentProductGrid.innerHTML = '<p class="no-results">No recently viewed items</p>';
    return;
  }

  // Get products in reverse order (most recent first)
  const recentProducts = [];
  for (let i = recentIds.length - 1; i >= 0; i--) {
    const id = recentIds[i];
    const product = productItems.find((item) => item.id.toString() === id);
    if (product) {
      recentProducts.push(product);
    }
  }

  recentProducts.forEach((product) => {
    const card = createProductCard(product);
    recentProductGrid.appendChild(card);
  });

  // Add event listeners for recently viewed items
  addRecentlyViewedEventListeners(recentProductGrid);
}

// Add event listeners for recently viewed items
function addRecentlyViewedEventListeners(container) {
  if (!container) return;

  container.addEventListener("click", (e) => {
    // Handle wishlist icon click
    const wishlistIcon = e.target.closest(".fa-heart");
    if (wishlistIcon) {
      e.preventDefault();
      const id = wishlistIcon.dataset.id;
      toggleWishlist(id);
    }

    // Handle add to cart button click
    const addBtn = e.target.closest(".addBtn");
    if (addBtn) {
      e.preventDefault();
      const productId = addBtn.dataset.id;
      if (!productIds.includes(productId)) {
        addToCart(productId);
      }
    }
  });

  container.addEventListener("click", (e) => {
    // Handle product card click for recently viewed
    if (e.target.closest(".addBtn, .wishlist-icon")) {
      return;
    }

    const clickedProduct = e.target.closest(".product-card");
    if (!clickedProduct) return;

    e.preventDefault();
    const productId = clickedProduct.dataset.id;
    if (!productId) return;

    // Update recently viewed when clicking on a product
    addToRecentlyViewed(productId);
    
    // Re-render recently viewed section to show updated order
    renderWishlistRecentlyViewed();
  });
}

export function initWishlistPage() {
  updateHeaderUI();
  renderWishlistItems();
  renderWishlistRecentlyViewed();
  fillMainNav()
}