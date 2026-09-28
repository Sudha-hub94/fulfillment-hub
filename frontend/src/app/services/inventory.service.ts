import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryCreate, InventoryItem, InventoryUpdate } from '../models/inventory.model';
import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  // FastAPI declares these routes with a trailing slash.
  private apiUrl = `${API_BASE_URL}/inventory/`;

  constructor(private http: HttpClient) {}

  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(this.apiUrl);
  }

  getInventoryItem(id: number): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}${id}`);
  }

  createInventoryItem(item: InventoryCreate): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(this.apiUrl, item);
  }

  updateInventoryItem(id: number, item: InventoryUpdate): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.apiUrl}${id}`, item);
  }

  deleteInventoryItem(id: number): Observable<InventoryItem> {
    return this.http.delete<InventoryItem>(`${this.apiUrl}${id}`);
  }
}
