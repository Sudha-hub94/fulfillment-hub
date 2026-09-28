import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Dashboard } from './dashboard';
import { InventoryComponent } from './inventory/inventory';
import { OrdersComponent } from './orders/orders';
import { ProductsComponent } from './products/products';
import { ShipmentsComponent } from './shipments/shipments';

const routes: Routes = [
  {
    path: '',
    component: Dashboard,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'orders' },
      { path: 'orders', component: OrdersComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'shipments', component: ShipmentsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule {}

