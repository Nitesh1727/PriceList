// Import your CSS if needed
import "../css/styles.css";

const BASE_URL = "https://pricelist-l6cm.onrender.com";

// DOM Elements
const pricelistSection = document.querySelector(".pricelist");
const newProductForm = document.getElementById("newProductForm");
const modal = document.getElementById("newProductModal");
const newProductBtn = document.querySelector(".buttons button");
const closeBtn = document.querySelector(".close");
const cancelBtn = document.querySelector(".cancel");
const searchArticle = document.querySelector(
  'input[placeholder="Search Article No ..."]'
);
const searchProduct = document.querySelector(
  'input[placeholder="Search Product ..."]'
);

// API Functions
async function getAllProducts() {
  const response = await fetch(`${BASE_URL}/products`);
  return response.json();
}

async function createProduct(data) {
  const response = await fetch(`${BASE_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Load and render products
async function loadProducts() {
  try {
    const products = await getAllProducts();
    renderProducts(products);
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

// Render products
function renderProducts(products) {
  const header = pricelistSection.querySelector(".table-header").outerHTML;
  const rows = products
    .map(
      (product) => `
        <div class="table-row">
            <div>${product.article_no}</div>
            <div>${product.product_service}</div>
            <div>${product.in_price || "-"}</div>
            <div>${product.price}</div>
            <div>${product.unit || "-"}</div>
            <div>${product.in_stock || "0"}</div>
            <div>${product.description || "-"}</div>
        </div>
    `
    )
    .join("");

  pricelistSection.innerHTML = header + rows;
}

// Form handling
newProductForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    await createProduct(data);
    modal.style.display = "none";
    newProductForm.reset();
    loadProducts();
  } catch (error) {
    console.error("Error creating product:", error);
  }
});

// Modal handling
newProductBtn.addEventListener("click", () => (modal.style.display = "block"));
[closeBtn, cancelBtn].forEach((btn) => {
  btn.addEventListener("click", () => {
    modal.style.display = "none";
    newProductForm.reset();
  });
});

// Search functionality
[searchArticle, searchProduct].forEach((input) => {
  input.addEventListener("input", async () => {
    const products = await getAllProducts();
    const filtered = products.filter(
      (product) =>
        product.article_no
          .toLowerCase()
          .includes(searchArticle.value.toLowerCase()) &&
        product.product_service
          .toLowerCase()
          .includes(searchProduct.value.toLowerCase())
    );
    renderProducts(filtered);
  });
});

// Initial load
loadProducts();
