import { updateHeaderFooter } from './services/sharedUI.js';
import { getAPIData } from './core/api.js';

document.addEventListener("DOMContentLoaded", async function () {
  await getAPIData();
  await updateHeaderFooter();

  // Check which page we're on
  const isCartPage = document.querySelector(".cart-items") !== null;
  const isWishlistPage = document.querySelector(".wishlist-grid") !== null;
  const isIndexPage = document.querySelector(".products-grid") !== null;
  const isProductDetailsPage = document.querySelector(".product-card") !== null && 
                              window.location.pathname.includes('product-details.html');

  if (isCartPage) {
    import('./pages/cart.js').then(module => {
      module.initCartPage();
    });
  } else if (isWishlistPage) {
    import('./pages/wishlist.js').then(module => {
      module.initWishlistPage();
    });
  } else if (isIndexPage) {
    import('./pages/index.js').then(module => {
      module.initIndexPage();
    });
  } else if (isProductDetailsPage) {
    import('./pages/productDetails.js').then(module => {
      module.initProductDetailsPage();
    });
  }
});