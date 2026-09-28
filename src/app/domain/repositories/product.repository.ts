import { Observable } from 'rxjs';
import {
  AddStockPayload,
  Category,
  CreateProductPayload,
  Product,
  ProductStock,
  UpdateProductPayload,
} from '../models/product.model';

/**
 * Domain-facing contract for product management. The presentation layer depends on this
 * abstract class (Angular's DI token pattern), never on the concrete HTTP implementation
 * in `data/`.
 */
export abstract class ProductRepository {
  /** Public catalog (HU-4) — active products only. */
  abstract getCatalog(): Observable<Product[]>;
  /** Search the public catalog by name and/or category (HU-17). Both filters are optional
   * and combine with AND; omitting both is equivalent to `getCatalog()`. */
  abstract search(name: string | null, categoryId: string | null): Observable<Product[]>;
  /** Admin management list (HU-10) — every product, any status. */
  abstract getAdminList(): Observable<Product[]>;
  abstract getById(id: string): Observable<Product>;
  /** Available units for a product, broken down by warehouse/store. 404s when the product
   * id isn't registered — surfaced by the caller as ProductApiError. */
  abstract getStock(id: string): Observable<ProductStock>;
  /** Batched stock lookup — one request for a whole table's Stock column instead of one
   * GET per row. Ids that don't match a product are simply absent from the result. Empty
   * input short-circuits to an empty result without a request. */
  abstract getStockBatch(ids: readonly string[]): Observable<ProductStock[]>;
  /** Category catalog — populates the "Categoría" select in the product form. */
  abstract getCategories(): Observable<Category[]>;
  abstract create(payload: CreateProductPayload): Observable<string>;
  abstract update(id: string, payload: UpdateProductPayload): Observable<void>;
  /** Manually add units to a product's stock (HU inventario — "Agregar Unidades"). */
  abstract addStock(id: string, payload: AddStockPayload): Observable<void>;
}
