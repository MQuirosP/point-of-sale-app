import { Component, ElementRef, ViewChild } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import * as moment from 'moment';
import {
  NgbCalendar,
  NgbDateParserFormatter,
  NgbDateStruct,
} from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ModalService } from 'src/app/services/modalService';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { ToastrService } from 'ngx-toastr';

interface ApiPurchaseResponse {
  success: boolean;
  message: {
    Purchases: any[];
  };
}

interface ApiProviderResponse {
  success: boolean;
  message: {
    Providers: any[];
  };
}

@Component({
  selector: 'app-purchase-history',
  templateUrl: './purchase-history.component.html',
  styleUrls: ['./purchase-history.component.css'],
  animations: [fadeAnimation],
})
export class PurchaseHistoryComponent {
  selectedDate: NgbDateStruct;

  url: string = environment.apiUrl;

  // Crear compras
  int_code: string = '';
  productName: string = '';
  productPrice: number = 0;
  productNewPrice: number = 0;
  selectedProductPrice: number = 0;
  productQuantity: number = 0;
  productList: any[] = [];
  totalPurchaseAmount: number = 0;
  providerName: string = '';
  doc_number: string = '';
  paymentMethod: string = 'Contado';
  date: Date | any = '';
  suggestionsList: any[] = [];

  // Consultar las compras
  purchases: any[] = [];
  purchase: any[] = [];

  // Consultar proveedores
  providerId: number = 0;
  providersList: any[] = [];
  filteredProviders: any[] = [];

  @ViewChild('newPurchaseModal', { static: false })
  newPurchaseModal!: ElementRef;
  @ViewChild('purchaseHistoryModal', { static: false })
  purchaseHistoryModal!: ElementRef;

  constructor(
    // private dbService: DbService,
    private http: HttpClient,
    private modalService: ModalService,
    private router: Router,
    private calendar: NgbCalendar,
    private dateParser: NgbDateParserFormatter,
    private toastr: ToastrService,
  ) {
    this.date = this.getCurrentDate();
    this.selectedDate = this.calendar.getToday();
  }

  ngOnInit() {
    this.modalService.showNewProductModal.subscribe((show: boolean) => {
      if (show) {
        this.openPurchaseModal();
      }
    });
    this.selectedDate = this.calendar.getToday();
  }

  ngAfterViewInit() {
    this.date = this.getCurrentDate();
    this.getProvidersList();
  }

  openPurchaseModal() {
    this.newPurchaseModal.nativeElement.classList.toggle('show');
    this.newPurchaseModal.nativeElement.style.display = 'block';
  }

  closePurchaseModal() {
    this.newPurchaseModal.nativeElement.classList.remove('show');
    this.newPurchaseModal.nativeElement.style.display = 'none';
  }

  openPurchaseHistoryModal() {
    this.purchaseHistoryModal.nativeElement.classList.toggle('show');
    this.purchaseHistoryModal.nativeElement.style.display = 'block';
    this.selectedDate = this.calendar.getToday();
  }

  closePurchaseHistoryModal() {
    this.purchaseHistoryModal.nativeElement.classList.remove('show');
    this.purchaseHistoryModal.nativeElement.style.display = 'none';
  }

  getPurchasesHistory(selectedDate: string) {
    if (!selectedDate) {
      console.log('Fecha no especificada', selectedDate);
      return;
    }
    this.http.get<ApiPurchaseResponse>(`${this.url}purchases`).subscribe({
      next: (response) => {
        if (response.success) {
          const purchases = response.message?.Purchases || [];
          this.purchases = purchases.filter((purchase: any) => {
            const purchaseDate = moment(purchase.createdAt).format(
              'YYYY-MM-DD'
            );
            return purchaseDate === selectedDate;
          });
          this.purchases.forEach((purchase: any) => {
            purchase.showDetails = false;
          });
        } else {
          console.log('Error recuperando las compras');
        }
      },
      error: (error) => {
        console.log('Error al obtener el historial de compras', error);
      },
    });
  }

  searchProducts() {
    const searchTerm = this.productName.toLowerCase();
    this.http.get(`${this.url}products`).subscribe({
      next: (response: any) => {
        const products = response?.message?.products;
        if (Array.isArray(products) && products.length > 0) {
          this.suggestionsList = products
            .filter((product: any) =>
              product.name.toLowerCase().includes(searchTerm)
            )
            .map((product: any) => ({
              int_code: product.int_code,
              name: product.name,
              purchase_price: product.purchase_price,
            }));
        } else {
          this.suggestionsList = [];
        }
      },
      error: (error) => {
        console.log('Error al recuperar productos');
      },
    });
  }

  selectSuggestion(suggestion: any, event: Event) {
    event.preventDefault();
    this.int_code = suggestion.int_code;
    this.productName = suggestion.name;
    this.selectedProductPrice = suggestion.purchase_price;
    this.suggestionsList = [];
  }

  addProduct() {
    const product = {
      int_code: this.int_code,
      name: this.productName,
      price: this.productNewPrice,
      quantity: this.productQuantity,
    };
    const data = {
      purchase_price: this.productNewPrice,
    };
    this.productList.push(product);
    this.calculateTotalPurchaseAmount();
    this.productName = '';
    this.productNewPrice = 0;
    this.productQuantity = 0;
  }

  private calculateTotalPurchaseAmount() {
    this.totalPurchaseAmount = this.productList.reduce((total, product) => {
      return total + this.productNewPrice * product.quantity;
    }, 0);
  }

  removeProduct(product: any) {
    const index = this.productList.indexOf(product);
    if (index !== -1) {
      this.productList.splice(index, 1);
      this.calculateTotalPurchaseAmount();
    }
  }

  createPurchase() {
    if (!this.doc_number) {
      this.toastr.error('Por favor ingresa un número de documento');
      return;
    }

    // Actualizar el precio de compra para cada producto en la lista
    const updateProductPrices = this.productList.map((product) => {
      const data = {
        purchase_price: product.price,
      };
      return this.http.put(`${this.url}products/${product.int_code}`, data);
    });

    // Realizar todas las peticiones PUT antes de la petición POST
    forkJoin(updateProductPrices).subscribe(
      (responses: any[]) => {
        console.log('Precios de compra actualizados para los productos');

        // Una vez completadas las peticiones PUT, realizar la petición POST para guardar la compra
        const purchase = {
          providerId: this.providerId,
          providerName: this.providerName,
          paymentMethod: this.paymentMethod,
          doc_number: this.doc_number,
          status: 'aceptado',
          products: this.productList.map((product) => ({
            int_code: product.int_code,
            quantity: product.quantity,
          })),
        };

        this.http.post(`${this.url}purchases/`, purchase).subscribe(
          (response: any) => {
            console.log('Compra guardada exitosamente', response);

            this.toastr.success('La compra ha sido guardada exitosamente');
            this.date = this.getCurrentDate();
            this.getPurchasesHistory(this.date);
            this.productList = [];
            this.totalPurchaseAmount = 0;
            this.productName = '';
            // this.providerName = '';
            this.paymentMethod = 'contado';
            this.int_code = '';
            this.doc_number = '';
            this.productNewPrice = 0;
            this.productPrice = this.providerId = 0;
            this.closePurchaseModal();
          },
          (error: any) => {
            console.log('Error al guardar la compra', error);
            this.toastr.error(
              'Ocurrió un error al guardar la venta. Por favor inténtalo nuevamente'
            );
          }
        );
      },
      (error: any) => {
        console.log('Error al actualizar los precios de compra', error);
        this.toastr.error(
          'Ocurrió un error al actualizar los precios de compra. Por favor inténtalo nuevamente'
        );
      }
    );
  }

  cancelPurchase(doc_number: string) {
    const myDocument = doc_number;
    this.http.put(`${this.url}purchases/${myDocument}`, null).subscribe(
      (response: any) => {
        console.log('Compra anulada exitosamente', response);
        this.toastr.success('Compra anulada exitosamente');

        const canceledPurchase = this.purchases.find(
          (purchase) => purchase.doc_number === doc_number
        );
        if (canceledPurchase) {
          canceledPurchase.status = 'anulada';
        }
      },
      (error: any) => {
        console.log('Error anulando documento', error);
        this.toastr.error('No se pudo anular el documento');
      }
    );
  }

  getCurrentDate(): string {
    const currentDate = this.calendar.getToday();
    const year = currentDate.year;
    const month = this.addLeadingZero(currentDate.month);
    const day = this.addLeadingZero(currentDate.day);
    return `${year}-${month}-${day}`;
  }

  private addLeadingZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

  filterPurchasesByDate() {
    if (this.selectedDate) {
      const selectedDateString = this.dateParser.format(this.selectedDate);
      this.getPurchasesHistory(selectedDateString);
    } else {
      const currentDate = this.getCurrentDate();
      this.getPurchasesHistory(currentDate);
    }
  }

  togglePurchaseDetails(purchase: any) {
    purchase.showDetails = !purchase.showDetails;
  }

  getProvidersList() {
    const searchTerm = this.productName.toLowerCase();
    this.http.get(`${this.url}providers`).subscribe({
      next: (response: any) => {
        const providers = response?.message?.providers;
        if (Array.isArray(providers) && providers.length > 0) {
          this.filteredProviders = providers
            .filter((providers: any) =>
              providers.name.toLowerCase().includes(searchTerm)
            )
            .map((provider: any) => ({
              id: provider.id,
              name: provider.name,
            }));
        } else {
          this.filteredProviders = [];
        }
      },
    });
  }

  // filterProviders() {
  //   this.filteredProviders = this.providersList.filter((provider) =>
  //     provider.name.toLowerCase().includes(this.providerName.toLowerCase())
  //   );
  // }

  selectProvider(provider: any, event: Event) {
    event.preventDefault();
    this.providerId = provider.id;
    this.providerName = provider.name;
    this.filteredProviders = [];
  }

  goToProductManagement() {
    this.router.navigate(['/product-list']);
  }
}
