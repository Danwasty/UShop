import { cart } from '../core/utils.js';
import { getPriceInfo, calculateTax } from '../core/utils.js';
import { removeFromCart, updateQuantity } from '../services/cartService.js';
import { updateHeaderUI } from '../services/sharedUI.js';
import { fillMainNav } from '../services/sharedUI.js';

export function calculateCartSummary() {
  const cartSummary = document.querySelector(".cart-summary");
  const totalCartItems = document.querySelector(".total-in-cart");
  const subTotalLabel = document.querySelector(".subtotal");
  const totalTax = document.querySelector(".tax");
  const discountLabel = document.querySelector(".discount span:last-child");
  const totalLabel = document.querySelector(".summary-total span:last-child");
  const shippingLabel = document.querySelector(".shipping span:last-child");

  if (!cartSummary) return;

  if (cart.length > 0) {
    cartSummary.classList.add("active");
  } else {
    cartSummary.classList.remove("active");
  }

  const subtotal = cart.reduce((acc, item) => {
    const priceInfo = getPriceInfo(item.price, 0);
    const itemTotal = parseFloat(priceInfo.currentPrice) * item.quantity;
    return acc + itemTotal;
  }, 0);

  const shipping = subtotal > 100 ? 0 : 9.99;
  const discount = subtotal > 200 ? 30 : 0;
  const tax = calculateTax(subtotal);
  const total = subtotal + shipping + tax - discount;

  if (totalCartItems) {
    totalCartItems.textContent =
      cart.length > 1
        ? `Subtotal (${cart.length} items)`
        : `Subtotal (${cart.length} item)`;
  }

  if (subTotalLabel) subTotalLabel.textContent = `$${subtotal.toFixed(2)}`;
  if (totalTax) totalTax.textContent = `$${tax.toFixed(2)}`;
  if (discountLabel) discountLabel.textContent = `-$${discount.toFixed(2)}`;
  if (shippingLabel) shippingLabel.textContent = `$${shipping.toFixed(2)}`;
  if (totalLabel) totalLabel.textContent = `$${total.toFixed(2)}`;
}

export function renderCartItems() {
  const cartContainer = document.querySelector(".cart-items");
  if (!cartContainer) return;

  cartContainer.innerHTML = "";

  if (cart.length === 0) {
    cartContainer.innerHTML = '<p class="no-results">Your cart is empty</p>';
    calculateCartSummary();
    return;
  }

  cart.forEach((product) => {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.dataset.id = product.id;

    const priceInfo = getPriceInfo(product.price, 0);
    const totalCartPrice = parseFloat(priceInfo.currentPrice) * product.quantity;

    const stockHTML = product.stock === "In Stock"
      ? '<i class="fas fa-check-circle in-stock"></i> In Stock'
      : product.stock === "Low Stock"
        ? '<i class="fas fa-exclamation-triangle low-stock"></i> Low Stock'
        : '<i class="fas fa-times-circle out-of-stock"></i> Out of Stock';

    div.innerHTML = `
      <img src="${product.image}" alt="${product.title}" class="item-image" />
      <div class="item-details">
        <h3 class="item-title">
          ${product.title}
        </h3>
        <p class="item-price">$${totalCartPrice.toFixed(2)}</p>
        <p class="item-stock">
          ${stockHTML}
        </p>
        <div class="item-actions">
          <div class="quantity-control">
            <button class="qty-btn minus">-</button>
            <input type="number" class="qty-input" value="${product.quantity}" min="1" max="10" />
            <button class="qty-btn plus">+</button>
          </div>
          <button class="remove-btn">
            <i class="fas fa-trash-alt"></i> Remove
          </button>
        </div>
      </div>
    `;

    cartContainer.appendChild(div);
  });

  calculateCartSummary();

  // Add event listeners
  cartContainer.querySelectorAll(".cart-item").forEach(item => {
    const productId = item.dataset.id;
    const minusBtn = item.querySelector(".minus");
    const plusBtn = item.querySelector(".plus");
    const qtyInput = item.querySelector(".qty-input");
    const removeBtn = item.querySelector(".remove-btn");

    if (minusBtn) {
      minusBtn.addEventListener("click", () => {
        const newQty = parseInt(qtyInput.value) - 1;
        if (newQty >= 1) {
          updateQuantity(productId, newQty);
        }
      });
    }

    if (plusBtn) {
      plusBtn.addEventListener("click", () => {
        const newQty = parseInt(qtyInput.value) + 1;
        if (newQty <= 10) {
          updateQuantity(productId, newQty);
        }
      });
    }

    if (qtyInput) {
      qtyInput.addEventListener("change", () => {
        const newQty = parseInt(qtyInput.value);
        if (newQty >= 1 && newQty <= 10) {
          updateQuantity(productId, newQty);
        } else {
          qtyInput.value = Math.max(1, Math.min(10, newQty));
        }
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        removeFromCart(productId);
      });
    }
  });
}

export function initCartPage() {
  updateHeaderUI();
  fillMainNav()
  renderCartItems();
}