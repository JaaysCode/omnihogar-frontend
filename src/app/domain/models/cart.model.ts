/** One line of the client's shopping cart (HU-05). */
export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  imageUrl: string | null;
  /** Price snapshotted when the product was first added. */
  unitPrice: number;
  quantity: number;
  /** `unitPrice * quantity`, computed by the backend. */
  subtotal: number;
  /** Units currently available — the UI caps the "+" stepper at this. */
  availableQuantity: number;
}

/** The client's active cart (HU-05). Empty `items` = nothing added yet. */
export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  /** Amount payable — equals `subtotal` for now (no tax/shipping at the cart stage). */
  total: number;
  /** Sum of every line's quantity. */
  itemCount: number;
}

/** Per-field validation messages, keyed by camelCase field name (e.g. "quantity"). */
export type CartFieldErrors = Record<string, string[]>;

/**
 * Normalized error thrown by the cart data layer. `fieldErrors` is populated for 400
 * (availability / quantity) responses; absent for generic failures (401, 404, 500, offline).
 */
export class CartApiError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: CartFieldErrors,
  ) {
    super(message);
    this.name = 'CartApiError';
  }
}
