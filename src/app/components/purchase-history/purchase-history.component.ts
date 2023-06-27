import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import {
  NgbCalendar,
  NgbDateParserFormatter,
  NgbDateStruct,
} from '@ng-bootstrap/ng-bootstrap';
import { Observable, forkJoin } from 'rxjs';
import { ModalService } from 'src/app/services/modalService';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { ToastrService } from 'ngx-toastr';
import { PurchaseService } from 'src/app/services/purchase.service';
// import * as moment from 'moment';

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

interface Purchase {
  providerId: number;
  providerName: string;
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
  taxes_amount: number;
  sub_total: number;
}

@Component({
  selector: 'app-purchase-history',
  templateUrl: './purchase-history.component.html',
  styleUrls: ['./purchase-history.component.css'],
  animations: [fadeAnimation],
})
export class PurchaseHistoryComponent {
  selectedDate: NgbDateStruct | any;

  url: string = environment.apiUrl;

  // Crear compras
  int_code: string = '';
  product_name: string = '';
  product_price: number = 0;
  product_new_price: number = 0;
  selectedProductPrice: number = 0;
  selectedProductTaxes: boolean;
  quantity: number = 0;
  productList: any[] = [];

  subTotalPurchaseAmount: number = 0;
  totalTaxesAmount: number = 0;
  totalPurchaseAmount: number = 0;

  doc_number: string = '';
  paymentMethod: string = 'Contado';
  date: Date | any = '';
  productSuggestionList: any[] = [];

  TAXES: number = 0.13;

  // Consultar las compras
  purchases: any[] = [];
  purchase: any[] = [];

  // Consultar proveedores
  provider_id: number = 0;
  provider_name: string = '';
  providersList: any[] = [];
  providerSuggestionList: any[] = [];

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
    private purchaseService: PurchaseService,
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
    // this.searchProviders();
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
    this.getPurchasesHistory(this.date);
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
    this.http
      .get<ApiPurchaseResponse>(`${this.url}purchases/date/${selectedDate}`)
      .subscribe({
        next: (response) => {
          if (response.message.Purchases.length === 0) {
            this.toastr.warning(
              'No hay compras para mostrar en la fecha seleccionada.'
            );
          }
          if (response.success) {
            this.purchases = response.message?.Purchases || [];
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
    const searchTerm = this.product_name.toLowerCase();
    this.http.get(`${this.url}products`).subscribe({
      next: (response: any) => {
        // console.log(response);
        const products = response?.message?.products;
        if (Array.isArray(products) && products.length > 0) {
          this.productSuggestionList = products
            .filter((product: any) =>
              product.name.toLowerCase().includes(searchTerm)
            )
            .map((product: any) => ({
              int_code: product.int_code,
              name: product.name,
              purchase_price: product.purchase_price,
              taxes: product.taxes,
            }));
        } else {
          this.productSuggestionList = [];
        }
      },
      error: (error) => {
        console.log('Error al recuperar productos');
        this.toastr.error('Error al recuperar productos.');
      },
    });
  }

  selectProductSuggestion(product: any, event: Event) {
    event.preventDefault();
    this.int_code = product.int_code;
    this.product_name = product.name;
    this.selectedProductTaxes = product.taxes;
    this.selectedProductPrice = product.purchase_price;
    this.productSuggestionList = [];
  }

  addProduct() {
    if (
      !this.int_code ||
      !this.product_name ||
      !this.product_new_price ||
      !this.selectedProductPrice ||
      !this.quantity
    ) {
      this.toastr.warning('Se debe suministrar todos los campos.');
      return;
    }

    let taxesAmount = 0;
    let subTotal = this.product_new_price * this.quantity;

    if (this.selectedProductTaxes) {
      const priceWithoutTaxes = this.product_new_price / (1 + this.TAXES);
      const taxes = this.product_new_price - priceWithoutTaxes;
      taxesAmount = taxes * this.quantity;
      subTotal = priceWithoutTaxes * this.quantity;
    }

    const product = {
      int_code: this.int_code,
      name: this.product_name,
      price: this.product_new_price,
      quantity: this.quantity,
      taxes: this.selectedProductTaxes,
      taxes_amount: taxesAmount,
      sub_total: subTotal,
    };

    this.productList.push(product);
    this.calculateTotalPurchaseAmount();
    this.product_name = '';
    this.selectedProductPrice = 0;
    this.product_new_price = 0;
    this.quantity = 0;
  }

  private calculateTotalPurchaseAmount() {
    this.subTotalPurchaseAmount = this.productList.reduce(
      (subTotal, product) => {
        if (!product.taxes) {
          return (
            this.subTotalPurchaseAmount +
            this.product_new_price * product.quantity
          );
        } else {
          const priceWithoutTaxes = this.product_new_price / (1 + this.TAXES);
          return (
            this.subTotalPurchaseAmount + priceWithoutTaxes * product.quantity
          );
        }
      },
      0
    );

    this.totalTaxesAmount = this.productList.reduce((taxesTotal, product) => {
      if (product.taxes) {
        const taxes = product.price - product.price / (1 + this.TAXES);
        return taxesTotal + taxes * product.quantity;
      } else {
        return taxesTotal;
      }
    }, 0);

    this.totalPurchaseAmount =
      this.subTotalPurchaseAmount + this.totalTaxesAmount;
  }

  removeProduct(product: any) {
    const index = this.productList.indexOf(product);
    if (index !== -1) {
      this.productList.splice(index, 1);
      this.calculateTotalPurchaseAmount();
    }
  }

  createPurchase() {
    if (!this.validatePurchaseData()) {
      return;
    }

    const updateProductPrices$ = this.updateProductPrices();

    updateProductPrices$.subscribe({
      next: () => {
        this.toastr.success(
          'Precios de compra actualizados para los productos.'
        );
        this.savePurchase();
      },
      error: (error) => {
        console.log('Error al actualizar los precios de compra.', error);
        this.toastr.error(
          'Ocurrió un error al actualizar los precios de compra. Por favor inténtalo nuevamente.'
        );
      },
    });
  }

  private validatePurchaseData(): boolean {
    if (!this.doc_number) {
      this.toastr.error('Por favor ingresa un número de documento.');
      return false;
    }

    if (this.productList.length === 0) {
      this.toastr.error('Agrega al menos un producto a la lista.');
      return false;
    }

    // aquí se pueden realizar más validaciones

    return true;
  }

  private updateProductPrices(): Observable<any> {
    const updateRequests = this.productList.map((product) => {
      const data = {
        purchase_price: product.price,
      };
      return this.http.put(`${this.url}products/${product.int_code}`, data);
    });

    return forkJoin(updateRequests);
  }

  private savePurchase() {
    const purchase: Purchase = {
      providerId: this.provider_id,
      providerName: this.provider_name,
      paymentMethod: this.paymentMethod,
      doc_number: this.doc_number,
      status: 'aceptado',
      sub_total: this.subTotalPurchaseAmount,
      taxes_amount: this.totalTaxesAmount || 0,
      products: this.productList.map((product) => ({ ...product })),
    };

    this.purchaseService.createPurchase(purchase).subscribe({
      next: () => {
        this.toastr.success('Compra creada exitosamente.');
        this.resetForm();
        this.subTotalPurchaseAmount = 0;
        this.totalTaxesAmount = 0;
        this.totalPurchaseAmount = 0;
      },
      error: (error) => {
        console.log('Error al crear la compra', error);
        this.toastr.error('Ocurrió un error al crear la compra. Por favor inténtalo nuevamente.');
      },
    });
  }

  resetForm() {
    this.provider_id = null;
    this.provider_name = '';
    this.paymentMethod = '';
    this.doc_number = '';
    this.productList = [];
  }

  cancelPurchase(doc_number: string) {
    this.purchaseService.cancelPurchase(doc_number).subscribe({
      next: (response: any) => {
        console.log('Compra anulada exitosamente', response);
        this.toastr.success('Compra anulada exitosamente.');
  
        const canceledPurchase = this.purchases.find(
          (purchase) => purchase.doc_number === doc_number
        );
        if (canceledPurchase) {
          canceledPurchase.status = 'anulada';
        }
      },
      error: (error: any) => {
        console.log('Error anulando documento', error);
        this.toastr.error('No se pudo anular el documento.');
      },
    });
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

  searchProviders() {
    const searchTerm = this.provider_name.toLowerCase();
    this.http.get(`${this.url}providers`).subscribe({
      next: (response: any) => {
        const providers = response?.message?.providers;
        if (Array.isArray(providers) && providers.length > 0) {
          this.providerSuggestionList = providers
            .filter((provider: any) =>
              provider.provider_name.toLowerCase().includes(searchTerm)
            )
            .map((provider: any) => ({
              provider_id: provider.provider_id,
              provider_dni: provider.provider_dni,
              provider_name: provider.provider_name,
            }));
        } else {
          this.providerSuggestionList = [];
        }
      },
      error: (error: any) => {
        console.log('Error al recuperar proveedores');
        this.toastr.error('Error al recuperar la lista de proveedores.');
      },
    });
  }

  selectProviderSuggestion(provider: any, event: Event) {
    event.preventDefault();
    this.provider_id = provider.provider_id;
    this.provider_name = provider.provider_name;
    this.providerSuggestionList = [];
  }
}
