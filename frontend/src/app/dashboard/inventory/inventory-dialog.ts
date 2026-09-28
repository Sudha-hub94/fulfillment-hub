import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { InventoryItem, InventoryUpdate } from '../../models/inventory.model';

export interface InventoryDialogData {
  /** When present the dialog works on an existing inventory record. */
  item?: InventoryItem;
}

/**
 * Result of the dialog. It satisfies `InventoryCreate` and `InventoryUpdate`
 * (`product_id` is ignored by the update endpoint).
 */
export interface InventoryPayload extends InventoryUpdate {
  product_id: number;
  quantity: number;
}

@Component({
  selector: 'app-inventory-dialog',
  standalone: false,
  styleUrl: './inventory-dialog.scss',
  templateUrl: './inventory-dialog.html'
})
export class InventoryDialog {
  readonly item: InventoryItem | undefined;
  readonly form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<InventoryDialog, InventoryPayload>,
    @Inject(MAT_DIALOG_DATA) data: InventoryDialogData
  ) {
    this.item = data?.item;

    this.form = this.formBuilder.group({
      product_id: [this.item?.product_id ?? null, [Validators.required, Validators.min(1)]],
      quantity: [this.item?.quantity ?? 0, [Validators.required, Validators.min(0)]],
      location: [this.item?.location ?? ''],
      reorder_level: [this.item?.reorder_level ?? 10, [Validators.min(0)]],
      last_restocked: [this.toDateInput(this.item?.last_restocked)]
    });

    if (this.item) {
      // The update endpoint cannot move a record to another product.
      this.form.get('product_id')?.disable();
    }
  }

  /** Convenience getter for easy access to form fields. */
  get f() {
    return this.form.controls;
  }

  get title(): string {
    return this.item ? 'Edit inventory item' : 'Add inventory item';
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

    this.dialogRef.close({
      product_id: Number(value.product_id),
      quantity: Number(value.quantity),
      location: value.location ? String(value.location).trim() : null,
      reorder_level: value.reorder_level == null ? 0 : Number(value.reorder_level),
      last_restocked: value.last_restocked ? new Date(value.last_restocked).toISOString() : null
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
