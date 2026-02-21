import { cart, productItems, productIds, setCart } from '../core/utils.js';
import { updateHeaderUI } from './sharedUI.js';
import { getPriceInfo } from '../core/utils.js';

export function addToCart(productId) {
  const product = productItems.find(
    (p) => p.id.toString() === productId.toString(),
  );
  if (!product) return;

  const newCart = [...cart];
  const existingItemIndex = newCart.findIndex(
    (item) => item.id.toString() === productId.toString(),
  );

  if (existingItemIndex !== -1) {
    newCart[existingItemIndex].quantity += 1;
  } else {
    newCart.push({
      stock: product.availabilityStatus,
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.thumbnail || product.image,
      quantity: 1,
    });
  }

  setCart(newCart);
  localStorage.setItem("cart", JSON.stringify(newCart));

  updateHeaderUI();

  // If we're on the cart page, update the display
  if (document.querySelector(".cart-items")) {
    import('../pages/cart.js').then(module => {
      module.renderCartItems();
      module.calculateCartSummary();
    });
  }
}

export function removeFromCart(productId) {
  const newCart = cart.filter((item) => item.id.toString() !== productId.toString());
  setCart(newCart);
  localStorage.setItem("cart", JSON.stringify(newCart));

  updateHeaderUI();

  if (document.querySelector(".cart-items")) {
    import('../pages/cart.js').then(module => {
      module.renderCartItems();
      module.calculateCartSummary();
    });
  }
}

export function updateQuantity(productId, newQuantity) {
  const newCart = cart.map(item => {
    if (item.id.toString() === productId.toString()) {
      return { ...item, quantity: Math.max(1, Math.min(10, newQuantity)) };
    }
    return item;
  });
  
  setCart(newCart);
  localStorage.setItem("cart", JSON.stringify(newCart));

  if (document.querySelector(".cart-items")) {
    import('../pages/cart.js').then(module => {
      module.renderCartItems();
      module.calculateCartSummary();
    });
  }
}