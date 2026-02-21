import { categoryGroups } from "./constants.js";

// Global state that needs to be shared - changed from const to let
export let productItems = [];
export let currentPage = 1;
export let itemsPerPage = 9;
export let currentList = [];
export let wishlistIds = JSON.parse(localStorage.getItem("wishlist")) || [];
export let cart = JSON.parse(localStorage.getItem("cart")) || [];
export let productIds = cart.map((item) => item.id);
export const MAX_LENGTH = 5;
export let randomIds = new Set();

// Function to update productItems
export function setProductItems(items) {
  productItems = items;
  currentList = [...items]; // Create a new array instead of assigning reference
}

// Function to update currentList
export function setCurrentList(items) {
  currentList = [...items];
}

// Function to update currentPage
export function setCurrentPage(page) {
  currentPage = page;
}

// Function to update wishlistIds
export function setWishlistIds(ids) {
  wishlistIds = [...ids];
}

// Function to update cart
export function setCart(newCart) {
  cart = [...newCart];
  productIds = cart.map((item) => item.id);
}

export function getRatingStars(rating) {
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
  while (stars.length < totalStars) {
    stars.push('<i class="far fa-star"></i>');
  }
  return stars.join("");
}

export function getPriceInfo(price, discountPercentage) {
  if (price === null) {
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

export function getParentCategories() {
  return Object.keys(categoryGroups);
}

export function calculateTax(subtotal) {
  return subtotal * 0.05;
}

export function generateRandomProductId() {
  while (randomIds.size < 10) {
    const randomId = Math.floor(Math.random() * productItems.length) + 1;
    randomIds.add(randomId);
  }
}

