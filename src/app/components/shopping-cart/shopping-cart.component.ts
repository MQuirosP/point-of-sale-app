import { Component, ElementRef, ViewChild } from '@angular/core';
import { Quagga } from 'quagga';
import { environment } from 'src/environments/environment';
import {
  NgbDateStruct,
  NgbCalendar,
  NgbDateParserFormatter,
} from '@ng-bootstrap/ng-bootstrap';
import { ModalService } from '../../services/modalService';
import { fadeAnimation } from 'src/app/animations/fadeAnimation';
import { ToastrService } from 'ngx-toastr';
import { TicketService } from 'src/app/services/ticket.service';
import { SaleService } from 'src/app/services/sale.service';
import { Subscription } from 'rxjs';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ProductService } from 'src/app/services/product.service';
import { productAnimations } from 'src/app/animations/product-list-animation';
import { Products } from 'src/app/interfaces/products';
import { Sales } from 'src/app/interfaces/sales';

interface ApiSaleResponse {
  success: boolean;
  message: {
    Sales: Sales[];
  };
}

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css'],
  animations: [fadeAnimation, productAnimations],
})
export class ShoppingCartComponent {
  selectedDate: NgbDateStruct;
  saleForm: FormGroup;

  backendUrl = `${environment.apiUrl}`;

  // Crear Ventas
  int_code: string = '';
  name: string = '';
  price: number = 0.0;
  selectedProductPrice: number = 0.0;
  quantity: number = 1;

  // Cálculo de impuestos, sub total y total
  TAXES: number = 0;
  selectedProductTaxes: boolean;
  subTotalSaleAmount: number = 0;
  totalTaxesAmount: number = 0;
  totalSaleAmount: number = 0;

  // Misceláneos
  isProductValid: boolean = false;
  productList: any[] = [];
  lastSaleDocNumber: string = '';
  paymentMethod: string = 'contado';
  date: Date | any = '';
  productSuggestionList: any[] = [];
  filteredProducts: any[] = [];

  // Consultar las ventas
  sales: Sales[] = [];
  sale: Sales[] = [];

  // Consultar clientes
  selectedCustomer: any;
  customer_id: number = 0;
  customer_name: string = '';
  customer_dni: string;
  customersList: any[] = [];
  customerSuggestionList: any[] = [];

  private showNewSaleModalSubscription: Subscription;

  @ViewChild('newSaleModal', { static: false }) newSaleModal!: ElementRef;
  @ViewChild('saleHistoryModal', { static: false })
  saleHistoryModal!: ElementRef;
  @ViewChild('nameInput') nameInput!: ElementRef;
  @ViewChild('video') videoElement: ElementRef<HTMLVideoElement>;
  isScanning: boolean = false;
  selectedProduct: any;
  product_name: any;
  selectedIndex: number = -1;

  constructor(
    private modalService: ModalService,
    private calendar: NgbCalendar,
    private dateParser: NgbDateParserFormatter,
    private toastr: ToastrService,
    private ticketService: TicketService,
    private saleService: SaleService,
    private productService: ProductService,
    private dateFormatter: NgbDateParserFormatter,
    private formBuilder: FormBuilder
  ) {
    this.date = this.getCurrentDate();
    this.selectedDate = this.calendar.getToday();
  }

  ngOnInit() {
    // SUSCRIPCION PARA ACCESAR EL FORMULARIO DE VENTAS
    // DESDE LA PÁGINA PRINCIPAL
    this.showNewSaleModalSubscription =
      this.modalService.showNewSaleModal.subscribe((show: boolean) => {
        if (show) {
          this.openSaleModal();
        }
      });

    // DEFINICIÓN FORMULARIO PARA VENTAS
    this.saleForm = this.formBuilder.group({
      customer_id: [0, Validators.required],
      customer_name: ['', Validators.required],
      doc_number: ['', Validators.required],
      paymentMethod: [
        'contado',
        [
          Validators.required,
          Validators.pattern('^(contado|crédito|sinpe|tarjeta|transferencia)'),
        ],
      ],
      date: [
        { value: this.getCurrentDate(), disabled: true },
        Validators.required,
      ],
      product_name: ['', Validators.required],
      product_price: ['', Validators.required],
      product_taxes: new FormControl({
        value: this.selectedProductTaxes,
        disabled: true,
      }),
      product_quantity: [1, [Validators.required, Validators.min(0.01)]],
    });
    this.getProductList();
    this.selectedDate = this.calendar.getToday();
    this.fetchCustomers();
  }

  ngAfterViewInit() {
    this.date = this.getCurrentDate();
  }

  ngOnDestroy() {
    if (this.showNewSaleModalSubscription) {
      this.showNewSaleModalSubscription.unsubscribe();
    }
  }

  toggleCamera() {
    if (!this.isScanning) {
      this.startScanning();
    } else {
      this.stopScanning();
    }
  }

  startScanning() {
    const video = this.videoElement.nativeElement;

    // Verifica si el navegador admite la API de getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          this.isScanning = true;
          video.srcObject = stream;
          video.play();

          const onDetected = (result) => {
            this.saleForm.get('product_name').setValue(result.codeResult.code);
            this.stopScanning();
          };

          const scanner = Quagga.decoder({
            readers: [
              'code_128_reader',
              'ean_reader',
              'ean_8_reader',
              'code_39_reader',
              'code_39_vin_reader',
              'codabar_reader',
              'upc_reader',
              'upc_e_reader',
              'i2of5_reader',
            ],
            debug: {
              showCanvas: true,
              showPatches: true,
              showFoundPatches: true,
              showSkeleton: true,
              showLabels: true,
              showPatchLabels: true,
              showRemainingPatchLabels: true,
              boxFromPatches: {
                showTransformed: true,
                showTransformedBox: true,
                showBB: true,
              },
            },
          })
            .locator({ patchSize: 'medium' })
            .fromVideo(video, {
              constraints: {
                width: 800,
                height: 600,
                facingMode: 'environment',
              },
            });

          scanner.addEventListener('detected', onDetected);
          scanner.start();
        })
        .catch((error) => {
          console.error('Error al acceder a la cámara:', error);
        });
    } else {
      console.error('El navegador no admite la API de getUserMedia');
    }
  }

  stopScanning() {
    this.isScanning = false;
    const video = this.videoElement.nativeElement;
    if (video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
  }

  getCurrentDateString(): string {
    const currentDate = this.calendar.getToday();
    return this.dateFormatter.format(currentDate);
  }

  openSaleModal(): void {
    if (this.newSaleModal?.nativeElement) {
      this.newSaleModal.nativeElement.style.display = 'block';
      this.newSaleModal.nativeElement.classList.add('opening');
      setTimeout(() => {
        this.newSaleModal.nativeElement.classList.add('show');
      }, 50);
    }
  }

  closeSaleModal(): void {
    this.newSaleModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.newSaleModal.nativeElement.classList.remove('show');
      this.newSaleModal.nativeElement.classList.remove('closing');
      this.newSaleModal.nativeElement.style.display = 'none';
    }, 300);
    this.selectedCustomer = '';
  }

  openSaleHistoryModal(): void {
    this.saleHistoryModal.nativeElement.style.display = 'block';
    this.saleHistoryModal.nativeElement.classList.add('opening');
    setTimeout(() => {
      this.saleHistoryModal.nativeElement.classList.toggle('show');
    }, 50);
    this.selectedDate = this.calendar.getToday();
    this.filterSalesByDate();
  }

  closeSaleHistoryModal(): void {
    this.saleHistoryModal.nativeElement.classList.add('closing');
    setTimeout(() => {
      this.saleHistoryModal.nativeElement.classList.remove('show');
      this.saleHistoryModal.nativeElement.classList.remove('closing');
      this.saleHistoryModal.nativeElement.style.display = 'none';
    }, 300);
    this.selectedDate = this.calendar.getToday();
  }

  getSalesHistory(selectedDate: string): void {
    if (!selectedDate) {
      console.log('Fecha no especificada', selectedDate);
      return;
    }

    this.saleService.getSalesByDate(selectedDate).subscribe({
      next: (response: ApiSaleResponse) => {
        if (response.message.Sales.length === 0) {
          this.toastr.warning(
            'No hay ventas para mostrar en la fecha seleccionada.'
          );
        }
        if (response.success) {
          this.sales = response.message?.Sales || [];
          this.sales.forEach((sale: Sales) => {
            sale.showDetails = false;
          });

          if (this.sales.length > 0) {
            const lastSale = this.sales[this.sales.length - 1];
            this.lastSaleDocNumber = lastSale.doc_number;
          }
        } else {
          console.log('Error recuperando las ventas');
        }
      },
      error: (error) => {
        console.log('Error al obtener el historial de ventas', error);
      },
    });
  }

  // Método para obtener la lista de productos
  getProductList(): void {
    this.productService.getProducts().subscribe({
      next: (response: any) => {
        const products = response?.message?.products;
        if (Array.isArray(products) && products.length > 0) {
          this.filteredProducts = products.map((product: any) => ({
            int_code: product.int_code,
            name: product.name,
            sale_price: product.sale_price,
            taxes: product.taxes,
          }));
        } else {
          this.filteredProducts = [];
        }
      },
      error: (error) => {
        console.log('Error al recuperar productos');
        this.toastr.error('Error al recuperar los productos.');
      },
    });
  }

  searchProduct(): void {
    const productNameControl = this.saleForm.get('product_name').value;

    const searchTerm = productNameControl?.toLowerCase().trim() || '';
    if (searchTerm === '') {
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

  private selectSingleProduct(): void {
    if (this.productSuggestionList.length === 1) {
      const suggestion = this.productSuggestionList[0];
      this.selectProductSuggestion(suggestion, null);
      this.selectedProduct = suggestion;
    } else {
      this.selectedProduct = null;
    }
  }

  private updateSelectedProductPrice(): void {
    if (!this.selectedProduct) {
      this.selectedProductPrice = null;
    } else {
      this.selectedProductPrice = this.selectedProduct.purchase_price;
    }
  }

  private clearProductSuggestions(): void {
    this.saleForm.get('product_price').setValue(0);
    this.productSuggestionList = [];
    this.selectedProduct = null;
    this.selectedProductTaxes = null;
    this.selectedProductPrice = null;
  }

  selectProductSuggestion(product: Products, event: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.saleForm.get('product_name').setValue(product.name);
    this.int_code = product.int_code;
    this.product_name = product.name;
    this.selectedProductTaxes = product.taxes;
    this.saleForm.get('product_price').setValue(product.sale_price);
    this.selectedProduct = product;
    this.productSuggestionList = [];
    setTimeout(() => {
      this.addProduct();
      this.selectedProductPrice = 0;
    }, 0);
  }

  handleBarcodeInput(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value.trim();

    if (inputValue) {
      const matchingProduct = this.productSuggestionList.find(
        (product: Products) => {
          return product.int_code === inputValue;
        }
      );

      if (matchingProduct) {
        this.selectProductSuggestion(matchingProduct, null);
      }
    }
  }

  handleSuggestionClick(event: Event, suggestion: Products) {
    event.preventDefault();
    event.stopPropagation();

    const searchTerm = suggestion.name?.toLowerCase().trim() || '';
    const suggestionName = suggestion.name.toLowerCase().trim();
    this.int_code = suggestion.int_code;
    this.selectedProductPrice = suggestion.sale_price;

    if (suggestionName === searchTerm) {
      this.selectProductSuggestion(suggestion, null);
      this.selectedProduct = suggestion;
    } else {
      this.selectedProduct = null;
    }

    this.productSuggestionList = []; // Limpiar la lista de sugerencias
    this.selectedIndex = -1;
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.productSuggestionList.length > 0) {
        if (event.key === 'ArrowDown') {
          this.selectedIndex =
            (this.selectedIndex + 1) % this.productSuggestionList.length;
        } else if (event.key === 'ArrowUp') {
          this.selectedIndex =
            (this.selectedIndex - 1 + this.productSuggestionList.length) %
            this.productSuggestionList.length;
        }
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.selectedIndex !== -1) {
        this.handleSuggestionClick(
          event,
          this.productSuggestionList[this.selectedIndex]
        );
      }
    }
  }

  isValidQuantity(): boolean {
    return this.quantity > 0;
  }

  isValidPaymentMethod(): boolean {
    return this.paymentMethod.trim() !== '';
  }

  addProduct() {
    const productName = this.saleForm.get('product_name').value;
    const productQuantity = this.saleForm.get('product_quantity').value;
    const productNewPrice = this.saleForm.get('product_price').value;

    if (
      productName?.invalid ||
      productQuantity?.invalid ||
      productNewPrice?.invalid
    ) {
      this.toastr.warning('Se deben suministrar todos los campos.');
      return;
    }

    this.productService.getProductByIntCode(this.int_code).subscribe({
      next: (response: any) => {
        const productData = response.message.product;
        this.TAXES = productData.taxPercentage;

        if (productQuantity > productData.quantity) {
          this.toastr.warning(
            `Stock de producto ${productData.name} inferior al digitado.`
          );
          return;
        }
        const { taxesAmount, subTotal } = this.calculateProductAmounts(
          productData,
          productQuantity
        );

        const product: Products = {
          productId: productData.productId,
          int_code: this.int_code,
          name: productName,
          price: productNewPrice,
          quantity: productQuantity,
          taxPercentage: this.TAXES,
          taxes: this.selectedProductTaxes,
          taxes_amount: taxesAmount,
          sub_total: subTotal,
          isNew: true,
          description: '',
          category_id: 0,
          sale_price: 0,
          margin: 0,
        };

        product.total = product.sub_total + product.taxes_amount;

        if (product.total === 0) {
          this.toastr.warning('Se deben suministrar todos los campos.');
          return;
        }
        this.updateProductList(product);
        this.calculateTotalSaleAmount();
        this.clearProductForm();
        this.clearProductSuggestions();
        setTimeout(() => {
          this.nameInput.nativeElement.focus();
        }, 0);
      },
      error: (response: any) => {
        this.toastr.warning(
          'Se debe seleccionar un producto para agregar a la lista.'
        );
      },
    });
  }

  private calculateProductAmounts(
    productData: Products,
    productQuantity: number
  ): { taxesAmount: number; subTotal: number } {
    let taxesAmount = 0;
    let subTotal = 0;

    if (this.selectedProductTaxes) {
      taxesAmount =
        productData.purchase_price / (1 - productData.taxPercentage / 100) -
        productData.purchase_price;
      subTotal = productData.sale_price - taxesAmount;
    }

    taxesAmount *= productQuantity;
    subTotal *= productQuantity;

    return { taxesAmount, subTotal };
  }

  private updateProductList(product: Products) {
    if (product.total !== 0) {
      const existingProductIndex = this.productList.findIndex(
        (p) => p.int_code === product.int_code
      );

      if (existingProductIndex !== -1) {
        const existingProduct = this.productList[existingProductIndex];
        existingProduct.quantity += product.quantity;
        existingProduct.taxes_amount += product.taxes_amount;
        existingProduct.sub_total += product.sub_total;
        existingProduct.total = product.total;
      } else {
        this.productList.push(product);
        product.isNew = false;
      }
    } else {
      const existingProductIndex = this.productList.findIndex(
        (p) => p.int_code === product.int_code
      );
      if (existingProductIndex !== -1) {
        this.productList.splice(existingProductIndex, 1);
      }

      this.toastr.error('Se deben suministrar todos los campos.');
    }
  }

  private calculateTotalSaleAmount() {
    this.subTotalSaleAmount = this.productList.reduce((subTotal, product) => {
      return subTotal + product.sub_total;
    }, 0);

    this.totalTaxesAmount = this.productList.reduce((taxesTotal, product) => {
      return taxesTotal + product.taxes_amount;
    }, 0);

    this.totalSaleAmount = +this.totalTaxesAmount + this.subTotalSaleAmount;
  }

  removeProduct(product: Products) {
    if (product.isRemoved) return;

    product.isRemoved = true;

    setTimeout(() => {
      const index = this.productList.indexOf(product);
      if (index !== -1) {
        this.productList.splice(index, 1);
        this.calculateTotalSaleAmount();
      }
    }, 200);
  }

  createSale(event: Event): void {
    if (this.saleForm.get('customer_name').valid) {
      const customerFullName = this.saleForm.get('customer_name').value;
      const sale = this.buildSaleObject(customerFullName);
      if (this.productList.length === 0) {
        this.toastr.warning('No hay productos agregados.');
        event.stopPropagation();
      } else {
        this.saveSale(sale);
      }
    } else {
      this.toastr.error('Debe seleccionar un cliente.');
      event.stopPropagation();
      return;
    }
  }

  private buildSaleObject(customerFullName: string): any {
    return {
      customer_name: customerFullName,
      paymentMethod: this.paymentMethod,
      sub_total: this.subTotalSaleAmount.toFixed(2),
      taxes_amount: this.totalTaxesAmount.toFixed(2),
      total: this.totalSaleAmount.toFixed(2),
      products: this.buildProductList(),
    };
  }

  private buildProductList(): any[] {
    return this.productList.map((product) => ({
      int_code: product.int_code,
      quantity: product.quantity,
      sub_total: product.sub_total,
      taxes_amount: product.taxes_amount,
    }));
  }

  private saveSale(sale: Sales): void {
    this.saleService.createSale(sale).subscribe({
      next: () => {
        this.handleSaleCreationSuccess();
      },
      error: () => {
        this.handleSaleCreationError();
      },
    });
  }

  private handleSaleCreationSuccess(): void {
    this.toastr.success('La venta ha sido guardada exitosamente.');
    this.date = this.getCurrentDate();
    this.getSalesHistory(this.date);
    setTimeout(() => {
      this.generateTicket(this.lastSaleDocNumber);
    }, 1000);
    this.selectedCustomer = '';
    this.clearSaleFormData();
    this.closeSaleModal();
  }

  private handleSaleCreationError(): void {
    this.toastr.error(
      'Ocurrió un error al guardar la venta. Por favor inténtalo nuevamente.'
    );
  }

  private clearSaleFormData(): void {
    this.saleForm.get('customer_name')?.reset();
    this.totalTaxesAmount = 0;
    this.subTotalSaleAmount = 0;
    this.totalSaleAmount = 0;
    this.productList = [];
    this.selectedCustomer = null;
  }

  private clearProductForm(): void {
    this.saleForm.get('product_name')?.reset();
    this.saleForm.get('product_taxes')?.reset();
    this.saleForm.get('product_price')?.reset();
    this.saleForm.get('product_quantity').setValue(1);
    this.TAXES = 0;
    this.selectedProduct = null;
  }

  updateProduct(product: Products, event: Event): void {
    const newQuantity = (event.target as HTMLInputElement).valueAsNumber;

    const productIndex = this.productList.findIndex(
      (p: Products) => p.int_code === product.int_code
    );

    if (productIndex !== -1) {
      this.getProductDataAndUpdateProductList(
        product,
        newQuantity,
        productIndex
      );
    }
  }

  private getProductDataAndUpdateProductList(
    product: Products,
    newQuantity: number,
    productIndex: number
  ): void {
    this.productService.getProductByIntCode(product.int_code).subscribe({
      next: (response: any) => {
        const productData = response.message.product;

        const taxesAmount =
          productData.purchase_price / (1 - productData.taxPercentage / 100) -
          productData.purchase_price;
        const subTotal = productData.sale_price - taxesAmount;

        this.productList[productIndex].quantity = newQuantity;
        this.productList[productIndex].taxes_amount = taxesAmount * newQuantity;
        this.productList[productIndex].sub_total = subTotal * newQuantity;
        this.productList[productIndex].total =
          this.productList[productIndex].sub_total +
          this.productList[productIndex].taxes_amount;

        this.calculateTotalSaleAmount();
      },
    });
  }

  cancelSale(sale: Sales): void {
    const doc_number = sale.doc_number;
    this.saleService.cancelSale(doc_number).subscribe({
      next: (response: any) => {
        this.toastr.success(`Venta #${doc_number} anulada exitosamente.`);

        const canceledSale = this.sales.find(
          (sale) => sale.doc_number === doc_number
        );
        if (canceledSale) {
          canceledSale.status = 'anulada';
        }
      },
      error: (error: any) => {
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

  filterSalesByDate(): void {
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

      const selectedDateString = this.dateParser.format(this.selectedDate);
      this.getSalesHistory(selectedDateString);
    } else {
      const currentDate = this.getCurrentDate();
      this.getSalesHistory(currentDate);
    }
  }

  toggleSaleDetails(sale: Sales): void {
    sale.showDetails = !sale.showDetails;
  }

  generateTicket(doc_number: string): void {
    this.ticketService.generateTicket(doc_number);
  }

  fetchCustomers(): void {
    this.saleService.getCustomers().subscribe({
      next: (response: any) => {
        const customers = response?.message?.customers;
        if (Array.isArray(customers) && customers.length > 0) {
          this.customersList = customers;
        } else {
          this.customersList = [];
        }
      },
      error: (error: any) => {
        console.log('Error al recuperar clientes');
        this.toastr.error('Error al recuperar la lista de clientes.');
      },
    });
  }

  searchCustomers(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

    if (Array.isArray(this.customersList) && this.customersList.length > 0) {
      this.customerSuggestionList = this.customersList.filter(
        (customer: any) =>
          customer.customer_name.toLowerCase().includes(searchTerm) ||
          customer.customer_dni.toLowerCase().includes(searchTerm) ||
          customer.customer_first_lastname.toLowerCase().includes(searchTerm)
      );
    } else {
      this.customerSuggestionList = [];
    }

    if (this.customerSuggestionList.length === 1) {
      const suggestion = this.customerSuggestionList[0];
      this.selectedCustomer = suggestion;
      this.customer_id = suggestion.customer_id;
      this.customerSuggestionList = [];
      (document.getElementById('customer_name') as HTMLInputElement).value =
        this.formatOption(suggestion);
    } else {
      this.customer_id = null;
    }
  }

  formatOption(customer: any): string {
    return `${customer.customer_name} ${customer.customer_first_lastname} ${customer.customer_second_lastname}`;
  }
}
