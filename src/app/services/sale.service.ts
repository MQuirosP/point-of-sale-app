import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private backendUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
  ) { }

  createSale(sale: any) {
    return this.http.post(`${this.backendUrl}sales/`, sale);
  }

  cancelSale(docNumber: string) {
    return this.http.put(`${this.backendUrl}sales/${docNumber}`, null);
  }
}
