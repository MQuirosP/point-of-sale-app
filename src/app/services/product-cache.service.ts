import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProductCacheService {
  private cachedProducts: any[] = [];
  constructor() { }

  getCachedProducts(): any[] {
    return this.cachedProducts;
  }

  setCachedProducts(products: any[]): void {
    this.cachedProducts = products;
  }
}
