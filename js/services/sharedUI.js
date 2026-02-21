import { cart, wishlistIds } from '../core/utils.js';
import { getParentCategories } from '../core/utils.js'

export async function updateHeaderFooter() {
  const header = document.getElementById("header");
  const footer = document.getElementById("footer");

  if (header) {
    const response = await fetch("header.html");
    header.innerHTML = await response.text();
    updateHeaderUI();
  }

  if (footer) {
    const response = await fetch("footer.html");
    footer.innerHTML = await response.text();
  }
}

export function updateHeaderUI() {
  const wishCart = document.querySelector(".wish-cart");
  const wishCartCount = document.querySelector(".wishlist-count");
  const cartCount = document.querySelector(".cart-count");

  if (cartCount) {
    cartCount.textContent = cart.length;
  }

  if (wishCartCount) {
    wishCartCount.textContent = wishlistIds.length;
  }

  if (wishCart) {
    wishCart.classList.toggle("active", wishlistIds.length > 0);
  }
}

export function fillMainNav() {
  const mainNav = document.querySelector(".main-nav");
  const productCategories = getParentCategories();
  const div = document.createElement("div");
  div.classList.add("container");
  const ul = document.createElement("ul");

  productCategories.forEach((cat) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="#">${cat}</a>`;
    ul.appendChild(li);
  });
  div.appendChild(ul);
  mainNav.appendChild(div);
}
