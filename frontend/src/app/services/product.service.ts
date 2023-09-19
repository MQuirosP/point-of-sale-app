import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Products } from '../interfaces/products';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private backendUrl = environment.apiUrl + "products";

  constructor(
    private http: HttpClient,
  ) { }

  getProducts(): Observable<any> {
    return this.http.get<Products>(`${this.backendUrl}`);
  }

  getProductById(product: Products): Observable<any> {
    const productId = product.productId;
    return this.http.get<Products>(`${this.backendUrl}/id/${productId}`)
  }

  getProductByIntCode(intCode: string): Observable<Products> {
    return this.http.get<Products>(`${this.backendUrl}/int_code/${intCode}`);
  }

  saveProduct(productData: Products): Observable<any> {
    return this.http.post(`${this.backendUrl}`, productData);
  }

  updateProduct(productId: number, productData: Products): Observable<any> {
    return this.http.put(`${this.backendUrl}/${productId}`, productData);
  }

  deleteProduct(intCode: string, password: string): Observable<any> {
    const url = `${this.backendUrl}/${intCode}`;

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${environment.token}`
      }),
      body: {
        password: password,
      },
    };

    return this.http.delete(url, httpOptions);
  }
}
