import { HttpErrorResponse } from '@angular/common/http';
import { FieldErrors, Product, ProductApiError } from '../../domain/models/product.model';
import { ApiProblemDto } from '../services/auth-api.dto';
import { ProductDto } from '../services/product-api.dto';

export function toProduct(dto: ProductDto): Product {
  return {
    id: dto.id,
    sku: dto.sku,
    name: dto.name,
    description: dto.description,
    categoryId: dto.categoryId,
    price: dto.price,
    imageUrl: dto.imageUrl,
    status: dto.status === 'discontinued' ? 'discontinued' : 'active',
  };
}

/** Lowercases the backend's PascalCase field-error keys (e.g. "Sku" -> "sku"). */
function toFieldErrors(errors: Record<string, string[]>): FieldErrors {
  const normalized: FieldErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
    normalized[fieldName] = messages;
  }
  return normalized;
}

/** Translates a failed HTTP call into a domain-level {@link ProductApiError}. */
export function toProductApiError(error: unknown): ProductApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return new ProductApiError($localize`:@@products.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`);
  }

  if (error.status === 400) {
    const problem = error.error as ApiProblemDto | null;
    const fieldErrors = problem?.errors ? toFieldErrors(problem.errors) : undefined;
    return new ProductApiError(
      fieldErrors ? '' : $localize`:@@products.error.validation:Hay campos que corregir.`,
      fieldErrors,
    );
  }

  if (error.status === 401 || error.status === 403) {
    return new ProductApiError(
      $localize`:@@products.error.forbidden:No tienes permisos para gestionar productos.`,
    );
  }

  if (error.status === 404) {
    return new ProductApiError($localize`:@@products.error.notFound:El producto no existe.`);
  }

  if (error.status === 0) {
    return new ProductApiError(
      $localize`:@@products.error.offline:No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.`,
    );
  }

  return new ProductApiError($localize`:@@products.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`);
}
