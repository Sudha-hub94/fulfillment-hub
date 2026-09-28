export type ShipmentStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'exception';

/** Statuses offered by the UI (the backend stores any string, default `pending`). */
export const SHIPMENT_STATUSES: ShipmentStatus[] = [
  'pending',
  'picked_up',
  'in_transit',
  'delivered',
  'exception'
];

export interface Shipment {
  id: number;
  /** Nullable: nulled when the referenced order is deleted. */
  order_id?: number | null;
  tracking_number: string;
  carrier?: string | null;
  service_level?: string | null;
  status: string;
  shipping_cost?: number | null;
  estimated_delivery?: string | null;
  actual_delivery?: string | null;
  notes?: string | null;
  created_by_id?: number | null;
  created_at?: string;
  updated_at?: string;
  /** Nested order as sent by `schemas.Shipment` (null for orphaned rows). */
  order?: { order_number: string; customer_name?: string | null } | null;
}

/** Body of `POST /api/v1/shipments/` (`schemas.ShipmentCreate`). */
export interface ShipmentCreate {
  order_id: number;
  tracking_number: string;
  carrier?: string | null;
  service_level?: string | null;
  status?: string;
  shipping_cost?: number | null;
  estimated_delivery?: string | null;
  actual_delivery?: string | null;
  notes?: string | null;
}

/** Body of `PUT /api/v1/shipments/{id}` (`schemas.ShipmentUpdate`). */
export interface ShipmentUpdate {
  tracking_number?: string;
  carrier?: string | null;
  service_level?: string | null;
  status?: string;
  shipping_cost?: number | null;
  estimated_delivery?: string | null;
  actual_delivery?: string | null;
  notes?: string | null;
}