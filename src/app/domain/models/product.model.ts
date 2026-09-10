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
  /** Units available across all facilities (HU-05). `null` when the query didn't compute it. */
  availableQuantity: number | null;
  /** `true` when `availableQuantity > 0` (HU-05). `null` when not computed. */
  inStock: boolean | null;
}

/** Product category — GET /categories, populates the "Categoría" select in the product form. */
export interface Category {
  id: string;
  name: string;
}

/** Payload for POST /products. */
export interface CreateProductPayload {
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  price: number;
  imageUrl: string | null;
  /** Units to stock immediately at the default facility. Null/0 = no initial inventory row. */
  initialStock: number | null;
}

/** Payload for PUT /products/{id}. Editing doesn't touch stock — that's the inventory section's job. */
export interface UpdateProductPayload extends Omit<CreateProductPayload, 'initialStock'> {
  id: string;
  status: ProductStatus;
}

/** Payload for POST /products/{id}/stock (HU inventario — "Agregar Unidades"). */
export interface AddStockPayload {
  quantity: number;
  reason: string | null;
}

/** Per-field validation messages, keyed by camelCase field name (e.g. "sku"). */
export type FieldErrors = Record<string, string[]>;

/** One facility's (warehouse/store) available units for a product — GET /products/{id}/stock. */
export interface FacilityStock {
  facilityId: string;
  facilityName: string;
  facilityType: 'WAREHOUSE' | 'POS';
  city: string;
  availableQuantity: number;
}

/** Stock lookup result (HU inventario) — total units plus the per-facility breakdown. */
export interface ProductStock {
  productId: string;
  sku: string;
  productName: string;
  totalAvailable: number;
  inStock: boolean;
  facilities: FacilityStock[];
}

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
