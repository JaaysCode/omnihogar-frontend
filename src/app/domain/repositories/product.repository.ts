import { Observable } from 'rxjs';
import { CreateProductPayload, Product, UpdateProductPayload } from '../models/product.model';

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
  abstract create(payload: CreateProductPayload): Observable<string>;
  abstract update(id: string, payload: UpdateProductPayload): Observable<void>;
}
