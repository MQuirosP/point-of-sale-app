import { Component, ElementRef, ViewChild } from '@angular/core';
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
  customerName: string = 'Contado';
  paymentMethod: string = 'contado';
  date: Date | any = '';
  suggestionsList: any[] = [];

  // Consultar las ventas
  sales: any[] = [];
  sale: any[] = [];

  @ViewChild('newSaleModal', { static: false }) newSaleModal!: ElementRef;
  @ViewChild('saleHistoryModal', { static: false })
  saleHistoryModal!: ElementRef;

  constructor(
    private http: HttpClient,
    private modalService: ModalService,
    private router: Router,
    private calendar: NgbCalendar,
    private dateParser: NgbDateParserFormatter,
    private toastr: ToastrService,
    private ticketService: TicketService
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
              'No hay ventas para mostrar en la fecha seleccionada'
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

  searchProducts() {
    const searchTerm = this.name.toLowerCase();
    this.http.get(`${this.backendUrl}products`).subscribe({
      next: (response: any) => {
        const products = response?.message?.products;
        if (Array.isArray(products) && products.length > 0) {
          this.suggestionsList = products
            .filter(
              (product: any) =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.int_code.toLowerCase().includes(searchTerm)
            )
            .map((product: any) => ({
              int_code: product.int_code,
              name: product.name,
              sale_price: product.sale_price,
              taxes: product.taxes,
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
    this.name = suggestion.name;
    (this.selectedProductTaxes = suggestion.taxes),
      (this.selectedProductPrice = suggestion.sale_price);
    this.suggestionsList = [];
  }

  addProduct() {
    if (
      !this.int_code ||
      !this.name ||
      !this.selectedProductPrice ||
      !this.quantity
    ) {
      this.toastr.warning('Se debe suministrar todos los campos');
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
    const sale = {
      customerId: 1,
      customer_name: this.customerName,
      paymentMethod: this.paymentMethod,
      sub_total: this.subTotalSaleAmount,
      taxes_amount: this.totalTaxesAmount,
      products: this.productList.map((product) => ({
        int_code: product.int_code,
        quantity: product.quantity,
        sub_total: product.sub_total,
        taxes_amount: product.taxes_amount,
      })),
    };
    console.log(sale);
    this.http.post(`${this.backendUrl}sales/`, sale).subscribe({
      next: (response: any) => {
        console.log('Venta guardada exitosamente', response);

        this.toastr.success('La venta ha sido guardada exitosamente');
        this.date = this.getCurrentDate();
        this.getSalesHistory(this.date);
        setTimeout(() => {
          this.generateTicket(this.lastSaleDocNumber);
        }, 1000);

        this.clearSaleFormData();
        this.closeSaleModal();
      },
      error: (error: any) => {
        console.error('Error al guardar la venta', error);
        this.toastr.error(
          'Ocurrió un error al guardar la venta. Por favor inténtalo nuevamente'
        );
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
    const myDocument = doc_number;
    this.http.put(`${this.backendUrl}sales/${myDocument}`, null).subscribe(
      (response: any) => {
        console.log('Venta anulada exitosamente', response);
        this.toastr.success('Venta anulada exitosamente');

        const canceledSale = this.sales.find(
          (sale) => sale.doc_number === doc_number
        );
        if (canceledSale) {
          canceledSale.status = 'anulada';
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
}
