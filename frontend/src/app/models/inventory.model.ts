import { Product } from './product.model';

export interface InventoryItem {
  id: number;
  product_id: number;
  quantity: number;
  location?: string | null;
  reorder_level?: number;
  last_restocked?: string | null;
  /**
   * Denormalised columns of the `inventory` table. They are only sent by the
   * backend when the response model includes them, so treat them as optional.
   */
  sku?: string | null;
  reserved_quantity?: number;
  available_quantity?: number;
  product?: Product | null;
}

/** Body of `POST /api/v1/inventory/` (`schemas.InventoryCreate`). */
export interface InventoryCreate {
  product_id: number;
  quantity: number;
  location?: string | null;
  reorder_level?: number;
  last_restocked?: string | null;
}

/** Body of `PUT /api/v1/inventory/{id}` (`schemas.InventoryUpdate`). */
export interface InventoryUpdate {
  quantity?: number;
  location?: string | null;
  reorder_level?: number;
  last_restocked?: string | null;
}
