import { Component, Inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Order } from '../../models/order.model';
import { SHIPMENT_STATUSES, Shipment, ShipmentUpdate } from '../../models/shipment.model';
import { OrderService } from '../../services/order.service';

export interface ShipmentDialogData {
  /** When present the dialog works on an existing shipment. */
  shipment?: Shipment;
}

/**
 * Result of the dialog. It satisfies `ShipmentCreate` and `ShipmentUpdate`
 * (`order_id` is ignored by the update endpoint).
 */
export interface ShipmentPayload extends ShipmentUpdate {
  order_id: number;
  tracking_number: string;
}

@Component({
  selector: 'app-shipment-dialog',
  standalone: false,
  styleUrl: './shipment-dialog.scss',
  templateUrl: './shipment-dialog.html'
})
export class ShipmentDialog {
  readonly statuses = SHIPMENT_STATUSES;
  readonly shipment: Shipment | undefined;
  readonly form: FormGroup;
  readonly orders = signal<Order[]>([]);

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<ShipmentDialog, ShipmentPayload>,
    @Inject(MAT_DIALOG_DATA) data: ShipmentDialogData,
    private orderService: OrderService
  ) {
    this.shipment = data?.shipment;

    this.form = this.formBuilder.group({
      order_id: [this.shipment?.order_id ?? null, [Validators.required, Validators.min(1)]],
      tracking_number: [this.shipment?.tracking_number ?? '', Validators.required],
      carrier: [this.shipment?.carrier ?? ''],
      service_level: [this.shipment?.service_level ?? ''],
      status: [this.shipment?.status ?? 'pending', Validators.required],
      shipping_cost: [this.shipment?.shipping_cost ?? null, Validators.min(0)],
      estimated_delivery: [this.toDateInput(this.shipment?.estimated_delivery)],
      actual_delivery: [this.toDateInput(this.shipment?.actual_delivery)],
      notes: [this.shipment?.notes ?? '']
    });

    if (this.shipment) {
      // The update endpoint cannot move a shipment to another order.
      this.form.get('order_id')?.disable();
    }

    this.orderService.getOrders().subscribe({
      next: (orders) => this.orders.set(orders ?? []),
      error: () => this.orders.set([])
    });
  }

  /** Convenience getter for easy access to form fields. */
  get f() {
    return this.form.controls;
  }

  get title(): string {
    return this.shipment ? 'Edit shipment' : 'New shipment';
  }

  /** `picked_up` → `Picked Up` (the backend stores snake_case statuses). */
  statusLabel(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const cost = value.shipping_cost;

    this.dialogRef.close({
      order_id: Number(value.order_id),
      tracking_number: String(value.tracking_number ?? '').trim(),
      carrier: value.carrier ? String(value.carrier).trim() : null,
      service_level: value.service_level ? String(value.service_level).trim() : null,
      status: String(value.status ?? 'pending'),
      shipping_cost: cost === null || cost === undefined || cost === '' ? null : Number(cost),
      estimated_delivery: value.estimated_delivery
        ? new Date(value.estimated_delivery).toISOString()
        : null,
      actual_delivery: value.actual_delivery
        ? new Date(value.actual_delivery).toISOString()
        : null,
      notes: value.notes ? String(value.notes).trim() : null
    });
  }

  /** `yyyy-MM-dd` (what `<input type="date">` needs) from an ISO timestamp. */
  private toDateInput(value?: string | null): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? '' : date.toISOString().substring(0, 10);
  }
}