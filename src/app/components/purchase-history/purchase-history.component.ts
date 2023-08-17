import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import {
  NgbCalendar,
  NgbDateParserFormatter,
  NgbDateStruct,
} from '@ng-bootstrap/ng-bootstrap';
import { Observable, forkJoin, throwError } from 'rxjs';
import { ModalService } from 'src/app/services/modalService';
import { fadeAnimation } from 'src/app/animations/fadeAnimation';
import { ToastrService } from 'ngx-toastr';
import { PurchaseService } from 'src/app/services/purchase.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ProductCacheService } from 'src/app/services/product-cache.service';
import { ProductService } from 'src/app/services/product.service';
import { productAnimations } from 'src/app/animations/product-list-animation';
import { Purchase } from 'src/app/interfaces/purchases';
import { Products } from 'src/app/interfaces/products';

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

// interface Product {
//   productId: number;
//   int_code: any;
//   name: any;
//   price: any;
//   quantity: any;
//   taxes: boolean;
//   taxPercentage: number;
//   taxes_amount?: number;
//   sub_total?: number;
//   isNew?: boolean;
//   isRemoved?: boolean;
// }

@Component({
  selector: 'app-purchase-history',
  templateUrl: './purchase-history.component.html',
  styleUrls: ['./purchase-history.component.css'],
  animations: [fadeAnimation, productAnimations],
})
export class PurchaseHistoryComponent {
  selectedDate: NgbDateStruct | any;
  purchaseForm: FormGroup;
  providerForm: FormGroup;

  backendUrl: string = environment.apiUrl;

  // Crear compras
  // int_code: string = '';
  // product_name: string = '';
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
  @ViewChild('nameInput') nameInput!: ElementRef;
  selectedProvider: any;
  selectedIndex: number = -1;

  constructor(
    private http: HttpClient,
    private calendar: NgbCalendar,
    private dateFormatter: NgbDateParserFormatter,
    private toastr: ToastrService,
    private purchaseService: PurchaseService,
    private formBuilder: FormBuilder,
    private productCache: ProductCacheService,
    private productService: ProductService
  ) {
    this.date = this.getCurrentDate();
    this.selectedDate = this.calendar.getToday();
  }

  ngOnInit() {
    this.selectedDate = this.calendar.getToday();

    // DEFINICIÓN FORMULARIO PARA COMPRAS
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
    this.fetchProviders();
  }

  ngAfterViewInit() {
    this.date = this.getCurrentDate();
  }

  getUserRole(): string {
    return localStorage.getItem('role');
  }

  getCurrentDateString(): string {
    const currentDate = this.calendar.getToday();
    return this.dateFormatter.format(currentDate);
  }

  openPurchaseModal() {
    this.newPurchaseModal.nativeElement.style.display = 'block';
    this.newPurchaseModal.nativeElement.classList.add('opening');
    setTimeout(() => {
      this.newPurchaseModal.nativeElement.classList.add('show');
    }, 50);
  }

  closePurchaseModal() {
    this.newPurchaseModal.nativeElement.classList.remove('show');
    this.newPurchaseModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.newPurchaseModal.nativeElement.classList.remove('closing');
      this.newPurchaseModal.nativeElement.style.display = 'none';
    }, 300);
  }

  openPurchaseHistoryModal() {
    this.purchaseHistoryModal.nativeElement.style.display = 'block';
    this.purchaseHistoryModal.nativeElement.classList.add('opening');
    setTimeout(() => {
      this.purchaseHistoryModal.nativeElement.classList.add('show');
    });
    this.selectedDate = this.calendar.getToday();
    this.getPurchasesHistory(this.date);
  }

  closePurchaseHistoryModal() {
    this.purchaseHistoryModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.purchaseHistoryModal.nativeElement.classList.remove('show');
      this.purchaseHistoryModal.nativeElement.classList.remove('closing');
      this.purchaseHistoryModal.nativeElement.style.display = 'none';
    });
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

    this.purchaseService.getPurchasesByDate(selectedDate).subscribe({
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

  searchProduct() {
    const productNameControl = this.purchaseForm.get('product_name').value;

    const searchTerm = productNameControl?.toLowerCase().trim() || '';
    if (!searchTerm) {
      this.clearProductSuggestions();
      return;
    }

    this.productService.getProducts().subscribe({
      next: (response: any) => {
        const products = response?.message?.products;
        if (Array.isArray(products) && products.length > 0) {
          this.updateProductSuggestions(products, searchTerm);
          this.selectSingleProduct();
        } else {
          this.clearProductSuggestions();
        }
        this.updateSelectedProductPrice();
      },
      error: (error: any) => {
        console.log('Error al recuperar productos');
        this.toastr.error('Error al recuperar productos.');
      },
    });
  }

  private updateProductSuggestions(products: Products[], searchTerm: string) {
    const searchTermNormalized = searchTerm
      ? searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      : '';
    const searchPattern = searchTermNormalized
      .toLowerCase()
      .replace(/\*/g, '.*');

    const regex = new RegExp(searchPattern);

    this.productSuggestionList = products.filter((product: Products) => {
      const productNameNormalized = product.name
        ? product.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        : '';
      const productCodeNormalized = product.int_code
        ? product.int_code.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        : '';

      return (
        regex.test(productNameNormalized.toLowerCase()) ||
        regex.test(productCodeNormalized.toLowerCase())
      );
    });
  }

  private selectSingleProduct() {
    if (this.productSuggestionList.length === 1) {
      const suggestion = this.productSuggestionList[0];
      this.selectProductSuggestion(suggestion, null);
      this.selectedProduct = suggestion;
    } else {
      this.selectedProduct = null;
    }
  }

  private updateSelectedProductPrice() {
    if (!this.selectedProduct) {
      this.selectedProductPrice = null;
    } else {
      this.selectedProductPrice = this.selectedProduct.purchase_price;
    }
  }

  private clearProductSuggestions() {
    this.productSuggestionList = [];
    this.selectedProduct = null;
    this.selectedProductTaxes = null;
    this.selectedProductPrice = null;
  }

  private selectProductSuggestion(product: any, event: Event) {
    if (event) {
      event.preventDefault();
    }
    this.purchaseForm.get('product_name').setValue(product.name);
    // this.int_code = product.int_code;
    // this.product_name = product.name;
    this.selectedProductTaxes = product.taxes;
    this.selectedProductPrice = product.purchase_price;
    this.selectedProduct = product;
    this.productSuggestionList = [];
    setTimeout(() => {
      this.productQuantityInput.nativeElement.focus();
    }, 0);
  }

  handleBarcodeInput(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value.trim();

    if (inputValue) {
      const matchingProduct = this.productSuggestionList.find(
        (product: any) => {
          return product.int_code === inputValue;
        }
      );

      if (matchingProduct) {
        this.selectProductSuggestion(matchingProduct, null);
        // this.addProduct();
      }
    }
  }

  handleSuggestionClick(event: Event, suggestion: any) {
    event.preventDefault();
    event.stopPropagation();

    const searchTerm = suggestion.name?.toLowerCase().trim() || '';
    const suggestionName = suggestion.name.toLowerCase().trim();
    // this.int_code = suggestion.int_code;
    this.selectedProductPrice = suggestion.sale_price;

    if (suggestionName === searchTerm) {
      this.selectProductSuggestion(suggestion, null);
      this.selectedProduct = suggestion;
    } else {
      this.selectedProduct = null;
    }

    this.productSuggestionList = [];
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.selectedIndex < this.productSuggestionList.length - 1) {
        this.selectedIndex++;
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.selectedIndex !== -1) {
        const selectedSuggestion =
          this.productSuggestionList[this.selectedIndex];
        this.handleSuggestionClick(event, selectedSuggestion);
      }
    }
  }

  addProduct() {
    const productQuantity = this.purchaseForm.get('product_quantity');
    const productNewPrice = this.purchaseForm.get('product_new_price');

    if (productQuantity?.invalid || productNewPrice?.invalid) {
      this.toastr.warning(
        'Por favor revise la cantidad y el precio actual del producto.'
      );
      return;
    }

    const productIntCode = this.selectedProduct.int_code;
    const productFromCache = this.getProductFromCache(productIntCode);

    if (!productFromCache) {
      this.toastr.error('El producto no se encuentra en la base de datos.');
      return;
    }

    const {
      productId,
      int_code,
      name,
      taxPercentage,
      category_id,
      sale_price,
      margin,
    } = this.selectedProduct;

    const product: Products = {
      productId,
      int_code,
      name,
      price: productNewPrice?.value,
      quantity: productQuantity?.value,
      taxes: this.selectedProductTaxes,
      isNew: true,
      taxPercentage,
      category_id,
      sale_price,
      margin,
    };

    this.calculateProductAmounts(product, taxPercentage);
    this.productList.push(product);
    product.isNew = false;
    this.calculateTotalPurchaseAmount();
    this.resetFormFields();
    this.nameInput.nativeElement.focus();
  }

  private getProductFromCache(intCode: any): Products | undefined {
    const cachedProducts = this.productCache.getCachedProducts();
    return cachedProducts.find(
      (product: Products) => product.int_code === intCode
    );
  }

  private calculateProductAmounts(product: Products, taxPercent: number) {
    if (product.taxes) {
      const priceWithTaxes = product.price / (1 - taxPercent / 100);
      const taxesPerItem = priceWithTaxes - product.price;
      product.taxes_amount = taxesPerItem * product.quantity;
      product.sub_total = product.price * product.quantity;
    } else {
      product.taxes_amount = 0;
      product.sub_total = product.price * product.quantity;
    }
  }

  private calculateTotalPurchaseAmount() {
    this.subTotalPurchaseAmount = this.productList.reduce(
      (subTotal, product) => subTotal + product.sub_total,
      0
    );

    this.totalTaxesAmount = this.productList.reduce(
      (taxesTotal, product) => taxesTotal + product.taxes_amount,
      0
    );

    this.totalPurchaseAmount =
      this.subTotalPurchaseAmount + this.totalTaxesAmount;
  }

  private resetFormFields() {
    this.purchaseForm.get('product_name')?.reset();
    this.purchaseForm.get('product_new_price')?.reset();
    this.purchaseForm.get('product_quantity')?.reset();
    this.selectedProductPrice = 0;
    this.selectedProductTaxes = false;
  }

  removeProduct(product: any) {
    if (product.isRemoved) return;

    product.isRemoved = true;

    setTimeout(() => {
      if (index !== -1) {
        this.productList.splice(index, 1);
        this.calculateTotalPurchaseAmount();
      }
    }, 200);
    const index = this.productList.indexOf(product);
  }

  async createPurchase(event: Event) {
    const providerName = this.selectedProvider;

    if (providerName.invalid) {
      this.toastr.warning('Seleccione un proveedor.');
    } else if (!this.validatePurchaseData(event)) {
    } else {
      try {
        const validDocument = await this.purchaseService.checkPurchaseDocNumber(
          this.purchaseForm.get('doc_number').value
        );

        if (validDocument) {
          this.toastr.error('Documento ya fue registrado anteriormente');
        } else {
          const updateProductPrices$ = this.updateProductPrices();

          updateProductPrices$.subscribe({
            next: () => {
              this.toastr.success(
                'Precios de compra actualizados para los productos.'
              );
              if (this.productList.length === 0) {
                this.toastr.warning('No hay productos agregados.');
              } else {
                this.savePurchase(event);
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
      } catch (error) {
        this.toastr.error('Error al registrar la compra.');
      }
    }
    event.stopPropagation();
  }

  private validatePurchaseData(event: Event): boolean {
    const docNumber = this.purchaseForm.get('doc_number')?.value;

    if (!docNumber) {
      this.toastr.warning('Por favor ingresa un número de documento.');
      event.stopPropagation();
      return false;
    }

    if (this.productList.length === 0) {
      this.toastr.error(
        'Se debe seleccionar un producto para agregar a la lista..'
      );
      event.stopPropagation();
      return false;
    }

    return true;
  }

  private updateProductPrices(): Observable<any> {
    const updateRequests = this.productList.map((product) => {
      const cachedProduct = this.productCache.getProductByIntCode(
        product.int_code
      );
      if (!cachedProduct) {
        return throwError(
          () =>
            new Error(
              `Product with int_code ${product.int_code} not found in cache.`
            )
        );
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

  private savePurchase(event: Event) {
    const purchase: Purchase = {
      providerId: this.provider_id,
      provider_name: this.purchaseForm.get('provider_name').value,
      paymentMethod: this.purchaseForm.get('paymentMethod').value,
      doc_number: this.purchaseForm.get('doc_number').value,
      status: 'aceptado',
      sub_total: this.subTotalPurchaseAmount,
      taxes_amount: this.totalTaxesAmount || 0,
      purchaseItems: this.productList.map((product) => ({ ...product })),
      createdAt: '',
      total: 0,
    };

    this.purchaseService.createPurchase(purchase).subscribe({
      next: () => {
        this.toastr.success('Compra registrada exitosamente.');
        this.resetForm();
        this.closePurchaseModal();
      },
      error: (error) => {
        event.stopPropagation();
        console.log('Error al crear la compra', error.error.error);
        this.toastr.error(
          'Ocurrió un error al crear la compra. Por favor inténtalo nuevamente.',
          error.error.error
        );
      },
    });
  }

  private resetForm() {
    this.purchaseForm.reset();
    this.subTotalPurchaseAmount = 0;
    this.totalTaxesAmount = 0;
    this.totalPurchaseAmount = 0;
    this.isProviderValid = false;
    this.productList = [];
    this.providerSuggestionList = [];
  }

  cancelPurchase(purchase: Purchase) {
    const doc_number = purchase.doc_number;
    this.purchaseService.cancelPurchase(doc_number).subscribe({
      next: (response: any) => {
        this.toastr.success(`Compra #${doc_number} anulada exitosamente.`);

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

  fetchProviders() {
    this.purchaseService.getProviders().subscribe({
      next: (response: any) => {
        const providers = response?.message?.providers;
        if (Array.isArray(providers) && providers.length > 0) {
          this.providersList = providers;
        } else {
          this.providersList = [];
        }
      },
      error: (error: any) => {
        console.log('Error al recuperar proveedores');
        this.toastr.error('Error al recuperar la lista de proveedores.');
      },
    });
  }

  searchProviders(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    if (Array.isArray(this.providersList) && this.providersList.length > 0) {
      this.providerSuggestionList = this.providersList.filter(
        (provider: any) =>
          provider.provider_name.toLowerCase().includes(searchTerm) ||
          provider.provider_dni.toLowerCase().includes(searchTerm)
      );
    } else {
      this.providerSuggestionList = [];
    }

    if (this.providerSuggestionList.length === 1) {
      const suggestion = this.providerSuggestionList[0];
      this.selectedProvider = suggestion;
      this.provider_id = suggestion.provider_id;
      this.providerSuggestionList = []; // Limpiar la lista de sugerencias de proveedores
      (document.getElementById('provider_name') as HTMLInputElement).value =
        this.formatOption(suggestion); // Establecer el valor en el input
    } else {
      this.provider_id = null;
    }
  }

  formatOption(provider: any): string {
    return `${provider.provider_name}`;
  }

  onDropdownOpen() {
    // Abre el dropdown al hacer clic en el input
    this.providerForm.get('provider_name').enable();
  }
}
