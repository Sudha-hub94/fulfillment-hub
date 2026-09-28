import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Product, ProductUpdate } from '../../models/product.model';

export interface ProductDialogData {
  /** When present the dialog works on an existing product. */
  product?: Product;
}

/**
 * Result of the dialog. It satisfies `ProductCreate` and `ProductUpdate`.
 */
export interface ProductPayload extends ProductUpdate {
  sku: string;
  name: string;
  price: number;
}

@Component({
  selector: 'app-product-dialog',
  standalone: false,
  styleUrl: './product-dialog.scss',
  templateUrl: './product-dialog.html'
})
export class ProductDialog {
  readonly product: Product | undefined;
  readonly form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<ProductDialog, ProductPayload>,
    @Inject(MAT_DIALOG_DATA) data: ProductDialogData
  ) {
    this.product = data?.product;

    this.form = this.formBuilder.group({
      sku: [this.product?.sku ?? '', Validators.required],
      name: [this.product?.name ?? '', Validators.required],
      price: [this.product?.price ?? null, [Validators.required, Validators.min(0.01)]],
      category: [this.product?.category ?? ''],
      weight: [this.product?.weight ?? null, Validators.min(0.01)],
      dimensions: [this.product?.dimensions ?? ''],
      description: [this.product?.description ?? ''],
      is_active: [this.product?.is_active ?? true]
    });
  }

  /** Convenience getter for easy access to form fields. */
  get f() {
    return this.form.controls;
  }

  get title(): string {
    return this.product ? 'Edit product' : 'New product';
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
      sku: String(value.sku ?? '').trim(),
      name: String(value.name ?? '').trim(),
      price: Number(value.price),
      description: value.description ? String(value.description).trim() : null,
      category: value.category ? String(value.category).trim() : null,
      weight: value.weight == null || value.weight === '' ? null : Number(value.weight),
      dimensions: value.dimensions ? String(value.dimensions).trim() : null,
      is_active: !!value.is_active
    });
  }
}