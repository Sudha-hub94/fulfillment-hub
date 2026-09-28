import { Component, OnInit, computed, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Shipment } from '../../models/shipment.model';
import { API_BASE_URL } from '../../services/api.config';
import { ShipmentService } from '../../services/shipment.service';
import { ShipmentDialog, ShipmentDialogData, ShipmentPayload } from './shipment-dialog';

@Component({
  selector: 'app-shipments',
  standalone: false,
  styleUrl: './shipments.scss',
  templateUrl: './shipments.html'
})
export class ShipmentsComponent implements OnInit {
  readonly displayedColumns = [
    'tracking_number',
    'order',
    'carrier',
    'status',
    'estimated_delivery',
    'actions'
  ];
  readonly pageSizeOptions = [5, 10, 25, 100];

  readonly shipments = signal<Shipment[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly filter = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly filteredShipments = computed(() => {
    const term = this.filter().trim().toLowerCase();
    if (!term) {
      return this.shipments();
    }
    return this.shipments().filter((shipment) =>
      `${shipment.tracking_number} ${shipment.carrier ?? ''} ${shipment.status} ${this.orderLabel(shipment)}`
        .toLowerCase()
        .includes(term)
    );
  });

  readonly pagedShipments = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredShipments().slice(start, start + this.pageSize());
  });

  constructor(
    private shipmentService: ShipmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadShipments();
  }

  loadShipments(): void {
    this.loading.set(true);
    this.error.set('');

    this.shipmentService.getShipments().subscribe({
      next: (shipments) => {
        this.shipments.set(shipments ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(this.describe(error, 'Failed to load shipments'));
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

  /** Order number of the linked order; `-` when the order was deleted. */
  orderLabel(shipment: Shipment): string {
    return shipment.order?.order_number ?? (shipment.order_id != null ? `#${shipment.order_id}` : '-');
  }

  /** `picked_up` → `Picked Up` (the backend stores snake_case statuses). */
  statusLabel(status: string | null | undefined): string {
    if (!status) {
      return '-';
    }
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  addShipment(): void {
    this.dialog
      .open<ShipmentDialog, ShipmentDialogData, ShipmentPayload>(ShipmentDialog, {
        width: '560px',
        data: {}
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) {
          return;
        }
        this.shipmentService.createShipment(payload).subscribe({
          next: () => {
            this.loadShipments();
            this.notify(`Shipment ${payload.tracking_number} created`);
          },
          error: (error) => this.notify(this.describe(error, 'Failed to create shipment'), true)
        });
      });
  }

  editShipment(shipment: Shipment): void {
    this.dialog
      .open<ShipmentDialog, ShipmentDialogData, ShipmentPayload>(ShipmentDialog, {
        width: '560px',
        data: { shipment }
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) {
          return;
        }
        this.shipmentService.updateShipment(shipment.id, payload).subscribe({
          next: () => {
            this.loadShipments();
            this.notify(`Shipment ${payload.tracking_number} updated`);
          },
          error: (error) => this.notify(this.describe(error, 'Failed to update shipment'), true)
        });
      });
  }

  deleteShipment(shipment: Shipment): void {
    if (!window.confirm(`Delete shipment ${shipment.tracking_number}?`)) {
      return;
    }

    this.shipmentService.deleteShipment(shipment.id).subscribe({
      next: () => {
        this.loadShipments();
        this.notify(`Shipment ${shipment.tracking_number} deleted`);
      },
      error: (error) => this.notify(this.describe(error, 'Failed to delete shipment'), true)
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