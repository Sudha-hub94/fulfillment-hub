import { Component, OnInit, computed, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';

import { InventoryItem } from '../../models/inventory.model';
import { API_BASE_URL } from '../../services/api.config';
import { InventoryService } from '../../services/inventory.service';
import { InventoryDialog, InventoryDialogData, InventoryPayload } from './inventory-dialog';

@Component({
  selector: 'app-inventory',
  standalone: false,
  styleUrl: './inventory.scss',
  templateUrl: './inventory.html'
})
export class InventoryComponent implements OnInit {
  readonly displayedColumns = [
    'sku',
    'product_name',
    'quantity',
    'location',
    'reorder_level',
    'actions'
  ];
  readonly pageSizeOptions = [5, 10, 25, 100];

  readonly inventoryItems = signal<InventoryItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly filter = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly filteredItems = computed(() => {
    const term = this.filter().trim().toLowerCase();
    if (!term) {
      return this.inventoryItems();
    }
    return this.inventoryItems().filter((item) =>
      `${this.skuOf(item)} ${item.product?.name ?? ''} ${item.location ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  });

  readonly pagedItems = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredItems().slice(start, start + this.pageSize());
  });

  constructor(
    private inventoryService: InventoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading.set(true);
    this.error.set('');

    this.inventoryService.getInventory().subscribe({
      next: (items) => {
        this.inventoryItems.set(items ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(this.describe(error, 'Failed to load inventory'));
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

  /** The SKU lives on the product, `item.sku` is only sent by some responses. */
  skuOf(item: InventoryItem): string {
    return item.sku ?? item.product?.sku ?? '';
  }

  isLowStock(item: InventoryItem): boolean {
    const reorderLevel = item.reorder_level ?? 0;
    return reorderLevel > 0 && item.quantity <= reorderLevel;
  }

  addItem(): void {
    this.dialog
      .open<InventoryDialog, InventoryDialogData, InventoryPayload>(InventoryDialog, {
        width: '560px',
        data: {}
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) {
          return;
        }
        this.inventoryService.createInventoryItem(payload).subscribe({
          next: () => {
            this.loadInventory();
            this.notify('Inventory item created');
          },
          error: (error) => this.notify(this.describe(error, 'Failed to create item'), true)
        });
      });
  }

  editItem(item: InventoryItem): void {
    this.dialog
      .open<InventoryDialog, InventoryDialogData, InventoryPayload>(InventoryDialog, {
        width: '560px',
        data: { item }
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) {
          return;
        }
        this.inventoryService.updateInventoryItem(item.id, payload).subscribe({
          next: () => {
            this.loadInventory();
            this.notify('Inventory item updated');
          },
          error: (error) => this.notify(this.describe(error, 'Failed to update item'), true)
        });
      });
  }

  deleteItem(item: InventoryItem): void {
    const sku = this.skuOf(item) || `#${item.id}`;
    if (!window.confirm(`Delete the inventory record for ${sku}?`)) {
      return;
    }

    this.inventoryService.deleteInventoryItem(item.id).subscribe({
      next: () => {
        this.loadInventory();
        this.notify(`Inventory record ${sku} deleted`);
      },
      error: (error) => this.notify(this.describe(error, 'Failed to delete item'), true)
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

