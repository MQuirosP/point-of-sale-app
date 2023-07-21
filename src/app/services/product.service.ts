import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private backendUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
  ) { }

  getProducts() {
    return this.http.get<any>(`${this.backendUrl}products`);
  }

  getProductByIntCode(intCode: string) {
    return this.http.get<any>(`${this.backendUrl}products/int_code/${intCode}`);
  }

}
