import { Component, Inject, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { InventoryItem } from '../../models/inventory.model';
import {
  ORDER_STATUSES,
  Order,
  OrderItemPayload,
  OrderStatus,
  OrderUpdate
} from '../../models/order.model';
import { Product } from '../../models/product.model';
import { InventoryService } from '../../services/inventory.service';
import { ProductService } from '../../services/product.service';

export interface OrderDialogData {
  /** When present the dialog works on an existing order. */
  order?: Order;
  /** Opens the dialog as a read-only detail view. */
  readOnly?: boolean;
}

/**
 * Result of the dialog. Structurally satisfies `OrderCreate` (items only apply
 * on create — `PUT /orders/{id}` cannot change line items) and `OrderUpdate`.
 */
export interface OrderPayload extends OrderUpdate {
  order_number: string;
  customer_name: string;
  status: OrderStatus;
  priority: boolean;
  /** What the customer bought. */
  items: OrderItemPayload[];
}

/** One row of the "items sold" editor. */
export interface OrderLine {
  product_id: number | null;
  name: string;
  sku: string;
  quantity: number;
  price_per_unit: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Component({
  selector: 'app-order-dialog',
  standalone: false,
  styleUrl: './order-dialog.scss',
  templateUrl: './order-dialog.html'
})
export class OrderDialog {
  readonly statuses = ORDER_STATUSES;
  readonly order: Order | undefined;
  readonly readOnly: boolean;
  readonly form: FormGroup;

  /** Product catalog behind the line-item picker. */
  readonly products = signal<Product[]>([]);
  /** Inventory snapshot behind the "remaining stock" hints. */
  readonly inventory = signal<InventoryItem[]>([]);
  /** Editable only while creating; seeded from the order when editing/viewing. */
  readonly lines = signal<OrderLine[]>([]);
  readonly linesError = signal('');

  private readonly stockByProductId = computed(
    () => new Map(this.inventory().map((item) => [item.product_id, item.quantity]))
  );

  constructor(
    private formBuilder: FormBuilder,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private dialogRef: MatDialogRef<OrderDialog, OrderPayload>,
    @Inject(MAT_DIALOG_DATA) data: OrderDialogData
  ) {
    this.order = data?.order;
    this.readOnly = !!data?.readOnly;

    this.form = this.formBuilder.group({
      order_number: [this.order?.order_number ?? '', Validators.required],
      customer_name: [this.order?.customer_name ?? '', Validators.required],
      customer_email: [this.order?.customer_email ?? '', Validators.email],
      customer_address: [this.order?.customer_address ?? ''],
      status: [this.order?.status ?? 'pending', Validators.required],
      priority: [this.order?.priority ?? false],
      total_amount: [this.order?.total_amount ?? null]
    });

    if (this.readOnly) {
      this.form.disable();
    }

    // Seed the line list from the existing order (shown read-only on edit/view).
    if (this.order?.items?.length) {
      this.lines.set(
        this.order.items.map((item) => ({
          product_id: item.product_id ?? null,
          name: item.product?.name ?? 'Removed product',
          sku: item.product?.sku ?? '',
          quantity: item.quantity,
          price_per_unit: item.price_per_unit
        }))
      );
    }

    this.productService.getProducts().subscribe({
      next: (products) => this.products.set(products)
    });
    this.inventoryService.getInventory().subscribe({
      next: (items) => this.inventory.set(items)
    });
  }

  /** Convenience getter for easy access to form fields. */
  get f() {
    return this.form.controls;
  }

  get title(): string {
    if (this.readOnly) {
      return `Order ${this.order?.order_number ?? ''}`;
    }
    return this.order ? 'Edit order' : 'New order';
  }

  /** `true` while creating — the only time line items can be changed. */
  get creating(): boolean {
    return !this.order;
  }

  /** Editable line rows only when creating (never in read-only view). */
  get canEditLines(): boolean {
    return this.creating && !this.readOnly;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.creating) {
      const error = this.linesValidationError();
      if (error) {
        this.linesError.set(error);
        return;
      }
    }

    const value = this.form.getRawValue();
    const amount = value.total_amount;
    const storedTotal =
      amount === null || amount === undefined || amount === '' ? null : Number(amount);

    this.dialogRef.close({
      order_number: String(value.order_number ?? '').trim(),
      customer_name: String(value.customer_name ?? '').trim(),
      customer_email: value.customer_email ? String(value.customer_email).trim() : null,
      customer_address: value.customer_address ? String(value.customer_address).trim() : null,
      status: value.status as OrderStatus,
      priority: !!value.priority,
      // While creating the total is the sum of the lines; on edit the stored
      // value is kept (it may include manually applied fees/discounts).
      total_amount: this.creating ? this.grandTotal() : storedTotal,
      items: this.lines()
        .filter((line) => line.product_id != null)
        .map((line) => ({
          product_id: line.product_id as number,
          quantity: line.quantity,
          price_per_unit: line.price_per_unit
        }))
    });
  }

  // ------------------------------------------------------------------
  // Line items — "what was sold"
  // ------------------------------------------------------------------

  addLine(): void {
    this.lines.update((lines) => [
      ...lines,
      { product_id: null, name: '', sku: '', quantity: 1, price_per_unit: 0 }
    ]);
    this.linesError.set('');
    this.syncTotal();
  }

  removeLine(index: number): void {
    this.lines.update((lines) => lines.filter((_, i) => i !== index));
    this.linesError.set('');
    this.syncTotal();
  }

  /** Picking a product fills in its catalog name/SKU/price as a default. */
  onLineProduct(index: number, productId: number): void {
    const product = this.products().find((candidate) => candidate.id === productId);
    if (!product) {
      return;
    }
    this.patchLine(index, {
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      price_per_unit: product.price
    });
  }

  onLineQuantity(index: number, raw: string, commit = false): void {
    const value = Number(raw);
    if (!commit && (raw.trim() === '' || !Number.isFinite(value) || value < 0)) {
      return; // let the user finish typing
    }
    this.patchLine(index, {
      quantity: Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
    });
  }

  onLinePrice(index: number, raw: string, commit = false): void {
    const value = Number(raw);
    if (!commit && (raw.trim() === '' || raw.endsWith('.') || !Number.isFinite(value) || value < 0)) {
      return; // let the user finish typing (e.g. "1." mid-decimal)
    }
    this.patchLine(index, {
      price_per_unit: Number.isFinite(value) && value >= 0 ? value : 0
    });
  }

  private patchLine(index: number, patch: Partial<OrderLine>): void {
    this.lines.update((lines) =>
      lines.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
    this.syncTotal();
  }

  lineTotal(line: OrderLine): number {
    return round2(line.quantity * line.price_per_unit);
  }

  /** What the whole order's line items sell for. */
  readonly grandTotal = computed(() =>
    round2(
      this.lines().reduce((sum, line) => sum + line.quantity * line.price_per_unit, 0)
    )
  );

  /** Keeps the read-only total field in step with the lines while creating. */
  private syncTotal(): void {
    if (this.creating) {
      this.form.controls['total_amount'].setValue(this.grandTotal());
    }
  }

  /** Current inventory quantity for a product; `null` when no stock record. */
  stockFor(productId: number | null): number | null {
    if (productId == null) {
      return null;
    }
    return this.stockByProductId().get(productId) ?? null;
  }

  /** Under the product picker: how much stock is left for that line. */
  stockHint(line: OrderLine): string {
    if (line.product_id == null) {
      return 'Pick a product to see stock';
    }
    const stock = this.stockFor(line.product_id);
    if (stock == null) {
      return 'No stock record for this product';
    }
    if (line.quantity > stock) {
      return `Only ${stock} in stock — short by ${line.quantity - stock}`;
    }
    return `In stock: ${stock}`;
  }

  isShort(line: OrderLine): boolean {
    const stock = this.stockFor(line.product_id);
    return stock != null && line.quantity > stock;
  }

  private linesValidationError(): string {
    const lines = this.lines();
    if (lines.length === 0) {
      return 'Add at least one line item so the order records what was sold.';
    }
    for (const line of lines) {
      if (line.product_id == null) {
        return 'Every line item needs a product.';
      }
      if (line.quantity < 1) {
        return `"${line.name || 'Line item'}" needs a quantity of at least 1.`;
      }
      if (line.price_per_unit <= 0) {
        return `"${line.name || 'Line item'}" needs a unit price greater than 0.`;
      }
    }
    return '';
  }
}
