import { API_URL } from './constants.js';
import { setProductItems } from './utils.js';

export async function getAPIData() {
  const response = await fetch(API_URL);
  const data = await response.json();
  setProductItems(data.products);
  console.log(data.products)
  return data.products;
}