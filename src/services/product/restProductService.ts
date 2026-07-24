import { apiFetch } from "@/lib/api";
import type {
  IProductService,
  Product,
  ProductSaveAction,
  ProductSavePayload,
  ProductSaveResult,
  ProductUpdateInput,
} from "./types";
import { SAVE_ACTION_STATUS } from "./types";

function payloadToCreateInput(payload: ProductSavePayload) {
  return {
    sku: payload.parentSku.trim() || payload.productInformation.productName.trim(),
    name: payload.productInformation.productName.trim(),
    description: payload.productInformation.description?.trim() || undefined,
  };
}

export const restProductService: IProductService = {
  async saveProduct(payload, action) {
    const body = payloadToCreateInput(payload);
    const product = await apiFetch<Product>("/products", {
      method: "POST",
      body,
      auth: true,
    });

    return {
      productId: product.id,
      status: SAVE_ACTION_STATUS[action],
    };
  },

  async listProducts() {
    const response = await apiFetch<{
      data: Product[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>("/products", {
      params: { limit: 1000 },
    });
    return response.data;
  },

  async getProduct(id) {
    return apiFetch<Product>(`/products/${id}`);
  },

  async updateProduct(id, patch) {
    return apiFetch<Product>(`/products/${id}`, {
      method: "PATCH",
      body: patch,
    });
  },

  async deleteProduct(id) {
    await apiFetch<void>(`/products/${id}`, {
      method: "DELETE",
    });
  },
};
