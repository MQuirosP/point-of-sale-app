import { ModalService } from '../../services/modalService';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { Router } from '@angular/router';
import {
  NgbDateStruct,
  NgbCalendar,
  NgbDateParserFormatter,
} from '@ng-bootstrap/ng-bootstrap';
// import { Observable } from 'rxjs';
import { jsPDF } from 'jspdf';
import { fadeAnimation } from 'src/app/fadeAnimation';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';

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
  // Variables generales
  // url: string = 'http://localhost:3000/api/';
  backendUrl = `${environment.apiUrl}`;

  // Crear Ventas
  int_code: string = '';
  productName: string = '';
  productPrice: number = 0;
  selectedProductPrice: number = 0;
  productQuantity: number = 0;
  productList: any[] = [];
  lastSaleDocNumber: string = '';
  totalSaleAmount: number = 0;
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
    private toastr: ToastrService
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
    this.http.get<ApiSaleResponse>(`${this.backendUrl}sales`).subscribe({
      next: (response) => {
        if (response.success) {
          const sales = response.message?.Sales || [];
          this.sales = sales.filter((sale: any) => {
            const saleDate = moment(sale.createdAt).format('YYYY-MM-DD');
            return saleDate === selectedDate;
          });
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
    const searchTerm = this.productName.toLowerCase();
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
    this.selectedProductPrice = suggestion.sale_price;
    this.suggestionsList = [];
  }

  addProduct() {
    if (
      !this.int_code ||
      !this.productName ||
      !this.selectedProductPrice ||
      !this.productQuantity
    ) {
      this.toastr.warning('Se debe suministrar todos los campos');
      return;
    }
    const product = {
      int_code: this.int_code,
      name: this.productName,
      price: this.selectedProductPrice,
      quantity: this.productQuantity,
    };
    this.productList.push(product);
    this.calculateTotalSaleAmount();
    this.productName = '';
    this.selectedProductPrice = 0;
    this.productQuantity = 0;
  }

  private calculateTotalSaleAmount() {
    this.totalSaleAmount = this.productList.reduce((total, product) => {
      return total + product.price * product.quantity;
    }, 0);
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
      products: this.productList.map((product) => ({
        int_code: product.int_code,
        quantity: product.quantity,
      })),
    };
    this.http.post(`${this.backendUrl}sales/`, sale).subscribe(
      (response: any) => {
        console.log('Venta guardada exitosamente', response);

        this.toastr.success('La venta ha sido guardada exitosamente');
        this.date = this.getCurrentDate();
        this.getSalesHistory(this.date);
        setTimeout(() => {
          this.generateTicket(this.lastSaleDocNumber);
        }, 1000);

        this.productName = '';
        this.productPrice = 0;
        this.productQuantity = 0;
        this.productList = [];
        this.totalSaleAmount = 0;
        this.closeSaleModal();
      },
      (error: any) => {
        console.error('Error al guardar la venta', error);
        this.toastr.error(
          'Ocurrió un error al guardar la venta. Por favor inténtalo nuevamente'
        );
      }
    );
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

  generateTicket(docNumber: string): void {
    this.http.get<any>(`${this.backendUrl}sales/${docNumber}`).subscribe(
      (response: any) => {
        if (
          response.success &&
          response.message &&
          response.message.Sale.length > 0
        ) {
          const saleData = response.message.Sale[0];
          const { doc_number, customer_name, createdAt, total, saleItems } =
            saleData;

          const doc = new jsPDF('p', 'mm', [77, 150]);

          doc.setFontSize(18);
          doc.text('Verdulería Sol', 39, 10, { align: 'center' });
          doc.setFontSize(14);
          doc.text('Tiquete de Venta', 5, 20);
          doc.setFontSize(12);
          doc.text(`N° ${doc_number}`, 5, 25);

          doc.setFontSize(10);
          doc.text(`Fecha: ${createdAt}`, 5, 30);
          doc.text(`Cliente: ${customer_name}`, 5, 35);
          doc.text(
            `--------------------------------------------------------`,
            5,
            37
          );
          let y = 42;

          saleItems.forEach((item: any, index: number) => {
            const { name, quantity, sale_price, total: totalPrice } = item;

            doc.text(`Producto ${index + 1}:`, 5, y);
            doc.text(`${name}`, 25, y);
            y += 5;
            doc.text(`Cantidad:`, 5, y);
            doc.text(`${quantity}`, 25, y);
            y += 5;
            doc.text(`Precio:`, 5, y);
            doc.text(`${sale_price}`, 25, y);
            y += 5;
            doc.text(`Total:`, 5, y);

            const formattedTotalPrice = totalPrice.toLocaleString('es-CR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            doc.text(`${formattedTotalPrice}`, 25, y);
            y += 5;
          });

          doc.text(
            `--------------------------------------------------------`,
            5,
            y
          );
          y += 5;
          doc.setFontSize(14);
          const formattedTotal = total.toLocaleString('es-CR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          doc.text(`Total: ${formattedTotal}`, 70, y, { align: 'right' });
          doc.save(`${docNumber}.pdf`);
        } else {
          console.error('Error al obtener los datos del documento');
        }
      },
      (error: any) => {
        console.error(
          'Error en la petición para obtener los datos del documento',
          error
        );
      }
    );
  }

  goToProductManagement() {
    this.router.navigate(['/product-list']);
  }
}
