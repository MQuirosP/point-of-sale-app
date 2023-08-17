import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Products } from '../interfaces/products';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private backendUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
  ) { }

  getProducts(): Observable<any> {
    return this.http.get<Products>(`${this.backendUrl}products`);
  }

  getProductById(product: Products): Observable<any> {
    const productId = product.productId;
    return this.http.get<Products>(`${this.backendUrl}products/id/${productId}`)
  }

  getProductByIntCode(intCode: string): Observable<Products> {
    return this.http.get<Products>(`${this.backendUrl}products/int_code/${intCode}`);
  }

  saveProduct(productData: Products): Observable<any> {
    return this.http.post(`${this.backendUrl}products`, productData);
  }

  updateProduct(productId: number, productData: Products): Observable<any> {
    return this.http.put(`${this.backendUrl}products/${productId}`, productData);
  }

  deleteProduct(intCode: string, password: string): Observable<any> {
    const url = `${this.backendUrl}products/${intCode}`;

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      body: {
        password: password,
      },
    };

    return this.http.delete(url, httpOptions);
  }
}
