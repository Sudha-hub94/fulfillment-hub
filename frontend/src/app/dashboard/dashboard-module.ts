import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DashboardRoutingModule } from './dashboard-routing-module';
import { Dashboard } from './dashboard';
import { InventoryDialog } from './inventory/inventory-dialog';
import { InventoryComponent } from './inventory/inventory';
import { OrderDialog } from './orders/order-dialog';
import { OrdersComponent } from './orders/orders';
import { ProductDialog } from './products/product-dialog';
import { ProductsComponent } from './products/products';
import { ShipmentDialog } from './shipments/shipment-dialog';
import { ShipmentsComponent } from './shipments/shipments';

@NgModule({
  declarations: [
    Dashboard,
    OrdersComponent,
    InventoryComponent,
    ProductsComponent,
    ShipmentsComponent,
    OrderDialog,
    InventoryDialog,
    ProductDialog,
    ShipmentDialog
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DashboardRoutingModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule
  ]
})
export class DashboardModule {}

