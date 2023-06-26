import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private url = environment.apiUrl;

  constructor(
    private http: HttpClient,
  ) { }

  createSale(sale: any) {
    return this.http.post(`${this.url}sales/`, sale);
  }

  cancelSale(docNumber: string) {
    return this.http.put(`${this.url}sales/${docNumber}`, null);
  }
}
