import { Component, ElementRef, ViewChild } from '@angular/core';
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
import { Subscription, take } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from 'src/app/services/product.service';
import { productAnimations } from 'src/app/animations/product-list-animation';
import { Products } from 'src/app/interfaces/products';
import { Sales } from 'src/app/interfaces/sales';
import { Customers } from 'src/app/interfaces/customers';
import { ScannerService } from 'src/app/services/scanner.service';

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
  selectedProductPrice: number = 0.0; // Revisar para eliminar
  quantity: number = 1;

  // Cálculo de impuestos, sub total y total
  selectedProductTaxes: boolean;
  subTotalSaleAmount: number = 0;
  totalTaxesAmount: number = 0;
  totalSaleAmount: number = 0;

  // Misceláneos
  isProductValid: boolean = false;
  productList: Products[] = [];
  lastSaleDocNumber: string = '';
  paymentMethod: string = 'contado';
  date: Date | any = '';
  productSuggestionList: Products[] = [];

  // Consultar las ventas
  sales: Sales[] = [];
  sale: Sales[] = [];

  permisibleStock: number = 0;

  // Consultar clientes
  customer_id: number = 0;
  formattedCustomerNames: { [key: string]: string } = {};
  customer_dni: string;
  customersList: Customers[] = [];
  customerSuggestionList: any[] = [];

  initialSaleFormData: any;
  isScanning: boolean = false;

  private showNewSaleModalSubscription: Subscription;

  @ViewChild('newSaleModal', { static: false }) newSaleModal!: ElementRef;
  @ViewChild('saleHistoryModal', { static: false })
  saleHistoryModal!: ElementRef;
  @ViewChild('nameInput') nameInput!: ElementRef;
  @ViewChild('video') videoElement: ElementRef<HTMLVideoElement>;
  @ViewChild('overlay') overlay!: ElementRef;
  selectedProduct: any;
  product_name: any;
  selectedIndex: number = -1;
  isExpanded: boolean;

  constructor(
    private modalService: ModalService,
    private calendar: NgbCalendar,
    private dateParser: NgbDateParserFormatter,
    private toastr: ToastrService,
    private ticketService: TicketService,
    private saleService: SaleService,
    private productService: ProductService,
    private dateFormatter: NgbDateParserFormatter,
    private formBuilder: FormBuilder,
    private barcodeScannerService: ScannerService
  ) {
    this.date = this.getCurrentDate();
    this.selectedDate = this.calendar.getToday();

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
        { value: this.getCurrentDate(), disabled: false },
        Validators.required,
      ],
      product_name: ['', Validators.required],
      product_price: ['', Validators.required],
      product_taxes: { value: this.selectedProductTaxes, disabled: true },
      product_quantity: [1, [Validators.required, Validators.min(0.01)]],
    });
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

    this.initialSaleFormData = this.saleForm.value;
    this.selectedDate = this.calendar.getToday();
  }

  ngAfterViewInit() {
    this.date = this.getCurrentDate();
  }

  ngOnDestroy() {
    if (this.showNewSaleModalSubscription) {
      this.showNewSaleModalSubscription.unsubscribe();
    }
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.isExpanded = input.value.length > 0; // Muestra la lista si hay algo escrito
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
    const canvas = this.overlay.nativeElement;
    const ctx = canvas.getContext('2d');
    this.isScanning=true;
    
    this.barcodeScannerService.startScanning(video, canvas, ctx, (detectedCode) => {
      this.saleForm.get('product_name').setValue(detectedCode);
      this.searchProduct();
      this.stopScanning();
    });
  }

  stopScanning() {
    this.isScanning = false;
    const video = this.videoElement.nativeElement as HTMLVideoElement;
    const canvas = this.overlay.nativeElement as HTMLCanvasElement;
    this.barcodeScannerService.stopScanning(video, canvas);
  }
  
  getCurrentDateString(): string {
    const currentDate = this.calendar.getToday();
    return this.dateFormatter.format(currentDate);
  }

  openSaleModal(): void {
    if (this.saleForm.invalid) {
      this.fetchCustomers();
    }
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
      this.selectedProduct = suggestion;
      this.saleForm.get('product_price').setValue(this.selectedProduct.sale_price)
      this.addProduct(suggestion);
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


  handleBarcodeInput(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value.trim();

    if (inputValue) {
      const matchingProduct = this.productSuggestionList.find(
        (product: Products) => {
          return product.int_code === inputValue;
        }
      );

      if (matchingProduct) {
        this.selectSingleProduct();
      }
    }
  }

  handleSuggestionClick(event: Event, suggestion: Products) {
    event.preventDefault();
    event.stopPropagation();

    const searchTerm = suggestion.name?.toLowerCase().trim() || '';
    const suggestionName = suggestion.name.toLowerCase().trim();
    this.selectedProduct = suggestion;
    this.saleForm.get("product_price").setValue(this.selectedProduct.sale_price)
    this.saleForm.get('product_name').setValue(this.selectedProduct.name)
    this.selectedProductPrice = suggestion.sale_price;

    if (suggestionName === searchTerm) {
      this.selectedProduct = suggestion;
      this.addProduct(this.selectedProduct);
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

        // Scroll
        const suggestionElement = document.querySelector('.selected');
        if (suggestionElement) {
          suggestionElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          });
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

  addProduct(productData: Products) {
    const productName = productData.name;
    const productQuantity = this.saleForm.get('product_quantity').value;
    const productNewPrice = productData.sale_price;
    const int_code = productData.int_code;

    if (
      productName === '' ||
      productQuantity?.invalid ||
      productNewPrice === 0
    ) {
      this.toastr.warning('Se deben suministrar todos los campos.');
      return;
    }

    this.productService.getProductByIntCode(int_code).subscribe({
      next: (response: any) => {
        const productData = response.message.product;
        this.permisibleStock = productData.quantity;

        if (productQuantity > this.permisibleStock) {
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
          int_code: productData.int_code,
          name: productName,
          // price: productNewPrice,
          quantity: productQuantity,
          taxPercentage: productData.taxPercentage,
          taxes: this.selectedProductTaxes,
          taxes_amount: taxesAmount,
          sub_total: subTotal,
          isNew: true,
          description: productData.description,
          category_id: productData.category_id,
          sale_price: productData.sale_price,
          margin: productData.margin,
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

    if (productData.taxes) {
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

        const validation = this.validateQuantityTransaction(existingProduct)

        if (!validation) {
          this.toastr.warning('Error')
          return;
        }
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

  private validateQuantityTransaction(currentTransaction: Products) {
    if (currentTransaction.quantity > this.permisibleStock) {
      this.toastr.warning(`Stock de producto ${currentTransaction.name} inferior al digitado.`)
      return false;
    } else {
      return true;
    }
  }

  private calculateTotalSaleAmount() {
    this.subTotalSaleAmount = this.productList.reduce((subTotal, product) => {
      return subTotal + (product.sub_total || 0);
    }, 0);

    this.totalTaxesAmount = this.productList.reduce((taxesTotal, product) => {
      return taxesTotal + (product.taxes_amount || 0);
    }, 0);

    // Calcula el total solo si tanto subTotalSaleAmount como totalTaxesAmount son números válidos
    if (!isNaN(this.subTotalSaleAmount) && !isNaN(this.totalTaxesAmount)) {
      this.totalSaleAmount = +this.totalTaxesAmount + this.subTotalSaleAmount;
    } else {
      // En caso de que alguno de los valores sea NaN, establece totalSaleAmount en 0
      this.totalSaleAmount = 0;
    }
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

  createSale(event: Event) {
    if (this.saleForm.get('customer_name').valid) {
      const customerFullName = this.saleForm.get('customer_name').value;
      const sale = this.buildSaleObject(customerFullName);
      if (this.productList.length === 0) {
        this.toastr.warning('No hay productos seleccionados para agregar.');
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
      customerId: this.customer_id,
      customer_name: customerFullName,
      paymentMethod: this.paymentMethod,
      status: "aceptado",
      sub_total: this.subTotalSaleAmount.toFixed(2),
      taxes_amount: this.totalTaxesAmount.toFixed(2),
      total: this.totalSaleAmount.toFixed(2),
      saleItems: this.buildProductList(),
    };
  }

  private buildProductList(): any[] {
    console.log(this.productList);
    return this.productList.map((product) => ({
      productId: product.productId,
      int_code: product.int_code,
      name: product.name,
      status: "aceptado",
      sale_price: product.sale_price,
      quantity: product.quantity,
      sub_total: product.sub_total,
      taxes_amount: product.taxes_amount,
      total: product.total
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
    this.clearSaleFormData();
    this.closeSaleModal();
  }

  private handleSaleCreationError(): void {
    this.toastr.error(
      'Ocurrió un error al guardar la venta. Por favor inténtalo nuevamente.'
    );
  }

  clearSaleFormData(): void {
    this.saleForm.reset(this.initialSaleFormData);
    this.totalTaxesAmount = 0;
    this.subTotalSaleAmount = 0;
    this.totalSaleAmount = 0;
    this.permisibleStock = 0;
    this.productList = [];
  }

  private clearProductForm(): void {
    this.saleForm.get('product_name')?.reset();
    this.saleForm.get('product_taxes')?.reset();
    this.saleForm.get('product_price')?.reset();
    this.saleForm.get('product_quantity').setValue(1);
    this.selectedProduct = null;
  }

  updateProduct(product: Products, event: Event): void {
    const newQuantity = (event.target as HTMLInputElement).valueAsNumber;

    const productIndex = this.productList.findIndex(
      (p: Products) => p.int_code === product.int_code
    );


    if (isNaN(newQuantity)) {
      this.toastr.error("La cantidad debe ser un número válido. Por favor, verifique.");
      (event.target as HTMLInputElement).value = '1';
      this.getProductDataAndUpdateProductList(product, 1, productIndex, event)
      return; // Sale del método si la cantidad no es un número válido.
    }

    if (newQuantity === 0) {
      (event.target as HTMLInputElement).value = '1';
      this.getProductDataAndUpdateProductList(product, 1, productIndex, event)
      this.toastr.error("La cantidad no puede ser igual a 0. Por favor, verifique.");
      return; // Sale del método si la cantidad es igual a 0.
    }

    if (productIndex !== -1) {
      this.getProductDataAndUpdateProductList(
        product,
        newQuantity,
        productIndex, event
      );
    }
  }


  private getProductDataAndUpdateProductList(
    product: Products,
    newQuantity: number,
    productIndex: number,
    event: Event
  ): void {
    this.productService.getProductByIntCode(product.int_code).subscribe({
      next: (response: any) => {
        const productData = response.message.product;

        this.permisibleStock = productData.quantity;

        if (newQuantity > this.permisibleStock) {
          this.toastr.warning(
            `Stock de producto ${productData.name} inferior al digitado.`
          );
          (event.target as HTMLInputElement).value = this.permisibleStock.toString();
          return;
        }

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
    this.saleService.getCustomers().pipe(take(1)).subscribe({
      next: (response: any) => {
        const customers = response?.message?.customers;
        if (Array.isArray(customers) && customers.length > 0) {
          this.customersList = customers;
          this.customersList.forEach((customer) => {
            this.formattedCustomerNames[customer.customer_id] = `${customer.customer_name} ${customer.customer_first_lastname} ${customer.customer_second_lastname}`;
          });
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
}
