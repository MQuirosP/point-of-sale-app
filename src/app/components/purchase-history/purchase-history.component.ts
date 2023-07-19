import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import {
  NgbCalendar,
  NgbDateParserFormatter,
  NgbDateStruct,
} from '@ng-bootstrap/ng-bootstrap';
import { Observable, forkJoin, throwError } from 'rxjs';
import { ModalService } from 'src/app/services/modalService';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { ToastrService } from 'ngx-toastr';
import { PurchaseService } from 'src/app/services/purchase.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ProductCacheService } from 'src/app/services/product-cache.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

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
  provider_name: string;
  paymentMethod: string;
  doc_number: string;
  status: string;
  sub_total: number;
  taxes_amount: number;
  products: Product[];
}

interface Product {
  productId: number;
  int_code: any;
  name: any;
  price: any;
  quantity: any;
  taxes: boolean;
  taxes_amount?: number;
  sub_total?: number;
  isNew?: boolean;
  isRemoved?: boolean;
}

@Component({
  selector: 'app-purchase-history',
  templateUrl: './purchase-history.component.html',
  styleUrls: ['./purchase-history.component.css'],
  animations: [ fadeAnimation,
    trigger('slideInOut', [
      state('in', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      state('out', style({
        transform: 'translateX(-100%)',
        opacity: 0
      })),
      transition('in => out', animate('200ms ease-out')),
      transition('out => in', animate('200ms ease-in'))
    ]),
    trigger('slideOut', [
      state('in', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      state('out', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      transition('in => out', animate('200ms ease-out')),
      transition('out => in', animate('200ms ease-in'))
    ])
  ]
})
export class PurchaseHistoryComponent {
  selectedDate: NgbDateStruct | any;
  purchaseForm: FormGroup;

  backendUrl: string = environment.apiUrl;

  // Crear compras
  int_code: string = '';
  product_name: string = '';
  selectedProductPrice: number = 0;
  selectedProductTaxes: boolean;
  selectedProduct: any;
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
  isProviderValid: boolean = false;

  @ViewChild('newPurchaseModal', { static: false })
  newPurchaseModal!: ElementRef;
  @ViewChild('purchaseHistoryModal', { static: false })
  purchaseHistoryModal!: ElementRef;
  @ViewChild('productQuantityInput')
  productQuantityInput: ElementRef<HTMLInputElement>;
  @ViewChild('productNameInput') productNameInput!: ElementRef;

  constructor(
    private http: HttpClient,
    private modalService: ModalService,
    private calendar: NgbCalendar,
    private dateFormatter: NgbDateParserFormatter,
    private toastr: ToastrService,
    private purchaseService: PurchaseService,
    private formBuilder: FormBuilder,
    private productCache: ProductCacheService
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
    this.purchaseForm = this.formBuilder.group({
      provider_name: ['', Validators.required],
      doc_number: ['', Validators.required],
      paymentMethod: [
        'contado',
        [Validators.required, Validators.pattern('^(contado|credito)$')],
      ],
      date: [
        { value: this.getCurrentDate(), disabled: true },
        Validators.required,
      ],
      product_name: ['', Validators.required],
      product_price: ['', Validators.required],
      product_new_price: ['', Validators.required],
      selectedProductTaxes: new FormControl({
        value: this.selectedProductTaxes,
        disabled: true,
      }),
      product_quantity: ['', [Validators.required, Validators.min(0.01)]],
    });
  }

  ngAfterViewInit() {
    this.date = this.getCurrentDate();
    // this.searchProviders();
  }

  getUserRole(): string {
    return localStorage.getItem('role');
  }
  

  getCurrentDateString(): string {
    const currentDate = this.calendar.getToday();
    return this.dateFormatter.format(currentDate);
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
    this.selectedDate = this.calendar.getToday();
  }

  isCurrentDate(createdAt: string): boolean {
    const saleDate = new Date(createdAt);
    const currentDate = new Date();
    // Compara solo el año, mes y día para ignorar la hora exacta
    return (
      saleDate.getFullYear() === currentDate.getFullYear() &&
      saleDate.getMonth() === currentDate.getMonth() &&
      saleDate.getDate() === currentDate.getDate()
    );
  }

  getPurchasesHistory(selectedDate: string) {
    if (!selectedDate) {
      console.log('Fecha no especificada', selectedDate);
      return;
    }
    this.http
      .get<ApiPurchaseResponse>(
        `${this.backendUrl}purchases/date/${selectedDate}`
      )
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
    const searchTerm = this.purchaseForm
      .get('product_name')
      .value.toLowerCase();
    this.http.get(`${this.backendUrl}products`).subscribe({
      next: (response: any) => {
        const products = response?.message?.products;
        if (Array.isArray(products) && products.length > 0) {
          const searchTermNormalized = searchTerm
            ? searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            : '';

          const searchPattern = searchTermNormalized
            .toLowerCase()
            .replace(/\*/g, '.*');

          const regex = new RegExp(searchPattern);

          this.productSuggestionList = products.filter((product: any) => {
            const productNameNormalized = product.name
              ? product.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              : '';

            const productCodeNormalized = product.int_code
              ? product.int_code
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
              : '';

            return (
              regex.test(productNameNormalized.toLowerCase()) ||
              regex.test(productCodeNormalized.toLowerCase())
            );
          });

          // Auto-seleccionar el producto si hay una sola sugerencia
          if (this.productSuggestionList.length === 1) {
            const suggestion = this.productSuggestionList[0];
            this.selectProductSuggestion(suggestion, null);
            this.selectedProduct = suggestion;
          } else {
            this.selectedProduct = null;
          }
        } else {
          this.productSuggestionList = [];
          this.selectedProduct = null;
        }

        // Verificar si el campo de entrada está vacío y borrar la selección
        if (searchTerm === '') {
          this.selectedProduct = null;
          this.selectedProductTaxes = null;
          this.selectedProductPrice = null;
        } else {
          // Actualizar el precio solo cuando se selecciona un producto
          if (this.selectedProduct) {
            this.selectedProductPrice =
              this.selectedProduct.purchase_price;
          }
        }
      },
      error: (error: any) => {
        console.log('Error al recuperar productos');
        this.toastr.error('Error al recuperar productos.');
      },
    });
  }

  selectProductSuggestion(product: any, event: Event) {
    if (event) {
      event.preventDefault();
    }
    this.purchaseForm.get('product_name').setValue(product.name);
    this.int_code = product.int_code;
    this.product_name = product.name;
    this.selectedProductTaxes = product.taxes;
    this.selectedProductPrice = product.purchase_price;
    this.productSuggestionList = [];
    this.selectedProduct = product;
    setTimeout(() => {
      this.productQuantityInput.nativeElement.focus();
    }, 0);
  }

  addProduct() {
    const productName = this.purchaseForm.get('product_name');
    const productQuantity = this.purchaseForm.get('product_quantity');
    const productNewPrice = this.purchaseForm.get('product_new_price');

    if (
      productName?.invalid ||
      productQuantity?.invalid ||
      productNewPrice?.invalid
    ) {
      this.toastr.warning('Se deben completar todos los campos.');
      return;
    }

    const productIntCode = this.int_code;
    const cachedProducts = this.productCache.getCachedProducts();
    const productFromCache = cachedProducts.find(
      (product: Product) => product.int_code === productIntCode
    );

    if (!productFromCache) {
      this.toastr.error('El producto no se encuentra en la caché.');
      return;
    }

    const taxPercent = productFromCache.taxPercentage;
    const productId = productFromCache.productId;

    // console.log(taxPercent, productId);
    const product: Product = {
      productId: productId,
      int_code: this.int_code,
      name: this.purchaseForm.get('product_name')?.value,
      price: this.purchaseForm.get('product_new_price')?.value,
      quantity: this.purchaseForm.get('product_quantity')?.value,
      taxes: this.selectedProductTaxes,
      isNew: true,
    };

    let taxesAmount = 0;
    let subTotal = 0;

    if (product.taxes) {
      const priceWithTaxes = product.price / (1 - taxPercent / 100);
      const taxesPerItem = priceWithTaxes - product.price;
      taxesAmount = taxesPerItem * product.quantity;
      subTotal = product.price * product.quantity;
    }

    product.taxes_amount = taxesAmount;
    product.sub_total = subTotal;
    // console.log(product);
    this.productList.push(product);
    product.isNew = false;
    this.calculateTotalPurchaseAmount();
    this.productNameInput.nativeElement.focus();
    this.purchaseForm.get('product_name')?.reset();
    this.purchaseForm.get('product_new_price')?.reset();
    this.purchaseForm.get('product_quantity')?.reset();

    this.selectedProductPrice = 0;
    this.selectedProductTaxes = false;
  }

  private calculateTotalPurchaseAmount() {
    this.subTotalPurchaseAmount = this.productList.reduce(
      (subTotal, product) => {
        return subTotal + product.sub_total;
      },
      0
    );

    this.totalTaxesAmount = this.productList.reduce((taxesTotal, product) => {
      return taxesTotal + product.taxes_amount;
    }, 0);

    this.totalPurchaseAmount =
      this.subTotalPurchaseAmount + this.totalTaxesAmount;
  }

  removeProduct(product: any) {
    if (product.isRemoved) return;

    product.isRemoved = true;

    setTimeout(() => {
      
      if (index !== -1) {
        this.productList.splice(index, 1);
        this.calculateTotalPurchaseAmount();
      }
    }, 200)
    const index = this.productList.indexOf(product);
  }

  async createPurchase(event: Event) {
    const providerName = this.purchaseForm.get('provider_name');

    if (providerName.invalid) {
      this.toastr.warning('Seleccione un proveedor.');
      event.stopPropagation();
    }
    if (!this.validatePurchaseData(event)) {
      event.stopPropagation();
      return;
    }
    try {
      const validDocument = await this.purchaseService.checkPurchaseDocNumber(
        this.purchaseForm.get('doc_number').value
      );
      if (validDocument) {
        this.toastr.error('Documento ya fue registrado anteriormente');
        return;
      } else {
        const updateProductPrices$ = this.updateProductPrices();

        updateProductPrices$.subscribe({
          next: () => {
            this.toastr.success(
              'Precios de compra actualizados para los productos.'
            );
            if (this.productList.length === 0) {
              this.toastr.warning('No hay productos agregados.')
              event.stopPropagation();
            } else {
              this.savePurchase();
            }

          },
          error: (error) => {
            console.log('Error al actualizar los precios de compra.', error);
            this.toastr.error(
              'Ocurrió un error al actualizar los precios de compra. Por favor inténtalo nuevamente.'
            );
          },
        });
      }
    } catch (error) {}
  }

  private validatePurchaseData(event: Event): boolean {
    const docNumber = this.purchaseForm.get('doc_number')?.value;

    if (!docNumber) {
      this.toastr.error('Por favor ingresa un número de documento.');
      event.stopPropagation();
      return false;
    }

    if (this.productList.length === 0) {
      this.toastr.error('Agrega al menos un producto a la lista.');
      event.stopPropagation();
      return false;
    }

    // Aquí se pueden realizar más validaciones

    return true;
  }

  private updateProductPrices(): Observable<any> {
    const updateRequests = this.productList.map((product) => {
      const cachedProduct = this.productCache.getProductByIntCode(
        product.int_code
      );
      if (!cachedProduct) {
        // El producto no está en la caché, manejar el error o la lógica apropiada
        return throwError(
          () =>
            new Error(
              `Product with int_code ${product.int_code} not found in cache.`
            )
        );
        // return throwError(
        //   `Product with int_code ${product.int_code} not found in cache.`
        // );
      }

      const data = {
        purchase_price: product.price,
      };
      return this.http.put(
        `${this.backendUrl}products/${cachedProduct.productId}`,
        data
      );
    });

    return forkJoin(updateRequests);
  }

  private savePurchase() {
    const purchase: Purchase = {
      providerId: this.provider_id,
      provider_name: this.purchaseForm.get('provider_name').value,
      paymentMethod: this.purchaseForm.get('paymentMethod').value,
      doc_number: this.purchaseForm.get('doc_number').value,
      status: 'aceptado',
      sub_total: this.subTotalPurchaseAmount,
      taxes_amount: this.totalTaxesAmount || 0,
      products: this.productList.map((product) => ({ ...product })),
    };
    this.purchaseService.createPurchase(purchase).subscribe({
      next: () => {
        this.toastr.success('Compra registrada exitosamente.');
        this.resetForm();
        this.closePurchaseModal();
        this.subTotalPurchaseAmount = 0;
        this.totalTaxesAmount = 0;
        this.totalPurchaseAmount = 0;
        this.isProviderValid = false;
      },
      error: (error) => {
        console.log('Error al crear la compra', error.error.error);
        this.toastr.error(
          'Ocurrió un error al crear la compra. Por favor inténtalo nuevamente.',
          error.error.error
        );
      },
    });
  }

  resetForm() {
    this.purchaseForm.get('provider_name')?.reset();
    this.purchaseForm.get('doc_number')?.reset();
    this.productList = [];
  }

  cancelPurchase(doc_number: string) {
    this.purchaseService.cancelPurchase(doc_number).subscribe({
      next: (response: any) => {
        this.toastr.success(`Compra #${doc_number} anulada exitosamente.`)

        const canceledPurchase = this.purchases.find(
          (purchase) => purchase.doc_number === doc_number
        );
        if (canceledPurchase) {
          canceledPurchase.status = 'anulada';
        }
      },
      error: (error: any) => {
        this.toastr.error('No se pudo anular el documento.');
      },
    });
  }

  getCurrentDate(): string {
    const currentDate = this.calendar.getToday();
    const year = currentDate.year.toString();
    const month = this.addLeadingZero(currentDate.month);
    const day = this.addLeadingZero(currentDate.day);
    return `${year}-${month}-${day}`;
  }

  private addLeadingZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

  filterPurchasesByDate() {
    if (this.selectedDate) {
      const selectedDate = new Date(
        this.selectedDate.year,
        this.selectedDate.month - 1,
        this.selectedDate.day
      );
      const currentDate = new Date();

      if (selectedDate > currentDate) {
        this.toastr.warning(
          'La fecha seleccionada es posterior a la fecha actual.'
        );
        this.selectedDate = this.calendar.getToday();
        return;
      }

      const selectedDateString = this.dateFormatter.format(this.selectedDate);
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
    const searchTerm = this.purchaseForm
      .get('provider_name')
      .value.toLowerCase();
    this.http.get(`${this.backendUrl}providers`).subscribe({
      next: (response: any) => {
        const providers = response?.message?.providers;
        if (Array.isArray(providers) && providers.length > 0) {
          this.providerSuggestionList = providers.filter((provider: any) =>
            provider.provider_name.toLowerCase().includes(searchTerm)
          );
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
    this.purchaseForm.get('provider_name').setValue(provider.provider_name);
    this.provider_id = provider.provider_id;
    this.provider_name = provider.provider_name;
    this.isProviderValid = true;
    this.providerSuggestionList = [];
  }
}
