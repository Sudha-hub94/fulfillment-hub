import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Shipment, ShipmentCreate, ShipmentUpdate } from '../models/shipment.model';
import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class ShipmentService {
  // FastAPI declares these routes with a trailing slash.
  private apiUrl = `${API_BASE_URL}/shipments/`;

  constructor(private http: HttpClient) {}

  getShipments(): Observable<Shipment[]> {
    return this.http.get<Shipment[]>(this.apiUrl);
  }

  getShipment(id: number): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.apiUrl}${id}`);
  }

  createShipment(shipment: ShipmentCreate): Observable<Shipment> {
    return this.http.post<Shipment>(this.apiUrl, shipment);
  }

  updateShipment(id: number, shipment: ShipmentUpdate): Observable<Shipment> {
    return this.http.put<Shipment>(`${this.apiUrl}${id}`, shipment);
  }

  deleteShipment(id: number): Observable<Shipment> {
    return this.http.delete<Shipment>(`${this.apiUrl}${id}`);
  }
}