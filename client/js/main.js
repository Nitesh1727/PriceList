const API_BASE_URL = "https://pricelist-l6cm.onrender.com/api/pricelist";

let searchTimeout;

// Debounced search function
function debounceSearch(func, wait) {
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(searchTimeout);
      func(...args);
    };
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(later, wait);
  };
}

// Fetch pricelist with search parameters
async function fetchPricelist(searchParams = {}) {
  try {
    const queryParams = new URLSearchParams(searchParams).toString();
    const url = queryParams ? `${API_BASE_URL}?${queryParams}` : API_BASE_URL;
    const response = await fetch(url);
    const result = await response.json();
    if (result.success) {
      clearAndRenderTable(result.data);
    }
  } catch (error) {
    console.error("Error fetching pricelist:", error);
  }
}

// Clear and render table
function clearAndRenderTable(items) {
  const pricelistSection = document.querySelector(".pricelist");
  // Keep the header
  const headerRow = pricelistSection.querySelector(".table-header");
  pricelistSection.innerHTML = "";
  pricelistSection.appendChild(headerRow);

  // Add all items
  items.forEach((item) => {
    const row = createTableRow(item);
    pricelistSection.appendChild(row);
  });
}

// Create editable table row
function createTableRow(item) {
  const row = document.createElement("div");
  row.className = "table-row";

  // Use PostgreSQL id instead of MongoDB _id
  if (!item.id) {
    console.error("Missing id:", item);
    return row;
  }

  const fields = [
    { key: "article_no", type: "text", label: "Article No" },
    { key: "product_service", type: "text", label: "Product/Service" },
    { key: "in_price", type: "number", label: "In Price" },
    { key: "price", type: "number", label: "Price" },
    { key: "unit", type: "text", label: "Unit" },
    { key: "in_stock", type: "number", label: "In Stock" },
    { key: "description", type: "text", label: "Description" },
  ];

  fields.forEach((field) => {
    const cell = document.createElement("div");
    cell.className = `editable ${field.key}-column`;

    const input = document.createElement("input");
    input.type = field.type;
    input.value = item[field.key] || "";
    if (field.type === "number") {
      input.step = "0.01";
    }

    // Store PostgreSQL id and original value
    input.setAttribute("data-id", item.id); // Changed from _id to id
    input.setAttribute("data-field", field.key);
    input.setAttribute("data-original", item[field.key] || "");

    // Add change and blur events for edit
    input.addEventListener("change", async () => {
      const newValue = input.value;
      const originalValue = input.getAttribute("data-original");
      const itemId = input.getAttribute("data-id");
      const fieldName = input.getAttribute("data-field");

      if (newValue !== originalValue && itemId) {
        console.log(`Updating ${fieldName} for item ${itemId} to ${newValue}`);
        try {
          await updateField(itemId, fieldName, newValue);
          input.setAttribute("data-original", newValue);
        } catch (error) {
          input.value = originalValue;
        }
      }
    });

    cell.appendChild(input);
    row.appendChild(cell);
  });

  // Add action button with correct id
  const actionButton = createActionButton(item.id); // Changed from _id to id
  row.appendChild(actionButton);

  return row;
}

async function updateField(id, field, value) {
  if (!id || id === "undefined") {
    console.error("Invalid item ID:", id);
    return;
  }

  try {
    // First get the current item data
    const getResponse = await fetch(`${API_BASE_URL}/${id}`);
    const currentItem = await getResponse.json();

    if (!currentItem.success || !currentItem.data) {
      throw new Error("Could not fetch current item data");
    }

    // Prepare update data with all required fields
    const updateData = {
      ...currentItem.data,
      [field]: value,
      // Ensure all required fields are present
      article_no: field === "article_no" ? value : currentItem.data.article_no,
      product_service: field === "product_service" ? value : currentItem.data.product_service,
      price: field === "price" ? value : currentItem.data.price,
    };

    console.log("Sending update with data:", updateData);

    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();
    console.log("Update response:", result);

    if (!result.success) {
      throw new Error(result.message || "Update failed");
    }

    // Refresh the table data after successful update
    fetchPricelist();
  } catch (error) {
    console.error("Error updating field:", error);
    alert("Failed to update field");
    throw error;
  }
}

function createActionButton(itemId) {
  const wrapper = document.createElement("div");
  wrapper.className = "mobile-actions";

  const button = document.createElement("button");
  button.className = "action-button";
  button.innerHTML = `
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="2"/>
      <circle cx="3" cy="12" r="2"/>
      <circle cx="21" cy="12" r="2"/>
    </svg>
  `;

  const menu = document.createElement("div");
  menu.className = "action-menu";
  menu.innerHTML = `
    <div class="action-menu-item view">
      <svg viewBox="0 0 24 24" fill="#0070dd">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
      </svg>
      View Details
    </div>
    <div class="action-menu-item delete">
      <svg viewBox="0 0 24 24" fill="#dc3545">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
      Delete
    </div>
  `;

  wrapper.appendChild(button);
  wrapper.appendChild(menu);

  // Global click handler for closing dropdowns
  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      menu.classList.remove("active");
    }
  });

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllMenus();
    menu.classList.toggle("active");
  });

  menu.querySelector(".view").addEventListener("click", async (e) => {
    e.stopPropagation();
    closeAllMenus();
    try {
      await showItemDetails(itemId);
    } catch (error) {
      console.error("View details error:", error);
    }
  });

  return wrapper;
}

function closeAllMenus() {
  document.querySelectorAll(".action-menu.active").forEach((menu) => {
    menu.classList.remove("active");
  });
}

// Update showItemDetails function to handle errors better
async function showItemDetails(id) {
  try {
    // Show loading state
    const loadingModal = document.createElement("div");
    loadingModal.className = "details-modal";
    loadingModal.innerHTML = `
      <div class="details-content" style="text-align: center; padding: 40px;">
        <h3>Loading details...</h3>
      </div>
    `;
    document.body.appendChild(loadingModal);
    loadingModal.style.display = "block";

    const response = await fetch(`${API_BASE_URL}/${id}`);
    const result = await response.json();

    // Remove loading state
    loadingModal.remove();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch item details");
    }

    if (!result.success || !result.data) {
      throw new Error("Item not found");
    }

    const modal = document.createElement("div");
    modal.className = "details-modal";
    modal.innerHTML = `
      <div class="details-content">
        <div class="details-header">
          <h2>${result.data.product_service || "No title"}</h2>
          <span class="close-details">✕</span>
        </div>
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">Article No</div>
            <div class="detail-value">${result.data.article_no || "—"}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">In Price</div>
            <div class="detail-value">${
              result.data.in_price
                ? Number(result.data.in_price).toFixed(2)
                : "—"
            }</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Price</div>
            <div class="detail-value">${
              result.data.price ? Number(result.data.price).toFixed(2) : "—"
            }</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Unit</div>
            <div class="detail-value">${result.data.unit || "—"}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">In Stock</div>
            <div class="detail-value">${result.data.in_stock ?? "—"}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Description</div>
            <div class="detail-value">${result.data.description || "—"}</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => {
      modal.style.opacity = "1";
    });

    const closeModal = () => {
      modal.style.opacity = "0";
      setTimeout(() => modal.remove(), 300);
    };

    const closeBtn = modal.querySelector(".close-details");
    closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  } catch (error) {
    console.error("Error fetching item details:", error);
    alert(`Could not load item details: ${error.message}`);
  }
}

async function deleteItem(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (result.success) {
      fetchPricelist();
    } else {
      alert("Failed to delete item");
    }
  } catch (error) {
    console.error("Error deleting item:", error);
    alert("Error deleting item");
  }
}

function initializeColumnToggle() {
  const toggle = document.createElement("div");
  toggle.className = "column-toggle";
  toggle.innerHTML = `
    <button class="column-toggle-button">Show/Hide Columns</button>
    <div class="column-options">
      <label class="column-option">
        <input type="checkbox" value="article_no" checked>
        Article No
      </label>
      <label class="column-option">
        <input type="checkbox" value="in_price" checked>
        In Price
      </label>
      <label class="column-option">
        <input type="checkbox" value="unit" checked>
        Unit
      </label>
      <label class="column-option">
        <input type="checkbox" value="in_stock" checked>
        In Stock
      </label>
      <label class="column-option">
        <input type="checkbox" value="description" checked>
        Description
      </label>
    </div>
  `;

  document.body.appendChild(toggle);

  const button = toggle.querySelector(".column-toggle-button");
  const options = toggle.querySelector(".column-options");

  // Close options when clicking outside
  document.addEventListener("click", (e) => {
    if (!toggle.contains(e.target)) {
      options.classList.remove("active");
    }
  });

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    options.classList.toggle("active");
  });

  options.addEventListener("change", (e) => {
    const columnClass = `${e.target.value}-column`;
    const columns = document.querySelectorAll(`.${columnClass}`);
    columns.forEach((col) => {
      col.style.display = e.target.checked ? "" : "none";
    });
  });
}

// Initialize search functionality
function initializeSearch() {
  const articleSearch = document.querySelector('input[placeholder*="Article"]');
  const productSearch = document.querySelector('input[placeholder*="Product"]');

  const handleSearch = debounceSearch(() => {
    const searchParams = {
      article_no: articleSearch.value,
      product_service: productSearch.value,
    };
    fetchPricelist(searchParams);
  }, 300);

  articleSearch.addEventListener("input", handleSearch);
  productSearch.addEventListener("input", handleSearch);
}

// Modal handlers
function initializeModal() {
  const modal = document.getElementById("newProductModal");
  const btn = document.querySelector("button");
  const span = document.getElementsByClassName("close")[0];
  const cancelBtn = document.querySelector(".cancel");
  const form = document.getElementById("newProductForm");

  btn.onclick = () => (modal.style.display = "block");
  span.onclick = () => (modal.style.display = "none");
  cancelBtn.onclick = () => (modal.style.display = "none");

  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = {
      article_no: document.getElementById("article_no").value,
      product_service: document.getElementById("product_service").value,
      in_price: parseFloat(document.getElementById("in_price").value) || 0,
      price: parseFloat(document.getElementById("price").value),
      unit: document.getElementById("unit").value,
      in_stock: parseInt(document.getElementById("in_stock").value) || 0,
      description: document.getElementById("description").value,
    };

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        modal.style.display = "none";
        form.reset();
        fetchPricelist();
      } else {
        alert("Failed to create product: " + result.message);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product");
    }
  };
}

// Mobile menu handler
function initializeMobileMenu() {
  const hamburger = document.querySelector(".hamburger");
  const sidebar = document.querySelector(".sidebar");
  const mainContent = document.querySelector(".main-content");

  hamburger.addEventListener("click", () => {
    sidebar.classList.toggle("active");
  });

  mainContent.addEventListener("click", () => {
    if (sidebar.classList.contains("active")) {
      sidebar.classList.remove("active");
    }
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  fetchPricelist();
  initializeSearch();
  initializeModal();
  initializeMobileMenu();
  initializeColumnToggle();
});
