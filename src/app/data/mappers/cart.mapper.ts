import { HttpErrorResponse } from '@angular/common/http';
import { Cart, CartApiError, CartFieldErrors, CartItem } from '../../domain/models/cart.model';
import { ApiProblemDto } from '../services/auth-api.dto';
import { CartDto, CartItemDto } from '../services/cart-api.dto';

export function toCartItem(dto: CartItemDto): CartItem {
  return {
    productId: dto.productId,
    sku: dto.sku,
    name: dto.name,
    imageUrl: dto.imageUrl,
    unitPrice: dto.unitPrice,
    quantity: dto.quantity,
    subtotal: dto.subtotal,
    availableQuantity: dto.availableQuantity,
  };
}

export function toCart(dto: CartDto): Cart {
  return {
    id: dto.id,
    items: dto.items.map(toCartItem),
    subtotal: dto.subtotal,
    total: dto.total,
    itemCount: dto.itemCount,
  };
}

/** Lowercases the backend's PascalCase field-error keys (e.g. "Quantity" -> "quantity"). */
function toFieldErrors(errors: Record<string, string[]>): CartFieldErrors {
  const normalized: CartFieldErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
    normalized[fieldName] = messages;
  }
  return normalized;
}

/** Translates a failed HTTP call into a domain-level {@link CartApiError}. */
export function toCartApiError(error: unknown): CartApiError {
  const generic = $localize`:@@cart.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`;

  if (!(error instanceof HttpErrorResponse)) {
    return new CartApiError(generic);
  }

  if (error.status === 400) {
    const problem = error.error as ApiProblemDto | null;
    const fieldErrors = problem?.errors ? toFieldErrors(problem.errors) : undefined;
    return new CartApiError(
      fieldErrors
        ? Object.values(fieldErrors)[0]?.[0] ?? $localize`:@@cart.error.validation:Revisa los datos e inténtalo de nuevo.`
        : problem?.title ?? $localize`:@@cart.error.validation:Revisa los datos e inténtalo de nuevo.`,
      fieldErrors,
    );
  }

  if (error.status === 401) {
    return new CartApiError($localize`:@@cart.error.unauthorized:Inicia sesión para usar el carrito.`);
  }

  if (error.status === 403) {
    return new CartApiError($localize`:@@cart.error.forbidden:No puedes usar el carrito con esta cuenta.`);
  }

  if (error.status === 404) {
    return new CartApiError($localize`:@@cart.error.notFound:El producto no está en el carrito.`);
  }

  if (error.status === 0) {
    return new CartApiError(
      $localize`:@@cart.error.offline:No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.`,
    );
  }

  return new CartApiError(generic);
}
