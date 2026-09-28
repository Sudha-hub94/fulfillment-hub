import { Component, OnInit, computed, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';

import { InventoryItem } from '../../models/inventory.model';
import { Order, OrderItem } from '../../models/order.model';
import { API_BASE_URL } from '../../services/api.config';
import { InventoryService } from '../../services/inventory.service';
import { OrderService } from '../../services/order.service';
import { OrderDialog, OrderDialogData, OrderPayload } from './order-dialog';

@Component({
  selector: 'app-orders',
  standalone: false,
  styleUrl: './orders.scss',
  templateUrl: './orders.html'
})
export class OrdersComponent implements OnInit {
  readonly displayedColumns = [
    'expand',
    'order_number',
    'customer_name',
    'items',
    'status',
    'priority',
    'total_amount',
    'actions'
  ];
  readonly pageSizeOptions = [5, 10, 25, 100];

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly filter = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  /** Order whose line-items detail row is currently expanded. */
  readonly expanded = signal<Order | null>(null);

  /** Inventory snapshot used to show how much stock is left per item. */
  private readonly inventory = signal<InventoryItem[]>([]);
  private readonly stockByProductId = computed(
    () => new Map(this.inventory().map((item) => [item.product_id, item.quantity]))
  );

  readonly filteredOrders = computed(() => {
    const term = this.filter().trim().toLowerCase();
    if (!term) {
      return this.orders();
    }
    return this.orders().filter((order) =>
      `${order.order_number} ${order.customer_name} ${order.customer_email ?? ''} ${(order.items ?? [])
        .map((item) => item.product?.name ?? '')
        .join(' ')}`
        .toLowerCase()
        .includes(term)
    );
  });

  readonly pagedOrders = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredOrders().slice(start, start + this.pageSize());
  });

  constructor(
    private orderService: OrderService,
    private inventoryService: InventoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.error.set('');
    this.loadStock();

    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(this.describe(error, 'Failed to load orders'));
        this.loading.set(false);
      }
    });
  }

  /** Best-effort inventory snapshot so rows can show what stock is left. */
  private loadStock(): void {
    this.inventoryService.getInventory().subscribe({
      next: (items) => this.inventory.set(items ?? []),
      error: () => {
        // Stock hints are informational — never block the orders table.
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

  addOrder(): void {
    this.dialog
      .open<OrderDialog, OrderDialogData, OrderPayload>(OrderDialog, {
        width: '560px',
        data: {}
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) {
          return;
        }
        // The dialog collects the line items (what was sold) plus customer data.
        this.orderService.createOrder(payload).subscribe({
          next: (order) => {
            this.loadOrders();
            this.notify(`Order ${order.order_number} created`);
          },
          error: (error) => this.notify(this.describe(error, 'Failed to create order'), true)
        });
      });
  }

  viewOrder(order: Order): void {
    this.dialog.open<OrderDialog, OrderDialogData, OrderPayload>(OrderDialog, {
      width: '560px',
      data: { order, readOnly: true }
    });
  }

  editOrder(order: Order): void {
    this.dialog
      .open<OrderDialog, OrderDialogData, OrderPayload>(OrderDialog, {
        width: '560px',
        data: { order }
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) {
          return;
        }
        // `PUT /orders/{id}` cannot change line items — send only order fields.
        const { items: _items, ...updates } = payload;
        this.orderService.updateOrder(order.id, updates).subscribe({
          next: () => {
            this.loadOrders();
            this.notify(`Order ${payload.order_number} updated`);
          },
          error: (error) => this.notify(this.describe(error, 'Failed to update order'), true)
        });
      });
  }

  deleteOrder(order: Order): void {
    if (!window.confirm(`Delete order ${order.order_number}?`)) {
      return;
    }

    this.orderService.deleteOrder(order.id).subscribe({
      next: () => {
        this.loadOrders();
        this.notify(`Order ${order.order_number} deleted`);
      },
      error: (error) => this.notify(this.describe(error, 'Failed to delete order'), true)
    });
  }

  /** Expands/collapses the line-items detail row of an order. */
  toggleExpanded(order: Order): void {
    this.expanded.set(this.expanded() === order ? null : order);
  }

  /** Predicate used by the `matRowDef` of the detail row. */
  readonly isExpandedRow = (row: Order): boolean => this.expanded() === row;

  /** Short "what was sold" summary shown in the Items column. */
  itemsSummary(order: Order): string {
    const items = order.items ?? [];
    if (!items.length) {
      return '';
    }
    const shown = items
      .slice(0, 3)
      .map((item) => `${this.itemName(item)} ×${item.quantity}`);
    return shown.join(', ') + (items.length > 3 ? ` +${items.length - 3} more` : '');
  }

  itemName(item: OrderItem): string {
    return item.product?.name ?? 'Removed product';
  }

  lineTotal(item: OrderItem): number {
    return Math.round(item.quantity * item.price_per_unit * 100) / 100;
  }

  itemsSubtotal(order: Order): number {
    const sum = (order.items ?? []).reduce((total, item) => total + this.lineTotal(item), 0);
    return Math.round(sum * 100) / 100;
  }

  /** Current inventory quantity left for an item's product. */
  stockForItem(item: OrderItem): number | null {
    if (item.product_id == null) {
      return null;
    }
    return this.stockByProductId().get(item.product_id) ?? null;
  }

  /** `true` when more was sold than the warehouse currently holds. */
  isShort(item: OrderItem): boolean {
    const stock = this.stockForItem(item);
    return stock != null && item.quantity > stock;
  }

  /** `true` when the stored total doesn't match the sum of the line items. */
  totalsDiffer(order: Order): boolean {
    if (order.total_amount == null || !order.items?.length) {
      return false;
    }
    return Math.abs(order.total_amount - this.itemsSubtotal(order)) > 0.005;
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

