const BASE_URL = "https://pricelist-l6cm.onrender.com";

export const api = {
  async getAllProducts() {
    const response = await fetch(`${BASE_URL}/products`);
    return response.json();
  },

  async createProduct(productData) {
    const response = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });
    return response.json();
  },

  async updateProduct(id, productData) {
    const response = await fetch(`${BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });
    return response.json();
  },

  async deleteProduct(id) {
    const response = await fetch(`${BASE_URL}/products/${id}`, {
      method: "DELETE",
    });
    return response.json();
  },
};
