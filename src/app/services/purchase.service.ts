import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface Purchase {
  providerId: number;
  provider_name: string;
  paymentMethod: string;
  doc_number: string;
  status: string;
  sub_total: number;
  taxes_amount: number;
  products: Product[];
}

interface Product {
  int_code: number;
  quantity: number;
  price: number;
  taxes_amount?: number;
  sub_total?: number;
}

@Injectable({
  providedIn: 'root'
})


export class PurchaseService {
  private url = environment.apiUrl; // URL del endpoint para crear compras

  constructor(private http: HttpClient) {}

  createPurchase(purchase: Purchase): Observable<any> {
    return this.http.post(`${this.url}purchases`, purchase);
  }

  cancelPurchase(docNumber: string): Observable<any> {
    const url = `${this.url}purchases/${docNumber}`;
    return this.http.put(url, null);
  }
}
