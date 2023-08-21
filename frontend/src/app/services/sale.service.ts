import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';


interface ApiSaleResponse {
  success: boolean;
  message: {
    Sales: any[];
  };
}

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

  getSalesByDate(selectedDate: string) {
    return this.http.get<ApiSaleResponse>(`${this.backendUrl}sales/date/${selectedDate}`);
  }

  getCustomers() {
    return this.http.get<any>(`${this.backendUrl}customers`);
  }
}
