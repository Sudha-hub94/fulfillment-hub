export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: number;
  weight?: number | null;
  dimensions?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Body of `POST /api/v1/products/` (`schemas.ProductCreate`). */
export interface ProductCreate {
  sku: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: number;
  weight?: number | null;
  dimensions?: string | null;
  is_active?: boolean;
}

/** Body of `PUT /api/v1/products/{id}` (`schemas.ProductUpdate`). */
export interface ProductUpdate {
  sku?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  price?: number;
  weight?: number | null;
  dimensions?: string | null;
  is_active?: boolean;
}
