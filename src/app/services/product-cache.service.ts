import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductCacheService {
  private cachedProducts: any[] = [];
  private localStorageKey = 'cachedProducts';

  constructor(private http: HttpClient) { }

  loadCachedProducts(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/products');
  }

  getCachedProducts(): any[] {
    const cachedData = localStorage.getItem(this.localStorageKey);
    if (cachedData) {
      this.cachedProducts = JSON.parse(cachedData);
    }
    return this.cachedProducts;
  }

  setCachedProducts(products: any[]): void {
    this.cachedProducts = products;
    localStorage.setItem(this.localStorageKey, JSON.stringify(products));
  }

  clearCachedProducts(): void {
    this.cachedProducts = [];
    localStorage.removeItem(this.localStorageKey);
  }

  getProductByIntCode(intCode: string): any | undefined {
    return this.cachedProducts.find(product => product.int_code === intCode);
  }
}
