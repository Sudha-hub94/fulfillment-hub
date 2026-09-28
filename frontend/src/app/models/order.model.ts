import { Product } from './product.model';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'picked'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'picked',
  'packed',
  'shipped',
  'delivered',
  'cancelled'
];

/** Order statuses that can still be modified from the pick/pack flow. */
export const OPEN_ORDER_STATUSES: OrderStatus[] = ORDER_STATUSES.filter(
  (status) => status !== 'shipped' && status !== 'delivered' && status !== 'cancelled'
);

export interface OrderItem {
  id: number;
  /** FK back to the product; `null` when the product was deleted. */
  product_id?: number | null;
  quantity: number;
  price_per_unit: number;
  product?: Product | null;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email?: string | null;
  customer_address?: string | null;
  status: OrderStatus;
  /** `true` when the order is flagged as a priority pick. */
  priority: boolean;
  total_amount?: number | null;
  created_at?: string;
  updated_at?: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
  owner_id?: number;
  items?: OrderItem[];
}

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
  price_per_unit: number;
}

/** Body of `POST /api/v1/orders/` (`schemas.OrderCreate`). */
export interface OrderCreate {
  order_number: string;
  customer_name: string;
  customer_email?: string | null;
  customer_address?: string | null;
  status: OrderStatus;
  priority: boolean;
  total_amount?: number | null;
  items: OrderItemPayload[];
}

/** Body of `PUT /api/v1/orders/{id}` (`schemas.OrderUpdate`). */
export interface OrderUpdate {
  order_number?: string;
  customer_name?: string;
  customer_email?: string | null;
  customer_address?: string | null;
  status?: OrderStatus;
  priority?: boolean;
  total_amount?: number | null;
}
