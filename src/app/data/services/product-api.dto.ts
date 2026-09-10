/** Wire-shape DTOs — mirror the backend's JSON exactly (camelCase via System.Text.Json). */

export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  price: number;
  imageUrl: string | null;
  status: string;
  /** HU-05 — present on the public catalog payload; absent elsewhere. */
  availableQuantity?: number | null;
  inStock?: boolean | null;
}

export interface CategoryDto {
  id: string;
  name: string;
}

export interface CreateProductRequestDto {
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  price: number;
  imageUrl: string | null;
  initialStock: number | null;
}

export interface UpdateProductRequestDto extends Omit<CreateProductRequestDto, 'initialStock'> {
  id: string;
  status: string;
}

export interface AddStockRequestDto {
  quantity: number;
  reason: string | null;
}

export interface FacilityStockDto {
  facilityId: string;
  facilityName: string;
  facilityType: string;
  city: string;
  availableQuantity: number;
}

export interface ProductStockDto {
  productId: string;
  sku: string;
  productName: string;
  totalAvailable: number;
  inStock: boolean;
  facilities: FacilityStockDto[];
}
