import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router'
import { DbService } from 'src/app/services/db.service';

@Component({
  selector: 'app-front-panel',
  templateUrl: './front-panel.component.html',
  styleUrls: ['./front-panel.component.css'],
})
export class FrontPanelComponent {
  subscription: Subscription = new Subscription();
  productos: any[] = [];
  filteredProducts: any[] = [];
  searchTerm: any = '';
  currentSlide: number = 0;
  dataLoaded: boolean = false;

  constructor(
    private dbService: DbService,
    private router: Router,
    ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadData() {
    if (this.dataLoaded) {
      // Los datos ya están cargados, no es necesario realizar la consulta
      return;
    }

    this.subscription = this.dbService.getAllProducts().subscribe({
      next: (response: any) => {
        if (
          response &&
          response.success &&
          response.message &&
          response.message.products &&
          response.message.products.length > 0
        ) {
          this.productos = response.message.products;
          this.filteredProducts = [...this.productos]; // Copia los productos a filteredProducts inicialmente
          this.dataLoaded = true; // Marcar los datos como cargados
        }
      },
      error: (error) => {
        console.log('Error al obtener productos', error);
      },
    });
  }

  filterProducts() {
    this.filteredProducts = this.productos.filter((producto) =>
      producto.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  goToShoppingCart() {
    this.router.navigate(['/shopping-cart']);
  }
  goToPurchaseHistory() {
    this.router.navigate(['/purchase-history'])
  }
}