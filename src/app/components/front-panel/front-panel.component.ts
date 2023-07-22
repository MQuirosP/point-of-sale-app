import { ChangeDetectorRef, Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ModalService } from '../../services/modalService';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { ProductCacheService } from 'src/app/services/product-cache.service';

@Component({
  selector: 'app-front-panel',
  templateUrl: './front-panel.component.html',
  styleUrls: ['./front-panel.component.css'],
  animations: [fadeAnimation]
})
export class FrontPanelComponent {
  backendUrl: string = environment.apiUrl;

  subscription: Subscription = new Subscription();
  products: any[] = [];
  filteredProducts: any[] = [];
  searchTerm: string = '';
  currentSlide: number = 0;

  cachedProducts: any[] = [];
  dataLoaded: boolean = false;

  constructor(
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private modalService: ModalService,
    private http: HttpClient,
    private productCacheService: ProductCacheService,
  ) {}

  ngOnInit(): void {
    this.loadData();
    // this.loadDataFromCache();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadDataFromCache() {
    const cachedData = localStorage.getItem('cachedProducts');
    if (cachedData) {
      this.cachedProducts = JSON.parse(cachedData);
      this.filteredProducts = [...this.cachedProducts];
      this.dataLoaded = true;
    } else {
      this.loadData();
    }
  }

  loadData() {
    if (this.dataLoaded) {
      return;
    }

    this.subscription = this.http.get(`${this.backendUrl}products`).subscribe({
      next: (response: any) => {
        if (
          response &&
          response.success &&
          response.message &&
          response.message.products &&
          response.message.products.length > 0
        ) {
          this.products = response.message.products;
          this.filteredProducts = [...this.products];
          this.cachedProducts = [...this.products];
          this.productCacheService.setCachedProducts(this.cachedProducts);
          this.dataLoaded = true;
          localStorage.setItem(
            'cachedProducts',
            JSON.stringify(this.cachedProducts)
          );
        }
      },
      error: (error) => {
        console.log('Error al obtener products', error);
      },
    });
  }

  filterProducts() {
    if (!this.searchTerm) {
      this.filteredProducts = [...this.products];
      return;
    }

    const searchTermNormalized = this.searchTerm
      ? this.searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      : '';

    this.filteredProducts = this.products.filter((product: any) => {
      const productNameNormalized = product.name
        ? product.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        : '';

      const productCodeNormalized = product.int_code
        ? product.int_code.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        : '';

      const searchTermLower = searchTermNormalized.toLowerCase();

      return (
        productNameNormalized.toLowerCase().includes(searchTermLower) ||
        productCodeNormalized.toLowerCase().includes(searchTermLower)
      );
    });

    this.changeDetectorRef.detectChanges();
  }

  // normalizeString(str: any) {
  //   return str
  //     .toLowerCase()
  //     .normalize('NFD')
  //     .replace(/[\u0300-\u036f]/g, '');
  // }

  // goToShoppingCart() {
  //   this.router.navigate(['/shopping-cart']);
  // }

  // goToPurchaseHistory() {
  //   this.router.navigate(['/purchase-history']);
  // }

  openSaleModal() {
    // this.goToShoppingCart();
    setTimeout(() => {
      this.modalService.showNewSaleModal.next(true);
    }, 500);
  }
}