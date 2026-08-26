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
}

export interface CreateProductRequestDto {
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  price: number;
  imageUrl: string | null;
}

export interface UpdateProductRequestDto extends CreateProductRequestDto {
  id: string;
  status: string;
}
