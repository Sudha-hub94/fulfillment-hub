import { Component, OnInit, computed, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Product } from '../../models/product.model';
import { API_BASE_URL } from '../../services/api.config';
import { ProductService } from '../../services/product.service';
import { ProductDialog, ProductDialogData, ProductPayload } from './product-dialog';

@Component({
  selector: 'app-products',
  standalone: false,
  styleUrl: './products.scss',
  templateUrl: './products.html'
})
export class ProductsComponent implements OnInit {
  readonly displayedColumns = ['sku', 'name', 'category', 'price', 'status', 'actions'];
  readonly pageSizeOptions = [5, 10, 25, 100];

  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly filter = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly filteredProducts = computed(() => {
    const term = this.filter().trim().toLowerCase();
    if (!term) {
      return this.products();
    }
    return this.products().filter((product) =>
      `${product.sku} ${product.name} ${product.category ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  });

  readonly pagedProducts = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredProducts().slice(start, start + this.pageSize());
  });

  constructor(
    private productService: ProductService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set('');

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(this.describe(error, 'Failed to load products'));
        this.loading.set(false);
      }
    });
  }

  applyFilter(event: Event): void {
    this.filter.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  isActive(product: Product): boolean {
    return product.is_active !== false;
  }

  addProduct(): void {
    this.dialog
      .open<ProductDialog, ProductDialogData, ProductPayload>(ProductDialog, {
        width: '560px',
        data: {}
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) {
          return;
        }
        this.productService.createProduct(payload).subscribe({
          next: (product) => {
            this.loadProducts();
            this.notify(`Product ${product.sku} created`);
          },
          error: (error) => this.notify(this.describe(error, 'Failed to create product'), true)
        });
      });
  }

  editProduct(product: Product): void {
    this.dialog
      .open<ProductDialog, ProductDialogData, ProductPayload>(ProductDialog, {
        width: '560px',
        data: { product }
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) {
          return;
        }
        this.productService.updateProduct(product.id, payload).subscribe({
          next: () => {
            this.loadProducts();
            this.notify(`Product ${payload.sku} updated`);
          },
          error: (error) => this.notify(this.describe(error, 'Failed to update product'), true)
        });
      });
  }

  deleteProduct(product: Product): void {
    const label = product.sku || `#${product.id}`;
    if (
      !window.confirm(
        `Delete product ${label}? Its inventory record will lose its product link.`
      )
    ) {
      return;
    }

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.loadProducts();
        this.notify(`Product ${label} deleted`);
      },
      error: (error) => this.notify(this.describe(error, 'Failed to delete product'), true)
    });
  }

  /** Turns an `HttpErrorResponse` into a message that is useful in the UI. */
  private describe(error: any, fallback: string): string {
    if (error?.status === 0) {
      return `${fallback}: the API at ${API_BASE_URL} is unreachable`;
    }
    if (error?.status === 401) {
      return 'Your session expired, please sign in again';
    }

    const detail = error?.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      // FastAPI (pydantic) validation errors.
      return detail.map((item: any) => item?.msg ?? '').filter(Boolean).join(', ') || fallback;
    }

    return fallback;
  }

  private notify(message: string, isError = false): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: isError ? 'app-snack-error' : 'app-snack-success'
    });
  }
}