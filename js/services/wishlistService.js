import { wishlistIds, productItems, setWishlistIds } from '../core/utils.js';
import { updateHeaderUI } from './sharedUI.js';
import { getPriceInfo } from '../core/utils.js';

export function toggleWishlist(productId) {
  let newWishlistIds = [...wishlistIds];
  const strId = productId.toString();
  
  const index = newWishlistIds.indexOf(strId);
  if (index !== -1) {
    newWishlistIds.splice(index, 1);
  } else {
    newWishlistIds.push(strId);
  }

  setWishlistIds(newWishlistIds);
  localStorage.setItem("wishlist", JSON.stringify(newWishlistIds));

  const heartIcon = document.querySelector(`.fa-heart[data-id="${productId}"]`);
  if (heartIcon) {
    heartIcon.classList.toggle("selected", newWishlistIds.includes(strId));
  }

  updateHeaderUI();
  
  if (document.querySelector(".wishlist-grid")) {
    import('../pages/wishlist.js').then(module => {
      module.renderWishlistItems();
    });
  }
}

export function createWishListCard(product) {
  const div = document.createElement("div");
  div.classList.add("wishlist-item");
  div.dataset.id = product.id;

  const {
    id = "",
    title = "No title",
    category = "Unknown",
    price = 0,
    thumbnail = "",
    discountPercentage = 0,
    availabilityStatus = "unknown",
    stock = 0,
  } = product;

  const safePrice = Number(price) || 0;
  const priceInfo = getPriceInfo(safePrice, discountPercentage);

  const stockHTML =
    availabilityStatus === "In Stock"
      ? '<i class="fas fa-check-circle in-stock"></i> In Stock'
      : availabilityStatus === "Low Stock"
        ? '<i class="fas fa-exclamation-triangle low-stock"></i> Low Stock'
        : '<i class="fas fa-times-circle out-of-stock"></i> Out of Stock';

  div.innerHTML = `
    ${priceInfo.isOnSale ? '<span class="item-badge">Sale</span>' : ""} 
    <button class="remove-wishlist" title="Remove from wishlist">
      <i class="fas fa-times"></i>
    </button>
    <img src="${thumbnail}" alt="${title}" class="item-image" />
    <div class="item-details">
      <div class="item-category">${category}</div>
      <h3 class="item-title">${title}</h3>
      <div class="item-price">
        <span class="sale-price">$${priceInfo.currentPrice}</span>
        ${priceInfo.originalPrice ? `<span class="original-price">$${priceInfo.originalPrice}</span>` : ""}
      </div>
      <div class="item-stock">
        ${stockHTML} (${stock})
      </div>
      <div class="item-actions">
        <button class="add-to-cart-btn">
          <i class="fas fa-cart-plus"></i> Add to Cart
        </button>
        <button class="view-details-btn">View Details</button>
      </div>
    </div>
  `;
  return div;
}