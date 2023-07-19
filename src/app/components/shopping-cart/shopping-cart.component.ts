import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import {
  NgbDateStruct,
  NgbCalendar,
  NgbDateParserFormatter,
} from '@ng-bootstrap/ng-bootstrap';
import { ModalService } from '../../services/modalService';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { ToastrService } from 'ngx-toastr';
import { TicketService } from 'src/app/services/ticket.service';
import { SaleService } from 'src/app/services/sale.service';
import { Observable, Subscription, map } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';
// import * as moment from 'moment';

interface ApiSaleResponse {
  success: boolean;
  message: {
    Sales: any[];
  };
}

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css'],
  animations: [
    trigger('slideInOut', [
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
    ]), fadeAnimation,
  ]
})
export class ShoppingCartComponent {
  selectedDate: NgbDateStruct;
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
  sales: any[] = [];
  sale: any[] = [];

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

  constructor(
    private http: HttpClient,
    private modalService: ModalService,
    private changeDetectorRef: ChangeDetectorRef,
    private calendar: NgbCalendar,
    private dateParser: NgbDateParserFormatter,
    private toastr: ToastrService,
    private ticketService: TicketService,
    private saleService: SaleService,
    private dateFormatter: NgbDateParserFormatter
  ) {
    this.date = this.getCurrentDate();
    this.selectedDate = this.calendar.getToday();
  }

  ngOnInit() {
    this.showNewSaleModalSubscription =
      this.modalService.showNewSaleModal.subscribe((show: boolean) => {
        if (show) {
          this.openSaleModal();
        }
      });
    this.selectedDate = this.calendar.getToday();
    this.getProductList();
  }

  ngAfterViewInit() {
    this.date = this.getCurrentDate();
  }

  ngOnDestroy() {
    if (this.showNewSaleModalSubscription) {
      this.showNewSaleModalSubscription.unsubscribe();
    }
  }

  getCurrentDateString(): string {
    const currentDate = this.calendar.getToday();
    return this.dateFormatter.format(currentDate);
  }

  openSaleModal() {
    if (this.newSaleModal?.nativeElement) {
      this.newSaleModal.nativeElement.classList.toggle('show');
      this.newSaleModal.nativeElement.style.display = 'block';
    }
  }

  closeSaleModal() {
    this.newSaleModal.nativeElement.classList.remove('show');
    this.newSaleModal.nativeElement.style.display = 'none';
    this.selectedCustomer = '';
  }

  openSaleHistoryModal() {
    this.saleHistoryModal.nativeElement.classList.toggle('show');
    this.saleHistoryModal.nativeElement.style.display = 'block';
    this.selectedDate = this.calendar.getToday();
    this.filterSalesByDate();
  }

  closeSaleHistoryModal() {
    this.saleHistoryModal.nativeElement.classList.remove('show');
    this.saleHistoryModal.nativeElement.style.display = 'none';
    this.selectedDate = this.calendar.getToday();
  }

  getSalesHistory(selectedDate: string) {
    if (!selectedDate) {
      console.log('Fecha no especificada', selectedDate);
      return;
    }
    this.http
      .get<ApiSaleResponse>(`${this.backendUrl}sales/date/${selectedDate}`)
      .subscribe({
        next: (response) => {
          if (response.message.Sales.length === 0) {
            this.toastr.warning(
              'No hay ventas para mostrar en la fecha seleccionada.'
            );
          }
          if (response.success) {
            this.sales = response.message?.Sales || [];
            this.sales.forEach((sale: any) => {
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
  getProductList() {
    this.http.get(`${this.backendUrl}products`).subscribe({
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

  searchProduct() {
    if (!this.name) {
      this.productSuggestionList = [...this.filteredProducts];
      return;
    }

    const searchTermNormalized = this.name
      ? this.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      : '';

    const searchPattern = searchTermNormalized
      .toLowerCase()
      .replace(/\*/g, '.*'); // Reemplazar asteriscos por .* para representar cualquier cantidad de caracteres

    const regex = new RegExp(searchPattern);

    this.productSuggestionList = this.filteredProducts.filter(
      (product: any) => {
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
      }
    );

    // Auto-seleccionar el producto si hay una sola sugerencia
    if (this.productSuggestionList.length === 1) {
      const suggestion = this.productSuggestionList[0];
      this.selectSuggestion(suggestion, null);
    }

    this.changeDetectorRef.detectChanges();
  }

  // searchProduct() {
  //   if (!this.name) {
  //     this.productSuggestionList = [...this.filteredProducts];
  //     return;
  //   }

  //   const searchTermNormalized = this.name
  //     ? this.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  //     : '';
  //   this.productSuggestionList = this.filteredProducts.filter(
  //     (product: any) => {
  //       const productNameNormalized = product.name
  //         ? product.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  //         : '';

  //       const productCodeNormalized = product.int_code
  //         ? product.int_code.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  //         : '';

  //       const searchTermLower = searchTermNormalized.toLowerCase();

  //       return (
  //         productNameNormalized.toLowerCase().includes(searchTermLower) ||
  //         productCodeNormalized.toLowerCase().includes(searchTermLower)
  //       );
  //     }
  //   );

  //   // Auto-seleccionar el producto si hay una sola sugerencia
  //   if (this.productSuggestionList.length === 1) {
  //     const suggestion = this.productSuggestionList[0];
  //     this.selectSuggestion(suggestion, null);
  //   }

  //   this.changeDetectorRef.detectChanges();
  // }

  handleBarcodeInput(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value.trim();

    if (inputValue) {
      const matchingProduct = this.filteredProducts.find((product: any) => {
        return product.int_code === inputValue;
      });

      if (matchingProduct) {
        this.selectSuggestion(matchingProduct, null);
        this.addProduct();
      }
    }
  }

  selectSuggestion(suggestion: any, event: Event) {
    if (event) {
      event.preventDefault();
    }
    this.int_code = suggestion.int_code;
    this.name = suggestion.name;
    this.isProductValid = true;
    this.selectedProductTaxes = suggestion.taxes;
    this.selectedProductPrice = suggestion.sale_price;
    this.productSuggestionList = [];

    setTimeout(() => {
      this.nameInput.nativeElement.focus();
    }, 0);
  }

  isValidQuantity(): boolean {
    return this.quantity > 0;
  }

  isValidPaymentMethod(): boolean {
    return this.paymentMethod.trim() !== '';
  }

  addProduct() {
    if (
      !this.int_code ||
      !this.name ||
      !this.selectedProductPrice ||
      !this.quantity
    ) {
      this.toastr.warning('Se deben suministrar todos los campos.');
      return;
    }

    // event.preventDefault();
    // let productData = {};
    let taxesAmount = 0;
    let subTotal = 0;

    this.http
      .get(`${this.backendUrl}products/int_code/${this.int_code}`)
      .subscribe({
        next: (response: any) => {
          const productData = response.message.product;
          if (this.selectedProductTaxes) {
            taxesAmount = (productData.purchase_price / (1 - productData.taxPercentage / 100) - productData.purchase_price);
            subTotal = productData.sale_price - taxesAmount;
          }

          if (this.quantity > productData.quantity) {
            this.toastr.error(
              `Stock de producto ${productData.name} inferior al digitado.`
            );
            return;
          }

          const product = {
            int_code: this.int_code,
            name: this.name,
            price: this.selectedProductPrice,
            quantity: this.quantity,
            taxPercentage: this.TAXES,
            taxes: this.selectedProductTaxes,
            taxes_amount: taxesAmount * this.quantity,
            sub_total: subTotal * this.quantity,
          };

          const existingProductIndex = this.productList.findIndex(
            (p) => p.int_code === this.int_code
          );

          if (existingProductIndex !== -1) {
            const existingProduct = this.productList[existingProductIndex];
            existingProduct.quantity += product.quantity;
            existingProduct.taxes_amount += product.taxes_amount;
            existingProduct.sub_total += product.sub_total;
            existingProduct.total =
              existingProduct.sub_total + existingProduct.taxes_amount;
          } else {
            this.productList.push(product);
          }
          this.calculateTotalSaleAmount();
          this.clearProductForm();
          setTimeout(() => {
            this.nameInput.nativeElement.focus();
          }, 0);
        },
        error: (response: any) => {
          this.toastr.error(
            'No se pudo recuperar la información de impuestos del producto.'
          );
        },
      });
  }

  private calculateTotalSaleAmount() {
    this.subTotalSaleAmount = this.productList.reduce((subTotal, product) => {
      return subTotal + product.sub_total;
    }, 0);

    this.totalTaxesAmount = this.productList.reduce((taxesTotal, product) => {
      return taxesTotal + product.taxes_amount;
    }, 0);

    this.totalSaleAmount = this.subTotalSaleAmount + this.totalTaxesAmount;
  }

  removeProduct(product: any) {
    const index = this.productList.indexOf(product);
    if (index !== -1) {
      this.productList.splice(index, 1);
      this.calculateTotalSaleAmount();
    }
  }

  createSale(event: Event) {
    if (this.selectedCustomer) {
      const customerFullName = this.getCustomerFullName(this.selectedCustomer);
      const sale = this.buildSaleObject(
        this.selectedCustomer,
        customerFullName
      );
      this.saveSale(sale);
    } else {
      event.stopPropagation();
      this.toastr.error('Debe seleccionar un cliente.');
      return;
    }
  }

  getCustomerDetails(): Observable<any> {
    return this.http
      .get(`${this.backendUrl}customers/id/${this.customer_id}`)
      .pipe(map((response: any) => response?.message?.customer));
  }

  getCustomerFullName(customer: any): string {
    const { customer_name, customer_first_lastname, customer_second_lastname } =
      customer;
    return `${customer_name} ${customer_first_lastname} ${customer_second_lastname}`;
  }

  buildSaleObject(customer: any, customerFullName: string): any {
    return {
      customerId: this.customer_id,
      customer_name: customerFullName,
      paymentMethod: this.paymentMethod,
      sub_total: this.subTotalSaleAmount.toFixed(2),
      taxes_amount: this.totalTaxesAmount.toFixed(2),
      products: this.buildProductList(),
    };
  }

  buildProductList(): any[] {
    return this.productList.map((product) => ({
      int_code: product.int_code,
      quantity: product.quantity,
      sub_total: product.sub_total,
      taxes_amount: product.taxes_amount,
    }));
  }

  saveSale(sale: any) {
    this.saleService.createSale(sale).subscribe({
      next: () => {
        this.handleSaleCreationSuccess();
      },
      error: () => {
        this.handleSaleCreationError();
      },
    });
  }

  handleSaleCreationSuccess() {
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

  handleSaleCreationError() {
    this.toastr.error(
      'Ocurrió un error al guardar la venta. Por favor inténtalo nuevamente.'
    );
  }

  private clearSaleFormData() {
    this.customer_name = '';
    this.name = '';
    this.price = 0;
    this.quantity = 1;
    this.productList = [];
    this.totalSaleAmount = 0;
    this.subTotalSaleAmount = 0;
    this.totalTaxesAmount = 0;
    this.totalSaleAmount = 0;
    this.selectedProductTaxes = false;
    this.selectedProductPrice = 0;
    this.TAXES = 0;
  }

  private clearProductForm() {
    this.name = '';
    this.selectedProductPrice = 0;
    this.isProductValid = false;
    this.quantity = 1;
    this.TAXES = 0;
    this.selectedProductTaxes = false;
  }

  updateProduct(product: any) {
    const foundProduct = this.productList.find((p: any) => p.int_code === product.int_code);
  
    if (foundProduct) {
      this.http.get(`${this.backendUrl}products/int_code/${product.int_code}`, {}).subscribe({
        next: (response: any) => {
          const productData = response.message.product;
  
          const taxesAmount = (productData.purchase_price / (1 - productData.taxPercentage / 100) - productData.purchase_price);
          const subTotal = productData.sale_price - taxesAmount;
  
          foundProduct.taxes_amount = taxesAmount * product.quantity;
          foundProduct.sub_total = subTotal * product.quantity;
          foundProduct.total = foundProduct.sub_total + foundProduct.taxes_amount;
  
          this.calculateTotalSaleAmount();
        },
      });
    }
  }
  

  cancelSale(doc_number: string) {
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

  filterSalesByDate() {
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

  toggleSaleDetails(sale: any) {
    sale.showDetails = !sale.showDetails;
  }

  generateTicket(doc_number: string) {
    this.ticketService.generateTicket(doc_number);
  }

  searchCustomers() {
    const searchTerm = this.customer_name.toLowerCase();
    this.http.get(`${this.backendUrl}customers`).subscribe({
      next: (response: any) => {
        const customers = response?.message?.customers;
        if (Array.isArray(customers) && customers.length > 0) {
          this.customerSuggestionList = customers
            .filter(
              (customer: any) =>
                customer.customer_name.toLowerCase().includes(searchTerm) ||
                customer.customer_dni.toLowerCase().includes(searchTerm) ||
                customer.customer_first_lastname
                  .toLowerCase()
                  .includes(searchTerm)
            )
            .map((customer: any) => ({
              customer_id: customer.customer_id,
              customer_dni: customer.customer_dni,
              customer_name: customer.customer_name,
              customer_first_lastname: customer.customer_first_lastname,
              customer_second_lastname: customer.customer_second_lastname,
            }));
        } else {
          this.customerSuggestionList = [];
        }
      },
      error: (error: any) => {
        console.log('Error al recuperar clientes');
        this.toastr.error('Error al recuperar la lista de clientes.');
      },
    });
  }

  selectCustomerSuggestion(customer: any, event: Event) {
    event.preventDefault();
    this.selectedCustomer = customer;
    this.customer_name = `${customer.customer_name} ${customer.customer_first_lastname} ${customer.customer_second_lastname}`;
    this.customerSuggestionList = [];
  }

  selectCustomer(customer: any) {
    this.selectedCustomer = customer;
    this.customer_name = `${customer.customer_name} ${customer.customer_first_lastname} ${customer.customer_second_lastname}`;
  }
}
