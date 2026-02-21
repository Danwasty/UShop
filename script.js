//GLOBAL VARIABLES
let productItems = [];
let currentPage = 1;
let itemsPerPage = 9;
let currentList = productItems;
let wishlistIds = JSON.parse(localStorage.getItem("wishlist")) || [];
let isSelected = false;
let isAdded = false;
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let productIds = cart.map((item) => item.id);
let recentIds = JSON.parse(localStorage.getItem("recent")) || [];
let scrollX = 0;
let speed = 0.5;
let isPaused = false;
const track = document.querySelector(".category-track");

MAX_LENGTH = 5;

// API ENDPOINTS
const API_URL = "https://dummyjson.com/products?limit=0";

const categoryGroups = {
  "Beauty & Personal Care": ["beauty", "skin-care", "fragrances"],
  Electronics: ["smartphones", "laptops", "tablets", "mobile-accessories"],
  "Men's Fashion": ["mens-shirts", "mens-shoes", "mens-watches"],
  "Women's Fashion": [
    "womens-bags",
    "womens-dresses",
    "womens-jewellery",
    "womens-shoes",
    "womens-watches",
    "tops",
  ],
  "Home & Living": ["furniture", "home-decoration", "kitchen-accessories"],
  "Sports & Outdoors": ["sports-accessories"],
  Automotive: ["motorcycle", "vehicle"],
  Groceries: ["groceries"],
};

// ============== UTILITY FUNCTIONS (Used across multiple pages) ==============

function getRatingStars(rating) {
  const stars = [];
  const totalStars = 5;

  const fullStars = Math.floor(rating);
  const decimal = rating - fullStars;

  const hasHalf = decimal >= 0.25 && decimal < 0.75;
  const roundUp = decimal >= 0.75;

  for (let i = 0; i < fullStars; i++) {
    stars.push('<i class="fas fa-star"></i>');
  }
  if (hasHalf) {
    stars.push('<i class="fas fa-star-half-alt"></i>');
  }

  if (roundUp) {
    stars.push('<i class="fas fa-star"></i>');
  }

  // Fill the rest with empty stars
  while (stars.length < totalStars) {
    stars.push('<i class="far fa-star"></i>');
  }

  return stars.join("");
}

function getPriceInfo(price, discountPercentage) {
  if (price == null) {
    return {
      isOnSale: false,
      currentPrice: "0.00",
      originalPrice: null,
      discountLabel: null,
    };
  }

  if (!discountPercentage || discountPercentage <= 0) {
    return {
      isOnSale: false,
      currentPrice: price.toFixed(2),
      originalPrice: null,
      discountLabel: null,
    };
  }

  const original = (price * 100) / (100 - discountPercentage);

  return {
    isOnSale: true,
    currentPrice: price.toFixed(2),
    originalPrice: original.toFixed(2),
    discountLabel: `${discountPercentage}% off`,
  };
}

// UPDATING THE HEADER AND FOOTER
async function updateHeaderFooter() {
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
updateHeaderFooter();

function updateHeaderUI() {
  const wishCart = document.querySelector(".wish-cart");
  const wishCartCount = document.querySelector(".wishlist-count");
  const cartCount = document.querySelector(".cart-count");

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  if (cartCount) {
    cartCount.textContent = cart.length;
  }

  if (wishCartCount) {
    wishCartCount.textContent = wishlist.length;
  }

  if (wishCart) {
    wishCart.classList.toggle("active", wishlist.length > 0);
  }
}

// ============== CART FUNCTIONS ==============

function addToCart(productId) {
  const product = productItems.find(
    (p) => p.id.toString() === productId.toString(),
  );
  if (!product) return;

  const existingItem = cart.find(
    (item) => item.id.toString() === productId.toString(),
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      stock: product.availabilityStatus,
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.thumbnail || product.image,
      quantity: 1,
    });
  }

  productIds = cart.map((item) => item.id);
  localStorage.setItem("cart", JSON.stringify(cart));

  updateHeaderUI();

  // If we're on the cart page, update the display
  if (document.querySelector(".cart-items")) {
    renderCartItems();
    calculateCartSummary();
  }
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id.toString() !== productId.toString());
  productIds = cart.map((item) => item.id);
  localStorage.setItem("cart", JSON.stringify(cart));

  updateHeaderUI();

  if (document.querySelector(".cart-items")) {
    renderCartItems();
    calculateCartSummary();
  }
}

function updateQuantity(productId, newQuantity) {
  const item = cart.find((item) => item.id.toString() === productId.toString());
  if (item) {
    item.quantity = Math.max(1, Math.min(10, newQuantity));
    localStorage.setItem("cart", JSON.stringify(cart));

    if (document.querySelector(".cart-items")) {
      renderCartItems();
      calculateCartSummary();
    }
  }
}

function calculateCartSummary() {
  const cartSummary = document.querySelector(".cart-summary");
  const totalCartItems = document.querySelector(".total-in-cart");
  const subTotalLabel = document.querySelector(".subtotal");
  const totalTax = document.querySelector(".tax");
  const discountLabel = document.querySelector(".discount span:last-child");
  const totalLabel = document.querySelector(".summary-total span:last-child");
  const shippingLabel = document.querySelector(".shipping span:last-child");

  if (cart.length > 0) {
    cartSummary.classList.add("active");
  } else {
    cartSummary.classList.remove("active");
  }

  const subtotal = cart.reduce((acc, item) => {
    const priceInfo = getPriceInfo(item.price, 0);
    const itemTotal = priceInfo.currentPrice * item.quantity;
    return acc + itemTotal;
  }, 0);

  // shipping
  const shipping = subtotal > 100 ? 0 : 9.99;

  const discount = subtotal > 200 ? 30 : 0;
  const tax = calculateTax(subtotal);

  const total = subtotal + shipping + tax - discount;

  totalCartItems.textContent =
    cart.length > 1
      ? `Subtotal (${cart.length} items)`
      : `Subtotal (${cart.length} item)`;

  subTotalLabel.textContent = `$${subtotal.toFixed(2)}`;
  totalTax.textContent = `$${tax.toFixed(2)}`;
  discountLabel.textContent = `-$${discount.toFixed(2)}`;
  shippingLabel.textContent = `$${shipping.toFixed(2)}`;
  totalLabel.textContent = `$${total.toFixed(2)}`;
}

function calculateTax(subtotal) {
  return subtotal * 0.05;
}

function renderCartItems() {
  const cartContainer = document.querySelector(".cart-items");
  if (!cartContainer) return;

  cartContainer.innerHTML = "";

  if (cart.length === 0) {
    cartContainer.innerHTML = '<p class="no-results">Your cart is empty</p>';
    return;
  }

  cart.forEach((product) => {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.dataset.id = product.id;

    const priceInfo = getPriceInfo(product.price, 0);
    const totalCartPrice = priceInfo.currentPrice * product.quantity;

    const stockHTML =
      product.stock === "In Stock"
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
        <p class="item-price">$${totalCartPrice}</p>
        <p class="item-stock ">
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

  // Add event listeners for cart items
  cartContainer.addEventListener("click", (e) => {
    const cartItem = e.target.closest(".cart-item");
    if (!cartItem) return;

    const productId = cartItem.dataset.id;

    if (e.target.closest(".remove-btn")) {
      removeFromCart(productId);
    } else if (e.target.classList.contains("minus")) {
      const input = cartItem.querySelector(".qty-input");
      updateQuantity(productId, parseInt(input.value) - 1);
    } else if (e.target.classList.contains("plus")) {
      const input = cartItem.querySelector(".qty-input");
      updateQuantity(productId, parseInt(input.value) + 1);
    }
  });

  cartContainer.addEventListener("change", (e) => {
    if (e.target.classList.contains("qty-input")) {
      const cartItem = e.target.closest(".cart-item");
      const productId = cartItem.dataset.id;
      updateQuantity(productId, parseInt(e.target.value));
    }
  });
}

// ============== WISHLIST FUNCTIONS ==============

function toggleWishlist(productId) {
  let wishlistIds = JSON.parse(localStorage.getItem("wishlist")) || [];

  if (wishlistIds.includes(productId.toString())) {
    wishlistIds = wishlistIds.filter((id) => id !== productId.toString());
  } else {
    wishlistIds.push(productId.toString());
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlistIds));

  const heartIcon = document.querySelector(`.fa-heart[data-id="${productId}"]`);
  if (heartIcon) {
    heartIcon.classList.toggle(
      "selected",
      wishlistIds.includes(productId.toString()),
    );
  }

  updateHeaderUI();
  renderWishlistItems();
}

function renderWishlistItems() {
  const wishlistContainer = document.querySelector(".wishlist-grid");
  if (!wishlistContainer) return;

  // Show loading state
  wishlistContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading your wishlist...</p>
    </div>
  `;

  // Use setTimeout to simulate async operation (if needed)
  // In real app, you might have an async operation here
  setTimeout(() => {
    const wishlistIds = JSON.parse(localStorage.getItem("wishlist")) || [];

    if (wishlistIds.length === 0) {
      wishlistContainer.innerHTML =
        '<p class="no-results">Your wishlist is empty</p>';
      return;
    }

    wishlistContainer.innerHTML = ""; // Clear loading state

    wishlistIds.forEach((productId) => {
      const product = productItems.find(
        (p) => p.id.toString() === productId.toString(),
      );
      if (!product) return;

      const card = createWishListCard(product);
      wishlistContainer.appendChild(card);
    });
  }, 300); // Small delay to show loading state (remove if not needed)
}

function createWishListCard(product) {
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
          <img
            src="${thumbnail}"
            alt="${title}"
            class="item-image"
          />
          <div class="item-details">
            <div class="item-category">${category}</div>
            <h3 class="item-title">${title}</h3>
            <div class="item-price">
              <span class="sale-price">${priceInfo.currentPrice}</span>
              ${priceInfo.originalPrice ? `<span class="original-price">$${priceInfo.originalPrice}</span>` : ""}
            </div>
            <div class="item-stock ">
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

// ============== INDEX PAGE FUNCTIONS ==============

async function getAPIData(url) {
  const response = await fetch(url);
  const data = await response.json();
  productItems = data.products;
  currentList = productItems;
}

function getParentCategories() {
  return Object.keys(categoryGroups);
}

// HEADER SHOPPING CATEGORY

function shopByCategory() {
  const parentCategories = getParentCategories();

  return parentCategories.map((parentCat) => {
    const subCategories = categoryGroups[parentCat];

    // All products under this parent category
    const matchedProducts = productItems.filter((product) =>
      subCategories.includes(product.category),
    );

    return {
      title: parentCat,
      count: matchedProducts.length,
      thumbnail: matchedProducts.length ? matchedProducts[4].thumbnail : null,
    };
  });
}

function filterCategoryBanner(categoryId) {
  const subCategories = categoryGroups[categoryId];

  if (!subCategories) {
    console.warn("Unknown category:", categoryId);
    return;
  }

  const list = productItems.filter((product) =>
    subCategories.includes(product.category),
  );

  currentList = list;
  fillProductCards();
}

function filterByShopCategory() {
  const track = document.querySelector(".category-track");
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

function animate() {
  if (!isPaused) {
    scrollX -= speed;
    track.style.transform = `translateX(${scrollX}px)`;

    // Reset seamlessly
    if (Math.abs(scrollX) >= track.scrollWidth / 2) {
      scrollX = 0;
    }
  }

  requestAnimationFrame(animate);
}

function filterCategoryOptions() {
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

function filterProductsByParent(selectedParents) {
  const childCategories = selectedParents.flatMap(
    (parent) => categoryGroups[parent],
  );
  return productItems.filter((product) =>
    childCategories.includes(product.category),
  );
}

function getSelectedParents() {
  const filterOptions = document.querySelector(".filter-options");
  if (!filterOptions) return [];

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

function getProductBrands() {
  const productBrand = [...new Set(productItems.map((item) => item.brand))];
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

function filterbyBrand() {
  const selectedBrand = [
    ...document.querySelectorAll('input[name="brand"]:checked'),
  ].map((input) => input.value);
  return selectedBrand;
}

// SEARCH FUNCTIONALITY

function searchProducts(searchTerm) {
  const term = searchTerm.toLowerCase().trim();

  // reset when search is empty
  if (!term) {
    currentList = productItems;
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
    prdtGrid.innerHTML = `<p class="no-results">Sorry! Your search did not match any item.</p>`;
    return;
  }

  currentList = searchedItems;
  fillProductCards();
}

function createProductCard(product) {
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
  <a href="#">
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
          <i class="fas fa-heart ${wishlistIds.includes(id.toString()) ? "selected" : ""}" data-id='${id}'></i>
        </div>
      </div>
    </div>
  </a>
  `;
  return card;
}

function fillProductCards() {
  const productsGrid = document.querySelector(".products-grid");
  if (!productsGrid) return;

  productsGrid.innerHTML = "";

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const pageItems = currentList.slice(startIndex, endIndex);

  pageItems.forEach((product) => {
    const card = createProductCard(product);
    productsGrid.appendChild(card);
  });

  updatePaginationControls();
}

function updatePaginationControls() {
  const pageNumber = document.getElementById("pageNumber");
  if (!pageNumber) return;

  pageNumber.textContent = `Page ${currentPage}`;

  const prevBtns = document.querySelectorAll(
    ".fa-angles-left, .fa-chevron-left",
  );
  prevBtns.forEach((btn) => {
    btn.disabled = currentPage === 1;
  });

  const isLastPage = currentPage * itemsPerPage >= currentList.length;

  const nextBtns = document.querySelectorAll(
    ".fa-chevron-right, .fa-angles-right",
  );
  nextBtns.forEach((btn) => {
    btn.disabled = isLastPage;
  });
}

function applyAllFilters() {
  let list = productItems;

  // 1. Category filter
  const selectedParents = getSelectedParents();
  if (selectedParents.length > 0) {
    list = filterProductsByParent(selectedParents);
  }

  // 2. Price filter
  const minPriceInput = document.getElementById("min");
  const maxPriceInput = document.getElementById("max");

  if (minPriceInput && maxPriceInput) {
    const low = Number(minPriceInput.value);
    const high = Number(maxPriceInput.value);

    if (!isNaN(low) && !isNaN(high) && (low > 0 || high > 0)) {
      list = list.filter(
        (product) => product.price >= low && product.price <= high,
      );
    }
  }

  // 3. Rating filter
  const rating = getRatingValue();
  if (rating !== null) {
    list = list.filter((p) => p.rating >= rating);
  }

  // 4. Brand Filter
  const selectedBrands = filterbyBrand();
  if (selectedBrands.length > 0) {
    list = list.filter((p) => selectedBrands.includes(p.brand));
  }

  if (list.length === 0) {
    const productsGrid = document.querySelector(".products-grid");
    if (productsGrid) {
      productsGrid.innerHTML = `<p class='no-results'>Sorry, Your Search Did not match any product</p>`;
    }
    currentList = [];
    return;
  }

  // Update + render
  currentList = list;
  currentPage = 1;
  fillProductCards();
}

// RECENTLY VIEWED ITEMS FUNCTIONALITY

function RecentlyViewedProductIds(id) {
  let recentIds = JSON.parse(localStorage.getItem("recent")) || [];

  const strId = id.toString();
  recentIds = recentIds.filter((item) => item !== strId);

  recentIds.push(strId);

  while (recentIds.length > MAX_LENGTH) {
    recentIds.shift();
  }

  localStorage.setItem("recent", JSON.stringify(recentIds));

  console.log(recentIds);
}

function renderRecentlyViewedItems() {
  console.log("Recently called");
  let recentIds = JSON.parse(localStorage.getItem("recent")) || [];
  const recentProductGrid = document.querySelector(
    ".recently-viewed .products-grid",
  );

  console.log("recentProductGrid:", recentProductGrid);

  recentProductGrid.innerHTML = "";

  recentIds.forEach((id) => {
    const product = productItems.find((item) => item.id.toString() === id);
    console.log("found product:", product);
    if (!product) return;

    const div = createProductCard(product);
    recentProductGrid.appendChild(div);
  });
}

// ============== HERO BACKGROUND (Index page only) ==============

function initHeroBackground() {
  const heroBg = [
    { src: "images/bg_1.png", color: "rgb(12, 12, 12)" },
    { src: "images/bg_2.png", color: "rgb(255, 255, 255)" },
    { src: "images/bg_3.png", color: "white" },
  ];

  const hero = document.querySelector(".hero");
  if (!hero) return;

  let currentIndex = 0;

  heroBg.forEach((bg) => {
    const img = new Image();
    img.src = bg.src;
  });

  if (heroBg.length > 0) {
    hero.style.backgroundImage = `url('${heroBg[currentIndex].src}')`;
    hero.style.color = heroBg[currentIndex].color;
  }

  function changeBackground() {
    currentIndex = (currentIndex + 1) % heroBg.length;
    hero.style.backgroundImage = `url('${heroBg[currentIndex].src}')`;
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center";
    hero.style.transition = "background-image 1s ease";
    hero.style.color = heroBg[currentIndex].color;
  }

  setInterval(changeBackground, 10000);
}

// ============== INITIALIZATION FUNCTIONS ==============

async function initIndexPage() {
  await getAPIData(API_URL);
  fillProductCards();
  filterCategoryOptions();
  getProductBrands();
  initHeroBackground();

  updateHeaderUI();

  filterByShopCategory();
  animate();

  // Event listeners
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
    minPriceInput.addEventListener("change", applyAllFilters);
  }

  const maxPriceInput = document.getElementById("max");
  if (maxPriceInput) {
    maxPriceInput.addEventListener("change", applyAllFilters);
  }

  const ratingOptions = document.querySelector(".rating-options");
  if (ratingOptions) {
    ratingOptions.addEventListener("change", applyAllFilters);
  }

  document.getElementById("header").addEventListener("input", (e) => {
    const input = e.target.closest(".search-box input");
    if (!input) return;
    const searchTerm = input.value.trim();
    searchProducts(searchTerm);
  });

  // Pagination event listeners
  const prevBtn = document.getElementById("prev-btn");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        fillProductCards();
      }
    });
  }

  const nextBtn = document.getElementById("next-btn");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentPage * itemsPerPage < currentList.length) {
        currentPage++;
        fillProductCards();
      }
    });
  }

  const firstPageBtn = document.getElementById("first-pg-btn");
  if (firstPageBtn) {
    firstPageBtn.addEventListener("click", () => {
      if (currentPage !== 1) {
        currentPage = 1;
        fillProductCards();
      }
    });
  }

  const lastPageBtn = document.getElementById("last-pg-btn");
  if (lastPageBtn) {
    lastPageBtn.addEventListener("click", () => {
      const totalPages = Math.ceil(currentList.length / itemsPerPage);
      if (currentPage !== totalPages) {
        currentPage = totalPages;
        fillProductCards();
      }
    });
  }

  // Product grid event listeners (for wishlist and cart)
  const productsGrid = document.querySelector(".products-grid");
  if (productsGrid) {
    productsGrid.addEventListener("click", (e) => {
      const wishlistIcon = e.target.closest(".fa-heart");
      if (wishlistIcon) {
        e.preventDefault();
        const id = wishlistIcon.dataset.id;
        toggleWishlist(id);
      }

      // Add to cart
      const addBtn = e.target.closest(".addBtn");
      if (addBtn) {
        e.preventDefault();
        const productId = addBtn.dataset.id;
        if (!productIds.includes(productId)) {
          addToCart(productId);
        }
      }
    });

    document.querySelector("#products-grid").addEventListener("click", (e) => {
      // Ignore action buttons
      if (e.target.closest(".addBtn, .wishlist-icon")) {
        return;
      }

      const clickedProduct = e.target.closest(".product-card");
      if (!clickedProduct) return;

      const link = clickedProduct.querySelector("a");
      if (link) e.preventDefault();

      const productId = clickedProduct.dataset.id;
      if (!productId) return;

      RecentlyViewedProductIds(productId);
      renderRecentlyViewedItems();
    });

    track.addEventListener("mouseenter", () => {
      isPaused = true;
    });

    track.addEventListener("mouseleave", () => {
      isPaused = false;
    });

    track.addEventListener("click", (e) => {
      const card = e.target.closest("a");
      if (!card) return;

      e.preventDefault();

      const categoryId = card.dataset.category;
      filterCategoryBanner(categoryId);
    });
  }
}

function initCartPage() {
  updateHeaderUI();

  if (document.querySelector(".cart-items")) {
    renderCartItems();
    calculateCartSummary?.();
  }
}

function initWishlistPage() {
  updateHeaderUI();
}

// Load product data first, then render wishlist
getAPIData(API_URL).then(() => {
  renderWishlistItems();

  renderRecentlyViewedItems();

  // Add event listeners to wishlist items
  const wishlistGrid = document.querySelector(".wishlist-grid");
  if (wishlistGrid) {
    wishlistGrid.addEventListener("click", (e) => {
      const wishlistIcon = e.target.closest(".fa-heart");
      if (wishlistIcon) {
        e.preventDefault();
        const id = wishlistIcon.dataset.id;
        toggleWishlist(id);
      }

      const addBtn = e.target.closest(".addBtn");
      if (addBtn) {
        e.preventDefault();
        const productId = addBtn.dataset.id;
        if (!productIds.includes(productId)) {
          addToCart(productId);
        }
      }
    });
    wishlistGrid.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".remove-wishlist");
      if (removeBtn) {
        const card = removeBtn.closest(".wishlist-item");
        const productId = card.dataset.id;
        toggleWishlist(productId);
      }
    });

    wishlistGrid.addEventListener("click", (e) => {
      const addCartBtn = e.target.closest(".add-to-cart-btn");
      if (addCartBtn) {
        const card = addCartBtn.closest(".wishlist-item");
        const productId = card.dataset.id;
        addToCart(productId);
        toggleWishlist(productId);
      }
    });
  }
});

// ============== MAIN INITIALIZATION ==============

document.addEventListener("DOMContentLoaded", function () {
  // Determine which page we're on and initialize accordingly
  const isCartPage = document.querySelector(".cart-items") !== null;
  const isWishlistPage = document.querySelector(".wishlist-grid") !== null;
  const isIndexPage = document.querySelector(".products-grid") !== null;

  if (isCartPage) {
    initCartPage();
  } else if (isWishlistPage) {
    initWishlistPage();
  } else if (isIndexPage) {
    initIndexPage();
  } else {
    updateHeaderUI();
  }
});
