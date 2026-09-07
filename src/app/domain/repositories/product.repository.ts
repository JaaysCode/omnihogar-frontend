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
  /** Admin management list (HU-10) — every product, any status. */
  abstract getAdminList(): Observable<Product[]>;
  abstract getById(id: string): Observable<Product>;
  /** Available units for a product, broken down by warehouse/store. 404s when the product
   * id isn't registered — surfaced by the caller as ProductApiError. */
  abstract getStock(id: string): Observable<ProductStock>;
  /** Category catalog — populates the "Categoría" select in the product form. */
  abstract getCategories(): Observable<Category[]>;
  abstract create(payload: CreateProductPayload): Observable<string>;
  abstract update(id: string, payload: UpdateProductPayload): Observable<void>;
  /** Manually add units to a product's stock (HU inventario — "Agregar Unidades"). */
  abstract addStock(id: string, payload: AddStockPayload): Observable<void>;
}
