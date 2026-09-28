import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderCreate, OrderUpdate } from '../models/order.model';
import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  // FastAPI declares these routes with a trailing slash.
  private apiUrl = `${API_BASE_URL}/orders/`;

  constructor(private http: HttpClient) {}

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}${id}`);
  }

  createOrder(order: OrderCreate): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }

  updateOrder(id: number, order: OrderUpdate): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}${id}`, order);
  }

  deleteOrder(id: number): Observable<Order> {
    return this.http.delete<Order>(`${this.apiUrl}${id}`);
  }
}
