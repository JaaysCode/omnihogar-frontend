export type ProductStatus = 'active' | 'discontinued';

/** A catalog product, as shown to customers and managed by admins. */
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  price: number;
  imageUrl: string | null;
  status: ProductStatus;
}

/** Payload for POST /products. */
export interface CreateProductPayload {
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  price: number;
  imageUrl: string | null;
}

/** Payload for PUT /products/{id}. */
export interface UpdateProductPayload extends CreateProductPayload {
  id: string;
  status: ProductStatus;
}

/** Per-field validation messages, keyed by camelCase field name (e.g. "sku"). */
export type FieldErrors = Record<string, string[]>;

/**
 * Normalized error thrown by the product data layer. `fieldErrors` is populated for
 * 400 (validation / duplicate SKU) responses; absent for generic failures (e.g. 401, 403, 404, 500).
 */
export class ProductApiError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = 'ProductApiError';
  }
}
