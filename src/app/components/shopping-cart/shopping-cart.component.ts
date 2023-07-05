import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
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
  animations: [fadeAnimation],
})
export class ShoppingCartComponent {
  selectedDate: NgbDateStruct;
  backendUrl = `${environment.apiUrl}`;

  // Crear Ventas
  int_code: string = '';
  name: string = '';
  price: number = 0;
  selectedProductPrice: number = 0;
  quantity: number = 0;

  // Cálculo de impuestos, sub total y total
  TAXES = 0.13;
  selectedProductTaxes: boolean;
  subTotalSaleAmount: number = 0;
  totalTaxesAmount: number = 0;
  totalSaleAmount: number = 0;

  // Misceláneos
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

  @ViewChild('newSaleModal', { static: false }) newSaleModal!: ElementRef;
  @ViewChild('saleHistoryModal', { static: false })
  saleHistoryModal!: ElementRef;

  constructor(
    private http: HttpClient,
    private modalService: ModalService,
    private changeDetectorRef: ChangeDetectorRef,
    private calendar: NgbCalendar,
    private dateParser: NgbDateParserFormatter,
    private toastr: ToastrService,
    private ticketService: TicketService,
    private saleService: SaleService
  ) {
    this.date = this.getCurrentDate();
    this.selectedDate = this.calendar.getToday();
  }

  ngOnInit() {
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

  openSaleModal() {
    this.newSaleModal.nativeElement.classList.toggle('show');
    this.newSaleModal.nativeElement.style.display = 'block';
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
            // const sales = response.message?.Sales || [];
            // this.sales = sales.filter((sale: any) => {
            //   const saleDate = moment(sale.createdAt).format('YYYY-MM-DD');
            //   return saleDate === selectedDate;
            // });
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

// Método para buscar un producto en la lista filtrada
searchProduct() {
  if (!this.name) {
    this.productSuggestionList = [...this.filteredProducts];
    return;
  }

  const searchTermNormalized = this.name
    ? this.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    : '';
  this.productSuggestionList = this.filteredProducts.filter((product: any) => {
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



  selectSuggestion(suggestion: any, event: Event) {
    event.preventDefault();
    this.int_code = suggestion.int_code;
    this.name = suggestion.name;
    (this.selectedProductTaxes = suggestion.taxes),
      (this.selectedProductPrice = suggestion.sale_price);
    this.productSuggestionList = [];
  }

  addProduct() {
    if (
      !this.int_code ||
      !this.name ||
      !this.selectedProductPrice ||
      !this.quantity
    ) {
      this.toastr.warning('Se debe suministrar todos los campos.');
      return;
    }

    let taxesAmount = 0;
    let subTotal = this.selectedProductPrice * this.quantity;

    if (this.selectedProductTaxes) {
      const priceWithoutTaxes = this.selectedProductPrice / (1 + this.TAXES);
      const taxes = this.selectedProductPrice - priceWithoutTaxes;
      taxesAmount = taxes * this.quantity;
      subTotal = priceWithoutTaxes * this.quantity;
    }

    const product = {
      int_code: this.int_code,
      name: this.name,
      price: this.selectedProductPrice,
      quantity: this.quantity,
      taxes: this.selectedProductTaxes,
      taxes_amount: taxesAmount,
      sub_total: subTotal,
    };

    // console.log(product);
    this.productList.push(product);
    this.calculateTotalSaleAmount();
    this.name = '';
    this.selectedProductPrice = 0;
    this.quantity = 0;
    this.selectedProductTaxes = false;
  }

  private calculateTotalSaleAmount() {
    this.subTotalSaleAmount = this.productList.reduce((subTotal, product) => {
      if (!product.taxes) {
        return this.subTotalSaleAmount + product.price * product.quantity;
      } else {
        const priceWithoutTaxes = product.price / (1 + this.TAXES);
        return this.subTotalSaleAmount + priceWithoutTaxes * product.quantity;
      }
    }, 0);

    this.totalTaxesAmount = this.productList.reduce((taxesTotal, product) => {
      if (product.taxes) {
        const taxes = product.price - product.price / (1 + this.TAXES);
        return taxesTotal + taxes * product.quantity;
      } else {
        return taxesTotal;
      }
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

  createSale() {
    this.http
      .get(`${this.backendUrl}customers/id/${this.customer_id}`)
      .subscribe({
        next: (response: any) => {
          const customer = response?.message.customer;
          const customerFullName = `${customer.customer_name} ${customer.customer_first_lastname} ${customer.customer_second_lastname}`;

          const sale = {
            customerId: this.customer_id,
            customer_name: customerFullName,
            paymentMethod: this.paymentMethod,
            sub_total: this.subTotalSaleAmount.toFixed(2),
            taxes_amount: this.totalTaxesAmount.toFixed(2),
            products: this.productList.map((product) => ({
              int_code: product.int_code,
              quantity: product.quantity,
              sub_total: product.sub_total.toFixed(2),
              taxes_amount: product.taxes_amount.toFixed(2),
            })),
          };

          this.saleService.createSale(sale).subscribe({
            next: (response: any) => {
              this.toastr.success('La venta ha sido guardada exitosamente.');
              this.date = this.getCurrentDate();
              this.getSalesHistory(this.date);
              setTimeout(() => {
                this.generateTicket(this.lastSaleDocNumber);
              }, 1000);
              this.selectedCustomer = '';
              this.clearSaleFormData();
              this.closeSaleModal();
            },
            error: (error: any) => {
              this.toastr.error(
                'Ocurrió un error al guardar la venta. Por favor inténtalo nuevamente.'
              );
            },
          });
        },
        error: (error: any) => {
          this.toastr.error('Error recuperando el nombre de cliente.');
        },
      });
  }

  private clearSaleFormData() {
    this.name = '';
    this.price = 0;
    this.quantity = 0;
    this.productList = [];
    this.totalSaleAmount = 0;
    this.subTotalSaleAmount = 0;
    this.totalTaxesAmount = 0;
    this.totalSaleAmount = 0;
  }

  cancelSale(doc_number: string) {
    this.saleService.cancelSale(doc_number).subscribe({
      next: (response: any) => {
        this.toastr.success('Venta anulada exitosamente.');

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
    this.customer_id = customer.customer_id;
    this.customer_dni = customer.customer_dni;
    this.customer_name = customer.customer_name;
    this.customerSuggestionList = [];
  }

  selectCustomer(customer: any) {
    this.selectedCustomer = customer;
    this.customer_name = `${customer.customer_name} ${customer.customer_first_lastname} ${customer.customer_second_lastname}`;
  }
}
